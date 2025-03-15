import { useState, useEffect } from "react";
import { getUserData } from "../services/users";

export function useUserData(userId: string) {
  const [userData, setUserData] = useState<{ photoURL?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getUserData(userId);
        setUserData(data);
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  return { userData, isLoading, error };
} 