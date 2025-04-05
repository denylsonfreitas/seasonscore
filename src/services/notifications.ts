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
import { getUserData } from "./users";
import { getSeriesDetails } from "./tmdb";

// Configurações
const db = getFirestore();
const notificationsCollection = collection(db, "notifications");
export const DEFAULT_NOTIFICATION_LIMIT = 50;

// Enum para tipos de notificações
export enum NotificationType {
  NEW_FOLLOWER = "NEW_FOLLOWER",
  NEW_COMMENT = "NEW_COMMENT",
  NEW_REACTION = "NEW_REACTION",
  NEW_EPISODE = "NEW_EPISODE",
  NEW_REVIEW = "NEW_REVIEW",
  LIST_COMMENT = "LIST_COMMENT",
  LIST_REACTION = "LIST_REACTION"
}

// Interface para notificações
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
  isDeleted?: boolean; // Flag para usuários excluídos
}

// Sistema de cache
type NotificationCache = {
  data: Notification[];
  timestamp: number;
};

const cache = new Map<string, NotificationCache>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

function isCacheValid(userId: string): boolean {
  const cached = cache.get(userId);
  return cached ? (Date.now() - cached.timestamp) < CACHE_TTL : false;
}

function updateCache(userId: string, data: Notification[]): void {
  cache.set(userId, { data, timestamp: Date.now() });
}

function invalidateCache(userId: string): void {
  cache.delete(userId);
}

// Criação de notificações
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
    // Verificar se o usuário existe
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return null;
    }
    
    // Verificar se o usuário permite este tipo de notificação
    const userData = userDoc.data();
    const settings = userData.notificationSettings || {
      newEpisode: true,
      newFollower: true,
      newComment: true,
      newReaction: true,
      newReview: true,
      listComment: true,
      listReaction: true
    };
    
    let isEnabled = true;
    switch (type) {
      case NotificationType.NEW_EPISODE: isEnabled = settings.newEpisode; break;
      case NotificationType.NEW_FOLLOWER: isEnabled = settings.newFollower; break;
      case NotificationType.NEW_COMMENT: isEnabled = settings.newComment; break;
      case NotificationType.NEW_REACTION: isEnabled = settings.newReaction; break;
      case NotificationType.NEW_REVIEW: isEnabled = settings.newReview; break;
      case NotificationType.LIST_COMMENT: isEnabled = settings.listComment; break;
      case NotificationType.LIST_REACTION: isEnabled = settings.listReaction; break;
    }
    
    if (!isEnabled) {
      return null;
    }
    
    // Obter dados do remetente
    let senderName: string | null = null;
    let senderPhoto: string | null = null;
    
    if (data.senderId) {
      const senderData = await getUserData(data.senderId);
      if (senderData) {
        senderName = senderData.username || senderData.displayName || senderData.email;
        senderPhoto = senderData.photoURL || null;
      } else {
        senderName = "Usuário excluído";
        senderPhoto = "";
      }
    }
    
    // Criar a notificação
    const notificationData = {
      userId,
      type,
      senderId: data.senderId || null,
      senderName,
      senderPhoto,
      seriesId: data.seriesId || null,
      seriesName: data.seriesName || null,
      seriesPoster: data.seriesPoster || null,
      seasonNumber: data.seasonNumber || null,
      episodeNumber: data.episodeNumber || null,
      reviewId: data.reviewId || null,
      message: data.message,
      read: false,
      createdAt: serverTimestamp(),
      isDeleted: false
    };

    const docRef = await addDoc(notificationsCollection, notificationData);
    invalidateCache(userId);
    
    return docRef.id;
  } catch (error) {
    return null;
  }
}

