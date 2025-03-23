import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { User } from "firebase/auth";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import {
  serverTimestamp,
  increment,
  orderBy,
  startAt,
  endAt,
  FieldPath,
} from "firebase/firestore";

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
    console.error("Erro ao verificar disponibilidade do username:", error);
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
    console.error("Erro ao verificar disponibilidade do email:", error);
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
    console.error("Erro ao atualizar username:", error);
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
    console.error("Erro ao buscar usuário pelo email:", error);
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
      console.warn("Usuário com mesmo email já existe com ID diferente:", existingUserWithEmail.id);
      
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
    console.error("Erro ao atualizar dados do usuário:", error);
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
    console.error("Erro ao buscar dados do usuário:", error);
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
    console.error("Erro ao buscar usuário pelo username:", error);
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
    console.error("Erro ao buscar usuário por username ou email:", error);
    return null;
  }
}

export async function deleteUserData(userId: string) {
  try {
    const db = getFirestore();
    
    // Função auxiliar para executar uma operação com tratamento de erro
    const safeOperation = async (operation: () => Promise<void>, name: string) => {
      try {
        await operation();
        return true;
      } catch (error: any) {
        console.error(`❌ Erro na operação "${name}":`, error);
        return false;
      }
    };

    // Excluir dados do usuário
    await safeOperation(async () => {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    }, "excluir perfil do usuário");

    // Excluir reviews do usuário
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

    // Excluir itens da watchlist
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

    // Excluir notificações
    await safeOperation(async () => {
      const notificationsSnapshot = await getDocs(query(collection(db, "notifications"), where("userId", "==", userId)));
      const batch = writeBatch(db);
      notificationsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      if (!notificationsSnapshot.empty) {
        await batch.commit();
      }
    }, "excluir notificações");

    // Excluir lastNotifiedEpisodes
    await safeOperation(async () => {
      
      try {
        // Buscar o usuário para verificar se temos a lista de séries acompanhadas
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          return;
        }
        
        const userData = userDoc.data();
        const watchedSeriesIds = userData.watchedSeriesIds || [];
        
        // Se temos a lista de séries, vamos tentar excluir especificamente esses documentos
        let seriesIdsToTry: number[] = [];
        
        if (watchedSeriesIds.length > 0) {
          seriesIdsToTry = watchedSeriesIds;
        } else {
          // Se não temos a lista, tentamos alguns IDs comuns (1-30) como fallback
          seriesIdsToTry = Array.from({ length: 30 }, (_, i) => i + 1);
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        // Processar exclusão para cada série
        for (const seriesId of seriesIdsToTry) {
          const docId = `${userId}_${seriesId}`;
          try {
            const docRef = doc(db, "lastNotifiedEpisodes", docId);
            await deleteDoc(docRef);
            successCount++;
          } catch (error: any) {
            // Se o erro for "not-found", isso é normal e esperado
            if (error.code === 'not-found') {
              // Não contabilizamos como erro, apenas continuamos
            } else {
              console.error(`❌ Erro ao excluir documento ${docId}:`, error);
              errorCount++;
            }
          }
        }
        
        // Adicionar mensagem sobre o resultado
        if (successCount > 0) {
        } else {
        }
      } catch (error) {
        throw error;
      }
    }, "excluir registros de episódios");

    // Excluir relações de seguidores
    await safeOperation(async () => {
      // Buscar onde o usuário é seguidor
      const followingSnapshot = await getDocs(query(
        collection(db, "followers"),
        where("followerId", "==", userId)
      ));
      
      // Buscar onde o usuário é seguido
      const followersSnapshot = await getDocs(query(
        collection(db, "followers"),
        where("followingId", "==", userId)
      ));
      
      const totalDocs = followingSnapshot.size + followersSnapshot.size;
      
      const batch = writeBatch(db);
      followingSnapshot.forEach((doc) => batch.delete(doc.ref));
      followersSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      if (totalDocs > 0) {
        await batch.commit();
      }
    }, "excluir relações de seguidores");

    return true;
  } catch (error: any) {
    console.error("❌ Erro fatal ao excluir dados do usuário:", {
      error,
      message: error.message,
      code: error.code,
      details: error.details
    });
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
      newReview: true
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
    console.error("Erro ao atualizar configurações de notificação:", error);
    throw error;
  }
}

// Nova função para adicionar uma série à lista de séries que o usuário acompanha
export async function addToUserWatchedSeries(userId: string, seriesId: number): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn(`Usuário ${userId} não encontrado`);
      return;
    }
    
    // Obter a lista atual ou inicializar se não existir
    const userData = userDoc.data();
    const currentWatchedSeries = userData.watchedSeriesIds || [];
    
    // Verificar se a série já está na lista
    if (!currentWatchedSeries.includes(seriesId)) {
      // Adicionar a série à lista
      await updateDoc(userRef, {
        watchedSeriesIds: [...currentWatchedSeries, seriesId],
        updatedAt: new Date()
      });
      
    }
  } catch (error) {
    console.error(`❌ Erro ao adicionar série à lista do usuário:`, error);
  }
} 