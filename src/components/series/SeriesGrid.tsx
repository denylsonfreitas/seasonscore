import { Box, SimpleGrid, Spinner, Flex } from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { SeriesListItem } from "../../services/tmdb";

interface SeriesGridProps {
  series: SeriesListItem[];
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function SeriesGrid({
  series,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: SeriesGridProps) {
  if (isLoading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <Box>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
        {series.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </SimpleGrid>

      {hasNextPage && (
        <Box textAlign="center" mt={4}>
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            style={{
              padding: "8px 16px",
              background: "#4A5568",
              color: "white",
              borderRadius: "4px",
              cursor: isFetchingNextPage ? "not-allowed" : "pointer",
            }}
          >
            {isFetchingNextPage ? "Carregando mais..." : "Carregar mais séries"}
          </button>
        </Box>
      )}
    </Box>
  );
}
