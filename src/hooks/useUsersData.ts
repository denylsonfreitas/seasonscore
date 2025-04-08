import { useState, useEffect, useRef, useMemo } from "react";
import { getUserData } from "../services/users";
import { ExtendedUserData } from "./useUserData";
import { userCache } from "../services/cacheService";

/**
 * Hook para buscar e gerenciar dados de múltiplos usuários
 * Utiliza o serviço de cache centralizado para evitar requisições desnecessárias
 */
export function useUsersData(userIds: string[]) {
  const [usersData, setUsersData] = useState<Record<string, ExtendedUserData>>({});
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
        const result: Record<string, ExtendedUserData> = {};
        const userIdsToFetch: string[] = [];
        
        // Primeiro, verifique o cache para cada ID
        uniqueUserIds.forEach(userId => {
          const cachedData = userCache.getUser<ExtendedUserData>(userId);
          if (cachedData) {
            // Use os dados do cache
            result[userId] = cachedData;
          } else {
            // Marque para buscar
            userIdsToFetch.push(userId);
          }
        });
        
        // Busque apenas os usuários que não estão em cache
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
              
              // Se o usuário não for encontrado, marcar como excluído
              if (!userData) {
                const deletedUserData: ExtendedUserData = { isDeleted: true };
                result[userId] = deletedUserData;
                
                // Atualizar o cache
                userCache.setUser(userId, deletedUserData);
              } else {
                result[userId] = userData;
                
                // Atualizar o cache
                userCache.setUser(userId, userData);
              }
            });
          }
        }
        
        if (isMounted.current) {
          setUsersData(result);
          setError(null);
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

    fetchUsersData();
  }, [uniqueUserIdsString]);

  return { usersData, isLoading, error };
} 