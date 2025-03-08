import { Box, Container, Heading, Flex } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAiringTodaySeries } from "../services/tmdb";
import { SeriesGrid } from "../components/SeriesGrid";
import { Footer } from "../components/Footer";

export function RecentSeries() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["recent-series"],
      queryFn: async ({ pageParam = 1 }) => {
        const result = await getAiringTodaySeries(pageParam as number);
        return result;
      },
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
      initialPageParam: 1,
    });

  const allSeries = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" pt="80px">
        <Container maxW="1200px" py={8} pb={16}>
          <Heading color="white" size="2xl" mb={8}>
            Lançamentos Recentes
          </Heading>

          <SeriesGrid
            series={allSeries}
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