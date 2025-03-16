import { Box, Container, Heading, Flex } from "@chakra-ui/react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { getAiringTodaySeries } from "../services/tmdb";
import { SeriesGrid } from "../components/SeriesGrid";
import { Footer } from "../components/Footer";
import { getSeriesReviews } from "../services/reviews";
import { useMemo } from "react";
import { ScrollToTop } from "../components/ScrollToTop";

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

  // Buscar avaliações para todas as séries
  const seriesReviewsQueries = useQueries({
    queries: allSeries.map(series => ({
      queryKey: ['series-reviews', series.id],
      queryFn: async () => {
        const reviews = await getSeriesReviews(series.id);
        if (reviews.length > 0) {
          const allRatings = reviews.flatMap(review => 
            review.seasonReviews.map(sr => sr.rating)
          );
          return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }
        return null;
      },
      staleTime: 1000 * 60 * 5, // 5 minutos
    }))
  });

  // Mapear as avaliações para as séries
  const seriesWithRatings = useMemo(() => {
    return allSeries.map((series, index) => ({
      ...series,
      rating: seriesReviewsQueries[index].data ?? undefined
    }));
  }, [allSeries, seriesReviewsQueries]);

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" pt="80px">
        <Container maxW="1200px" py={8} pb={16}>
          <Heading color="white" size="2xl" mb={8}>
            Novidades
          </Heading>

          <SeriesGrid
            series={seriesWithRatings}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </Container>
      </Box>
      <Footer />
      <ScrollToTop />
    </Flex>
  );
} 