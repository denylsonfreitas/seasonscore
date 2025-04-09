import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getFirestore,
  orderBy,
  serverTimestamp,
  DocumentData,
  updateDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  doc,
  arrayUnion,
  arrayRemove,
  limit,
  writeBatch,
  startAfter,
  runTransaction,
} from "firebase/firestore";
import { auth } from "../config/firebase";
import { getSeriesDetails, Series } from "./tmdb";
import { createNotification, NotificationType } from "./notifications";
import { Comment } from "../types/review";
import { getUserData } from "./users";
import { db } from "../config/firebase";
import { SeasonReview } from "../types/review";
import { getFollowing } from "./followers";
import { isInWatchlist } from "./watchlist";
import { removeReactionNotification } from "./notifications";

const reviewsCollection = collection(db, "reviews");

// Cache para rastrear notificações recentes
// Estrutura: { [receiverId_objectId_senderId_type]: timestamp }
const recentNotificationsCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutos em milissegundos

/**
 * Verifica se uma notificação foi enviada recentemente
 * @param objectId ID do objeto (review ou comment)
 * @param senderId ID do usuário que interagiu
 * @param receiverId ID do usuário que recebe a notificação
 * @param type Tipo de interação ('reaction' ou 'comment')
 * @returns Verdadeiro se uma notificação foi enviada nos últimos 30 minutos
 */
function wasNotifiedRecently(
  objectId: string, 
  senderId: string, 
  receiverId: string,
  type: string
): boolean {
  const cacheKey = `${receiverId}_${objectId}_${senderId}_${type}`;
  const lastNotified = recentNotificationsCache.get(cacheKey);
  
  if (lastNotified) {
    const now = Date.now();
    return (now - lastNotified) < NOTIFICATION_COOLDOWN;
  }
  
  return false;
}

/**
 * Registra que uma notificação foi enviada
 * @param objectId ID do objeto (review ou comment)
 * @param senderId ID do usuário que interagiu
 * @param receiverId ID do usuário que recebe a notificação
 * @param type Tipo de interação ('reaction' ou 'comment')
 */
function trackNotification(
  objectId: string, 
  senderId: string, 
  receiverId: string,
  type: string
): void {
  const cacheKey = `${receiverId}_${objectId}_${senderId}_${type}`;
  recentNotificationsCache.set(cacheKey, Date.now());
}

