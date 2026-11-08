import type { SeriesResponse } from "../../services/tmdb";
import { Box } from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { Carousel } from "../common/Carousel";
import { SectionBase } from "../common/SectionBase";

interface RelatedSeriesProps {
  relatedSeries: SeriesResponse | undefined;
  isLoading: boolean;
  currentSeriesId: string | number;
}

/** Séries parecidas. A seção some quando o TMDB não sugere nenhuma. */
export function RelatedSeries({ relatedSeries, isLoading, currentSeriesId }: RelatedSeriesProps) {
  const related = (relatedSeries?.results ?? []).filter((s) => s.id !== Number(currentSeriesId));
  if (!isLoading && related.length === 0) return null;

  return (
    <SectionBase
      eyebrow="Se você gostou"
      title="Séries parecidas"
      isLoading={isLoading}
      containerProps={{ borderTop: "1px solid", borderColor: "ink.800" }}
      renderContent={() => (
        <Carousel preset="series" gap={4} label="Séries parecidas">
          {related.map((series) => (
            <Box key={series.id}>
              <SeriesCard series={series} />
            </Box>
          ))}
        </Carousel>
      )}
    />
  );
}
