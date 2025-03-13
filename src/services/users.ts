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
  } | null;
}

export async function createOrUpdateUser(user: User, additionalData?: Partial<UserData>) {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  
  // Remover campos undefined ou vazios
  const cleanData = (data: any) => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== "") {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  // Limpar dados do usuário e dados adicionais
  const baseUserData = cleanData({
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  });

  const cleanedAdditionalData = additionalData ? cleanData(additionalData) : {};

  // Combinar os dados
  const userData = {
    ...baseUserData,
    ...cleanedAdditionalData,
    updatedAt: new Date()
  };

  try {
    await setDoc(userRef, userData, { merge: true });
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