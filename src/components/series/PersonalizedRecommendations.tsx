import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  HStack,
  VStack,
  Button,
  Flex,
  Spinner,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { Lightning, Question } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPersonalizedRecommendations, RecommendedSeries } from "../../services/recommendations";
import { SeriesCard } from "./SeriesCard";

export function PersonalizedRecommendations() {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { 
    data: recommendations = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["personalized-recommendations", currentUser?.uid],
    queryFn: () => getPersonalizedRecommendations(currentUser?.uid || ""),
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Forçar recarregamento das recomendações se estiverem vazias
  useEffect(() => {
    if (currentUser && recommendations.length === 0 && !isLoading && !isError) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["personalized-recommendations", currentUser?.uid]
        });
        refetch();
      }, 3000); // Esperar 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, recommendations, isLoading, isError, queryClient, refetch]);

  // Número de séries a mostrar inicialmente
  const initialCount = 6;
  const displayedRecommendations = isExpanded 
    ? recommendations
    : recommendations.slice(0, initialCount);

  if (!currentUser) {
    return (
      <Box mb={12}>
        <HStack spacing={2} mb={6}>
          <Heading color="white" size="lg">Recomendações para Você</Heading>
          <Tooltip 
            label="Faça login para ver recomendações personalizadas baseadas nas suas avaliações e watchlist"
            placement="top"
          >
            <Box><Icon as={Question} color="gray.400" boxSize={5} /></Box>
          </Tooltip>
        </HStack>
        <Box 
          bg="gray.800" 
          p={6} 
          borderRadius="lg" 
          textAlign="center"
        >
          <Text color="gray.400">
            Faça login para ver recomendações personalizadas baseadas no seu perfil de preferências.
          </Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box mb={12}>
        <Heading color="white" size="lg" mb={6}>
          Recomendações para Você
        </Heading>
        <Flex justify="center" py={8}>
          <Spinner size="xl" color="primary.500" />
        </Flex>
      </Box>
    );
  }

  if (isError || recommendations.length === 0) {
    return (
      <Box mb={12}>
        <Heading color="white" size="lg" mb={6}>
          Recomendações para Você
        </Heading>
        <Box 
          bg="gray.800" 
          p={6} 
          borderRadius="lg" 
          textAlign="center"
        >
          <Text color="gray.400">
            {isError 
              ? "Ocorreu um erro ao buscar suas recomendações. Tente novamente mais tarde."
              : "Estamos preparando suas recomendações com base nas suas avaliações."}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box mb={12}>
      <HStack spacing={2} mb={6}>
        <Heading color="white" size="lg">Recomendações para Você</Heading>
        <Tooltip 
          label="Recomendações personalizadas baseadas nas suas avaliações e watchlist"
          placement="top"
        >
          <Box><Icon as={Question} color="gray.400" boxSize={5} /></Box>
        </Tooltip>
      </HStack>

      <SimpleGrid columns={{ base: 3, md: 3, lg: 6 }} spacing={4}>
        {displayedRecommendations.map((series) => (
          <Box key={series.id} position="relative">
              <Box>
                <SeriesCard series={series} />
              </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
} 