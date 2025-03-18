import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { useState } from "react";
import { SeriesCard } from "./SeriesCard";

interface RelatedSeriesProps {
  relatedSeries: any;
  isLoading: boolean;
  currentSeriesId: string | number;
}

export function RelatedSeries({
  relatedSeries,
  isLoading,
  currentSeriesId,
}: RelatedSeriesProps) {
  const [showAllRelated, setShowAllRelated] = useState(false);

  if (isLoading) {
    return (
      <Container maxW="1200px" pb={16}>
        <Heading color="white" size="xl" mb={8}>
          Séries Relacionadas
        </Heading>
        <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={4}>
          {[...Array(6)].map((_, i) => (
            <Box key={i}>
              <Skeleton height="300px" borderRadius="lg" />
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  const filteredSeries = relatedSeries?.results 
    ? relatedSeries.results.filter(
        (series: any) => series.id !== Number(currentSeriesId)
      )
    : [];

  if (filteredSeries.length === 0) {
    return (
      <Container maxW="1200px" pb={16}>
        <Heading color="white" size="xl" mb={8}>
          Séries Relacionadas
        </Heading>
        <Text color="gray.400" textAlign="center">
          Não há séries relacionadas disponíveis.
        </Text>
      </Container>
    );
  }

  return (
    <Container maxW="1200px" pb={16}>
      <Heading color="white" size="xl" mb={8}>
        Séries Relacionadas
      </Heading>
      <SimpleGrid columns={{ base: 3, md: 4, lg: 7 }} spacing={4}>
        {filteredSeries
          .slice(0, showAllRelated ? undefined : 7)
          .map((series: any) => (
            <Box key={series.id}>
              <SeriesCard series={series} size="sm" />
            </Box>
          ))}
      </SimpleGrid>
      {filteredSeries.length > 7 && (
        <Button
          variant="ghost"
          color="teal.400"
          onClick={() => setShowAllRelated(!showAllRelated)}
          rightIcon={showAllRelated ? <CaretUp /> : <CaretDown />}
          mt={7}
          mx="auto"
          display="block"
        >
          {showAllRelated
            ? "Ver menos"
            : `Ver mais (${filteredSeries.length - 7} séries)`}
        </Button>
      )}
    </Container>
  );
} 