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
import { SeriesResponse } from "../../services/tmdb";
import { InfiniteData } from "@tanstack/react-query";
import { CaretRight } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";

export interface SeriesSectionProps {
  title: string;
  data?: InfiniteData<SeriesResponse>;
  isLoading: boolean;
  error: Error | null;
  link?: string;
}

export function SeriesSection({
  title,
  data,
  isLoading,
  error,
  link,
}: SeriesSectionProps) {
  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="primary.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="red.500">Erro ao carregar séries: {error.message}</Text>
      </Box>
    );
  }

  const series = data?.pages.flatMap((page) => page.results) ?? [];

  if (series.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.400">Nenhuma série encontrada</Text>
      </Box>
    );
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
            color="primary.500"
            rightIcon={<CaretRight weight="bold" />}
            _hover={{ bg: "gray.800" }}
          >
            Ver mais
          </Button>
        )}
      </Flex>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
        {series.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
