import { Box } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { SeriesCard } from "./SeriesCard";
import type { SeriesResponse } from "../../services/tmdb";
import { getSeriesAverageRating } from "../../services/reviews";
import { SectionBase } from "../common/SectionBase";
import { Carousel } from "../common/Carousel";

interface HomeSectionProps {
  title: string;
  eyebrow?: string;
  queryKey: string[];
  queryFn: () => Promise<SeriesResponse>;
  link?: string;
}

/** Fileira de pôsteres com a nota da comunidade. */
export function HomeSeriesSection({ title, eyebrow, queryKey, queryFn, link }: HomeSectionProps) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn, staleTime: 1000 * 60 * 5 });
  const results = data?.results ?? [];

  const { data: ratings = {} } = useQuery({
    queryKey: [...queryKey, "ratings", results.map((s) => s.id)],
    queryFn: async () => {
      const values = await Promise.all(results.map((s) => getSeriesAverageRating(s.id)));
      return Object.fromEntries(results.map((s, i) => [s.id, values[i]])) as Record<
        number,
        number | undefined
      >;
    },
    enabled: results.length > 0,
  });

  return (
    <SectionBase
      title={title}
      eyebrow={eyebrow}
      link={link}
      isLoading={isLoading}
      error={error as Error | null}
      isEmpty={!results.length}
      renderContent={() => (
        <Carousel preset="series" gap={4} label={title}>
          {results.map((series) => (
            <Box key={series.id}>
              <SeriesCard series={{ ...series, rating: ratings[series.id] }} />
            </Box>
          ))}
        </Carousel>
      )}
    />
  );
}
