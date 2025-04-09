import { db, auth } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  increment,
  startAfter,
  writeBatch,
  setDoc,
  runTransaction,
  FieldValue,
} from "firebase/firestore";
import { 
  List, 
  ListItem, 
  ListComment, 
  ListReaction, 
  ListReactionType,
  ListWithUserData
} from "../types/list";
import { getUserData } from "./users";
import { 
  createNotification, 
  NotificationType,
  deleteNotificationsOfType,
  removeReactionNotification
} from "./notifications";
import { ensureFirestoreDelete } from "../utils/deleteUtils";

// Constantes para nomes de coleções
const LISTS_COLLECTION = "lists";
const LIST_REACTIONS_COLLECTION = "listReactions";
const LIST_COMMENTS_COLLECTION = "listComments";
const DEFAULT_LIMIT = 10;

// Cache para rastrear notificações recentes
// Estrutura: { [receiverId_objectId_senderId_type]: timestamp }
const recentNotificationsCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutos em milissegundos

/**
 * Verifica se uma notificação foi enviada recentemente
 * @param objectId ID do objeto (lista ou comentário)
 * @param senderId ID do usuário que interagiu
 * @param receiverId ID do usuário que recebe a notificação
 * @returns Verdadeiro se uma notificação foi enviada nos últimos 30 minutos
 */
function wasNotifiedRecently(
  objectId: string, 
  senderId: string, 
  receiverId: string
): boolean {
  const cacheKey = `${receiverId}_${objectId}_${senderId}`;
  const lastNotified = recentNotificationsCache.get(cacheKey);
  
  if (lastNotified) {
    const now = Date.now();
    return (now - lastNotified) < NOTIFICATION_COOLDOWN;
  }
  
  return false;
}

/**
 * Registra que uma notificação foi enviada
 * @param objectId ID do objeto (lista ou comentário)
 * @param senderId ID do usuário que interagiu
 * @param receiverId ID do usuário que recebe a notificação
 */
function trackNotification(
  objectId: string, 
  senderId: string, 
  receiverId: string
): void {
  const cacheKey = `${receiverId}_${objectId}_${senderId}`;
  recentNotificationsCache.set(cacheKey, Date.now());
}

/**
 * Função utilitária para converter Timestamp para Date
 */
function convertTimestampToDate(timestamp: Date | Timestamp): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

/**
 * Cria uma nova lista de séries
 * @param title Título da lista
 * @param description Descrição da lista (opcional)
 * @param tags Tags da lista (opcional)
 * @param isPublic Se a lista é pública (padrão: true)
 * @param items Itens iniciais da lista (opcional)
 * @param accessByLink Se a lista é acessível por link (padrão: false)
 * @returns Promise com o ID da lista criada
 */
