import {
  Box,
  Container,
  Heading,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { carouselStyles, seriesSliderSettings } from "../../styles/carouselStyles";

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
  if (isLoading) {
    return (
      <Container maxW="container.lg">
        <Heading color="white" size="xl" mb={8}>
          Séries Relacionadas
        </Heading>
        <Box 
          display="grid" 
          gridTemplateColumns={{ base: "repeat(3, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} 
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
    ? relatedSeries.results.filter(
        (series: any) => series.id !== Number(currentSeriesId)
      )
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

  // Configurações personalizadas para o slider
  const sliderSettings = {
    ...seriesSliderSettings,
    slidesToShow: Math.min(filteredSeries.length, 7),
  };

  return (
    <Container maxW="container.lg">
      <Heading color="white" size="xl" mb={8}>
        Séries Relacionadas
      </Heading>
      <Box sx={carouselStyles} pb={8}>
        <Slider {...sliderSettings}>
          {filteredSeries.map((series: any) => (
            <Box key={series.id}>
              <SeriesCard series={series} size="lg" />
            </Box>
          ))}
        </Slider>
      </Box>
    </Container>
  );
} 