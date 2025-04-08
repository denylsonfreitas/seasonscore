import { useState, useEffect, useRef } from "react";
import { getUserData, UserData } from "../services/users";
import { userCache } from "../services/cacheService";

// Interface para o userData com a flag isDeleted
export interface ExtendedUserData extends Partial<UserData> {
  isDeleted?: boolean;
}

/**
 * Hook para buscar e gerenciar dados de um usuário
 * Utiliza o serviço de cache centralizado para evitar requisições desnecessárias
 */
export function useUserData(userId: string) {
  const [userData, setUserData] = useState<ExtendedUserData | null>(null);
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
        if (isMounted.current) {
          setUserData({ isDeleted: true });
          setIsLoading(false);
        }
        return;
      }

      // Verificar se os dados estão em cache
      const cachedData = userCache.getUser<ExtendedUserData>(userId);
      
      if (cachedData) {
        // Usar dados do cache se estiverem disponíveis
        if (isMounted.current) {
          setUserData(cachedData);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const data = await getUserData(userId);
        
        // Se o usuário não foi encontrado, marcar como excluído
        if (!data) {
          const deletedUserData: ExtendedUserData = { isDeleted: true };
          
          // Atualizar o cache
          userCache.setUser(userId, deletedUserData);
          
          if (isMounted.current) {
            setUserData(deletedUserData);
          }
        } else {
          // Atualizar o cache
          userCache.setUser(userId, data);
          
          if (isMounted.current) {
            setUserData(data);
          }
        }
      } catch (error) {
        // Em caso de erro, considerar o usuário como excluído
        const deletedUserData: ExtendedUserData = { isDeleted: true };
        
        // Atualizar o cache
        userCache.setUser(userId, deletedUserData);
        
        if (isMounted.current) {
          setUserData(deletedUserData);
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