export async function createList(
  title: string,
  description: string = "",
  tags: string[] = [],
  isPublic: boolean = true,
  initialItems: ListItem[] = [],
  accessByLink: boolean = false
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const listData = {
      userId: currentUser.uid,
      title,
      description,
      tags,
      isPublic,
      accessByLink,
      items: initialItems.map(item => ({
        ...item,
        addedAt: new Date()
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
    };

    const listRef = await addDoc(collection(db, LISTS_COLLECTION), listData);
    return listRef.id;
  } catch (error) {
    console.error("Erro ao criar lista:", error);
    throw new Error("Não foi possível criar a lista");
  }
}

/**
 * Adiciona uma série a uma lista existente
 * @param listId ID da lista
 * @param series Dados da série a ser adicionada
 * @returns Promise<void>
 */
export async function addSeriesToList(
  listId: string,
  series: {
    id: number;
    name: string;
    poster_path: string | null;
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listSnap = await getDoc(listRef);
    
    if (!listSnap.exists()) {
      throw new Error("Lista não encontrada");
    }
    
    const listData = listSnap.data();
    if (listData.userId !== currentUser.uid) {
      throw new Error("Você não tem permissão para editar esta lista");
    }
    
    // Verificar se a série já existe na lista
    const seriesExists = listData.items.some((item: ListItem) => 
      item.seriesId === series.id
    );
    
    if (seriesExists) {
      throw new Error("Esta série já está na lista");
    }
    
    // Adicionar a série à lista
    const newItem: ListItem = {
      seriesId: series.id,
      name: series.name,
      poster_path: series.poster_path,
      addedAt: new Date()
    };
    
    await updateDoc(listRef, {
      items: arrayUnion(newItem),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao adicionar série à lista:", error);
    throw error instanceof Error ? error : new Error("Não foi possível adicionar a série à lista");
  }
}

/**
 * Remove uma série de uma lista
 * @param listId ID da lista
 * @param seriesId ID da série a ser removida
 * @returns Promise<void>
 */
export async function removeSeriesFromList(
  listId: string,
  seriesId: number
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listSnap = await getDoc(listRef);
    
    if (!listSnap.exists()) {
      throw new Error("Lista não encontrada");
    }
    
    const listData = listSnap.data();
    if (listData.userId !== currentUser.uid) {
      throw new Error("Você não tem permissão para editar esta lista");
    }
    
    // Encontrar o item da série na lista e removê-lo
    const itemToRemove = listData.items.find((item: ListItem) => 
      item.seriesId === seriesId
    );
    
    if (!itemToRemove) {
      throw new Error("Série não encontrada na lista");
    }
    
    // Ao remover usando arrayRemove, precisamos enviar o objeto exato,
    // então vamos atualizar a lista diretamente
    const updatedItems = listData.items.filter((item: ListItem) => 
      item.seriesId !== seriesId
    );
    
    await updateDoc(listRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao remover série da lista:", error);
    throw error instanceof Error ? error : new Error("Não foi possível remover a série da lista");
  }
}

/**
 * Atualiza informações de uma lista
 * @param listId ID da lista
 * @param data Dados a serem atualizados (título, descrição, tags, isPublic, accessByLink)
 * @returns Promise<void>
 */
export async function updateList(
  listId: string,
  data: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
    accessByLink?: boolean;
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listSnap = await getDoc(listRef);
    
    if (!listSnap.exists()) {
      throw new Error("Lista não encontrada");
    }
    
    const listData = listSnap.data();
    if (listData.userId !== currentUser.uid) {
      throw new Error("Você não tem permissão para editar esta lista");
    }
    
    await updateDoc(listRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao atualizar lista:", error);
    throw error instanceof Error ? error : new Error("Não foi possível atualizar a lista");
  }
}

/**
 * Exclui uma lista
 * @param listId ID da lista a ser excluída
 * @returns Promise<void>
 */
export async function deleteList(listId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listSnap = await getDoc(listRef);
    
    if (!listSnap.exists()) {
      throw new Error("Lista não encontrada");
    }
    
    const listData = listSnap.data();
    if (listData.userId !== currentUser.uid) {
      throw new Error("Você não tem permissão para excluir esta lista");
    }
    
    // Excluir a lista e todos os dados relacionados em uma transação
    await runTransaction(db, async (transaction) => {
      // 1. Excluir todos os comentários da lista
      const commentsQuery = query(
        collection(db, LIST_COMMENTS_COLLECTION),
        where("listId", "==", listId)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach(commentDoc => {
        transaction.delete(commentDoc.ref);
      });
      
      // 2. Excluir todas as reações da lista
      const reactionsQuery = query(
        collection(db, LIST_REACTIONS_COLLECTION),
        where("listId", "==", listId)
      );
      
      const reactionsSnapshot = await getDocs(reactionsQuery);
      reactionsSnapshot.forEach(reactionDoc => {
        transaction.delete(reactionDoc.ref);
      });
      
      // 3. Excluir notificações relacionadas a esta lista
      try {
        await deleteNotificationsOfType(listData.userId, NotificationType.LIST_COMMENT);
        await deleteNotificationsOfType(listData.userId, NotificationType.LIST_REACTION);
      } catch (error) {
        console.error("Erro ao excluir notificações da lista:", error);
        // Continuar mesmo se houver erro nas notificações
      }
      
      // 4. Excluir a lista
      transaction.delete(listRef);
    });
  } catch (error) {
    console.error("Erro ao excluir lista:", error);
    throw error instanceof Error ? error : new Error("Não foi possível excluir a lista");
  }
}

/**
 * Busca uma lista pelo ID
 * @param listId ID da lista
 * @returns Promise com os dados da lista
 */
export async function getListById(listId: string): Promise<ListWithUserData | null> {
  try {
    const listDoc = await getDoc(doc(db, LISTS_COLLECTION, listId));
    
    if (!listDoc.exists()) {
      return null;
    }
    
    const listData = listDoc.data() as List;
    const isPublic = listData.isPublic !== false;
    const allowAccessByLink = listData.accessByLink === true;
    
    // Verificar permissões de acesso:
    // 1. Lista pública: qualquer um pode acessar
    // 2. Lista privada com acesso por link: qualquer um com o link pode acessar
    // 3. Lista totalmente privada: apenas o dono pode acessar
    if (!isPublic && !allowAccessByLink) {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== listData.userId) {
        throw new Error("Você não tem permissão para acessar esta lista");
      }
    }
    
    // Obter dados do usuário
    const userData = await getUserData(listData.userId);
    
    // Buscar todas as reações para esta lista
    const reactionsQuery = query(
      collection(db, LIST_REACTIONS_COLLECTION),
      where("listId", "==", listId)
    );
    
    const reactionsSnapshot = await getDocs(reactionsQuery);
    const reactions: ListReaction[] = [];
    
    reactionsSnapshot.forEach(doc => {
      const reactionData = doc.data() as ListReaction;
      reactions.push({
        ...reactionData,
        id: doc.id,
        createdAt: reactionData.createdAt instanceof Timestamp 
          ? reactionData.createdAt.toDate() 
          : reactionData.createdAt
      });
    });
    
    // Formatar timestamps para Date
    const formattedList: ListWithUserData = {
      ...listData,
      id: listDoc.id,
      createdAt: listData.createdAt instanceof Timestamp 
        ? listData.createdAt.toDate() 
        : listData.createdAt,
      updatedAt: listData.updatedAt instanceof Timestamp 
        ? listData.updatedAt.toDate() 
        : listData.updatedAt,
      items: listData.items.map(item => ({
        ...item,
        addedAt: item.addedAt instanceof Timestamp ? item.addedAt.toDate() : item.addedAt
      })),
      username: userData?.username,
      userPhotoURL: userData?.photoURL,
      userDisplayName: userData?.displayName,
      reactions: reactions
    };
    
    return formattedList;
  } catch (error) {
    console.error("Erro ao obter lista:", error);
    throw new Error("Não foi possível obter os detalhes da lista");
  }
}

/**
 * Busca uma lista pelo ID com informações do usuário
 * @param listId ID da lista
 * @returns Promise com os dados da lista incluindo informações do usuário
 */
export async function getListWithUserData(listId: string): Promise<ListWithUserData | null> {
  try {
    const list = await getListById(listId);
    if (!list) return null;

    const userData = await getUserData(list.userId);
    if (!userData) {
      return {
        ...list,
        username: "Usuário excluído",
        userDisplayName: "Usuário excluído",
        userPhotoURL: null
      };
    }

    return {
      ...list,
      username: userData.username,
      userDisplayName: userData.displayName || userData.username,
      userPhotoURL: userData.photoURL
    };
  } catch (error) {
    console.error("Erro ao buscar lista com dados do usuário:", error);
    throw error;
  }
}

/**
 * Busca listas de um usuário específico
 * @param userId ID do usuário
 * @param onlyPublic Se true, retorna apenas listas públicas
 * @returns Promise com array de listas
 */
export async function getUserLists(userId: string, onlyPublic: boolean = false): Promise<ListWithUserData[]> {
  if (!userId) {
    return [];
  }

  try {
    const listsRef = collection(db, LISTS_COLLECTION);
    let q;
    
    // Verificar se o usuário atual é o mesmo que está sendo consultado
    const currentUser = auth.currentUser;
    const isOwnProfile = currentUser && currentUser.uid === userId;
    
    // Se não for o próprio perfil ou onlyPublic for true, mostrar apenas listas públicas
    if (!isOwnProfile || onlyPublic) {
      q = query(listsRef, 
        where("userId", "==", userId),
        where("isPublic", "==", true)
      );
    } else {
      // Se for o próprio perfil, mostrar todas as listas
      q = query(listsRef, where("userId", "==", userId));
    }
    
    const querySnapshot = await getDocs(q);
    
    const lists: ListWithUserData[] = [];
    const userData = await getUserData(userId);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as List;
      
      // Garantir que accessByLink esteja presente, mesmo em documentos antigos
      const accessByLink = data.accessByLink || false;
      
      lists.push({
        ...data,
        id: doc.id,
        accessByLink,
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
        items: data.items.map((item: any) => ({
          ...item,
          addedAt: convertTimestampToDate(item.addedAt)
        })),
        username: userData?.username,
        userPhotoURL: userData?.photoURL,
        userDisplayName: userData?.displayName,
      });
    });
    
    return lists;
  } catch (error) {
    console.error("Erro ao buscar listas do usuário:", error);
    throw error; // Propagar o erro para que o componente possa tratá-lo
  }
}

/**
 * Retorna as listas mais populares
 * @param limitCount Número de listas a retornar
 * @returns Promise com array de listas populares
 */
export async function getPopularLists(limitCount: number = DEFAULT_LIMIT): Promise<ListWithUserData[]> {
  try {
    const q = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true),
      where("likesCount", ">", 0),
      orderBy("likesCount", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const lists = querySnapshot.docs.map(doc => listFromDoc(doc));

    // Enriquecer com dados de usuário
    return Promise.all(
      lists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          return {
            ...list,
            username: userData?.username,
            userDisplayName: userData?.displayName,
            userPhotoURL: userData?.photoURL,
          };
        } catch (error) {
          console.error(`Erro ao obter dados do usuário para lista ${list.id}:`, error);
          return list as ListWithUserData;
        }
      })
    );
  } catch (error) {
    console.error("Erro ao buscar listas populares:", error);
    return [];
  }
}

