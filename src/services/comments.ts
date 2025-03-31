import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
  limit,
  setDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from "../config/firebase";
import { auth } from "../config/firebase";
import { Comment } from '../components/comments/CommentSection';
import { 
  createNotification, 
  NotificationType,
} from './notifications';
import { getUserData } from './users';

// Cache para rastrear notificações recentes
// Estrutura: { [receiverId_objectId_senderId_type]: timestamp }
const recentCommentsNotificationsCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutos em milissegundos

/**
 * Verifica se uma notificação de comentário foi enviada recentemente
 * @param objectId ID do objeto (lista ou review)
 * @param senderId ID do usuário que comentou
 * @param receiverId ID do usuário que recebe a notificação
 * @returns Verdadeiro se uma notificação foi enviada nos últimos 30 minutos
 */
function wasCommentNotifiedRecently(
  objectId: string, 
  senderId: string, 
  receiverId: string
): boolean {
  const cacheKey = `${receiverId}_${objectId}_${senderId}_comment`;
  const lastNotified = recentCommentsNotificationsCache.get(cacheKey);
  
  if (lastNotified) {
    const now = Date.now();
    return (now - lastNotified) < NOTIFICATION_COOLDOWN;
  }
  
  return false;
}

/**
 * Registra que uma notificação de comentário foi enviada
 * @param objectId ID do objeto (lista ou review)
 * @param senderId ID do usuário que comentou
 * @param receiverId ID do usuário que recebe a notificação
 */
function trackCommentNotification(
  objectId: string, 
  senderId: string, 
  receiverId: string
): void {
  const cacheKey = `${receiverId}_${objectId}_${senderId}_comment`;
  recentCommentsNotificationsCache.set(cacheKey, Date.now());
}

/**
 * Verifica se um usuário já fez comentários anteriores em um objeto
 */
async function hasExistingComments(
  objectId: string,
  objectType: string,
  userId: string
): Promise<boolean> {
  try {
    const commentsCollectionName = objectType === 'review' ? 'reviewComments' : 'listComments';
    
    const commentsQuery = query(
      collection(db, commentsCollectionName),
      where("objectId", "==", objectId),
      where("userId", "==", userId),
      where("createdAt", ">=", new Date(Date.now() - 3600000)) // Comentários na última hora
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar comentários existentes:', error);
    return false;
  }
}

/**
 * Adiciona um comentário a um objeto (review ou lista)
 */
export async function addComment(
  objectId: string,
  objectType: string,
  content: string
): Promise<Comment> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  const userId = auth.currentUser.uid;
  const userEmail = auth.currentUser.email || '';
  const displayName = auth.currentUser.displayName || '';
  const photoURL = auth.currentUser.photoURL || '';
  
  try {
    // Determinar a coleção correta com base no tipo do objeto
    const collectionName = getObjectCollectionName(objectType);
    if (!collectionName) {
      throw new Error(`Tipo de objeto inválido: ${objectType}`);
    }
    
    // Verificar se o objeto existe
    const objectRef = doc(db, collectionName, objectId);
    const objectSnap = await getDoc(objectRef);
    
    if (!objectSnap.exists()) {
      throw new Error(`${objectType === 'review' ? 'Avaliação' : 'Lista'} não encontrada`);
    }
    
    const objectData = objectSnap.data();
    const objectOwnerId = objectData.userId;
    
    // Criar o comentário
    const commentsCollectionName = objectType === 'review' ? 'reviewComments' : 'listComments';
    const commentData = {
      objectId,
      objectType,
      userId,
      username: '', // Será obtido do perfil do usuário
      userEmail,
      userDisplayName: displayName,
      userPhotoURL: photoURL,
      content,
      createdAt: serverTimestamp(),
    };
    
    // Adicionar o comentário
    const docRef = await addDoc(collection(db, commentsCollectionName), commentData);
    
    // Incrementar o contador de comentários no objeto original
    await runTransaction(db, async (transaction) => {
      const objectDoc = await transaction.get(objectRef);
      if (!objectDoc.exists()) {
        throw new Error(`${objectType === 'review' ? 'Avaliação' : 'Lista'} não encontrada`);
      }
      
      const currentCount = objectDoc.data().commentsCount || 0;
      transaction.update(objectRef, { commentsCount: currentCount + 1 });
    });
    
    // Enviar notificação ao proprietário do objeto, se não for o próprio usuário comentando
    if (objectOwnerId !== userId) {
      try {
        const userData = await getUserData(userId);
        const commentatorName = userData?.username || userData?.displayName || userEmail?.split('@')[0] || "Alguém";
        
        // Verificar se o usuário já fez comentários anteriores neste objeto
        const hasMultipleComments = await hasExistingComments(objectId, objectType, userId);
        
        // Verificar se já enviamos notificação recentemente (usando cache local)
        const alreadyNotified = wasCommentNotifiedRecently(objectId, userId, objectOwnerId);
        
        // Só enviar notificação se não tiver enviado recentemente
        if (!alreadyNotified) {
          // Registrar que a notificação está sendo enviada
          trackCommentNotification(objectId, userId, objectOwnerId);
          
          // Definir a mensagem baseada em se existem comentários anteriores
          if (objectType === 'list') {
            const message = hasMultipleComments
              ? `${commentatorName} fez comentários na sua lista "${objectData.title}"`
              : `${commentatorName} comentou na sua lista "${objectData.title}"`;
            
            await createNotification(
              objectOwnerId,
              NotificationType.LIST_COMMENT,
              {
                senderId: userId,
                reviewId: objectId, // Usar reviewId para armazenar o ID da lista
                message
              }
            );
          } else if (objectType === 'review') {
            const message = hasMultipleComments
              ? `${commentatorName} fez comentários na sua avaliação`
              : `${commentatorName} comentou na sua avaliação`;
            
            await createNotification(
              objectOwnerId,
              NotificationType.NEW_COMMENT,
              {
                senderId: userId,
                reviewId: objectId,
                seriesId: objectData.seriesId,
                message
              }
            );
          }
        }
      } catch (error) {
        console.error('Erro ao criar notificação de comentário:', error);
        // Continuamos mesmo se falhar ao criar notificação
      }
    }
    
    // Retornar o comentário criado
    return {
      id: docRef.id,
      objectId,
      objectType,
      userId,
      username: '',  // Será preenchido por quem exibe o comentário
      userDisplayName: displayName,
      userPhotoURL: photoURL,
      content,
      createdAt: new Date(),
    } as Comment;
    
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    throw error;
  }
}

