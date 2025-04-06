import {
  SimpleGrid,
  Spinner,
  Text,
  Box,
} from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { SeriesResponse } from "../../services/tmdb";
import { useQuery } from "@tanstack/react-query";
import { getSeriesReviews } from "../../services/reviews";
import { SectionBase } from "../common/SectionBase";

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
          }
        })
      );
      
      return reviewsMap;
    },
    enabled: !!data?.results,
  });
  
  const renderContent = () => {
    return (
      <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={4}>
        {data?.results?.slice(0, 6).map((series) => (
          <SeriesCard 
            key={series.id} 
            series={{
              ...series,
              rating: allReviews[series.id]
            }}
          />
        ))}
      </SimpleGrid>
    );
  };

  // Componentes de estados personalizados
  const loadingElement = (
    <Box textAlign="center" py={8}>
      <Spinner size="xl" color="primary.500" />
    </Box>
  );

  const errorElement = (
    <Box textAlign="center" py={8}>
      <Text color="red.500">Erro ao carregar séries</Text>
    </Box>
  );

  return (
    <SectionBase
      title={title}
      link={link}
      isLoading={isLoading}
      error={error as Error}
      isEmpty={!data?.results?.length}
      loadingElement={loadingElement}
      errorElement={errorElement}
      renderContent={() => renderContent()}
      containerProps={{ mb: 12 }}
    />
  );
}
