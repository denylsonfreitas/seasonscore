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
} from "firebase/firestore";
import { auth } from "../config/firebase";
import { getSeriesDetails } from "./tmdb";
import { createNotification, NotificationType } from "./notifications";
import { Comment } from "../types/review";
import { getUserData } from "./users";
import { db } from "../config/firebase";
import { SeasonReview } from "../types/review";

const reviewsCollection = collection(db, "reviews");

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
  if (!auth.currentUser.email)
    throw new Error("Email do usuário não encontrado");

  const seasonReview = {
    seriesId,
    seasonNumber,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email,
    rating,
    comment,
    comments: [],
    createdAt: new Date(),
  };

  // Verifica se já existe uma avaliação para esta série do usuário
  const userReviewQuery = query(
    reviewsCollection,
    where("userId", "==", auth.currentUser.uid),
    where("seriesId", "==", seriesId)
  );

  const userReviewSnapshot = await getDocs(userReviewQuery);

  if (userReviewSnapshot.empty) {
    // Cria uma nova avaliação da série
    const seriesReview = {
      seriesId,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      seasonReviews: [seasonReview],
      createdAt: new Date(),
    };

    await addDoc(reviewsCollection, seriesReview);
  } else {
    // Atualiza a avaliação existente
    const reviewDoc = userReviewSnapshot.docs[0];
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
    }

    await updateDoc(reviewDoc.ref, {
      seasonReviews: existingReview.seasonReviews,
    });
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
      console.error("Erro ao criar notificação de comentário:", error);
    }
  }
}

export async function deleteReview(reviewId: string, seasonNumber: number) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewDoc = await getDoc(doc(reviewsCollection, reviewId));
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;

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
      dislikes: []
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
        const seriesDetails = await getSeriesDetails(review.seriesId);
        const userData = await getUserData(auth.currentUser.uid);
        const userName = userData?.username || userData?.displayName || auth.currentUser.email;
        
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
            message: `${userName} comentou na sua avaliação de ${seriesDetails.name} (Temporada ${seasonNumber}).`
          }
        );
      } catch (error) {
        console.error("Erro ao criar notificação de comentário:", error);
      }
    }

    return newComment;
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    throw new Error("Não foi possível adicionar o comentário. Por favor, tente novamente.");
  }
}

export async function deleteComment(
  reviewId: string,
  seasonNumber: number,
  commentId: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewDoc = await getDoc(doc(reviewsCollection, reviewId));
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;
  const seasonIndex = review.seasonReviews.findIndex(
    (sr) => sr.seasonNumber === seasonNumber
  );

  if (seasonIndex === -1) throw new Error("Temporada não encontrada");

  const comments = review.seasonReviews[seasonIndex].comments;
  if (!comments) throw new Error("Não há comentários nesta avaliação");

  const commentIndex = comments.findIndex((c) => c.id === commentId);
  if (commentIndex === -1) throw new Error("Comentário não encontrado");

  const comment = comments[commentIndex];
  if (comment.userId !== auth.currentUser.uid) {
    throw new Error("Você não tem permissão para excluir este comentário");
  }

  comments.splice(commentIndex, 1);

  await updateDoc(reviewDoc.ref, {
    seasonReviews: review.seasonReviews,
  });
}