/**
 * Obtém todos os comentários de um objeto (review ou lista)
 */
export async function getComments(objectId: string, objectType: string): Promise<Comment[]> {
  try {
    const commentsCollectionName = objectType === 'review' ? 'reviewComments' : 'listComments';
    const commentsQuery = query(
      collection(db, commentsCollectionName),
      where('objectId', '==', objectId),
      where('objectType', '==', objectType),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    const comments: Comment[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || undefined,
      } as Comment);
    });
    
    return comments;
  } catch (error) {
    console.error('Erro ao obter comentários:', error);
    return [];
  }
}

/**
 * Atualiza um comentário existente
 */
export async function updateComment(
  commentId: string, 
  objectId: string, 
  objectType: string, 
  content: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const commentsCollectionName = objectType === 'review' ? 'reviewComments' : 'listComments';
    const commentRef = doc(db, commentsCollectionName, commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error('Comentário não encontrado');
    }
    
    const commentData = commentSnap.data();
    
    // Verificar se o usuário atual é o autor do comentário
    if (commentData.userId !== auth.currentUser.uid) {
      throw new Error('Você não tem permissão para editar este comentário');
    }
    
    // Atualizar o comentário
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    throw error;
  }
}

/**
 * Exclui um comentário e atualiza o contador no objeto pai
 */
export async function deleteComment(
  commentId: string, 
  objectId: string, 
  objectType: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }

  try {
    const commentsCollectionName = objectType === 'review' ? 'reviewComments' : 'listComments';
    const commentRef = doc(db, commentsCollectionName, commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error('Comentário não encontrado');
    }
    
    const commentData = commentSnap.data();
    
    // Verificar se o usuário atual é o autor do comentário
    if (commentData.userId !== auth.currentUser.uid) {
      throw new Error('Você não tem permissão para excluir este comentário');
    }
    
    // Determinar a coleção do objeto pai
    const collectionName = getObjectCollectionName(objectType);
    if (!collectionName) {
      throw new Error(`Tipo de objeto inválido: ${objectType}`);
    }
    
    const objectRef = doc(db, collectionName, objectId);
    
    // Executar a transação para excluir o comentário e atualizar o contador
    await runTransaction(db, async (transaction) => {
      const objectDoc = await transaction.get(objectRef);
      if (!objectDoc.exists()) {
        throw new Error(`${objectType === 'review' ? 'Avaliação' : 'Lista'} não encontrada`);
      }
      
      // Excluir o comentário
      transaction.delete(commentRef);
      
      // Atualizar o contador de comentários
      const currentCount = objectDoc.data().commentsCount || 0;
      transaction.update(objectRef, { 
        commentsCount: Math.max(0, currentCount - 1) 
      });
    });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    throw error;
  }
}

/**
 * Função auxiliar para obter o nome da coleção com base no tipo de objeto
 */
function getObjectCollectionName(objectType: string): string | null {
  switch (objectType) {
    case 'review':
      return 'reviews';
    case 'list':
      return 'lists';
    default:
      return null;
  }
} 