/**
 * Retorna todas as listas públicas em ordem aleatória
 * @param limitCount Número de listas a retornar
 * @returns Promise com array de listas em ordem aleatória
 */
export async function getAllLists(limitCount: number = DEFAULT_LIMIT): Promise<ListWithUserData[]> {
  try {
    const q = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true),
      limit(500) // Buscar um número maior para depois randomizar
    );

    const querySnapshot = await getDocs(q);
    let lists = querySnapshot.docs.map(doc => listFromDoc(doc));
    
    // Embaralhar a lista usando o algoritmo Fisher-Yates
    for (let i = lists.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lists[i], lists[j]] = [lists[j], lists[i]];
    }
    
    // Limitar ao número solicitado
    lists = lists.slice(0, limitCount);

    // Enriquecer com dados de usuário
    return Promise.all(
      lists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          return {
            ...list,
            username: userData?.username,
            userDisplayName: userData?.displayName,
            userPhotoURL: userData?.photoURL,
          };
        } catch (error) {
          console.error(`Erro ao obter dados do usuário para lista ${list.id}:`, error);
          return list as ListWithUserData;
        }
      })
    );
  } catch (error) {
    console.error("Erro ao buscar todas as listas:", error);
    return [];
  }
}

/**
 * Busca listas por tag
 * @param tag Tag para buscar
 * @param limitCount Número máximo de resultados
 * @returns Lista de listas que contêm a tag
 */
