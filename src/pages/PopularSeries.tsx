import { Box, Container, Heading, Flex } from "@chakra-ui/react";
import { getPopularSeries } from "../services/tmdb";
import { SeriesGrid } from "../components/series/SeriesGrid";
import { Footer } from "../components/common/Footer";
import { useInfiniteQuery } from "@tanstack/react-query";

export function PopularSeries() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["popular-series"],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getPopularSeries(pageParam as number);
      return result;
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allSeries = data?.pages.flatMap((page) => page.results) ?? [];
  const uniqueSeries = allSeries.filter(
    (series, index, self) =>
      index === self.findIndex((s) => s.id === series.id)
  );

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        <Container maxW="container.lg" py={8} pb={16}>
          <Heading color="white" size="2xl" mb={8}>
            Populares
          </Heading>

          <SeriesGrid
            series={uniqueSeries}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
} 