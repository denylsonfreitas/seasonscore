import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { User } from "firebase/auth";

export interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  coverURL?: string;
  description?: string;
  favoriteSeries?: {
    id: number;
    name: string;
    poster_path: string;
  };
}

export async function createOrUpdateUser(user: User, additionalData?: Partial<UserData>) {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userData = {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    ...additionalData
  };

  await setDoc(userRef, userData, { merge: true });
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