export interface Review {
  id: string;
  seriesId: number;
  userId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface SeriesReview {
  id: string;
  userId: string;
  userEmail: string;
  seriesId: number;
  seasonReviews: SeasonReview[];
  series: {
    name: string;
    poster_path: string;
  };
  selectedSeasonNumber?: number;
  createdAt?: Date | { seconds: number };
}

export async function addReview(
  seriesId: number,
  rating: number,
  comment: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const review = {
    seriesId,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email,
    rating,
    comment,
    createdAt: serverTimestamp(),
  };

  await addDoc(reviewsCollection, review);
}

export async function addSeasonReview(
  seriesId: number,
  seasonNumber: number,
  rating: number,
  comment: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");
  if (!auth.currentUser.email) throw new Error("Email do usuário não encontrado");

  // Validações
  if (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    throw new Error("A nota deve estar entre 0.5 e 5, com incrementos de 0.5");
  }

  if (comment && comment.length > 280) {
    throw new Error("O comentário não pode ter mais que 280 caracteres");
  }

  const seasonReview = {
    seasonNumber,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email,
    rating,
    comment: comment || "",
    comments: [],
    reactions: {
      likes: [],
    },
    createdAt: new Date(),
  };

  try {
    // Verifica se já existe uma avaliação para esta série do usuário
    const userReviewQuery = query(
      reviewsCollection,
      where("userId", "==", auth.currentUser.uid),
      where("seriesId", "==", seriesId)
    );

    const userReviewSnapshot = await getDocs(userReviewQuery);
    let isNewReview = false;
    let reviewDocRef;

    if (userReviewSnapshot.empty) {
      // Cria uma nova avaliação da série
      const seriesReview = {
        seriesId,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        seasonReviews: [seasonReview],
        createdAt: serverTimestamp(),
      };

      reviewDocRef = await addDoc(reviewsCollection, seriesReview);
      isNewReview = true;
    } else {
      // Atualiza a avaliação existente
      const reviewDoc = userReviewSnapshot.docs[0];
      reviewDocRef = reviewDoc.ref;
      const existingReview = reviewDoc.data() as SeriesReview;

      // Verifica se já existe uma avaliação para esta temporada
      const existingSeasonIndex = existingReview.seasonReviews.findIndex(
        (sr) => sr.seasonNumber === seasonNumber
      );

      if (existingSeasonIndex >= 0) {
        // Atualiza a avaliação da temporada existente
        existingReview.seasonReviews[existingSeasonIndex] = seasonReview;
      } else {
        // Adiciona nova avaliação de temporada
        existingReview.seasonReviews.push(seasonReview);
        isNewReview = true;
      }

      await updateDoc(reviewDoc.ref, {
        seasonReviews: existingReview.seasonReviews,
      });
    }

    // Se é uma nova avaliação, notificar os seguidores
    if (isNewReview) {
      try {
        // Obter detalhes da série
        const seriesDetails = await getSeriesDetails(seriesId);
        
        // Obter dados do usuário
        const userData = await getUserData(auth.currentUser.uid);
        const userName = userData?.username || userData?.displayName || auth.currentUser.email;
        
        // Obter lista de seguidores
        const followers = await getFollowing(auth.currentUser.uid);
        
        // Para cada seguidor, verificar se tem a série na watchlist e enviar notificação se tiver
        for (const follower of followers) {
          try {
            // Verificar se o seguidor tem a série na watchlist
            const hasInWatchlist = await isInWatchlist(follower.userId, seriesId);
            
            // Só enviar notificação se o usuário tiver a série na watchlist
            if (hasInWatchlist) {
              await createNotification(
                follower.userId, // ID do seguidor que receberá a notificação
                NotificationType.NEW_REVIEW,
                {
                  senderId: auth.currentUser.uid,
                  seriesId: seriesId,
                  seriesName: seriesDetails.name,
                  seriesPoster: seriesDetails.poster_path || undefined,
                  seasonNumber: seasonNumber,
                  reviewId: reviewDocRef.id,
                  message: `${userName} avaliou ${seriesDetails.name} (Temporada ${seasonNumber}).`
                }
              );
            }
          } catch (watchlistError) {
            // Silenciar erros individuais de verificação de watchlist 
            // para não interromper o processamento de outros seguidores
          }
        }
      } catch (error) {
        // Silenciar erros de notificação para não interromper o fluxo principal
      }
    }
  } catch (error) {
  }
}

export async function getSeriesReviews(seriesId: number): Promise<SeriesReview[]> {
  const reviewsQuery = query(
    reviewsCollection,
    where("seriesId", "==", seriesId)
  );

  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      seasonReviews: data.seasonReviews.map((sr: SeasonReview) => ({
        ...sr,
        comments: sr.comments || []
      }))
    };
  }) as SeriesReview[];
}