export async function toggleReaction(
  reviewId: string,
  seasonNumber: number,
  reactionType: "likes" | "dislikes"
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

  // Inicializar reactions se não existir
  if (!updatedReview.seasonReviews[seasonIndex].reactions) {
    updatedReview.seasonReviews[seasonIndex].reactions = {
      likes: [],
      dislikes: []
    };
  }

  const userId = auth.currentUser.uid;
  const reactions = updatedReview.seasonReviews[seasonIndex].reactions!;

  // Remove a reação oposta se existir
  const oppositeType = reactionType === "likes" ? "dislikes" : "likes";
  const oppositeIndex = reactions[oppositeType].indexOf(userId);
  if (oppositeIndex !== -1) {
    reactions[oppositeType].splice(oppositeIndex, 1);
  }

  // Toggle da reação atual
  const currentIndex = reactions[reactionType].indexOf(userId);
  if (currentIndex === -1) {
    reactions[reactionType].push(userId);
  } else {
    reactions[reactionType].splice(currentIndex, 1);
  }

  try {
    await updateDoc(reviewRef, updatedReview);

    // Notificar o dono da avaliação sobre a reação (apenas se for uma nova reação)
    if (currentIndex === -1 && review.userId !== auth.currentUser.uid) {
      try {
        const seriesDetails = await getSeriesDetails(review.seriesId);
        const userData = await getUserData(auth.currentUser.uid);
        const userName = userData?.username || userData?.displayName || auth.currentUser.email;
        
        await createNotification(
          review.userId,
          NotificationType.NEW_REACTION,
          {
            senderId: auth.currentUser.uid,
            seriesId: review.seriesId,
            seriesName: seriesDetails.name,
            seriesPoster: seriesDetails.poster_path || undefined,
            seasonNumber,
            reviewId,
            message: `${userName} reagiu à sua avaliação de ${seriesDetails.name} (Temporada ${seasonNumber}).`
          }
        );
      } catch (error) {
        console.error("Erro ao criar notificação de reação:", error);
      }
    }

    return updatedReview.seasonReviews[seasonIndex];
  } catch (error) {
    console.error("Erro ao atualizar reação:", error);
    throw new Error("Não foi possível atualizar a reação. Por favor, tente novamente.");
  }
}

export async function toggleCommentReaction(
  reviewId: string,
  seasonNumber: number,
  commentId: string,
  reactionType: "likes" | "dislikes"
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

  // Encontrar o comentário
  const comment = updatedReview.seasonReviews[seasonIndex].comments?.find(
    (c) => c.id === commentId
  );

  if (!comment) throw new Error("Comentário não encontrado");

  const userId = auth.currentUser.uid;

  // Remove a reação oposta se existir
  const oppositeType = reactionType === "likes" ? "dislikes" : "likes";
  const oppositeIndex = comment.reactions[oppositeType].indexOf(userId);
  if (oppositeIndex !== -1) {
    comment.reactions[oppositeType].splice(oppositeIndex, 1);
  }

  // Toggle da reação atual
  const currentIndex = comment.reactions[reactionType].indexOf(userId);
  if (currentIndex === -1) {
    comment.reactions[reactionType].push(userId);
  } else {
    comment.reactions[reactionType].splice(currentIndex, 1);
  }

  try {
    await updateDoc(reviewRef, updatedReview);

    // Notificar o dono do comentário sobre a reação (apenas se for uma nova reação)
    if (currentIndex === -1 && comment.userId !== auth.currentUser.uid) {
      try {
        const seriesDetails = await getSeriesDetails(review.seriesId);
        const userData = await getUserData(auth.currentUser.uid);
        const userName = userData?.username || userData?.displayName || auth.currentUser.email;
        
        await createNotification(
          comment.userId,
          NotificationType.NEW_REACTION,
          {
            senderId: auth.currentUser.uid,
            seriesId: review.seriesId,
            seriesName: seriesDetails.name,
            seriesPoster: seriesDetails.poster_path || undefined,
            seasonNumber,
            reviewId,
            message: `${userName} reagiu ao seu comentário em ${seriesDetails.name} (Temporada ${seasonNumber}).`
          }
        );
      } catch (error) {
        console.error("Erro ao criar notificação de reação:", error);
      }
    }

    return comment;
  } catch (error) {
    console.error("Erro ao atualizar reação:", error);
    throw new Error("Não foi possível atualizar a reação. Por favor, tente novamente.");
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
  dislikes: number;
}

export async function getPopularReviews(): Promise<PopularReview[]> {
  const reviewsRef = collection(db, "reviews");
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const q = query(
    reviewsRef,
    where("createdAt", ">=", oneWeekAgo),
    orderBy("createdAt", "desc"),
    limit(10)
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
          : new Date(firstSeasonReview.createdAt.seconds * 1000),
        likes: firstSeasonReview.reactions?.likes?.length || 0,
        dislikes: firstSeasonReview.reactions?.dislikes?.length || 0,
      };
    })
  );

  return reviews;
}
