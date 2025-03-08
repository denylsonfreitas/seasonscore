import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

interface UserInfo {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export function useUserInfo(userId: string | undefined) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId) {
        setUserInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserInfo({
            id: userDoc.id,
            ...userDoc.data() as Omit<UserInfo, 'id'>
          });
        } else {
          setUserInfo(null);
        }
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  return { userInfo, isLoading };
} 