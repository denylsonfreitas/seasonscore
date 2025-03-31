import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { User } from "firebase/auth";
import { collection, query, where, getDocs, writeBatch, DocumentReference, DocumentData } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import {
  serverTimestamp,
  increment,
  orderBy,
  startAt,
  endAt,
  FieldPath,
} from "firebase/firestore";
import { 
  createNotification, 
  NotificationType, 
  deleteNotificationsOfType,
  removeCurrentUserNotifications
} from "./notifications";

export interface UserData {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string | null;
  coverURL?: string | null;
  description?: string;
  favoriteSeries?: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
    images?: {
      logos?: Array<{
        file_path: string;
      }>;
    };
  } | null | undefined;
  notificationSettings?: {
    newEpisode: boolean;
    newFollower: boolean;
    newComment: boolean;
    newReaction: boolean;
    newReview: boolean;
    listComment: boolean;
    listReaction: boolean;
  };
  watchedSeriesIds?: number[]; // Array de IDs de séries que o usuário acompanha
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.length < 3) {
    return false;
  }
  
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    // Em caso de erro, retornamos false para evitar criar usernames duplicados
    return false;
  }
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  if (!email || !email.includes("@")) {
    return false;
  }
  
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    // Em caso de erro, retornamos false para evitar criar emails duplicados
    return false;
  }
}