export async function getListsByTag(
  tag: string,
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  try {
    // Buscar listas públicas com a tag especificada
    const q = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true),
      where("tags", "array-contains", tag),
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const lists = querySnapshot.docs.map(doc => listFromDoc(doc));

    // Enriquecer com dados de usuário
    return Promise.all(
      lists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          return {
            ...list,
            username: userData?.username,
            userDisplayName: userData?.displayName,
            userPhotoURL: userData?.photoURL,
          };
        } catch (error) {
          console.error(`Erro ao obter dados do usuário para lista ${list.id}:`, error);
          return list as ListWithUserData;
        }
      })
    );
  } catch (error) {
    console.error(`Erro ao buscar listas com tag "${tag}":`, error);
    return [];
  }
}

/**
 * Verifica se uma série está em alguma lista do usuário
 * @param userId ID do usuário
 * @param seriesId ID da série
 * @returns Promise com array de listas que contêm a série
 */
export async function getListsContainingSeries(
  userId: string,
  seriesId: number
): Promise<List[]> {
  try {
    const listsRef = collection(db, LISTS_COLLECTION);
    const q = query(listsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const lists: List[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as List;
      
      // Verificar se a série está na lista
      const hasSeriesInItems = data.items.some(
        (item: any) => item.seriesId === seriesId
      );
      
      if (hasSeriesInItems) {
        lists.push({
          ...data,
          id: doc.id,
          createdAt: convertTimestampToDate(data.createdAt),
          updatedAt: convertTimestampToDate(data.updatedAt),
          items: data.items.map((item: any) => ({
            ...item,
            addedAt: convertTimestampToDate(item.addedAt)
          }))
        });
      }
    });
    
    return lists;
  } catch (error) {
    console.error("Erro ao buscar listas contendo a série:", error);
    return [];
  }
}