export async function getUserReview(seriesId: number, userId: string) {
  const reviewQuery = query(
    reviewsCollection,
    where("seriesId", "==", seriesId),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(reviewQuery);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as SeriesReview;
}

export async function updateReview(
  reviewId: string,
  seasonNumber: number,
  rating: number,
  comment: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewDoc = await getDoc(doc(reviewsCollection, reviewId));
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;
  
  // Verificar se é uma atualização de outra pessoa (comentário em avaliação)
  const isCommentOnOthersReview = review.userId !== auth.currentUser.uid;
  
  const seasonIndex = review.seasonReviews.findIndex(
    (sr) => sr.seasonNumber === seasonNumber
  );

  if (seasonIndex === -1) throw new Error("Temporada não encontrada");

  // Guardar o comentário anterior para verificar se houve alteração
  const previousComment = review.seasonReviews[seasonIndex].comment;
  
  review.seasonReviews[seasonIndex] = {
    ...review.seasonReviews[seasonIndex],
    rating,
    comment,
    createdAt: new Date(),
  };

  await updateDoc(reviewDoc.ref, {
    seasonReviews: review.seasonReviews,
  });
  
  // Se for um comentário em avaliação de outra pessoa, enviar notificação
  if (isCommentOnOthersReview && comment && comment !== previousComment) {
    try {
      // Obter detalhes da série
      const seriesDetails = await getSeriesDetails(review.seriesId);
      
      // Criar notificação para o dono da avaliação
      await createNotification(
        review.userId,
        NotificationType.NEW_COMMENT,
        {
          senderId: auth.currentUser.uid,
          seriesId: review.seriesId,
          seriesName: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path || undefined,
          seasonNumber,
          reviewId,
          message: `Alguém comentou na sua avaliação de ${seriesDetails.name} (Temporada ${seasonNumber}).`
        }
      );
    } catch (error) {
    }
  }
}

export async function deleteReview(reviewId: string, seasonNumber: number) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewDoc = await getDoc(doc(reviewsCollection, reviewId));
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;

  // Verificar se o usuário tem permissão para excluir a avaliação
  if (review.userId !== auth.currentUser.uid) {
    throw new Error("Você não tem permissão para excluir esta avaliação");
  }

  try {
    // Remove a avaliação da temporada específica
    review.seasonReviews = review.seasonReviews.filter(
      (sr) => sr.seasonNumber !== seasonNumber
    );

    if (review.seasonReviews.length === 0) {
      // Se não houver mais avaliações, remove o documento inteiro
      await deleteDoc(reviewDoc.ref);
    } else {
      // Caso contrário, atualiza o documento com as avaliações restantes
      await updateDoc(reviewDoc.ref, {
        seasonReviews: review.seasonReviews,
      });
    }

    // Excluir todas as notificações relacionadas a esta avaliação
    try {
      const notificationsCollection = collection(db, "notifications");
      
      // Primeiro, obter notificações onde o usuário atual é o destinatário
      const userNotificationsQuery = query(
        notificationsCollection,
        where("reviewId", "==", reviewId),
        where("seasonNumber", "==", seasonNumber),
        where("userId", "==", auth.currentUser.uid)
      );
      
      // Depois, obter notificações onde o usuário atual é o remetente
      const sentNotificationsQuery = query(
        notificationsCollection,
        where("reviewId", "==", reviewId),
        where("seasonNumber", "==", seasonNumber),
        where("senderId", "==", auth.currentUser.uid)
      );
      
      // Obter os resultados de ambas as consultas
      const [userNotificationsSnapshot, sentNotificationsSnapshot] = await Promise.all([
        getDocs(userNotificationsQuery),
        getDocs(sentNotificationsQuery)
      ]);
      
      // Excluir notificações em silêncio, sem logs de erro ou contagem
      const batch = writeBatch(db);
      
      // Adicionar todos os documentos ao batch para exclusão
      userNotificationsSnapshot.docs.forEach(docSnapshot => 
        batch.delete(docSnapshot.ref)
      );
      
      sentNotificationsSnapshot.docs.forEach(docSnapshot => 
        batch.delete(docSnapshot.ref)
      );
      
      if (userNotificationsSnapshot.docs.length > 0 || sentNotificationsSnapshot.docs.length > 0) {
        await batch.commit();
      }
    } catch (error) {

    }
    
    return true;
  } catch (error) {
  }
}

export async function getUserReviews(userId: string): Promise<SeriesReview[]> {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  const reviews = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const seriesDetails = await getSeriesDetails(data.seriesId);

      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        seriesId: data.seriesId,
        seasonReviews: data.seasonReviews,
        series: {
          name: seriesDetails.name,
          poster_path: seriesDetails.poster_path,
        },
      } as SeriesReview;
    })
  );

  return reviews;
}

export async function getTopRatedSeries(): Promise<SeriesReview[]> {
  const reviewsRef = collection(db, "reviews");
  const querySnapshot = await getDocs(reviewsRef);
  
  // Mapa para armazenar a média de avaliações por série
  const seriesRatings: { [key: number]: { total: number; count: number; reviews: SeriesReview[] } } = {};

  // Calcular a média das avaliações para cada série
  querySnapshot.docs.forEach((doc) => {
    const review = doc.data() as SeriesReview;
    const seriesId = review.seriesId;

    if (!seriesRatings[seriesId]) {
      seriesRatings[seriesId] = { total: 0, count: 0, reviews: [] };
    }

    // Calcular a média das avaliações das temporadas
    const seasonRatings = review.seasonReviews.map(sr => sr.rating);
    const averageRating = seasonRatings.reduce((a, b) => a + b, 0) / seasonRatings.length;

    seriesRatings[seriesId].total += averageRating;
    seriesRatings[seriesId].count += 1;
    seriesRatings[seriesId].reviews.push({
      ...review,
      id: doc.id
    });
  });

  // Converter para array e ordenar por média de avaliação
  const sortedSeries = Object.entries(seriesRatings)
    .map(([seriesId, data]) => ({
      seriesId: Number(seriesId),
      averageRating: data.total / data.count,
      reviews: data.reviews
    }))
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);

  // Retornar as reviews das top 10 séries
  return sortedSeries.flatMap(series => series.reviews);
}

