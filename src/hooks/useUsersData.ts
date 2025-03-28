import { useState, useEffect, useRef, useMemo } from "react";
import { getUserData } from "../services/users";

// Cache para armazenar dados de usuários já carregados
const userDataCache: Record<string, { 
  data: any, 
  timestamp: number 
}> = {};

// Tempo de expiração do cache (5 minutos)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

// Função para verificar se o cache é válido
const isCacheValid = (userId: string): boolean => {
  const cachedData = userDataCache[userId];
  if (!cachedData) return false;
  
  const now = Date.now();
  return (now - cachedData.timestamp) < CACHE_EXPIRY_TIME;
};

export function useUsersData(userIds: string[]) {
  const [usersData, setUsersData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  
  // Memoize userIds para evitar reprocessamento desnecessário
  const uniqueUserIdsString = useMemo(() => {
    const uniqueUserIds = [...new Set(userIds)].sort();
    return uniqueUserIds.join(",");
  }, [userIds]);

  useEffect(() => {
    // Componente foi montado
    isMounted.current = true;
    
    return () => {
      // Componente será desmontado
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchUsersData = async () => {
      setIsLoading(true);
      
      if (userIds.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        const uniqueUserIds = [...new Set(userIds)];
        const result: Record<string, any> = {};
        const userIdsToFetch: string[] = [];
        
        // Primeiro, verifique o cache para cada ID
        uniqueUserIds.forEach(userId => {
          if (isCacheValid(userId)) {
            // Use os dados do cache
            result[userId] = userDataCache[userId].data;
          } else {
            // Marque para buscar
            userIdsToFetch.push(userId);
          }
        });
        
        // Busque apenas os usuários que não estão em cache ou que expiraram
        if (userIdsToFetch.length > 0) {
          // Divida em lotes de 10 para evitar sobrecarga
          const batchSize = 10;
          for (let i = 0; i < userIdsToFetch.length; i += batchSize) {
            const batch = userIdsToFetch.slice(i, i + batchSize);
            const promises = batch.map(userId => getUserData(userId));
            const results = await Promise.all(promises);
            
            // Atualizar o cache e resultado para cada usuário
            batch.forEach((userId, index) => {
              const userData = results[index];
              result[userId] = userData;
              
              // Atualizar o cache
              userDataCache[userId] = {
                data: userData,
                timestamp: Date.now()
              };
            });
          }
        }
        
        if (isMounted.current) {
          setUsersData(result);
          setError(null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de usuários:", error);
        if (isMounted.current) {
          setError(error as Error);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchUsersData();
  }, [uniqueUserIdsString]);

  return { usersData, isLoading, error };
} 