/**
 * Adiciona um comentário a uma lista
 * @param listId ID da lista
 * @param content Conteúdo do comentário
 * @returns Promise com ID do comentário criado
 */
export async function addCommentToList(
  listId: string,
  content: string
): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("Usuário não autenticado");
  }

  if (!content.trim()) {
    throw new Error("O comentário não pode estar vazio");
  }

  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      throw new Error("Lista não encontrada");
    }

    const listData = listSnap.data() as List;

    const commentData: Omit<ListComment, "id"> = {
      listId,
      userId: auth.currentUser.uid,
      content,
      createdAt: serverTimestamp() as Timestamp,
      likes: {}
    };

    const commentRef = await addDoc(collection(db, LIST_COMMENTS_COLLECTION), commentData);

    // Atualizar contador de comentários na lista
    await updateDoc(listRef, {
      commentsCount: increment(1),
      updatedAt: serverTimestamp()
    });

    // Notificar o dono da lista, se não for o próprio usuário comentando
    if (auth.currentUser.uid !== listData.userId) {
      try {
        const userData = await getUserData(auth.currentUser.uid);
        const commentatorName = userData?.username || userData?.displayName || auth.currentUser.email?.split('@')[0] || "Alguém";
        
        await createNotification(
          listData.userId,
          NotificationType.LIST_COMMENT,
          {
            senderId: auth.currentUser.uid,
            reviewId: listId, // Usar reviewId para armazenar o ID da lista
            message: `${commentatorName} comentou na sua lista "${listData.title}"`
          }
        );
      } catch (error) {
        console.error("Erro ao criar notificação de comentário:", error);
        // Continuar mesmo se a notificação falhar
      }
    }

    return commentRef.id;
  } catch (error) {
    console.error("Erro ao adicionar comentário à lista:", error);
    throw error;
  }
}

/**
 * Exclui um comentário de uma lista
 * @param listId ID da lista
 * @param commentId ID do comentário
 * @returns Promise<void>
 */
export async function deleteListComment(
  listId: string,
  commentId: string
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const commentRef = doc(db, LIST_COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      throw new Error("Comentário não encontrado");
    }

    const commentData = commentSnap.data();
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      throw new Error("Lista não encontrada");
    }

    const listData = listSnap.data();

    // Verificar permissão: o usuário deve ser o autor do comentário ou o dono da lista
    if (commentData.userId !== auth.currentUser.uid && listData.userId !== auth.currentUser.uid) {
      throw new Error("Você não tem permissão para excluir este comentário");
    }

    // Excluir o comentário
    await deleteDoc(commentRef);

    // Atualizar contador de comentários na lista
    await updateDoc(listRef, {
      commentsCount: increment(-1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao excluir comentário da lista:", error);
    throw error;
  }
}

/**
 * Busca comentários de uma lista
 * @param listId ID da lista
 * @returns Promise com array de comentários
 */
export async function getListComments(listId: string): Promise<ListComment[]> {
  try {
    const q = query(
      collection(db, LIST_COMMENTS_COLLECTION),
      where("listId", "==", listId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    } as ListComment));
  } catch (error) {
    console.error("Erro ao buscar comentários da lista:", error);
    throw error;
  }
}

/**
 * Adiciona ou remove uma reação (like) de um comentário de lista
 * @param listId ID da lista
 * @param commentId ID do comentário
 * @returns Retorna o novo status da reação e a contagem de likes
 */
