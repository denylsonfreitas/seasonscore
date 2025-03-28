import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getFirestore,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
  limit as firestoreLimit,
  deleteDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { auth } from "../config/firebase";
import { getUserData, addToUserWatchedSeries } from "./users";
import { getSeriesDetails } from "./tmdb";

const db = getFirestore();
const notificationsCollection = collection(db, "notifications");

// Cache para armazenar notificações por usuário
const notificationsCache = new Map<string, {
  data: Notification[];
  timestamp: number;
}>();

// Tempo máximo de validade do cache em milissegundos (2 minutos)
const CACHE_EXPIRY = 2 * 60 * 1000;

// Limite padrão para consultas de notificações
const DEFAULT_NOTIFICATION_LIMIT = 50;

export enum NotificationType {
  NEW_FOLLOWER = "new_follower",
  NEW_COMMENT = "NEW_COMMENT",
  NEW_EPISODE = "new_episode",
  NEW_REACTION = "NEW_REACTION",
  NEW_REVIEW = "NEW_REVIEW"
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  senderId?: string;
  senderName?: string;
  senderPhoto?: string;
  seriesId?: number;
  seriesName?: string;
  seriesPoster?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  reviewId?: string;
  message: string;
  read: boolean;
  createdAt: Date | Timestamp;
}

// Função auxiliar para verificar se o cache está válido
function isCacheValid(userId: string): boolean {
  const cachedData = notificationsCache.get(userId);
  if (!cachedData) return false;
  
  const now = Date.now();
  return (now - cachedData.timestamp) < CACHE_EXPIRY;
}

// Função auxiliar para atualizar o cache
function updateCache(userId: string, notifications: Notification[]): void {
  notificationsCache.set(userId, {
    data: notifications,
    timestamp: Date.now()
  });
}

// Função auxiliar para limpar o cache de um usuário específico
function invalidateCache(userId: string): void {
  notificationsCache.delete(userId);
}

