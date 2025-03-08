import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../config/firebase";

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

  const follower = {
    userId,
    followerId: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  };

  await addDoc(followersCollection, follower);
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

  await deleteDoc(querySnapshot.docs[0].ref);
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