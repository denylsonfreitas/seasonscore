import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../services/watchlist';
import { useAuth } from '../contexts/AuthContext';

interface Series {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

export function useWatchlist(seriesId?: number) {
  const { currentUser } = useAuth();
  const [isInList, setIsInList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Verificar status da watchlist quando o componente carrega
  useEffect(() => {
    if (currentUser && seriesId) {
      checkWatchlistStatus(seriesId);
    }
  }, [currentUser, seriesId]);

  /**
   * Verifica se uma série está na watchlist do usuário
   */
  const checkWatchlistStatus = async (id: number = seriesId!) => {
    if (!currentUser) return false;
    
    try {
      setIsLoading(true);
      const status = await isInWatchlist(currentUser.uid, id);
      setIsInList(status);
      setHasChecked(true);
      return status;
    } catch (error) {
      console.error('Erro ao verificar status da watchlist:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adiciona ou remove uma série da watchlist do usuário
   */
  const toggleWatchlist = async (series: Series) => {
    if (!currentUser) {
      toast({
        title: "Faça login para gerenciar sua watchlist",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Se já está na lista, remover
      if (isInList) {
        await removeFromWatchlist(currentUser.uid, series.id);
        
        // Invalidar a consulta para atualizar a interface
        queryClient.invalidateQueries({ queryKey: ["userWatchlist"] });
        
        toast({
          title: "Removido da watchlist",
          description: `${series.name} foi removida da sua watchlist`,
          status: "success",
          duration: 2000,
        });
        
        setIsInList(false);
        return false; // Retorna false para indicar que não está mais na lista
      } 
      // Senão, adicionar
      else {
        await addToWatchlist(currentUser.uid, series);
        
        // Invalidar a consulta para atualizar a interface
        queryClient.invalidateQueries({ queryKey: ["userWatchlist"] });
        
        toast({
          title: "Adicionado à watchlist",
          description: `${series.name} foi adicionada à sua watchlist`,
          status: "success",
          duration: 2000,
        });
        
        setIsInList(true);
        return true; // Retorna true para indicar que agora está na lista
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar watchlist",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return isInList; // Mantém o estado anterior em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInWatchlist: isInList,
    isLoading,
    hasChecked,
    checkWatchlistStatus,
    toggleWatchlist,
  };
} 