// Sanitizar notificações
function sanitizeMessage(message: string, senderName: string, type: NotificationType): string {
  if (!senderName) return message;
  
  let sanitized = message;
  
  // Tratamentos específicos por tipo
  switch (type) {
    case NotificationType.NEW_FOLLOWER:
      return sanitized.replace(/^.+(?=começou a seguir você)/i, "Usuário excluído ");
      
    case NotificationType.NEW_COMMENT:
      if (sanitized.includes("comentou na sua avaliação")) {
        return sanitized.replace(/^.+?(?=comentou)/i, "Usuário excluído ");
      }
      break;
      
    case NotificationType.NEW_REACTION:
      if (sanitized.includes("reagiu à sua avaliação")) {
        return sanitized.replace(/^.+?(?=reagiu)/i, "Usuário excluído ");
      }
      break;
      
    case NotificationType.LIST_COMMENT:
      if (sanitized.includes("comentou na sua lista")) {
        return sanitized.replace(/^.+?(?=comentou)/i, "Usuário excluído ");
      }
      break;
      
    case NotificationType.LIST_REACTION:
      if (sanitized.includes("gostou da sua lista") || sanitized.includes("não gostou da sua lista")) {
        return sanitized.replace(/^.+?(?=gostou|não gostou)/i, "Usuário excluído ");
      }
      break;
  }
  
  // Substituição genérica
  const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const fullNameRegex = new RegExp(escapeRegex(senderName), 'gi');
  
  return sanitized.replace(fullNameRegex, "Usuário excluído");
}

// Verificar e atualizar notificações de usuários excluídos
export async function sanitizeNotifications(notifications: Notification[]): Promise<Notification[]> {
  if (!notifications || notifications.length === 0) return notifications;
  
  try {
    // Identificar remetentes únicos
    const senderIds = Array.from(new Set(
      notifications
        .filter(n => n.senderId && !n.isDeleted)
        .map(n => n.senderId!)
    ));
    
    if (senderIds.length === 0) return notifications;
    
    // Verificar quais ainda existem
    const senderStatus: Record<string, boolean> = {};
    
    await Promise.all(senderIds.map(async (id) => {
      try {
        const userData = await getUserData(id);
        senderStatus[id] = !!userData;
      } catch (error) {
        senderStatus[id] = false;
      }
    }));
    
    // Processar notificações
    const updates: Promise<void>[] = [];
    
    const sanitized = notifications.map(notification => {
      if (notification.senderId && !senderStatus[notification.senderId]) {
        // Remetente não existe mais
        const updated = { ...notification };
        
        updated.message = sanitizeMessage(
          notification.message, 
          notification.senderName || "",
          notification.type
        );
        
        updated.senderName = "Usuário excluído";
        updated.senderPhoto = "";
        updated.isDeleted = true;
        
        // Salvar alterações no Firestore
        if (!notification.isDeleted) {
          const ref = doc(db, "notifications", notification.id);
          updates.push(updateDoc(ref, {
            senderName: updated.senderName,
            senderPhoto: updated.senderPhoto,
            message: updated.message,
            isDeleted: true
          }));
        }
        
        return updated;
      }
      
      return notification;
    });
    
    // Aplicar atualizações em segundo plano
    if (updates.length > 0) {
      Promise.all(updates).catch(err => {
      });
    }
    
    return sanitized;
  } catch (error) {
    return notifications;
  }
}

// Obter notificações
export async function getUserNotifications(
  userId: string,
  limit = DEFAULT_NOTIFICATION_LIMIT,
  forceRefresh = false
): Promise<Notification[]> {
  if (!forceRefresh && isCacheValid(userId)) {
    return cache.get(userId)!.data;
  }
  
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    let notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate() 
        : doc.data().createdAt
    } as Notification));
    
    // Verificar remetentes excluídos
    notifications = await sanitizeNotifications(notifications);
    
    // Atualizar cache
    updateCache(userId, notifications);
    
    return notifications;
  } catch (error) {
    return [];
  }
}

