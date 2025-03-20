import { Box, SimpleGrid, Spinner, Flex } from "@chakra-ui/react";
import { SeriesCard } from "./SeriesCard";
import { SeriesListItem } from "../../services/tmdb";
import { InfiniteScroll } from "../common/InfiniteScroll";

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
  if (isLoading && series.length === 0) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <Box>
      <InfiniteScroll
        loadMore={onLoadMore || (() => {})}
        hasMore={!!hasNextPage}
        isLoading={!!isFetchingNextPage}
      >
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
          {series.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </SimpleGrid>
      </InfiniteScroll>
    </Box>
  );
}