// Criar uma nova notificação
export async function createNotification(
  userId: string,
  type: NotificationType,
  data: {
    senderId?: string;
    seriesId?: number;
    seriesName?: string;
    seriesPoster?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    reviewId?: string;
    message: string;
  }
): Promise<string | null> {
  try {
    // Verificar configurações de notificação do usuário
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.warn(`Usuário ${userId} não encontrado. Notificação não será criada.`);
      return null;
    }
    
    const userData = userDoc.data();
    const notificationSettings = userData.notificationSettings || {
      newEpisode: true,
      newFollower: true,
      newComment: true,
      newReaction: true,
      newReview: true
    };
    
    // Verificar se o tipo de notificação está habilitado para este usuário
    let isEnabled = true;
    
    switch (type) {
      case NotificationType.NEW_EPISODE:
        isEnabled = notificationSettings.newEpisode;
        break;
      case NotificationType.NEW_FOLLOWER:
        isEnabled = notificationSettings.newFollower;
        break;
      case NotificationType.NEW_COMMENT:
        isEnabled = notificationSettings.newComment;
        break;
      case NotificationType.NEW_REACTION:
        isEnabled = notificationSettings.newReaction;
        break;
      case NotificationType.NEW_REVIEW:
        isEnabled = notificationSettings.newReview;
        break;
    }
    
    // Se o tipo de notificação estiver desabilitado, não criar a notificação
    if (!isEnabled) {
      return null;
    }
    
    // Se houver um senderId, buscar informações do remetente
    let senderName, senderPhoto;
    if (data.senderId) {
      const senderData = await getUserData(data.senderId);
      senderName = senderData?.username || senderData?.displayName || senderData?.email;
      senderPhoto = senderData?.photoURL;
    }

    // Verificar se já existe uma notificação similar recente
    let existingNotificationId = null;
    
    if (auth.currentUser && data.senderId) {
      try {
        let q;
        
        if (type === NotificationType.NEW_REACTION && data.reviewId) {
          // Para reações em avaliações, agrupar por reviewId
          q = query(
            notificationsCollection,
            where("userId", "==", userId),
            where("type", "==", type),
            where("reviewId", "==", data.reviewId),
            orderBy("createdAt", "desc"),
            firestoreLimit(1)
          );
        } else {
          // Para outros tipos, verificar por remetente
          q = query(
            notificationsCollection,
            where("userId", "==", userId),
            where("type", "==", type),
            where("senderId", "==", data.senderId),
            orderBy("createdAt", "desc"),
            firestoreLimit(1)
          );
        }
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const notificationDoc = querySnapshot.docs[0];
          const notificationData = notificationDoc.data();
          
          // Verificar se a notificação é recente (menos de 24 horas)
          const notificationDate = notificationData.createdAt instanceof Timestamp 
            ? notificationData.createdAt.toDate() 
            : notificationData.createdAt;
            
          const now = new Date();
          const timeDiff = now.getTime() - (notificationDate?.getTime() || 0);
          const isRecent = timeDiff < 24 * 60 * 60 * 1000; // 24 horas em milissegundos
          
          if (isRecent) {
            // Para reações em avaliações, atualizar a mensagem para indicar múltiplas reações
            if (type === NotificationType.NEW_REACTION && data.reviewId) {
              let newMessage = data.message;
              
              // Se a mensagem já contém "e outros", atualizar o contador
              if (notificationData.message.includes("e outros")) {
                const currentCount = notificationData.message.match(/e outros (\d+)/);
                const count = currentCount ? parseInt(currentCount[1]) + 1 : 2;
                newMessage = `${senderName} e outros ${count} reagiram à sua avaliação`;
              } else {
                newMessage = `${senderName} e outros 1 reagiram à sua avaliação`;
              }
              
              // Atualizar a notificação existente
              const notificationRef = doc(db, "notifications", notificationDoc.id);
              await updateDoc(notificationRef, {
                message: newMessage,
                read: false, // Marcar como não lida novamente
                createdAt: serverTimestamp(), // Atualizar o timestamp
              });
            } else {
              // Para outros tipos, apenas atualizar a notificação existente
              const notificationRef = doc(db, "notifications", notificationDoc.id);
              await updateDoc(notificationRef, {
                message: data.message,
                read: false, // Marcar como não lida novamente
                createdAt: serverTimestamp(), // Atualizar o timestamp
              });
            }
            
            // Invalidar o cache após atualizar uma notificação
            invalidateCache(userId);
            
            return notificationDoc.id;
          }
        }
      } catch (error) {
        console.error("Erro ao verificar notificações existentes:", error);
        // Continuar e criar uma nova notificação mesmo se houver erro na verificação
      }
    }

    // Criar uma nova notificação se não houver similar recente
    const notificationData = {
      userId,
      type,
      senderId: data.senderId || null,
      senderName: senderName || null,
      senderPhoto: senderPhoto || null,
      seriesId: data.seriesId || null,
      seriesName: data.seriesName || null,
      seriesPoster: data.seriesPoster || null,
      seasonNumber: data.seasonNumber || null,
      episodeNumber: data.episodeNumber || null,
      reviewId: data.reviewId || null,
      message: data.message,
      read: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(notificationsCollection, notificationData);
    
    // Invalidar o cache após criar uma nova notificação
    invalidateCache(userId);
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return null;
  }
}

// Obter notificações do usuário
export async function getUserNotifications(userId: string, limit = DEFAULT_NOTIFICATION_LIMIT): Promise<Notification[]> {
  // Verificar se há um cache válido
  if (isCacheValid(userId)) {
    return notificationsCache.get(userId)!.data;
  }
  
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate() 
        : data.createdAt;
      
      notifications.push({
        id: doc.id,
        ...data,
        createdAt,
      } as Notification);
    });
    
    // Atualizar o cache
    updateCache(userId, notifications);
    
    return notifications;
  } catch (error) {
    console.error("Erro ao obter notificações:", error);
    return [];
  }
}

// Marcar notificação como lida
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
    
    // Buscar o userId para invalidar o cache
    const notificationDoc = await getDoc(notificationRef);
    if (notificationDoc.exists()) {
      const userId = notificationDoc.data().userId;
      if (userId) {
        invalidateCache(userId);
      }
    }
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    throw error;
  }
}