export async function addCommentToReview(
  reviewId: string,
  seasonNumber: number,
  content: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");
  if (!auth.currentUser.email) throw new Error("Email do usuário não encontrado");

  const reviewRef = doc(reviewsCollection, reviewId);
  const reviewDoc = await getDoc(reviewRef);
  
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;
  const seasonIndex = review.seasonReviews.findIndex(
    (sr) => sr.seasonNumber === seasonNumber
  );

  if (seasonIndex === -1) throw new Error("Temporada não encontrada");

  const newComment: Comment = {
    id: crypto.randomUUID(),
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email,
    content,
    createdAt: new Date(),
    reactions: {
      likes: [],
    }
  };

  // Criar uma cópia da avaliação para atualização
  const updatedReview = {
    ...review,
    seasonReviews: [...review.seasonReviews]
  };

  // Inicializar o array de comentários se não existir
  if (!updatedReview.seasonReviews[seasonIndex].comments) {
    updatedReview.seasonReviews[seasonIndex].comments = [];
  }

  updatedReview.seasonReviews[seasonIndex].comments!.push(newComment);

  try {
    await updateDoc(reviewRef, updatedReview);

    // Notificar o dono da avaliação sobre o novo comentário
    if (review.userId !== auth.currentUser.uid) {
      try {
        // Verificar se uma notificação foi enviada recentemente
        const wasNotified = wasNotifiedRecently(
          reviewId,
          auth.currentUser.uid,
          review.userId,
          'comment'
        );
        
        // Se não foi notificado recentemente, enviar notificação
        if (!wasNotified) {
          const seriesDetails = await getSeriesDetails(review.seriesId);
          const userData = await getUserData(auth.currentUser.uid);
          const userName = userData?.username || userData?.displayName || auth.currentUser.email;
          
          // Registrar que a notificação está sendo enviada
          trackNotification(reviewId, auth.currentUser.uid, review.userId, 'comment');
          
          // Mensagem mais genérica para comentários
          const message = `${userName} comentou na sua avaliação de ${seriesDetails.name} (Temporada ${seasonNumber}).`;
          
          await createNotification(
            review.userId,
            NotificationType.NEW_COMMENT,
            {
              senderId: auth.currentUser.uid,
              seriesId: review.seriesId,
              seriesName: seriesDetails.name,
              seriesPoster: seriesDetails.poster_path || undefined,
              seasonNumber,
              reviewId,
              message
            }
          );
        }
      } catch (error) {
      }
    }

    return newComment;
  } catch (error) {
  }
}

export async function deleteComment(
  reviewId: string,
  seasonNumber: number,
  commentId: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewRef = doc(reviewsCollection, reviewId);
  const reviewDoc = await getDoc(reviewRef);

  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;
  const seasonIndex = review.seasonReviews.findIndex(
    (sr) => sr.seasonNumber === seasonNumber
  );

  if (seasonIndex === -1) throw new Error("Temporada não encontrada");

  // Criar uma cópia da avaliação para atualização
  const updatedReview = {
    ...review,
    seasonReviews: [...review.seasonReviews]
  };

  // Buscar o comentário a ser excluído
  const commentIndex = updatedReview.seasonReviews[seasonIndex].comments?.findIndex(
    (c) => c.id === commentId
  );

  if (commentIndex === undefined || commentIndex === -1) {
    throw new Error("Comentário não encontrado");
  }
    
  // Armazenar o comentário antes de excluí-lo
  const comment = updatedReview.seasonReviews[seasonIndex].comments![commentIndex];

  // Verificar permissão (somente o proprietário do comentário ou da avaliação pode excluir)
  if (comment.userId !== auth.currentUser.uid && review.userId !== auth.currentUser.uid) {
    throw new Error("Você não tem permissão para excluir este comentário");
  }
    
  // Remover o comentário do array
  updatedReview.seasonReviews[seasonIndex].comments!.splice(commentIndex, 1);

  try {
    // Atualizar o documento no Firestore
    await updateDoc(reviewRef, updatedReview);
    
    // IMPORTANTE: Vamos remover APENAS as notificações que o USUÁRIO ATUAL recebeu
    // relacionadas a este comentário
    // Isso evita erros de permissão ao tentar excluir notificações de outros usuários
    try {
      const currentUserId = auth.currentUser.uid;
      
      // 1. Se o usuário atual é o dono da avaliação, remova notificações que ele recebeu sobre este comentário
      if (review.userId === currentUserId) {
        // Buscar notificações recebidas pelo usuário atual relacionadas a este comentário
        const notificationsQuery = query(
          collection(db, "notifications"), 
          where("userId", "==", currentUserId),  // Apenas notificações recebidas pelo usuário atual
          where("type", "==", NotificationType.NEW_COMMENT),
          where("reviewId", "==", reviewId)
        );
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        if (!notificationsSnapshot.empty) {
          const batch = writeBatch(db);
          
          // Filtrar apenas as notificações relacionadas a este comentário específico
          notificationsSnapshot.forEach(doc => {
            const notificationData = doc.data();
            
            if (notificationData.message.includes(commentId) || 
                (notificationData.senderId === comment.userId && 
                notificationData.message.includes("comentou"))) {
              batch.delete(doc.ref);
            }
          });
          
          // Commit silencioso sem mensagens de log
          await batch.commit();
        }
      }
      
      // 2. Se o usuário atual é o autor do comentário, remova notificações de reação que ele recebeu
      // sobre este comentário (se houver)
      const reactionNotificationsQuery = query(
        collection(db, "notifications"), 
        where("userId", "==", currentUserId),  // Apenas notificações recebidas pelo usuário atual
        where("type", "==", NotificationType.NEW_REACTION),
        where("reviewId", "==", reviewId)
      );
      
      const reactionSnapshot = await getDocs(reactionNotificationsQuery);
      
      if (!reactionSnapshot.empty) {
        const batch = writeBatch(db);
        
        reactionSnapshot.forEach(doc => {
          const notificationData = doc.data();
          
          // Verificar se a notificação está relacionada a uma reação neste comentário
          if (notificationData.message.includes("comentário") && 
              (notificationData.message.includes(commentId) || 
              notificationData.reviewId.includes(commentId))) {
            batch.delete(doc.ref);
          }
        });
        
        await batch.commit();
      }
      
    } catch (error) {
    }

    return comment;
  } catch (error) {
    throw error;
  }
}

