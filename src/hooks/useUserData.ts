import { useState, useEffect, useRef } from "react";
import { getUserData } from "../services/users";

// Cache para armazenar dados de usuários já carregados
const userDataCache: Record<string, { 
  data: any, 
  timestamp: number 
}> = {};

// Tempo de expiração do cache (5 minutos)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

export function useUserData(userId: string) {
  const [userData, setUserData] = useState<{ photoURL?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    // Componente foi montado
    isMounted.current = true;
    
    return () => {
      // Componente será desmontado
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // Verificar se os dados estão em cache e não expirados
      const cachedData = userDataCache[userId];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRY_TIME) {
        // Usar dados do cache se estiverem disponíveis e válidos
        if (isMounted.current) {
          setUserData(cachedData.data);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const data = await getUserData(userId);
        
        // Atualizar o cache
        userDataCache[userId] = {
          data,
          timestamp: Date.now()
        };
        
        if (isMounted.current) {
          setUserData(data);
        }
      } catch (error) {
        if (isMounted.current) {
          setError(error as Error);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [userId]);

  return { userData, isLoading, error };
} 