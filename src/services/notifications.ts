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
  limit,
  deleteDoc,
} from "firebase/firestore";
import { auth } from "../config/firebase";
import { getUserData } from "./users";

const db = getFirestore();
const notificationsCollection = collection(db, "notifications");

export enum NotificationType {
  NEW_FOLLOWER = "new_follower",
  NEW_COMMENT = "new_comment",
  NEW_EPISODE = "new_episode",
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
): Promise<string> {
  try {
    
    // Se houver um senderId, buscar informações do remetente
    let senderName, senderPhoto;
    if (data.senderId) {
      const senderData = await getUserData(data.senderId);
      senderName = senderData?.displayName || senderData?.email;
      senderPhoto = senderData?.photoURL;
    }

    // Verificar se já existe uma notificação similar recente (últimas 24 horas)
    // Apenas se o usuário atual for o destinatário da notificação (para evitar erros de permissão)
    let existingNotificationId = null;
    
    if (auth.currentUser && userId === auth.currentUser.uid && data.senderId) {
      try {
        const q = query(
          notificationsCollection,
          where("userId", "==", userId),
          where("type", "==", type),
          where("senderId", "==", data.senderId),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        
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
            // Atualizar a notificação existente em vez de criar uma nova
            const notificationRef = doc(db, "notifications", notificationDoc.id);
            await updateDoc(notificationRef, {
              message: data.message,
              read: false, // Marcar como não lida novamente
              createdAt: serverTimestamp(), // Atualizar o timestamp
            });
            
            return notificationDoc.id;
          }
        }
      } catch (error) {
        console.error("Erro ao verificar notificações existentes:", error);
        // Continuar e criar uma nova notificação mesmo se houver erro na verificação
      }
    }

    // Criar objeto base de notificação
    const notification: Record<string, any> = {
      userId,
      type,
      message: data.message,
      read: false,
      createdAt: serverTimestamp(),
    };

    // Adicionar campos opcionais apenas se não forem undefined
    if (data.senderId) notification.senderId = data.senderId;
    if (senderName) notification.senderName = senderName;
    if (senderPhoto) notification.senderPhoto = senderPhoto;
    if (data.seriesId !== undefined) notification.seriesId = data.seriesId;
    if (data.seriesName) notification.seriesName = data.seriesName;
    if (data.seriesPoster) notification.seriesPoster = data.seriesPoster;
    if (data.seasonNumber !== undefined) notification.seasonNumber = data.seasonNumber;
    if (data.episodeNumber !== undefined) notification.episodeNumber = data.episodeNumber;
    if (data.reviewId) notification.reviewId = data.reviewId;


    const docRef = await addDoc(notificationsCollection, notification);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
}

// Buscar notificações do usuário
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(
      notificationsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Notification[];
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
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
      where("read", "==", false)
    );
    const querySnapshot = await getDocs(q);

    const batch = [];
    for (const docSnapshot of querySnapshot.docs) {
      batch.push(
        updateDoc(doc(db, "notifications", docSnapshot.id), {
          read: true,
        })
      );
    }

    await Promise.all(batch);
  } catch (error) {
    console.error("Erro ao marcar todas notificações como lidas:", error);
    throw error;
  }
}

// Excluir uma notificação
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
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
    limit(50)
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
    
    // Agrupar notificações por tipo e senderId
    const notificationGroups: Record<string, Notification[]> = {};
    
    notifications.forEach(notification => {
      const key = `${notification.type}_${notification.senderId || 'unknown'}`;
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