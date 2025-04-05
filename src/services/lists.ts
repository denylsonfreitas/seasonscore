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
const LIST_COMMENTS_COLLECTION = "comments";
const DEFAULT_LIMIT = 10;

// Cache para rastrear notificações recentes de reações em listas
// Estrutura: { [userId_listId_reactionType]: timestamp }
const recentListReactionsCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutos em milissegundos

/**
 * Verifica se uma notificação de reação foi enviada recentemente
 * @param listId ID da lista
 * @param senderId ID do usuário que reagiu
 * @param receiverId ID do usuário que recebe a notificação
 * @returns Verdadeiro se uma notificação foi enviada nos últimos 30 minutos
 */
function wasReactionNotifiedRecently(
  listId: string, 
  senderId: string, 
  receiverId: string
): boolean {
  const cacheKey = `${receiverId}_${listId}_${senderId}_reaction`;
  const lastNotified = recentListReactionsCache.get(cacheKey);
  
  if (lastNotified) {
    const now = Date.now();
    return (now - lastNotified) < NOTIFICATION_COOLDOWN;
  }
  
  return false;
}

/**
 * Registra que uma notificação de reação foi enviada
 * @param listId ID da lista
 * @param senderId ID do usuário que reagiu
 * @param receiverId ID do usuário que recebe a notificação
 */