// Marcar todas as notificações como lidas
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      where("read", "==", false),
      firestoreLimit(100) // Limitar para evitar operações em lote muito grandes
    );
    
    const querySnapshot = await getDocs(q);
    
    // Atualização em lote para melhor performance
    const batch = querySnapshot.size > 0 ? writeBatch(db) : null;
    
    querySnapshot.forEach((docSnapshot) => {
      const notificationRef = docSnapshot.ref;
      batch?.update(notificationRef, { read: true });
    });
    
    if (batch) {
      await batch.commit();
    }
    
    // Invalidar o cache após marcar todas como lidas
    invalidateCache(userId);
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas:", error);
    throw error;
  }
}

// Excluir notificação
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    // Buscar o userId antes de excluir para invalidar o cache
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);
    
    let userId = null;
    if (notificationDoc.exists()) {
      userId = notificationDoc.data().userId;
    }
    
    // Excluir a notificação
    await deleteDoc(notificationRef);
    
    // Invalidar o cache se tiver o userId
    if (userId) {
      invalidateCache(userId);
    }
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
    throw error;
  }
}

// Excluir notificações de um tipo específico e de um remetente específico
export async function deleteNotificationsOfType(
  userId: string,
  type: NotificationType,
  senderId?: string
): Promise<void> {
  try {
    // Verificar se o usuário atual tem permissão para excluir estas notificações
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return;
    }
    
    let q;
    
    if (senderId) {
      // Buscar notificações do tipo específico e do remetente específico
      q = query(
        notificationsCollection,
        where("userId", "==", userId),
        where("type", "==", type),
        where("senderId", "==", senderId)
      );
    } else {
      // Buscar todas as notificações do tipo específico
      q = query(
        notificationsCollection,
        where("userId", "==", userId),
        where("type", "==", type)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const batch = [];
    for (const docSnapshot of querySnapshot.docs) {
      batch.push(deleteDoc(doc(db, "notifications", docSnapshot.id)));
    }
    
    await Promise.all(batch);
  } catch (error) {
    console.error(`Erro ao excluir notificações do tipo ${type}:`, error);
    throw error;
  }
}

// Configurar listener para notificações em tempo real
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    notificationsCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    firestoreLimit(50)
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Notification[];
    
    callback(notifications);
  });
}

// Contar notificações não lidas
export async function countUnreadNotifications(userId: string): Promise<number> {
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Erro ao contar notificações não lidas:", error);
    return 0;
  }
}