export async function toggleReaction(
  reviewId: string,
  seasonNumber: number,
  reactionType: "likes"
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const userId = auth.currentUser.uid;
  const reviewRef = doc(reviewsCollection, reviewId);
  
  try {
    // Usamos uma transação para garantir a consistência dos dados
    const result = await runTransaction(db, async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

      const review = reviewDoc.data() as SeriesReview;
      const seasonIndex = review.seasonReviews.findIndex(
        (sr) => sr.seasonNumber === seasonNumber
      );

      if (seasonIndex === -1) throw new Error("Temporada não encontrada");

      // Criar uma cópia da avaliação para atualização
      const updatedReview = {
        ...review,
        seasonReviews: [...review.seasonReviews]
      };

      // Inicializar reactions se necessário
      if (!updatedReview.seasonReviews[seasonIndex].reactions) {
        updatedReview.seasonReviews[seasonIndex].reactions = { likes: [] };
      }

      const reactions = updatedReview.seasonReviews[seasonIndex].reactions!;

      // Toggle da reação atual
      const currentIndex = reactions[reactionType].indexOf(userId);
      
      // Verificar se está adicionando ou removendo a reação
      const isRemoving = currentIndex !== -1;
      
      if (isRemoving) {
        // Remover a reação
        reactions[reactionType].splice(currentIndex, 1);
      } else {
        // Adicionar a reação
        reactions[reactionType].push(userId);
      }

      // Aplicar a atualização na transação
      transaction.update(reviewRef, updatedReview);

      return {
        isRemoving,
        reactions,
        reviewUserId: review.userId,
        seriesId: review.seriesId
      };
    });

    // Lidar com notificações fora da transação para não bloquear
    const { isRemoving, reactions, reviewUserId, seriesId } = result;
    const currentUserId = auth.currentUser.uid;

    // Gerenciar notificações em background
    setTimeout(async () => {
      try {
        if (!auth.currentUser) return;
        
        if (isRemoving && reviewUserId !== currentUserId) {
          // Usar removeReactionNotification para tratar a remoção da notificação de maneira segura
          await removeReactionNotification(reviewId, currentUserId);
        }
        else if (!isRemoving && reviewUserId !== currentUserId) {
          // Verificar se uma notificação foi enviada recentemente
          const wasNotified = wasNotifiedRecently(
            reviewId,
            currentUserId,
            reviewUserId,
            'reaction'
          );
          
          // Se não foi notificado recentemente, enviar notificação
          if (!wasNotified) {
            try {
              const seriesDetails = await getSeriesDetails(seriesId);
              const userData = await getUserData(auth.currentUser.uid);
              const userName = userData?.username || userData?.displayName || auth.currentUser.email;
              
              // Registrar que a notificação está sendo enviada
              trackNotification(reviewId, auth.currentUser.uid, reviewUserId, 'reaction');
              
              // Usar mensagem mais genérica para evitar múltiplas notificações específicas
              const message = `${userName} reagiu à sua avaliação de ${seriesDetails.name} (Temporada ${seasonNumber}).`;
              
              await createNotification(
                reviewUserId,
                NotificationType.NEW_REACTION,
                {
                  senderId: auth.currentUser.uid,
                  seriesId: seriesId,
                  seriesName: seriesDetails.name,
                  seriesPoster: seriesDetails.poster_path || undefined,
                  seasonNumber,
                  reviewId,
                  message
                }
              );
            } catch (notificationError) {
              console.error("Erro ao criar notificação:", notificationError);
              // Silencia erros na tarefa em background
            }
          }
        }
      } catch (error) {
        console.error("Erro geral no processamento de notificações:", error);
        // Silencia erros gerais
      }
    }, 0);

    // Retornar imediatamente o novo estado para atualização da UI
    return {
      likes: reactions.likes.length,
      userReaction: reactions.likes.includes(userId) ? "likes" : null
    };
  } catch (error) {
    console.error("Erro ao atualizar reação:", error);
    throw error;
  }
}

