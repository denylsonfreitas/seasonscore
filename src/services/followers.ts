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
      const followerName = currentUserData?.displayName || currentUserData?.email || "Alguém";
      
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
      console.error("Erro ao criar notificação de novo seguidor:", error);
    }
  } catch (error) {
    console.error("Erro ao seguir usuário:", error);
    throw error;
  }
}

export async function unfollowUser(userId: string) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const q = query(
    followersCollection,
    where("userId", "==", userId),
    where("followerId", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Você não segue este usuário");
  }

  const followerDoc = querySnapshot.docs[0];
  const followerData = followerDoc.data();
  
  // Remover o relacionamento de seguidor
  await deleteDoc(followerDoc.ref);
  
  // Verificar se o follow ocorreu há menos de 1 hora
  // e remover a notificação correspondente
  try {
    const followDate = followerData.createdAt instanceof Timestamp 
      ? followerData.createdAt.toDate() 
      : followerData.createdAt;
      
    if (followDate) {
      const now = new Date();
      const timeDiff = now.getTime() - (followDate?.getTime() || 0);
      const isRecent = timeDiff < 60 * 60 * 1000; // 1 hora em milissegundos
      
      if (isRecent) {
        // Remover a notificação de novo seguidor para este usuário
        await deleteNotificationsOfType(
          userId,
          NotificationType.NEW_FOLLOWER,
          auth.currentUser.uid
        );
      }
    }
  } catch (error) {
    console.error("Erro ao remover notificação de seguidor:", error);
    // Continuar a execução mesmo se houver erro ao remover a notificação
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