// Limpar notificações duplicadas e antigas
export async function cleanupNotifications(userId: string): Promise<number> {
  try {
    // Verificar se o usuário atual tem permissão para limpar estas notificações
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return 0;
    }
    
    // Buscar todas as notificações do usuário
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    
    // Agrupar notificações por tipo e contexto
    const notificationGroups: Record<string, Notification[]> = {};
    
    notifications.forEach(notification => {
      let key = '';
      
      switch (notification.type) {
        case NotificationType.NEW_REACTION:
          if (notification.reviewId) {
            // Agrupar por avaliação
            key = `reaction_review_${notification.reviewId}`;
          } else {
            // Caso não tenha reviewId, usar senderId
            key = `reaction_sender_${notification.senderId || 'unknown'}`;
          }
          break;
        case NotificationType.NEW_COMMENT:
          if (notification.seriesId) {
            // Agrupar por série
            key = `comment_series_${notification.seriesId}`;
          } else {
            // Caso não tenha seriesId, usar senderId
            key = `comment_sender_${notification.senderId || 'unknown'}`;
          }
          break;
        case NotificationType.NEW_FOLLOWER:
          key = `follower_${notification.senderId || 'unknown'}`;
          break;
        case NotificationType.NEW_EPISODE:
          key = `episode_${notification.seriesId || 'unknown'}`;
          break;
        case NotificationType.NEW_REVIEW:
          key = `review_${notification.seriesId || 'unknown'}_${notification.senderId || 'unknown'}`;
          break;
        default:
          // Para outros tipos, criar uma chave genérica
          key = `${String(notification.type)}_${notification.senderId || 'unknown'}`;
      }
      
      if (!notificationGroups[key]) {
        notificationGroups[key] = [];
      }
      notificationGroups[key].push(notification);
    });
    
    // Para cada grupo, manter apenas a notificação mais recente
    const deletePromises: Promise<void>[] = [];
    
    Object.values(notificationGroups).forEach(group => {
      // Se houver mais de uma notificação no grupo, excluir as mais antigas
      if (group.length > 1) {
        // Ordenar por data de criação (mais recente primeiro)
        group.sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp 
            ? a.createdAt.toDate().getTime() 
            : a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          
          const dateB = b.createdAt instanceof Timestamp 
            ? b.createdAt.toDate().getTime() 
            : b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          
          return dateB - dateA;
        });
        
        // Para notificações de reação, atualizar a primeira para indicar múltiplas reações
        if (group[0].type === NotificationType.NEW_REACTION && group[0].reviewId) {
          // Contar quantas notificações diferentes temos neste grupo
          const uniqueSenders = new Set(group.map(n => n.senderId));
          
          if (uniqueSenders.size > 1) {
            // Atualizar a mensagem para indicar múltiplas reações
            const notification = group[0];
            const notificationRef = doc(db, "notifications", notification.id);
            
            let newMessage = `${notification.senderName} e outros ${uniqueSenders.size - 1} reagiram à sua avaliação`;
            
            updateDoc(notificationRef, {
              message: newMessage,
              read: false, // Marcar como não lida novamente
            }).catch(error => {
              console.error("Erro ao atualizar mensagem de notificação:", error);
            });
          }
        }
        
        // Manter a primeira (mais recente) e excluir as demais
        for (let i = 1; i < group.length; i++) {
          deletePromises.push(deleteNotification(group[i].id));
        }
      }
    });
    
    // Executar todas as exclusões
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
    
    // Retornar o número de notificações removidas
    return deletePromises.length;
  } catch (error) {
    console.error("Erro ao limpar notificações:", error);
    return 0;
  }
}

// Função melhorada para obter notificações agrupadas do usuário
export async function getGroupedNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(50)
    );
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Notification[];

    // Agrupar notificações por tipo, remetente, e contexto (série, avaliação)
    const notificationGroups: Record<string, Notification> = {};
    
    notifications.forEach(notification => {
      // Criar uma chave única com base no tipo e contexto da notificação
      let key = '';
      
      switch (notification.type) {
        case NotificationType.NEW_REACTION:
          if (notification.reviewId) {
            // Agrupar por avaliação
            key = `reaction_review_${notification.reviewId}`;
          } else {
            // Caso não tenha reviewId, usar senderId
            key = `reaction_sender_${notification.senderId || 'unknown'}`;
          }
          break;
        case NotificationType.NEW_COMMENT:
          if (notification.seriesId) {
            // Agrupar por série
            key = `comment_series_${notification.seriesId}`;
          } else {
            // Caso não tenha seriesId, usar senderId
            key = `comment_sender_${notification.senderId || 'unknown'}`;
          }
          break;
        case NotificationType.NEW_FOLLOWER:
          key = `follower_${notification.senderId || 'unknown'}`;
          break;
        case NotificationType.NEW_EPISODE:
          key = `episode_${notification.seriesId || 'unknown'}`;
          break;
        case NotificationType.NEW_REVIEW:
          key = `review_${notification.seriesId || 'unknown'}_${notification.senderId || 'unknown'}`;
          break;
        default:
          // Para outros tipos, criar uma chave genérica
          key = `${String(notification.type)}_${notification.senderId || 'unknown'}`;
      }
      
      // Se já temos uma notificação deste grupo, só atualizar se esta for mais recente
      if (!notificationGroups[key] || 
          (notification.createdAt > notificationGroups[key].createdAt)) {
        notificationGroups[key] = notification;
      }
    });
    
    // Converter o objeto de grupos para um array e ordenar por data de criação
    return Object.values(notificationGroups).sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Erro ao buscar notificações agrupadas:", error);
    return [];
  }
}

