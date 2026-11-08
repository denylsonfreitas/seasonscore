import { Box, Container, Heading, Skeleton, Text } from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { Carousel } from "../common/Carousel";

interface RelatedSeriesProps {
  relatedSeries: any;
  isLoading: boolean;
  currentSeriesId: string | number;
}

export function RelatedSeries({ relatedSeries, isLoading, currentSeriesId }: RelatedSeriesProps) {
  if (isLoading) {
    return (
      <Container maxW="container.lg">
        <Heading color="white" size="xl" mb={8}>
          Séries Relacionadas
        </Heading>
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "repeat(3, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(6, 1fr)",
          }}
          gap={4}
        >
          {[...Array(6)].map((_, i) => (
            <Box key={i}>
              <Skeleton height="300px" borderRadius="lg" />
            </Box>
          ))}
        </Box>
      </Container>
    );
  }

  const filteredSeries = relatedSeries?.results
    ? relatedSeries.results.filter((series: any) => series.id !== Number(currentSeriesId))
    : [];

  if (filteredSeries.length === 0) {
    return (
      <Container maxW="container.lg">
        <Heading color="white" size="xl" mb={8}>
          Séries Relacionadas
        </Heading>
        <Text color="primary.400" textAlign="center">
          Não há séries relacionadas disponíveis.
        </Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg">
      <Heading color="white" size="xl" mb={8}>
        Séries Relacionadas
      </Heading>
      <Box pb={8}>
        <Carousel preset="series">
          {filteredSeries.map((series: any) => (
            <Box key={series.id}>
              <SeriesCard series={series} size="lg" />
            </Box>
          ))}
        </Carousel>
      </Box>
    </Container>
  );
}
