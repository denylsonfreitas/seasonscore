import React, { useState } from 'react';
import {
  Box,
  Heading,
  Grid,
  Flex,
  Button,
  Skeleton,
  useToast,
  Text
} from '@chakra-ui/react';
import { ListCard } from './ListCard';
import { CaretDown, CaretUp, CaretRight } from '@phosphor-icons/react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPopularLists } from '../../services/lists';
import { ListWithUserData } from '../../types/list';

export function PopularLists() {
  const [isExpanded, setIsExpanded] = useState(false);
  const toast = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["popularLists"],
    queryFn: () => getPopularLists(12)
  });
  
  // Tipagem segura para os dados
  const lists: ListWithUserData[] = data || [];

  // Mostrar toast de erro se a query falhar
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar listas",
        description: "Não foi possível carregar as listas populares",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const displayedLists = isExpanded ? lists : lists.slice(0, 6);

  if (isLoading) {
    return (
      <Box mt={12}>
        <Heading color="white" size="lg" mb={6}>
          Listas Populares
        </Heading>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height="240px" borderRadius="lg" />
          ))}
        </Grid>
      </Box>
    );
  }

  if (lists.length === 0) {
    return (
      <Box mt={12}>
        <Heading color="white" size="lg" mb={6}>
          Listas Populares
        </Heading>
        <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
          <Text color="gray.400">
            Ainda não há listas populares. Listas com mais de uma curtida aparecerão aqui!
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box mt={12}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="white" size="lg">
          Listas Populares
        </Heading>
        <Button
          as={RouterLink}
          to="/lists"
          variant="link"
          colorScheme="primary"
          rightIcon={<CaretRight weight="bold" />}
        >
          Ver todas
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
        {displayedLists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </Grid>

      {lists.length > 6 && (
        <Flex justify="center" mt={6}>
          <Button
            variant="ghost"
            colorScheme="whiteAlpha"
            onClick={() => setIsExpanded(!isExpanded)}
            rightIcon={isExpanded ? <CaretUp weight="bold" size={20} /> : <CaretDown weight="bold" size={20} />}
            _hover={{ bg: "whiteAlpha.200" }}
            transition="all 0.2s ease"
          >
            {isExpanded ? "Ver Menos" : "Ver Mais"}
          </Button>
        </Flex>
      )}
    </Box>
  );
} 