function trackReactionNotification(
  listId: string, 
  senderId: string, 
  receiverId: string
): void {
  const cacheKey = `${receiverId}_${listId}_${senderId}_reaction`;
  recentListReactionsCache.set(cacheKey, Date.now());
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
      dislikesCount: 0,
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
 * Obtém as listas populares
 * @param limitCount Número máximo de listas a retornar
 * @returns Promise com array de listas populares
 */
export async function getPopularLists(limitCount: number = DEFAULT_LIMIT): Promise<ListWithUserData[]> {
  try {
    const listsQuery = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true),
      orderBy("likesCount", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(listsQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Mapear os documentos para objetos List e incluir os IDs
    const lists = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description || "",
        tags: data.tags || [],
        isPublic: data.isPublic,
        items: data.items || [],
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
        likesCount: data.likesCount || 0,
        dislikesCount: data.dislikesCount || 0,
        commentsCount: data.commentsCount || 0,
      } as List;
    });
    
    // Buscar dados dos usuários para cada lista
    const listsWithUserData = await Promise.all(
      lists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          
          // Obter uma imagem de capa usando o primeiro item da lista
          const coverImage = list.items && list.items.length > 0 
            ? list.items[0].poster_path 
            : null;
          
          return {
            ...list,
            userDisplayName: userData?.displayName || "Usuário",
            userPhotoURL: userData?.photoURL || "",
            coverImage
          } as ListWithUserData;
        } catch (error) {
          return {
            ...list,
            userDisplayName: "Usuário",
            userPhotoURL: "",
          } as ListWithUserData;
        }
      })
    );
    
    // Ordenar por data de atualização e limitar o número de resultados
    const sortedLists = listsWithUserData.sort((a, b) => {
      // Garantir que estamos trabalhando com objetos Date
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : convertTimestampToDate(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : convertTimestampToDate(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, limitCount);
    
    return sortedLists;
  } catch (error) {
    console.error("Erro ao obter listas populares:", error);
    return [];
  }
}

/**
 * Busca listas por tag
 * @param tag Tag para filtrar
 * @param limitCount Limite de resultados
 * @returns Promise com array de listas
 */
export async function getListsByTag(
  tag: string,
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  try {
    const q = query(
      collection(db, LISTS_COLLECTION),
      where("tags", "array-contains", tag.toLowerCase()),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const lists = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      items: doc.data().items.map((item: any) => ({
        ...item,
        addedAt: item.addedAt?.toDate() || new Date()
      }))
    } as List));

    // Buscar informações dos usuários
    const listsWithUserData = await Promise.all(lists.map(async (list) => {
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
    }));

    return listsWithUserData;
  } catch (error) {
    console.error("Erro ao buscar listas por tag:", error);
    throw error;
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
      likes: {},
      dislikes: {}
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
 * Adiciona ou remove uma reação (like/dislike) de uma lista
 */
export async function toggleListReaction(
  listId: string,
  reactionType: ListReactionType
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("Você precisa estar logado para reagir a uma lista");
  }

  try {
    const currentUser = auth.currentUser;
    const userId = currentUser.uid;
    
    // Buscar os dados da lista
    const listData = await getListById(listId);
    if (!listData) {
      throw new Error("Lista não encontrada");
    }
    
    // IDs compostos para identificar a reação única
    const likeId = `${listId}_${userId}_like`;
    const dislikeId = `${listId}_${userId}_dislike`;
    
    // Referências aos documentos
    const likeRef = doc(db, LIST_REACTIONS_COLLECTION, likeId);
    const dislikeRef = doc(db, LIST_REACTIONS_COLLECTION, dislikeId);
    
    // Verificar se as reações já existem
    const likeDoc = await getDoc(likeRef);
    const dislikeDoc = await getDoc(dislikeRef);
    
    const hasLiked = likeDoc.exists();
    const hasDisliked = dislikeDoc.exists();
    
    // Variável para rastrear se estamos removendo uma reação existente
    let isRemoving = false;
    
    // Determinar a ação com base no tipo de reação e estado atual
    if (reactionType === "like") {
      if (hasLiked) {
        // Remover like
        await deleteDoc(likeRef);
        await updateDoc(doc(db, LISTS_COLLECTION, listId), {
          likesCount: Math.max(0, (listData.likesCount || 0) - 1)
        });
        isRemoving = true;
      } else {
        // Adicionar like e remover dislike se existir
        const batch = writeBatch(db);
        
        batch.set(likeRef, {
          userId,
          listId,
          type: "like",
          createdAt: serverTimestamp()
        });
        
        batch.update(doc(db, LISTS_COLLECTION, listId), {
          likesCount: (listData.likesCount || 0) + 1
        });
        
        if (hasDisliked) {
          batch.delete(dislikeRef);
          batch.update(doc(db, LISTS_COLLECTION, listId), {
            dislikesCount: Math.max(0, (listData.dislikesCount || 0) - 1)
          });
        }
        
        await batch.commit();
      }
    } else if (reactionType === "dislike") {
      if (hasDisliked) {
        // Remover dislike
        await deleteDoc(dislikeRef);
        await updateDoc(doc(db, LISTS_COLLECTION, listId), {
          dislikesCount: Math.max(0, (listData.dislikesCount || 0) - 1)
        });
        isRemoving = true;
      } else {
        // Adicionar dislike e remover like se existir
        const batch = writeBatch(db);
        
        batch.set(dislikeRef, {
          userId,
          listId,
          type: "dislike",
          createdAt: serverTimestamp()
        });
        
        batch.update(doc(db, LISTS_COLLECTION, listId), {
          dislikesCount: (listData.dislikesCount || 0) + 1
        });
        
        if (hasLiked) {
          batch.delete(likeRef);
          batch.update(doc(db, LISTS_COLLECTION, listId), {
            likesCount: Math.max(0, (listData.likesCount || 0) - 1)
          });
        }
        
        await batch.commit();
      }
    }
    
    // Lidar com notificações
    if (listData.userId !== currentUser.uid) {
      if (isRemoving) {
        // Se estamos removendo uma reação, remover notificações relacionadas
        try {
          // Buscar e excluir apenas as notificações enviadas pelo usuário atual para o dono da lista
          const notificationsQuery = query(
            collection(db, "notifications"),
            where("type", "==", NotificationType.LIST_REACTION),
            where("senderId", "==", currentUser.uid),
            where("userId", "==", listData.userId),
            where("reviewId", "==", listId)
          );
          
          const querySnapshot = await getDocs(notificationsQuery);
          
          if (!querySnapshot.empty) {
            const batch = writeBatch(db);
            
            querySnapshot.forEach(doc => {
              batch.delete(doc.ref);
            });
            
            await batch.commit();
          }
        } catch (error) {
          // Silenciar erro ao remover notificações
        }
      } else {
        // Verificar se uma notificação foi enviada recentemente por este usuário para esta lista
        const wasNotifiedRecently = wasReactionNotifiedRecently(
          listId,
          currentUser.uid,
          listData.userId
        );
        
        // Se não foi notificado recentemente, enviar notificação
        if (!wasNotifiedRecently) {
          // Registrar que a notificação está sendo enviada
          trackReactionNotification(listId, currentUser.uid, listData.userId);
          
          // Criar mensagem mais genérica para evitar múltiplas notificações específicas
          const message = `${currentUser.displayName || 'Alguém'} reagiu à sua lista "${listData.title}".`;
          
          // Enviar notificação
          await createNotification(
            listData.userId,
            NotificationType.LIST_REACTION,
            {
              senderId: currentUser.uid,
              reviewId: listId, // Usar reviewId para armazenar o listId
              message
            }
          );
        }
      }
    }
  } catch (error) {
    console.error("Erro ao reagir à lista:", error);
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
 * Obtém listas dos usuários que o usuário atual segue
 * @param limitCount Número máximo de listas a retornar
 * @returns Promise com array de listas dos usuários seguidos
 */
export async function getFollowedUsersLists(limitCount: number = DEFAULT_LIMIT): Promise<ListWithUserData[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Primeiro, obter a lista de usuários seguidos pelo usuário atual
    const followingQuery = query(
      collection(db, "followers"),
      where("followerId", "==", currentUser.uid)
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
      
      return userListsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description || "",
          tags: data.tags || [],
          isPublic: data.isPublic,
          items: data.items || [],
          createdAt: convertTimestampToDate(data.createdAt),
          updatedAt: convertTimestampToDate(data.updatedAt),
          likesCount: data.likesCount || 0,
          dislikesCount: data.dislikesCount || 0,
          commentsCount: data.commentsCount || 0,
        } as List;
      });
    });
    
    // Aguardar todas as promessas e combinar os resultados
    const allLists = (await Promise.all(listsPromises)).flat();
    
    // Ordenar por data de atualização e limitar o número de resultados
    const sortedLists = allLists.sort((a, b) => {
      // Garantir que estamos trabalhando com objetos Date
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : convertTimestampToDate(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : convertTimestampToDate(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, limitCount);
    
    // Buscar dados dos usuários para cada lista
    const listsWithUserData = await Promise.all(
      sortedLists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          
          // Obter uma imagem de capa usando o primeiro item da lista
          const coverImage = list.items && list.items.length > 0 
            ? list.items[0].poster_path 
            : null;
          
          return {
            ...list,
            userDisplayName: userData?.displayName || "Usuário",
            userPhotoURL: userData?.photoURL || "",
            coverImage
          } as ListWithUserData;
        } catch (error) {
          return {
            ...list,
            userDisplayName: "Usuário",
            userPhotoURL: "",
          } as ListWithUserData;
        }
      })
    );
    
    return listsWithUserData;
  } catch (error) {
    console.error("Erro ao obter listas de usuários seguidos:", error);
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
 * Busca listas públicas por título, descrição ou tags
 * @param query Termo de busca
 * @param limitCount Limite de resultados
 * @returns Promise com array de listas que correspondem à busca
 */
export async function searchLists(
  searchText: string,
  limitCount: number = DEFAULT_LIMIT
): Promise<ListWithUserData[]> {
  if (!searchText.trim()) return [];
  
  try {
    const searchTerm = searchText.trim().toLowerCase();
    
    // Buscar todas as listas públicas
    const listsQuery = query(
      collection(db, LISTS_COLLECTION),
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc")
    );
    
    const querySnapshot = await getDocs(listsQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Filtrar por título, descrição ou tags que contenham o termo de busca
    const matchingLists = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description || "",
          tags: data.tags || [],
          isPublic: data.isPublic,
          items: (data.items || []).map((item: any) => ({
            ...item,
            addedAt: convertTimestampToDate(item.addedAt)
          })),
          createdAt: convertTimestampToDate(data.createdAt),
          updatedAt: convertTimestampToDate(data.updatedAt),
          likesCount: data.likesCount || 0,
          dislikesCount: data.dislikesCount || 0,
          commentsCount: data.commentsCount || 0,
        } as List;
      })
      .filter(list => {
        // Verificar se o termo de busca está no título
        if (list.title.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Verificar se o termo de busca está na descrição
        if (list.description && list.description.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Verificar se o termo de busca está em alguma tag
        if (list.tags && list.tags.some(tag => tag.includes(searchTerm))) {
          return true;
        }
        
        return false;
      })
      .slice(0, limitCount);
    
    // Buscar informações dos usuários para cada lista
    const listsWithUserData = await Promise.all(
      matchingLists.map(async (list) => {
        try {
          const userData = await getUserData(list.userId);
          
          // Obter uma imagem de capa usando o primeiro item da lista
          const coverImage = list.items && list.items.length > 0 
            ? list.items[0].poster_path 
            : null;
          
          return {
            ...list,
            userDisplayName: userData?.displayName || "Usuário",
            userPhotoURL: userData?.photoURL || "",
            coverImage
          } as ListWithUserData;
        } catch (error) {
          return {
            ...list,
            userDisplayName: "Usuário",
            userPhotoURL: "",
          } as ListWithUserData;
        }
      })
    );
    
    return listsWithUserData;
  } catch (error) {
    console.error("Erro ao buscar listas:", error);
    return [];
  }
} 