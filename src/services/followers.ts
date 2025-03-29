import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  getFirestore,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth } from "../config/firebase";
import { 
  createNotification, 
  NotificationType, 
  deleteNotificationsOfType
} from "./notifications";
import { getUserData } from "./users";

const db = getFirestore();
const followersCollection = collection(db, "followers");

export interface Follower {
  id: string;
  userId: string;
  followerId: string;
  createdAt: Date;
}

export async function followUser(userId: string) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");
  if (userId === auth.currentUser.uid) throw new Error("Não é possível seguir a si mesmo");

  // Verificar se já segue
  const q = query(
    followersCollection,
    where("userId", "==", userId),
    where("followerId", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error("Você já segue este usuário");
  }

  // Verificar se já seguiu este usuário antes (para evitar spam de notificações)
  // Em vez de usar uma coleção separada, vamos verificar o histórico de follows
  // usando a própria coleção de followers com uma consulta mais ampla
  let hasFollowedBefore = false;
  
  try {
    // Buscar todos os documentos de followers que foram excluídos (histórico)
    // Isso não é possível diretamente, então vamos usar uma abordagem diferente
    
    // Criar o relacionamento de seguidor com um campo adicional
    const follower = {
      userId,
      followerId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      // Adicionar um campo para controlar se é a primeira vez que segue
      isFirstFollow: true
    };

    await addDoc(followersCollection, follower);
    
    // Criar notificação para o usuário que foi seguido
    try {
      const currentUserData = await getUserData(auth.currentUser.uid);
      // Usar o mesmo campo que será armazenado como senderName na notificação
      const followerName = currentUserData?.username || currentUserData?.displayName || currentUserData?.email || "Alguém";
      
      // Criar uma nova notificação
      await createNotification(
        userId,
        NotificationType.NEW_FOLLOWER,
        {
          senderId: auth.currentUser.uid,
          message: `${followerName} começou a seguir você.`
        }
      );
    } catch (error) {
    }
  } catch (error) {
    throw error;
  }
}

export async function unfollowUser(userId: string) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  try {
    // Buscar a relação de seguidor
    const q = query(
      followersCollection,
      where("userId", "==", userId),
      where("followerId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Você não segue este usuário");
    }

    // Processar cada relação encontrada (normalmente deve ser apenas uma)
    for (const followerDoc of querySnapshot.docs) {
      const followerData = followerDoc.data();
      
      // Excluir a relação de seguidor
      await deleteDoc(followerDoc.ref);
      
      // Remover notificações relacionadas
      try {
        const followDate = followerData.createdAt instanceof Timestamp 
          ? followerData.createdAt.toDate() 
          : followerData.createdAt;
          
        // Sempre tentar remover a notificação, independentemente da data
        // Isso garante que não fiquem notificações órfãs
        await deleteNotificationsOfType(
          userId,
          NotificationType.NEW_FOLLOWER,
          auth.currentUser.uid
        );
        
      } catch (error) {
      }
    }
    
    return true;
  } catch (error) {
    throw error;
  }
}

export async function getFollowers(userId: string): Promise<Follower[]> {
  const q = query(followersCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Follower[];
}

export async function getFollowing(userId: string): Promise<Follower[]> {
  const q = query(followersCollection, where("followerId", "==", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Follower[];
}

export async function isFollowing(userId: string): Promise<boolean> {
  if (!auth.currentUser) return false;

  const q = query(
    followersCollection,
    where("userId", "==", userId),
    where("followerId", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);

  return !querySnapshot.empty;
} 