export async function toggleCommentReaction(
  reviewId: string,
  seasonNumber: number,
  commentId: string,
  reactionType: "likes"
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const userId = auth.currentUser.uid;
  const reviewRef = doc(reviewsCollection, reviewId);
  
  try {
    // Usamos uma transação para garantir a consistência dos dados
    const result = await runTransaction(db, async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      
      if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

      const review = reviewDoc.data() as SeriesReview;
      const seasonIndex = review.seasonReviews.findIndex(
        (sr) => sr.seasonNumber === seasonNumber
      );

      if (seasonIndex === -1) throw new Error("Temporada não encontrada");

      // Criar uma cópia da avaliação para atualização
      const updatedReview = {
        ...review,
        seasonReviews: [...review.seasonReviews]
      };

      // Encontrar o comentário
      const comment = updatedReview.seasonReviews[seasonIndex].comments?.find(
        (c) => c.id === commentId
      );

      if (!comment) throw new Error("Comentário não encontrado");

      // Toggle da reação atual
      const currentIndex = comment.reactions[reactionType].indexOf(userId);
      
      // Verificar se está adicionando ou removendo a reação
      const isRemoving = currentIndex !== -1;
      
      if (isRemoving) {
        // Remover a reação
        comment.reactions[reactionType].splice(currentIndex, 1);
      } else {
        // Adicionar a reação
        comment.reactions[reactionType].push(userId);
      }

      // Aplicar a atualização na transação
      transaction.update(reviewRef, updatedReview);

      return {
        isRemoving,
        comment,
        seriesId: review.seriesId
      };
    });

    // Lidar com notificações fora da transação para não bloquear
    const { isRemoving, comment, seriesId } = result;
    const currentUserId = auth.currentUser.uid;

    // Gerenciar notificações em background
    setTimeout(async () => {
      try {
        if (!auth.currentUser) return;
        
        if (isRemoving && comment.userId !== currentUserId) {
          // Usar removeReactionNotification para tratar a remoção da notificação de maneira segura
          await removeReactionNotification(reviewId, currentUserId, commentId);
        }
        else if (!isRemoving && comment.userId !== currentUserId) {
          // Adicionar notificação ao dar like
          try {
            // Verificar se uma notificação foi enviada recentemente
            const wasNotified = wasNotifiedRecently(
              `${reviewId}_comment_${commentId}`,
              currentUserId,
              comment.userId,
              'reaction'
            );
            
            // Se não foi notificado recentemente, enviar notificação
            if (!wasNotified) {
              try {
                const seriesDetails = await getSeriesDetails(seriesId);
                const userData = await getUserData(auth.currentUser.uid);
                const userName = userData?.username || userData?.displayName || auth.currentUser.email;
                
                // Registrar que a notificação está sendo enviada
                trackNotification(
                  `${reviewId}_comment_${commentId}`, 
                  auth.currentUser.uid, 
                  comment.userId, 
                  'reaction'
                );
                
                // Usar mensagem mais genérica para evitar múltiplas notificações específicas
                const message = `${userName} reagiu ao seu comentário em ${seriesDetails.name} (Temporada ${seasonNumber}).`;
                
                await createNotification(
                  comment.userId,
                  NotificationType.NEW_REACTION,
                  {
                    senderId: auth.currentUser.uid,
                    seriesId: seriesId,
                    seriesName: seriesDetails.name,
                    seriesPoster: seriesDetails.poster_path || undefined,
                    seasonNumber,
                    reviewId: `${reviewId}_comment_${commentId}`,
                    message
                  }
                );
              } catch (notificationError) {
                console.error("Erro ao criar notificação:", notificationError);
                // Silencia erros de notificação
              }
            }
          } catch (error) {
            console.error("Erro no processamento de notificação:", error);
            // Silencia erros
          }
        }
      } catch (error) {
        console.error("Erro geral no processamento de notificações:", error);
        // Silencia erros gerais
      }
    }, 0);

    // Retornar imediatamente o novo estado para atualização da UI
    return {
      likes: comment.reactions.likes.length,
      userReaction: comment.reactions.likes.includes(userId) ? "likes" : null
    };
  } catch (error) {
    console.error("Erro ao atualizar reação em comentário:", error);
    throw error;
  }
}