// Implementar as funções restantes
// Agrupar notificações para evitar duplicatas
export async function getGroupedNotifications(userId: string): Promise<Notification[]> {
  try {
    // Buscar notificações do usuário
    const notifications = await getUserNotifications(userId);
    
    // Mapear para agrupar notificações similares
    const groups: Record<string, Notification> = {};
    
    notifications.forEach(notification => {
      // Gerar uma chave de agrupamento
      let key = '';
      
      // Usuários excluídos sempre têm chaves únicas
      if (notification.isDeleted) {
        key = `deleted_${notification.id}`;
      } else {
        // Gerar chave baseada no tipo
        switch (notification.type) {
          case NotificationType.NEW_FOLLOWER:
            key = `follower_${notification.senderId || 'unknown'}`;
            break;
            
          case NotificationType.NEW_COMMENT:
            if (notification.reviewId) {
              key = `comment_review_${notification.reviewId}`;
            } else {
              key = `comment_series_${notification.seriesId || 'unknown'}`;
            }
            break;
            
          case NotificationType.NEW_REACTION:
            if (notification.reviewId) {
              key = `reaction_review_${notification.reviewId}`;
            } else {
              key = `reaction_sender_${notification.senderId || 'unknown'}`;
            }
            break;
            
          case NotificationType.NEW_EPISODE:
            key = `episode_${notification.seriesId || 'unknown'}`;
            break;
            
          case NotificationType.NEW_REVIEW:
            key = `review_${notification.seriesId || 'unknown'}_${notification.senderId || 'unknown'}`;
            break;
            
          default:
            key = `${notification.type}_${notification.id}`;
        }
      }
      
      // Manter apenas a notificação mais recente de cada grupo
      if (!groups[key] || 
         (notification.createdAt instanceof Date && 
          groups[key].createdAt instanceof Date && 
          notification.createdAt > groups[key].createdAt)) {
        groups[key] = notification;
      }
    });
    
    // Converter para array e ordenar por data (mais recente primeiro)
    return Object.values(groups).sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    return [];
  }
}

// Limpar notificações duplicadas
export async function cleanupNotifications(userId: string): Promise<number> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return 0;
  }
  
  try {
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
    
    // Agrupar as notificações
    const groups: Record<string, Notification[]> = {};
    
    // Função auxiliar para gerar chaves de agrupamento
    const getGroupKey = (notification: Notification) => {
      if (notification.isDeleted) {
        return `deleted_${notification.id}`;
      }
      
      switch (notification.type) {
        case NotificationType.NEW_FOLLOWER:
          return `follower_${notification.senderId || 'unknown'}`;
          
        case NotificationType.NEW_COMMENT:
          if (notification.reviewId) {
            return `comment_review_${notification.reviewId}`;
          }
          return `comment_series_${notification.seriesId || 'unknown'}`;
          
        case NotificationType.NEW_REACTION:
          if (notification.reviewId) {
            return `reaction_review_${notification.reviewId}`;
          }
          return `reaction_sender_${notification.senderId || 'unknown'}`;
          
        case NotificationType.NEW_EPISODE:
          return `episode_${notification.seriesId || 'unknown'}`;
          
        case NotificationType.NEW_REVIEW:
          return `review_${notification.seriesId || 'unknown'}_${notification.senderId || 'unknown'}`;
          
        default:
          return `${notification.type}_${notification.id}`;
      }
    };
    
    // Agrupá-las
    notifications.forEach(notification => {
      const key = getGroupKey(notification);
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(notification);
    });
    
    // Identificar duplicatas para excluir
    const toDelete: string[] = [];
    
    Object.values(groups).forEach(group => {
      // Se houver apenas 1 ou menos, não há o que limpar
      if (group.length <= 1) return;
      
      // Ordenar por data (mais recente primeiro)
      group.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp 
          ? a.createdAt.toDate().getTime() 
          : a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          
        const dateB = b.createdAt instanceof Timestamp 
          ? b.createdAt.toDate().getTime() 
          : b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          
        return dateB - dateA;
      });
      
      // Manter a mais recente, marcar as outras para exclusão
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i].id);
      }
    });
    
    // Executar as exclusões
    if (toDelete.length > 0) {
      const batch = writeBatch(db);
      
      toDelete.forEach(id => {
        batch.delete(doc(db, "notifications", id));
      });
      
      await batch.commit();
      invalidateCache(userId);
      
    }
    
    return toDelete.length;
  } catch (error) {
    return 0;
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);
    
    if (!notificationDoc.exists()) {
      return; 
    }
    
    const notification = notificationDoc.data() as Notification;
    if (notification.userId !== userId) {
      return;
    }
    
    await updateDoc(notificationRef, { read: true });
    
    invalidateCache(userId);
    
  } catch (error) {
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      where("read", "==", false),
      firestoreLimit(100) 
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return;
    }
    
    const batch = writeBatch(db);
    
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
      await batch.commit();
    
    invalidateCache(userId);
    
  } catch (error) {
    throw error;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }

  try {
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationDoc = await getDoc(notificationRef);
    
    if (!notificationDoc.exists()) {
      return false; 
    }
    
    const notification = notificationDoc.data() as Notification;
    
    if (auth.currentUser.uid !== notification.userId && 
        auth.currentUser.uid !== notification.senderId) {
      return false; 
    }
    
    await deleteDoc(notificationRef);
    
    if (notification.userId) {
      invalidateCache(notification.userId);
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Excluir notificações por tipo
export async function deleteNotificationsOfType(
  userId: string,
  type: NotificationType,
  senderId?: string
): Promise<number> {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return 0;
    }
    
  try {
    // Construir consulta
    let q;
    
    if (senderId) {
      q = query(
        notificationsCollection,
        where("userId", "==", userId),
        where("type", "==", type),
        where("senderId", "==", senderId)
      );
    } else {
      q = query(
        notificationsCollection,
        where("userId", "==", userId),
        where("type", "==", type)
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 0;
    }
    
    // Excluir em lote
    const batch = writeBatch(db);
    
    querySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Invalidar cache
    invalidateCache(userId);
    
    return querySnapshot.size;
  } catch (error) {
    // Silenciar erro não crítico
    return 0;
  }
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
    // Silenciar erro não crítico
    return 0;
  }
}

// Listener de notificações em tempo real
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

  return onSnapshot(q, async (querySnapshot) => {
    // Mapear documentos
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    } as Notification));
    
    // Sanitizar e agrupar
    const sanitized = await sanitizeNotifications(notifications);
    
    // Atualizar cache
    updateCache(userId, sanitized);
    
    // Executar callback
    callback(sanitized);
  });
}