export async function toggleListCommentReaction(
  listId: string,
  commentId: string
): Promise<{
  liked: boolean;
  likesCount: number;
}> {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const userId = auth.currentUser.uid;
  const commentRef = doc(db, LIST_COMMENTS_COLLECTION, commentId);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      
      if (!commentDoc.exists()) {
        console.error(`Comentário ${commentId} não encontrado na coleção ${LIST_COMMENTS_COLLECTION}`);
        throw new Error("Comentário não encontrado");
      }

      const comment = commentDoc.data() as any;
      if (comment.objectId !== listId || comment.objectType !== "list") {
        console.error(`Comentário não pertence à lista ${listId}`, { 
          commentObjectId: comment.objectId, 
          listId,
          commentObjectType: comment.objectType
        });
        throw new Error("Comentário não pertence a esta lista");
      }

      // Clonar o objeto de likes para modificação - inicializa se necessário
      const likes = comment.likes ? { ...comment.likes } : {};
      
      // Verificar se o usuário já curtiu o comentário
      const userLiked = !!likes[userId];
      
      if (userLiked) {
        // Remover o like
        delete likes[userId];
      } else {
        // Adicionar o like
        likes[userId] = true;
      }

      // Aplicar a atualização na transação
      transaction.update(commentRef, { likes });

      return {
        isRemoving: userLiked,
        comment,
        likes,
        likesCount: Object.keys(likes).length
      };
    });

    const { isRemoving, comment, likes, likesCount } = result;
    const currentUserId = auth.currentUser.uid;

    // Gerenciar notificações em background
    setTimeout(async () => {
      try {
        if (!auth.currentUser) return;
        
        // Somente notificar se for uma adição (não uma remoção) e o comentário não for do usuário atual
        if (!isRemoving && comment.userId !== currentUserId) {
          // Verificar se uma notificação foi enviada recentemente
          const wasNotified = wasNotifiedRecently(
            `list_${listId}_comment_${commentId}`,
            currentUserId,
            comment.userId
          );
          
          // Se não foi notificado recentemente, enviar notificação
          if (!wasNotified) {
            try {
              const listSnap = await getDoc(doc(db, LISTS_COLLECTION, listId));
              if (!listSnap.exists()) return;
              
              const listData = listSnap.data() as List;              
              const userData = await getUserData(auth.currentUser.uid);
              const userName = userData?.username || userData?.displayName || auth.currentUser.email;
              
              // Registrar que a notificação está sendo enviada
              trackNotification(
                `list_${listId}_comment_${commentId}`, 
                auth.currentUser.uid, 
                comment.userId
              );
              
              // Usar mensagem mais genérica para evitar múltiplas notificações específicas
              const message = `${userName} reagiu ao seu comentário na lista "${listData.title}".`;
              
              await createNotification(
                comment.userId,
                NotificationType.NEW_REACTION,
                {
                  senderId: auth.currentUser.uid,
                  reviewId: `list_${listId}_comment_${commentId}`,
                  message
                }
              );
            } catch (notificationError) {
              console.error("Erro ao criar notificação:", notificationError);
              // Silencia erros de notificação
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
      liked: !isRemoving,
      likesCount
    };
  } catch (error) {
    console.error("Erro ao atualizar reação em comentário de lista:", error);
    throw error;
  }
}

/**
 * Adiciona ou remove uma reação (like) de uma lista
 */
export async function toggleListReaction(
  listId: string,
  reactionType: ListReactionType
): Promise<{
  liked: boolean;
  likesCount: number;
}> {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const userId = auth.currentUser.uid;
  const listRef = doc(db, LISTS_COLLECTION, listId);
  
  try {
    // Primeiro, verifique diretamente se já existe uma reação do usuário atual
    const userReactionQuery = query(
      collection(db, "listReactions"),
      where("listId", "==", listId),
      where("userId", "==", userId)
    );
    
    const userReactionSnapshot = await getDocs(userReactionQuery);
    const hasExistingReaction = !userReactionSnapshot.empty;
    let reactionDocId = hasExistingReaction ? userReactionSnapshot.docs[0].id : null;
    
    // Agora use uma transação para garantir a consistência
    const transactionResult = await runTransaction(db, async (transaction) => {
      const listDoc = await transaction.get(listRef);
      
      if (!listDoc.exists()) {
        console.error(`[toggleListReaction] Lista ${listId} não encontrada`);
        throw new Error("Lista não encontrada");
      }

      const list = listDoc.data() as List;
      let newLikesCount = list.likesCount || 0;
      
      // Se já existe uma reação, remover
      if (hasExistingReaction && reactionDocId) {
        transaction.delete(doc(db, "listReactions", reactionDocId));
        newLikesCount = Math.max(0, newLikesCount - 1);
        transaction.update(listRef, {
          likesCount: newLikesCount
        });
      } 
      // Senão, adicionar nova reação
      else {
        const newReactionRef = doc(collection(db, "listReactions"));
        const reactionData = {
          id: newReactionRef.id,
          listId,
          userId,
          type: reactionType,
          createdAt: serverTimestamp()
        };
        transaction.set(newReactionRef, reactionData);
        newLikesCount = newLikesCount + 1;
        transaction.update(listRef, {
          likesCount: newLikesCount
        });
      }

      return {
        isRemoving: hasExistingReaction,
        list,
        newLikesCount
      };
    });

    const { isRemoving, list, newLikesCount } = transactionResult;
    const currentUserId = auth.currentUser.uid;
    
    // Processar notificações em background sem bloquear
    Promise.resolve().then(async () => {
      try {
        if (!auth.currentUser) return;
        
        if (isRemoving && list.userId !== currentUserId) {
          // Usar removeReactionNotification para tratar a remoção da notificação de maneira segura
          await removeReactionNotification(listId, currentUserId, undefined, true);
        }
        else if (!isRemoving && list.userId !== currentUserId) {
          // Verificar se já foi enviada notificação recentemente para evitar spam
          if (!wasNotifiedRecently(listId, currentUserId, list.userId)) {
            try {
              const userData = await getUserData(currentUserId);
              const username = userData?.username || userData?.displayName || auth.currentUser.email?.split('@')[0] || "Alguém";
              
              await createNotification(
                list.userId,
                NotificationType.LIST_REACTION,
                {
                  senderId: currentUserId,
                  reviewId: listId,
                  message: `${username} gostou da sua lista "${list.title}"`
                }
              );
              
              // Registrar notificação para evitar duplicatas em curto período
              trackNotification(listId, currentUserId, list.userId);
            } catch (error) {
              console.error("Erro ao enviar notificação de reação:", error);
              // Silenciar erros na notificação
            }
          }
        }
      } catch (error) {
        console.error("Erro geral no processamento de notificações:", error);
      }
    }).catch(error => {
      console.error("Erro ao processar notificações:", error);
    });
    
    // Retornar novo estado imediatamente, sem aguardar as notificações
    const finalResult = {
      liked: !isRemoving,
      likesCount: newLikesCount
    };
    return finalResult;
  } catch (error) {
    console.error("[toggleListReaction] Erro crítico ao processar reação:", error);
    throw error;
  }
}

/**
 * Verifica se o usuário atual já reagiu a uma lista
 * @param listId ID da lista
 * @returns Promise com o tipo de reação, ou null se não houver
 */
export async function getUserListReaction(
  listId: string
): Promise<ListReactionType | null> {
  if (!auth.currentUser) {
    return null;
  }

  try {
    const q = query(
      collection(db, LIST_REACTIONS_COLLECTION),
      where("listId", "==", listId),
      where("userId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data().type as ListReactionType;
  } catch (error) {
    console.error("Erro ao verificar reação do usuário:", error);
    return null;
  }
}

/**
 * Converte um objeto Timestamp para Date se necessário
 */
function ensureDate(dateOrTimestamp: Date | Timestamp): Date {
  if (dateOrTimestamp instanceof Date) {
    return dateOrTimestamp;
  } else if ('toDate' in dateOrTimestamp) {
    return dateOrTimestamp.toDate();
  }
  return new Date();
}

/**
 * Obtém as listas dos usuários que o usuário atual segue
 * @param limitCount Número máximo de listas a retornar
 * @returns Promise com array de listas
 */
export async function getFollowedUsersLists(limitCount: number = DEFAULT_LIMIT): Promise<ListWithUserData[]> {
  if (!auth.currentUser) {
    return [];
  }
  
  try {
    // Buscar os usuários que o usuário atual segue
    const followingQuery = query(
      collection(db, "followers"),
      where("followerId", "==", auth.currentUser.uid)
    );
    
    const followingSnapshot = await getDocs(followingQuery);
    
    if (followingSnapshot.empty) {
      return [];
    }
    
    // Extrair os IDs dos usuários seguidos
    const followedUserIds = followingSnapshot.docs.map(doc => doc.data().userId);
    
    // Buscar listas públicas dos usuários seguidos
    const listsPromises = followedUserIds.map(async (userId) => {
      const userListsQuery = query(
        collection(db, LISTS_COLLECTION),
        where("userId", "==", userId),
        where("isPublic", "==", true),
        orderBy("updatedAt", "desc")
      );
      
      const userListsSnapshot = await getDocs(userListsQuery);
      
      return userListsSnapshot.docs.map(doc => listFromDoc(doc));
    });
    
    // Juntar todas as listas em um único array
    let allLists = (await Promise.all(listsPromises)).flat();
    
    // Ordenar por data de atualização (mais recentes primeiro) e limitar o número
    allLists = allLists
      .sort((a, b) => ensureDate(b.updatedAt).getTime() - ensureDate(a.updatedAt).getTime())
      .slice(0, limitCount);
    
    // Adicionar dados de usuário a cada lista
    return Promise.all(
      allLists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          return {
            ...list,
            username: userData?.username,
            userDisplayName: userData?.displayName,
            userPhotoURL: userData?.photoURL,
          };
        } catch (error) {
          console.error(`Erro ao obter dados do usuário para lista ${list.id}:`, error);
          return list as ListWithUserData;
        }
      })
    );
  } catch (error) {
    console.error("Erro ao buscar listas de usuários seguidos:", error);
    return [];
  }
}

/**
 * Obtém as tags mais populares
 * @param limitCount Número máximo de tags a retornar
 * @returns Promise com array de tags e suas contagens
 */
export async function getPopularTags(limitCount: number = 20): Promise<{tag: string, count: number}[]> {
  try {
    // Buscar todas as listas públicas
    const listsQuery = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true)
    );
    
    const querySnapshot = await getDocs(listsQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Contar ocorrências de cada tag
    const tagCounter = new Map<string, number>();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const tags = data.tags || [];
      
      tags.forEach((tag: string) => {
        const currentCount = tagCounter.get(tag) || 0;
        tagCounter.set(tag, currentCount + 1);
      });
    });
    
    // Converter o Map para array e ordenar por contagem
    const tagsArray = Array.from(tagCounter.entries()).map(([tag, count]) => ({ tag, count }));
    const sortedTags = tagsArray.sort((a, b) => b.count - a.count);
    
    // Limitar o número de resultados
    return sortedTags.slice(0, limitCount);
  } catch (error) {
    console.error("Erro ao obter tags populares:", error);
    return [];
  }
}