export interface PopularReview {
  id: string;
  userId: string;
  seriesId: number;
  seriesName: string;
  seriesPoster: string | null;
  seasonNumber: number;
  rating: number;
  comment: string;
  userName: string;
  userAvatar: string;
  createdAt: Date;
  likes: number;
}

export async function getPopularReviews(): Promise<PopularReview[]> {
  try {
    const reviewsRef = collection(db, "reviews");
    
    // Não usamos mais o filtro de data
    const q = query(
      reviewsRef,
      orderBy("createdAt", "desc"),
      limit(50) // Buscamos mais para poder filtrar depois
    );

    const querySnapshot = await getDocs(q);
    const reviews = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const review = doc.data() as SeriesReview;
        const userData = await getUserData(review.userId);
        const seriesDetails = await getSeriesDetails(review.seriesId);
        
        // Verificar se existem avaliações de temporada
        if (!review.seasonReviews || review.seasonReviews.length === 0) {
          return null; // Ignorar avaliações sem temporadas
        }
        
        // Pegar a primeira avaliação de temporada para mostrar
        const firstSeasonReview = review.seasonReviews[0];
        
        // Calcular o número de curtidas
        const likesCount = firstSeasonReview.reactions?.likes?.length || 0;
        
        return {
          id: doc.id,
          userId: review.userId,
          seriesId: review.seriesId,
          seriesName: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path,
          seasonNumber: firstSeasonReview.seasonNumber,
          rating: firstSeasonReview.rating,
          comment: firstSeasonReview.comment,
          userName: userData?.displayName || review.userEmail,
          userAvatar: userData?.photoURL || "",
          createdAt: firstSeasonReview.createdAt instanceof Date 
            ? firstSeasonReview.createdAt 
            : typeof firstSeasonReview.createdAt === 'object' && 'seconds' in firstSeasonReview.createdAt
              ? new Date(firstSeasonReview.createdAt.seconds * 1000)
              : new Date(),
          likes: likesCount,
        };
      })
    );
    
    // Filtrar avaliações nulas e que tenham pelo menos 1 curtida
    const filteredReviews = reviews
      .filter(review => review !== null && review.likes >= 1) as PopularReview[];
    
    // Ordenar por número de curtidas (decrescente)
    return filteredReviews
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 30); // Limitar a 30 resultados
  } catch (error) {
    console.error("Erro ao buscar avaliações populares:", error);
    return [];
  }
}

export async function getFollowedUsersReviews(userId: string, seriesId: number): Promise<SeriesReview[]> {
  // Primeiro, buscar os usuários que o usuário segue
  const following = await getFollowing(userId);
  const followedUserIds = following.map((f: { userId: string }) => f.userId);

  // Se não estiver seguindo ninguém, retornar array vazio
  if (followedUserIds.length === 0) {
    return [];
  }

  // Buscar as avaliações dos usuários seguidos para a série específica
  const reviewsRef = collection(db, "reviews");
  const q = query(
    reviewsRef,
    where("seriesId", "==", seriesId),
    where("userId", "in", followedUserIds)
  );

  const querySnapshot = await getDocs(q);
  const reviews = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const seriesDetails = await getSeriesDetails(data.seriesId);

      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        seriesId: data.seriesId,
        seasonReviews: data.seasonReviews,
        series: {
          name: seriesDetails.name,
          poster_path: seriesDetails.poster_path,
        },
      } as SeriesReview;
    })
  );

  return reviews;
}

/**
 * Busca avaliações recentes de usuários que o usuário atual segue
 * @param limitCount Número máximo de avaliações a retornar
 * @returns Promise com array de avaliações populares
 */