// Obter detalhes da avaliação
export async function getReviewDetails(reviewId: string) {
  try {
    const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
    
    if (!reviewDoc.exists()) {
      console.warn(`⚠️ Avaliação não encontrada: ${reviewId}`);
      return null;
    }

    const reviewData = reviewDoc.data();
    
    // Se não houver dados da série, retornar erro
    if (!reviewData.seriesId) {
      console.warn(`⚠️ Avaliação sem série associada: ${reviewId}`);
      return null;
    }
    
    // Buscar detalhes da série
    try {
    const seriesDetails = await getSeriesDetails(reviewData.seriesId);
    
      // Verificar se há avaliações de temporada
      if (!reviewData.seasonReviews || reviewData.seasonReviews.length === 0) {
        console.warn(`⚠️ Avaliação sem dados de temporada: ${reviewId}`);
        return {
          id: reviewDoc.id,
          seriesId: reviewData.seriesId,
          userId: reviewData.userId,
          userEmail: reviewData.userEmail,
          seriesName: seriesDetails.name,
          seriesPoster: seriesDetails.poster_path || "",
          seasonNumber: 1,
          rating: 0,
          comment: "",
          comments: [],
          reactions: { likes: [], dislikes: [] },
          createdAt: new Date()
        };
      }
      
      // Retornar dados completos
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
    } catch (seriesError) {
      console.error(`❌ Erro ao obter detalhes da série para avaliação ${reviewId}:`, seriesError);
      
      // Retornar dados parciais mesmo sem a série
      return {
        id: reviewDoc.id,
        seriesId: reviewData.seriesId,
        userId: reviewData.userId,
        userEmail: reviewData.userEmail,
        seriesName: "Série não encontrada",
        seriesPoster: "",
        seasonNumber: reviewData.seasonReviews?.[0]?.seasonNumber || 1,
        rating: reviewData.seasonReviews?.[0]?.rating || 0,
        comment: reviewData.seasonReviews?.[0]?.comment || "",
        comments: reviewData.seasonReviews?.[0]?.comments || [],
        reactions: reviewData.seasonReviews?.[0]?.reactions || { likes: [], dislikes: [] },
        createdAt: reviewData.seasonReviews?.[0]?.createdAt || new Date()
      };
    }
  } catch (error) {
    console.error("❌ Erro ao obter detalhes da avaliação:", error);
    return null;
  }
}

// Remover notificações do usuário (para exclusão de conta)
export async function removeCurrentUserNotifications(userId: string): Promise<number> {
  if (!userId) return 0;
  
  try {
    const q = query(notificationsCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 0;
    }
    
    // Excluir em lote
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    
    // Invalidar cache
    invalidateCache(userId);
    
    return querySnapshot.size;
  } catch (error) {
    console.error(`❌ Erro ao remover notificações: ${error}`);
    return 0;
  }
}

