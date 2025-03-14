import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export interface UserData {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  coverURL?: string;
  description?: string;
  favoriteSeries?: {
    id: number;
    name: string;
    poster_path: string;
  } | undefined;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do username:", error);
    throw error;
  }
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade do email:", error);
    throw error;
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

  // Verificar se o usuário já existe
  const userDoc = await getDoc(userRef);
  
  // Gerar username inicial se não existir
  let username = "";
  if (!userDoc.exists()) {
    // Criar username base a partir do email
    username = user.email?.split("@")[0].toLowerCase() || "";
    
    // Se o username já existe, adicionar números até encontrar um disponível
    let counter = 1;
    let tempUsername = username;
    while (!(await isUsernameAvailable(tempUsername))) {
      tempUsername = `${username}${counter}`;
      counter++;
    }
    username = tempUsername;
  } else {
    // Manter o username existente
    username = userDoc.data()?.username || "";
  }

  // Limpar dados do usuário e dados adicionais
  const baseUserData = cleanData({
    id: user.uid,
    email: user.email,
    username: username,
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