export async function getRecentFollowedUsersReviews(limitCount: number = 10): Promise<PopularReview[]> {
  if (!auth.currentUser) {
    return [];
  }
  
  try {
    // Buscar os usuários que o usuário atual segue
    const following = await getFollowing(auth.currentUser.uid);
    const followedUserIds = following.map(f => f.userId);
    
    // Se não estiver seguindo ninguém, retornar array vazio
    if (followedUserIds.length === 0) {
      return [];
    }
    
    // Buscar avaliações recentes dos usuários seguidos
    const reviewsRef = collection(db, "reviews");
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const q = query(
      reviewsRef,
      where("userId", "in", followedUserIds),
      where("createdAt", ">=", oneWeekAgo),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const review = doc.data() as SeriesReview;
        const userData = await getUserData(review.userId);
        const seriesDetails = await getSeriesDetails(review.seriesId);
        
        // Pegar a primeira avaliação de temporada para mostrar
        const firstSeasonReview = review.seasonReviews[0];
        
        return {
          id: doc.id,
          userId: review.userId,
          seriesId: review.seriesId,
          seriesName: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path,
          seasonNumber: firstSeasonReview.seasonNumber,
          rating: firstSeasonReview.rating,
          comment: firstSeasonReview.comment,
          userName: userData?.displayName || review.userEmail,
          userAvatar: userData?.photoURL || "",
          createdAt: firstSeasonReview.createdAt instanceof Date 
            ? firstSeasonReview.createdAt 
            : typeof firstSeasonReview.createdAt === 'object' && 'seconds' in firstSeasonReview.createdAt
              ? new Date(firstSeasonReview.createdAt.seconds * 1000)
              : new Date(),
          likes: firstSeasonReview.reactions?.likes?.length || 0,
        };
      })
    );
    
    return reviews;
  } catch (error) {
    console.error("Erro ao buscar avaliações de usuários seguidos:", error);
    return [];
  }
}

export async function getUserRecentReviews(userId: string, limitCount: number = 3): Promise<PopularReview[]> {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reviews = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const review = doc.data() as SeriesReview;
        const userData = await getUserData(review.userId);
        const seriesDetails = await getSeriesDetails(review.seriesId);
        
        // Pegar a primeira avaliação de temporada para mostrar
        const firstSeasonReview = review.seasonReviews[0];
        
        return {
          id: doc.id,
          userId: review.userId,
          seriesId: review.seriesId,
          seriesName: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path,
          seasonNumber: firstSeasonReview.seasonNumber,
          rating: firstSeasonReview.rating,
          comment: firstSeasonReview.comment,
          userName: userData?.displayName || review.userEmail,
          userAvatar: userData?.photoURL || "",
          createdAt: firstSeasonReview.createdAt instanceof Date 
            ? firstSeasonReview.createdAt 
            : typeof firstSeasonReview.createdAt === 'object' && 'seconds' in firstSeasonReview.createdAt
              ? new Date(firstSeasonReview.createdAt.seconds * 1000)
              : new Date(),
          likes: firstSeasonReview.reactions?.likes?.length || 0,
        };
      })
    );

    return reviews;
  } catch (error) {
    console.error(`Erro ao buscar reviews recentes do usuário ${userId}:`, error);
    return [];
  }
}

/**
 * Busca todas as avaliações, independente de popularidade
 * @param limitCount Número máximo de avaliações a retornar
 * @returns Promise com array de todas as avaliações
 */
export async function getAllReviews(limitCount: number = 30): Promise<PopularReview[]> {
  try {
    const reviewsRef = collection(db, "reviews");
    
    const q = query(
      reviewsRef,
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const reviews = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const review = doc.data() as SeriesReview;
        const userData = await getUserData(review.userId);
        const seriesDetails = await getSeriesDetails(review.seriesId);
        
        // Verificar se existem avaliações de temporada
        if (!review.seasonReviews || review.seasonReviews.length === 0) {
          return null; // Ignorar avaliações sem temporadas
        }
        
        // Pegar a primeira avaliação de temporada para mostrar
        const firstSeasonReview = review.seasonReviews[0];
        
        return {
          id: doc.id,
          userId: review.userId,
          seriesId: review.seriesId,
          seriesName: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path,
          seasonNumber: firstSeasonReview.seasonNumber,
          rating: firstSeasonReview.rating,
          comment: firstSeasonReview.comment,
          userName: userData?.displayName || review.userEmail,
          userAvatar: userData?.photoURL || "",
          createdAt: firstSeasonReview.createdAt instanceof Date 
            ? firstSeasonReview.createdAt 
            : typeof firstSeasonReview.createdAt === 'object' && 'seconds' in firstSeasonReview.createdAt
              ? new Date(firstSeasonReview.createdAt.seconds * 1000)
              : new Date(),
          likes: firstSeasonReview.reactions?.likes?.length || 0,
        };
      })
    );
    
    // Filtrar itens nulos (que foram ignorados por não terem avaliações de temporada)
    return reviews.filter(review => review !== null) as PopularReview[];
  } catch (error) {
    console.error("Erro ao buscar todas as avaliações:", error);
    return [];
  }
}