export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      username: newUsername.toLowerCase(),
      updatedAt: new Date()
    });
  } catch (error) {
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<UserData | null> {
  if (!email) return null;
  
  try {
    // Normalizar o email para minúsculas
    const normalizedEmail = email.toLowerCase().trim();
    
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as UserData;
    }
    
    // Se não encontrou com o email exato, tentar buscar ignorando case
    // Isso é útil para casos onde o email foi armazenado com capitalização diferente
    if (querySnapshot.empty) {
      
      // Buscar todos os usuários e filtrar manualmente
      // Isso é menos eficiente, mas pode ajudar em casos onde o email foi armazenado incorretamente
      const allUsersQuery = query(collection(db, "users"));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      const matchingUser = allUsersSnapshot.docs.find(doc => {
        const userData = doc.data();
        return userData.email && userData.email.toLowerCase() === normalizedEmail;
      });
      
      if (matchingUser) {
        return { id: matchingUser.id, ...matchingUser.data() } as UserData;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function createOrUpdateUser(user: User, additionalData?: Partial<UserData>) {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  
  // Remover campos undefined ou vazios, mas manter valores null explícitos
  const cleanData = (data: any) => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Preservar valores null, remover apenas undefined e strings vazias
      if (value !== undefined && (value !== "" || value === null)) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  try {
    // Verificar se o usuário já existe
    const userDoc = await getDoc(userRef);
    const existingUserData = userDoc.exists() ? userDoc.data() : null;
    
    // Verificar se existe outro usuário com o mesmo email
    const existingUserWithEmail = user.email ? await getUserByEmail(user.email) : null;
    
    // Se encontrou um usuário com o mesmo email mas ID diferente, temos um conflito
    // Isso pode acontecer quando o usuário faz login com diferentes métodos (Google vs email/senha)
    if (existingUserWithEmail && existingUserWithEmail.id !== user.uid) {
      
      // Preservar dados importantes do usuário existente
      if (!additionalData) {
        additionalData = {};
      }
      
      // Preservar username, descrição, foto de capa e séries favoritas
      if (!additionalData.username && existingUserWithEmail.username) {
        additionalData.username = existingUserWithEmail.username;
      }
      
      if (!additionalData.displayName && existingUserWithEmail.displayName) {
        additionalData.displayName = existingUserWithEmail.displayName;
      }
      
      if (!additionalData.description && existingUserWithEmail.description) {
        additionalData.description = existingUserWithEmail.description;
      }
      
      if (!additionalData.coverURL && existingUserWithEmail.coverURL) {
        additionalData.coverURL = existingUserWithEmail.coverURL;
      }
      
      if (!additionalData.favoriteSeries && existingUserWithEmail.favoriteSeries) {
        additionalData.favoriteSeries = existingUserWithEmail.favoriteSeries;
      }
      
      // Considerar migrar todos os dados do usuário existente para o novo ID
      // Isso poderia ser implementado como uma função separada no futuro
      // Por enquanto, apenas registramos o conflito e preservamos os dados
    }
    
    // Gerar username inicial se não existir
    let username = "";
    if (!userDoc.exists()) {
      // Se já existe um usuário com o mesmo email, usar o username dele
      if (existingUserWithEmail && existingUserWithEmail.username) {
        username = existingUserWithEmail.username;
      } else if (additionalData?.username) {
        // Se foi fornecido um username nos dados adicionais, usar ele
        username = additionalData.username;
      } else {
        // Criar username base a partir do email
        username = user.email?.split("@")[0].toLowerCase() || "";
        
        // Se o username já existe, adicionar números até encontrar um disponível
        let counter = 1;
        let tempUsername = username;
        while (!(await isUsernameAvailable(tempUsername))) {
          tempUsername = `${username}${counter}`;
          counter++;
          
          // Limite de tentativas para evitar loop infinito
          if (counter > 100) {
            tempUsername = `${username}${Date.now().toString().slice(-6)}`;
            break;
          }
        }
        username = tempUsername;
      }
    } else {
      // Manter o username existente
      username = userDoc.data()?.username || "";
      
      // Se não tiver username mas foi fornecido nos dados adicionais, usar ele
      if (!username && additionalData?.username) {
        username = additionalData.username;
      }
    }

    // Determinar o displayName a ser usado
    let displayName = user.displayName;
    
    // Se o usuário já existe, preservar o displayName existente
    if (existingUserData && existingUserData.displayName) {
      displayName = existingUserData.displayName;
    }
    
    // Se foi fornecido um displayName nos dados adicionais, usar ele
    if (additionalData?.displayName) {
      displayName = additionalData.displayName;
    }
    
    // Se ainda não temos um displayName, usar o username
    if (!displayName && username) {
      displayName = username;
    }

    // Limpar dados do usuário e dados adicionais
    const baseUserData = cleanData({
      id: user.uid,
      email: user.email,
      username: username,
      displayName: displayName,
      photoURL: user.photoURL
    });

    const cleanedAdditionalData = additionalData ? cleanData(additionalData) : {};

    // Combinar os dados
    const userData = {
      ...baseUserData,
      ...cleanedAdditionalData,
      updatedAt: new Date()
    };

    // Adicionar campo createdAt apenas se for um novo usuário
    if (!userDoc.exists()) {
      userData.createdAt = new Date();
    }

    await setDoc(userRef, userData, { merge: true });
    
    // Registrar que o usuário foi atualizado com sucesso
    
    return userData;
  } catch (error) {
    throw error;
  }
}

export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserData;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<UserData | null> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as UserData;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function getUserByUsernameOrEmail(usernameOrEmail: string): Promise<UserData | null> {
  if (!usernameOrEmail) return null;
  
  try {
    // Remove espaços e converte para minúsculas
    const normalizedInput = usernameOrEmail.toLowerCase().trim();
    
    // Verifica se parece com um email (contém @)
    const isEmail = normalizedInput.includes('@');
    
    if (isEmail) {
      // Se parece com um email, busca por email
      return await getUserByEmail(normalizedInput);
    } else {
      // Se não parece com um email, busca por username
      return await getUserByUsername(normalizedInput);
    }
  } catch (error) {
    return null;
  }
}

export async function deleteUserData(userId: string) {
  try {
    const db = getFirestore();
    
    // Rastrear operações bem-sucedidas e falhas
    const results = {
      success: [] as string[],
      failures: [] as string[],
      permissionIssues: [] as string[]
    };
    
    // Função auxiliar para executar uma operação com tratamento de erro
    const safeOperation = async (operation: () => Promise<void>, name: string) => {
      try {
        await operation();
        results.success.push(name);
        return true;
      } catch (error: any) {
        // Verificar se é um erro de permissão
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          results.permissionIssues.push(name);
          // Retornar true para indicar que o processo deve continuar
          return true;
        }
        
        // Verificar se é um erro de rede ou bloqueio por extensão
        if (
          error.name === 'AbortError' || 
          error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
          error.message?.includes('network error') ||
          error.code === 'failed-precondition' ||
          error.code === 'unavailable'
        ) {
          results.permissionIssues.push(`${name} (erro de rede)`);
          // Retornar true para continuar o processo
          return true;
        }
        results.failures.push(name);
        return false;
      }
    };

    // 1. Excluir dados do usuário
    await safeOperation(async () => {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    }, "excluir perfil do usuário");

    // 2. Excluir reviews do usuário
    await safeOperation(async () => {
      const reviewsSnapshot = await getDocs(query(collection(db, "reviews"), where("userId", "==", userId)));
      const batch = writeBatch(db);
      reviewsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      if (!reviewsSnapshot.empty) {
        await batch.commit();
      }
    }, "excluir reviews");

    // 3. Excluir comentários do usuário em reviews de outros usuários
    await safeOperation(async () => {
      // Precisamos primeiro encontrar todos os reviews que contêm comentários deste usuário
      const reviewsSnapshot = await getDocs(collection(db, "reviews"));
      
      let updateOperations = [];
      
      for (const reviewDoc of reviewsSnapshot.docs) {
        const review = reviewDoc.data();
        let reviewUpdated = false;
        
        // Verificar cada season review
        if (review.seasonReviews && Array.isArray(review.seasonReviews)) {
          for (let i = 0; i < review.seasonReviews.length; i++) {
            const seasonReview = review.seasonReviews[i];
            
            // MODIFICAÇÃO 1: Verificar se há comentários e remover completamente os do usuário
            if (seasonReview.comments && Array.isArray(seasonReview.comments)) {
              // Encontrar e remover comentários do usuário
              const initialCommentsCount = seasonReview.comments.length;
              seasonReview.comments = seasonReview.comments.filter((comment: any) => comment.userId !== userId);
              
              if (initialCommentsCount !== seasonReview.comments.length) {
                reviewUpdated = true;
              }
            }
            
            // MODIFICAÇÃO 2: Verificar reações e remover completamente as do usuário
            if (seasonReview.reactions) {
              // Remover o usuário das listas de likes/dislikes
              if (Array.isArray(seasonReview.reactions.likes) && seasonReview.reactions.likes.includes(userId)) {
                seasonReview.reactions.likes = seasonReview.reactions.likes.filter((id: string) => id !== userId);
                reviewUpdated = true;
              }
              
              if (Array.isArray(seasonReview.reactions.dislikes) && seasonReview.reactions.dislikes.includes(userId)) {
                seasonReview.reactions.dislikes = seasonReview.reactions.dislikes.filter((id: string) => id !== userId);
                reviewUpdated = true;
              }
            }

            // MODIFICAÇÃO 3: Remover reações a comentários
            if (seasonReview.comments && Array.isArray(seasonReview.comments)) {
              for (let j = 0; j < seasonReview.comments.length; j++) {
                const comment = seasonReview.comments[j];
                if (comment.reactions) {
                  let reactionUpdated = false;

                  // Remover likes do usuário em comentários
                  if (Array.isArray(comment.reactions.likes) && comment.reactions.likes.includes(userId)) {
                    comment.reactions.likes = comment.reactions.likes.filter((id: string) => id !== userId);
                    reactionUpdated = true;
                  }

                  // Remover dislikes do usuário em comentários
                  if (Array.isArray(comment.reactions.dislikes) && comment.reactions.dislikes.includes(userId)) {
                    comment.reactions.dislikes = comment.reactions.dislikes.filter((id: string) => id !== userId);
                    reactionUpdated = true;
                  }

                  if (reactionUpdated) {
                    reviewUpdated = true;
                  }
                }
              }
            }
          }
        }
        
        // Se alguma alteração foi feita, atualize o documento
        if (reviewUpdated) {
          updateOperations.push(updateDoc(reviewDoc.ref, { seasonReviews: review.seasonReviews }));
        }
      }
      
      // Aplicar todas as atualizações
      if (updateOperations.length > 0) {
        await Promise.all(updateOperations);
      }
    }, "remover comentários e reações em reviews de outros usuários");

    // 4. Excluir itens da watchlist
    await safeOperation(async () => {
      const watchlistSnapshot = await getDocs(query(collection(db, "watchlist"), where("userId", "==", userId)));
      const batch = writeBatch(db);
      watchlistSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      if (!watchlistSnapshot.empty) {
        await batch.commit();
      }
    }, "excluir watchlist");

    // 5. Excluir notificações recebidas pelo usuário
    await safeOperation(async () => {
      // Usar a nova função que lida apenas com notificações do próprio usuário
      await removeCurrentUserNotifications(userId);
    }, "excluir notificações recebidas");

    // 7. Excluir relações de seguidores - quando o usuário é quem está seguindo outros
    await safeOperation(async () => {
      const followingSnapshot = await getDocs(query(
        collection(db, "followers"),
        where("followerId", "==", userId)
      ));
      
      const batch = writeBatch(db);
      followingSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      if (followingSnapshot.size > 0) {
        await batch.commit();
      }
    }, "excluir relações onde o usuário segue outros");
    
    // 8. Excluir relações de seguidores - quando o usuário é quem está sendo seguido
    await safeOperation(async () => {
      const followersSnapshot = await getDocs(query(
        collection(db, "followers"),
        where("userId", "==", userId)
      ));
      
      const batch = writeBatch(db);
      followersSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      if (followersSnapshot.size > 0) {
        await batch.commit();
      }
    }, "excluir relações onde o usuário é seguido");

    // 9. Excluir listas criadas pelo usuário
    await safeOperation(async () => {
      const listsSnapshot = await getDocs(query(
        collection(db, "lists"),
        where("userId", "==", userId)
      ));
      
      const batch = writeBatch(db);
      const listIds: string[] = [];
      
      listsSnapshot.forEach((doc) => {
        listIds.push(doc.id);
        batch.delete(doc.ref);
      });
      
      if (listsSnapshot.size > 0) {
        await batch.commit();
        
        // Após excluir as listas, exclua também as reações e comentários associados a elas
        for (const listId of listIds) {
          // Excluir reações das listas
          await safeOperation(async () => {
            const reactionsSnapshot = await getDocs(query(
              collection(db, "listReactions"),
              where("listId", "==", listId)
            ));
            
            const reactionsBatch = writeBatch(db);
            reactionsSnapshot.forEach((doc) => reactionsBatch.delete(doc.ref));
            
            if (reactionsSnapshot.size > 0) {
              await reactionsBatch.commit();
            }
          }, `excluir reações da lista ${listId}`);
          
          // Excluir comentários das listas
          await safeOperation(async () => {
            const commentsSnapshot = await getDocs(query(
              collection(db, "comments"),
              where("listId", "==", listId)
            ));
            
            const commentsBatch = writeBatch(db);
            commentsSnapshot.forEach((doc) => commentsBatch.delete(doc.ref));
            
            if (commentsSnapshot.size > 0) {
              await commentsBatch.commit();
            }
          }, `excluir comentários da lista ${listId}`);
        }
      }
    }, "excluir listas do usuário e dados relacionados");
    
    // 10. Excluir comentários do usuário em listas de outros usuários
    await safeOperation(async () => {
      const commentsSnapshot = await getDocs(query(
        collection(db, "comments"),
        where("userId", "==", userId)
      ));
      
      const batch = writeBatch(db);
      commentsSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      if (commentsSnapshot.size > 0) {
        await batch.commit();
      }
    }, "excluir comentários do usuário em listas de outros");
    
    // 11. Excluir reações do usuário em listas de outros usuários
    await safeOperation(async () => {
      const reactionsSnapshot = await getDocs(query(
        collection(db, "listReactions"),
        where("userId", "==", userId)
      ));
      
      const batch = writeBatch(db);
      reactionsSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      if (reactionsSnapshot.size > 0) {
        await batch.commit();
      }
    }, "excluir reações do usuário em listas de outros");

    // Retornar resultados das operações
    return {
      userId,
      success: results.success.length > 0,
      details: results
    };
  } catch (error: any) {
    throw error;
  }
}

export async function updateUserNotificationSettings(
  userId: string, 
  settings: {
    newEpisode?: boolean;
    newFollower?: boolean;
    newComment?: boolean;
    newReaction?: boolean;
    newReview?: boolean;
    listComment?: boolean;
    listReaction?: boolean;
  }
): Promise<void> {
  try {
    if (!userId) throw new Error("ID de usuário não fornecido");
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado");
    }
    
    // Obter configurações atuais ou usar defaults
    const currentSettings = userDoc.data().notificationSettings || {
      newEpisode: true,
      newFollower: true,
      newComment: true,
      newReaction: true,
      newReview: true,
      listComment: true,
      listReaction: true
    };
    
    // Mesclar configurações existentes com as novas
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    await updateDoc(userRef, {
      notificationSettings: updatedSettings,
      updatedAt: new Date()
    });
    
  } catch (error) {
    throw error;
  }
}

// Nova função para adicionar uma série à lista de séries que o usuário acompanha
export async function addToUserWatchedSeries(userId: string, seriesId: number): Promise<void> {
  try {
    if (!userId) throw new Error("ID de usuário não fornecido");
    
    const userRef = doc(db, "users", userId);
    
    // Usar uma transação para garantir que os dados estejam atualizados
    const userData = await getUserData(userId);
    if (!userData) throw new Error("Usuário não encontrado");
    
    const watchedSeriesIds = userData.watchedSeriesIds || [];
    
    // Adicionar apenas se ainda não estiver na lista
    if (!watchedSeriesIds.includes(seriesId)) {
      await updateDoc(userRef, {
        watchedSeriesIds: [...watchedSeriesIds, seriesId],
        updatedAt: new Date()
      });
    }
    
  } catch (error) {
    throw error;
  }
}

// Obter configurações de notificação do usuário
export async function getUserNotificationSettings(userId: string): Promise<{
  newEpisode: boolean;
  newFollower: boolean;
  newComment: boolean;
  newReaction: boolean;
  newReview: boolean;
  listComment: boolean;
  listReaction: boolean;
} | null> {
  try {
    if (!userId) return null;
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    // Obter configurações atuais ou usar defaults
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
    
    return settings;
  } catch (error) {
    console.error("Erro ao obter configurações de notificação:", error);
    return null;
  }
} 