/**
 * Remove notificações relacionadas a reações em avaliações
 * @param reviewId ID da avaliação
 * @param userId ID do usuário que está removendo a reação
 * @returns Promise<void>
 */
export async function removeReactionNotification(
  reviewId: string,
  userId: string,
  commentId?: string
) {
  try {
    if (!auth.currentUser) return false;
    
    // Verificar permissões: só pode remover notificações que o usuário atual enviou
    // ou que foram enviadas para o usuário atual
    const notificationsRef = collection(db, "notifications");
    
    // Construir a query base
    let query_ = query(
      notificationsRef,
      where("type", "==", NotificationType.NEW_REACTION),
      where("reviewId", "==", reviewId)
    );
    
    // Se comentId for fornecido, adicionar à query
    if (commentId) {
      // No caso dos comentários, o reviewId é armazenado como `${reviewId}_${commentId}`
      const formattedReviewId = `${reviewId}_${commentId}`;
      query_ = query(
        notificationsRef,
        where("type", "==", NotificationType.NEW_REACTION),
        where("reviewId", "==", formattedReviewId)
      );
    }
    
    // Executar a consulta
    const querySnapshot = await getDocs(query_);
    
    // Filtrar notificações que podem ser excluídas pelo usuário atual
    // (apenas as que o usuário atual enviou ou recebeu)
    const currentUserId = auth.currentUser.uid;
    const docsToDelete = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return (data.senderId === currentUserId || data.userId === currentUserId);
    });
    
    if (docsToDelete.length === 0) {
      return true; // Nada para excluir, simplesmente retorna com sucesso
    }
    
    // Excluir as notificações permitidas em um batch
    const batch = writeBatch(db);
    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit do batch em silêncio (sem logs)
    await batch.commit();
    
    return true;
  } catch (error) {
    // Silenciar erro não crítico
    return false;
  }
}

export async function markAllAsReadType(userId: string): Promise<void> {
  try {
    const notificationsCollection = collection(db, "notifications");
    const querySnapshot = await getDocs(
      query(
        notificationsCollection,
        where("userId", "==", userId),
        where("read", "==", false)
      )
    );
    
    if (querySnapshot.empty) {
      return;
    }
    
    // Atualizar em lote
    const batch = writeBatch(db);
    
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    
    // Invalidar cache
    invalidateCache(userId);
    
  } catch (error) {
    // Silenciar erro não crítico
    // Continuar mesmo em caso de erro
  }
}

export async function markAllAsRead(): Promise<number> {
  try {
    if (!auth.currentUser) return 0;

    const notificationsRef = collection(db, "notifications");
    const query_ = query(
      notificationsRef,
      where("userId", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(query_);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    if (querySnapshot.size > 0) {
      await batch.commit();
    }
    
    return querySnapshot.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Encontra uma notificação existente por tipo, remetente e objeto
 * Se encontrar, atualiza a mensagem e marca como não lida
 * Se não encontrar, retorna null
 */
export async function findAndUpdateExistingNotification(
  receiverId: string,
  senderId: string,
  type: NotificationType,
  objectId: string,
  newMessage: string
): Promise<string | null> {
  if (!auth.currentUser) return null;
  
  try {
    // Buscar notificações existentes com esses filtros
    const q = query(
      notificationsCollection,
      where("userId", "==", receiverId),
      where("senderId", "==", senderId),
      where("type", "==", type),
      where("reviewId", "==", objectId),
      orderBy("createdAt", "desc"),
      firestoreLimit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Se não encontrou notificação existente, retorna null
    if (querySnapshot.empty) {
      return null;
    }
    
    // Encontrou - atualizar a notificação existente
    const notificationDoc = querySnapshot.docs[0];
    const notificationId = notificationDoc.id;
    
    // Atualizar a mensagem e marcar como não lida novamente
    await updateDoc(doc(notificationsCollection, notificationId), {
      message: newMessage,
      read: false,
      createdAt: serverTimestamp() // Atualizar o timestamp para aparecer no topo
    });
    
    // Invalidar o cache
    invalidateCache(receiverId);
    
    return notificationId;
  } catch (error) {
    console.error("Erro ao buscar/atualizar notificação existente:", error);
    return null;
  }
} 