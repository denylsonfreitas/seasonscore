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
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
        {data.results.slice(0, 5).map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
