import { Spinner, Text, Box } from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { SeriesResponse } from "../../services/tmdb";
import { useQuery } from "@tanstack/react-query";
import { getSeriesAverageRating } from "../../services/reviews";
import { SectionBase } from "../common/SectionBase";
import { Carousel } from "../common/Carousel";

interface HomeSectionProps {
  title: string;
  queryKey: string[];
  queryFn: () => Promise<SeriesResponse>;
  link?: string;
}

export function HomeSeriesSection({ title, queryKey, queryFn, link }: HomeSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar as avaliações para cada série
  const { data: allReviews = {} } = useQuery({
    queryKey: [...queryKey, "ratings", data?.results?.map((s) => s.id)],
    queryFn: async () => {
      const results = data?.results ?? [];
      const ratings = await Promise.all(results.map((s) => getSeriesAverageRating(s.id)));
      const reviewsMap: Record<number, number> = {};
      results.forEach((series, i) => {
        const rating = ratings[i];
        if (rating !== undefined) reviewsMap[series.id] = rating;
      });
      return reviewsMap;
    },
    enabled: !!data?.results,
  });

  const renderContent = () => {
    return (
      <Box pb={8}>
        <Carousel preset="series">
          {data?.results?.map((series) => (
            <Box key={series.id}>
              <SeriesCard
                key={series.id}
                series={{
                  ...series,
                  rating: allReviews[series.id],
                }}
              />
            </Box>
          ))}
        </Carousel>
      </Box>
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
    />
  );
}