// Remover notificações de reação para uma avaliação específica e um remetente específico
export async function removeReactionNotification(
  reviewId: string,
  senderId: string
): Promise<void> {
  try {
    // Verificar se o usuário atual tem permissão para excluir estas notificações
    if (!auth.currentUser) {
      return;
    }
    
    // Verificar se é uma notificação de comentário
    const isCommentReaction = reviewId.includes('_comment_');
    
    let targetUserId: string | null = null;
    
    if (isCommentReaction) {
      // Para reações a comentários, nós salvamos o ID da review em um formato especial
      // Exemplo: originalReviewId_comment_commentId
      const originalReviewId = reviewId.split('_comment_')[0];
      
      // Buscar a avaliação para obter o dono do comentário
      const reviewRef = doc(collection(db, "reviews"), originalReviewId);
      const reviewSnapshot = await getDoc(reviewRef);
      
      if (!reviewSnapshot.exists()) {
        return;
      }
      
      const reviewData = reviewSnapshot.data();
      // O comentário pertence ao usuário que o criou
      // Como precisaríamos percorrer todos os comentários para encontrar o específico,
      // vamos usar a abordagem de buscar diretamente nas notificações
      
      // Buscar notificações de reação com o reviewId alterado (que inclui o commentId)
      const notificationQuery = query(
        notificationsCollection,
        where("type", "==", NotificationType.NEW_REACTION),
        where("reviewId", "==", reviewId),
        where("senderId", "==", senderId)
      );
      
      const querySnapshot = await getDocs(notificationQuery);
      
      if (querySnapshot.empty) {
        return;
      }
      
      // Deletar todas as notificações encontradas
      const batch = [];
      for (const docSnapshot of querySnapshot.docs) {
        batch.push(deleteDoc(doc(db, "notifications", docSnapshot.id)));
      }
      
      await Promise.all(batch);
    } else {
      // Buscar o usuário dono da avaliação
      const reviewRef = doc(collection(db, "reviews"), reviewId);
      const reviewSnapshot = await getDoc(reviewRef);
      
      if (!reviewSnapshot.exists()) {
        return;
      }
      
      const reviewData = reviewSnapshot.data();
      const reviewOwnerId = reviewData.userId;
      
      // Se for uma avaliação do usuário atual, não fazer nada
      if (reviewOwnerId === senderId) {
        return;
      }
      
      // Buscar notificações de reação para esta avaliação específica e este remetente
      const notificationQuery = query(
        notificationsCollection,
        where("userId", "==", reviewOwnerId),
        where("type", "==", NotificationType.NEW_REACTION),
        where("reviewId", "==", reviewId),
        where("senderId", "==", senderId)
      );
      
      const querySnapshot = await getDocs(notificationQuery);
      
      const batch = [];
      for (const docSnapshot of querySnapshot.docs) {
        batch.push(deleteDoc(doc(db, "notifications", docSnapshot.id)));
      }
      
      await Promise.all(batch);
    }
  } catch (error) {
    console.error("Erro ao remover notificação de reação:", error);
  }
}

// Buscar detalhes de uma avaliação
export async function getReviewDetails(reviewId: string) {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      return null;
    }

    const reviewData = reviewDoc.data();
    const seriesDetails = await getSeriesDetails(reviewData.seriesId);
    
    return {
      id: reviewDoc.id,
      seriesId: reviewData.seriesId,
      userId: reviewData.userId,
      userEmail: reviewData.userEmail,
      seriesName: seriesDetails.name,
      seriesPoster: seriesDetails.poster_path || "",
      seasonNumber: reviewData.seasonReviews[0]?.seasonNumber || 1,
      rating: reviewData.seasonReviews[0]?.rating || 0,
      comment: reviewData.seasonReviews[0]?.comment || "",
      comments: reviewData.seasonReviews[0]?.comments || [],
      reactions: reviewData.seasonReviews[0]?.reactions || { likes: [], dislikes: [] },
      createdAt: reviewData.seasonReviews[0]?.createdAt || new Date()
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes da avaliação:", error);
    return null;
  }
} 