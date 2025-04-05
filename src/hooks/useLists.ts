import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  getUserLists, 
  addSeriesToList, 
  createList, 
  getListsContainingSeries 
} from '../services/lists';
import { useAuth } from '../contexts/AuthContext';

interface Series {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string;
}

/**
 * Hook personalizado para gerenciar operações com listas de usuário
 */
export function useLists() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [listsWithSeries, setListsWithSeries] = useState<string[]>([]);
  const toast = useToast();
  const queryClient = useQueryClient();

  /**
   * Carrega as listas do usuário e verifica quais já contêm a série especificada
   */
  const loadUserLists = async (seriesId?: number) => {
    if (!currentUser) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para ver suas listas",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return { lists: [], listsWithSeries: [] };
    }
    
    setIsLoading(true);
    try {
      // Buscar listas do usuário
      const lists = await getUserLists(currentUser.uid);
      setUserLists(lists);
      
      // Se um ID de série foi fornecido, verificar quais listas já a contêm
      if (seriesId) {
        const listsWithThisSeries = await getListsContainingSeries(currentUser.uid, seriesId);
        const seriesListIds = listsWithThisSeries.map(list => list.id);
        setListsWithSeries(seriesListIds);
        return { lists, listsWithSeries: seriesListIds };
      }
      
      return { lists, listsWithSeries: [] };
    } catch (error) {
      console.error("Erro ao carregar listas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas listas",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { lists: [], listsWithSeries: [] };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adiciona uma série a uma lista específica
   */
  const addToList = async (listId: string, series: Series) => {
    if (!currentUser) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para adicionar séries a listas",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    
    setIsLoading(true);
    try {
      await addSeriesToList(listId, {
        id: series.id,
        name: series.name,
        poster_path: series.poster_path
      });
      
      // Atualizar a lista de listas que contêm esta série
      setListsWithSeries(prev => {
        if (!prev.includes(listId)) {
          return [...prev, listId];
        }
        return prev;
      });
      
      // Invalidar queries relacionadas às listas
      queryClient.invalidateQueries({ queryKey: ["userLists"] });
      
      toast({
        title: "Série adicionada",
        description: "Série adicionada à lista com sucesso",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a série à lista",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cria uma nova lista para o usuário
   */
  const createUserList = async (
    title: string, 
    description: string, 
    tags: string[], 
    isPublic: boolean,
    initialSeries?: Series
  ) => {
    if (!currentUser) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para criar listas",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
    
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, forneça um título para a lista",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
    
    setIsLoading(true);
    try {
      // Se uma série inicial foi fornecida, criar a lista com ela já incluída
      const initialItems = initialSeries ? [{
        seriesId: initialSeries.id,
        name: initialSeries.name,
        poster_path: initialSeries.poster_path,
        addedAt: new Date()
      }] : [];
      
      // Criar a lista
      const listId = await createList(
        title.trim(),
        description.trim(),
        tags,
        isPublic,
        initialItems
      );
      
      // Invalidar queries relacionadas às listas
      queryClient.invalidateQueries({ queryKey: ["userLists"] });
      
      // Se uma série foi adicionada, também atualizar o estado de listsWithSeries
      if (initialSeries) {
        setListsWithSeries(prev => [...prev, listId]);
      }
      
      toast({
        title: "Lista criada",
        description: initialSeries 
          ? `Lista criada com sucesso com ${initialSeries.name} adicionada` 
          : "Lista criada com sucesso",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      return listId;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a lista",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifica se uma série já está em uma lista específica
   */
  const isInList = (listId: string): boolean => {
    return listsWithSeries.includes(listId);
  };

  return {
    userLists,
    listsWithSeries,
    isLoading,
    loadUserLists,
    addToList,
    createUserList,
    isInList
  };
} 