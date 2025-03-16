import {
  Box,
  Heading,
  SimpleGrid,
  Button,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { SeriesResponse } from "../services/tmdb";
import { useQuery } from "@tanstack/react-query";
import { CaretRight } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { getSeriesReviews } from "../services/reviews";

interface HomeSectionProps {
  title: string;
  queryKey: string[];
  queryFn: () => Promise<SeriesResponse>;
  link?: string;
}

export function HomeSeriesSection({
  title,
  queryKey,
  queryFn,
  link,
}: HomeSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar as avaliações para cada série
  const { data: allReviews = {} } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      if (!data?.results) return {};
      
      const reviewsMap: { [key: number]: number } = {};
      
      await Promise.all(
        data.results.map(async (series) => {
          try {
            const reviews = await getSeriesReviews(series.id);
            if (reviews.length > 0) {
              // Calcular a média das avaliações
              const allRatings = reviews.flatMap(review => 
                review.seasonReviews.map(sr => sr.rating)
              );
              
              if (allRatings.length > 0) {
                reviewsMap[series.id] = 
                  allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
              }
            }
          } catch (error) {
            console.error(`Erro ao buscar avaliações para série ${series.id}:`, error);
          }
        })
      );
      
      return reviewsMap;
    },
    enabled: !!data?.results,
  });

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="teal.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="red.500">Erro ao carregar séries</Text>
      </Box>
    );
  }

  if (!data?.results?.length) {
    return null;
  }

  return (
    <Box mb={12}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="white" size="lg">
          {title}
        </Heading>
        {link && (
          <Button
            as={RouterLink}
            to={link}
            variant="ghost"
            color="teal.500"
            rightIcon={<CaretRight weight="bold" />}
            _hover={{ bg: "gray.800" }}
          >
            Ver mais
          </Button>
        )}
      </Flex>
      <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={4}>
        {data.results.slice(0, 6).map((series) => (
          <SeriesCard 
            key={series.id} 
            series={{
              ...series,
              rating: allReviews[series.id]
            }}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