/**
 * Busca listas que correspondam a uma pesquisa
 * @param searchText Texto para buscar
 * @param limitCount Número máximo de resultados
 * @returns Array de listas que correspondem à pesquisa
 */
export async function searchLists(
  searchText: string,
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  try {
    // Normalizar e dividir o texto de pesquisa
    const searchTerms = searchText.toLowerCase().trim().split(/\s+/);
    
    // Consultar todas as listas públicas
    const q = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc"),
      limit(limitCount * 3) // Buscar mais resultados para filtrar depois
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filtra as listas que correspondem aos termos de pesquisa
    const matchingLists = querySnapshot.docs
      .map(doc => listFromDoc(doc))
      .filter(list => {
        const titleLower = list.title.toLowerCase();
        const descLower = (list.description || "").toLowerCase();
        const tagsLower = (list.tags || []).map(tag => tag.toLowerCase());
        
        // Verificar se algum termo de pesquisa corresponde ao título, descrição ou tags
        return searchTerms.some(term => 
          titleLower.includes(term) || 
          descLower.includes(term) || 
          tagsLower.some(tag => tag.includes(term))
        );
      })
      .slice(0, limitCount); // Limitar ao número solicitado
    
    // Enriquecer com dados de usuário
    return Promise.all(
      matchingLists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          return {
            ...list,
            username: userData?.username,
            userDisplayName: userData?.displayName,
            userPhotoURL: userData?.photoURL,
          };
        } catch (error) {
          console.error(`Erro ao obter dados do usuário para lista ${list.id}:`, error);
          return list as ListWithUserData;
        }
      })
    );
  } catch (error) {
    console.error(`Erro ao buscar listas com o termo "${searchText}":`, error);
    return [];
  }
}

function listFromDoc(doc: any): List {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title,
    description: data.description || "",
    tags: data.tags || [],
    isPublic: data.isPublic,
    accessByLink: data.accessByLink || false,
    items: data.items || [],
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    likesCount: data.likesCount || 0,
    commentsCount: data.commentsCount || 0
  };
} 