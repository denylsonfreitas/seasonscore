import React from 'react';
import {
  Grid,
  Skeleton,
  useToast,
  Box,
  Text
} from '@chakra-ui/react';
import { ListCard } from './ListCard';
import { useQuery } from '@tanstack/react-query';
import { getFollowedUsersLists } from '../../services/lists';
import { ListWithUserData } from '../../types/list';
import { useAuth } from '../../contexts/AuthContext';
import { SectionBase } from '../common/SectionBase';

export function FollowedUsersLists() {
  const toast = useToast();
  const { currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["followedUsersLists"],
    queryFn: () => getFollowedUsersLists(12),
    enabled: !!currentUser,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });
  
  // Tipagem segura para os dados
  const lists: ListWithUserData[] = data || [];

  // Mostrar toast de erro se a query falhar
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar listas",
        description: "Não foi possível carregar as listas de usuários seguidos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  // Elementos personalizados para estados
  const loadingElement = (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} height="240px" borderRadius="lg" />
      ))}
    </Grid>
  );

  // Componente para mensagem quando o usuário não está logado ou não tem listas
  const emptyElement = !currentUser ? (
    <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
      <Text color="gray.400">
        Faça login para ver listas de usuários que você segue.
      </Text>
    </Box>
  ) : (
    <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
      <Text color="gray.400">
        Você ainda não tem listas de usuários seguidos. Comece a seguir usuários para ver suas listas aqui.
      </Text>
    </Box>
  );

  // Renderização do conteúdo
  const renderContent = (limitItems: boolean) => {
    const displayedLists = limitItems ? lists.slice(0, 6) : lists;
    
    return (
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
        {displayedLists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </Grid>
    );
  };

  return (
    <SectionBase
      title="Listas de quem você segue"
      link="/lists"
      isLoading={isLoading}
      error={error as Error}
      isEmpty={!currentUser || lists.length === 0}
      emptyElement={emptyElement}
      loadingElement={loadingElement}
      expandable={lists.length > 6}
      renderContent={renderContent}
    />
  );
} 