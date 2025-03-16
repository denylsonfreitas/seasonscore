import { Box, Container, Heading, Flex } from "@chakra-ui/react";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { getPopularSeries } from "../services/tmdb";
import { SeriesGrid } from "../components/SeriesGrid";
import { Footer } from "../components/Footer";
import { getSeriesReviews } from "../services/reviews";
import { useMemo } from "react";
import { ScrollToTop } from "../components/ScrollToTop";

export function PopularSeries() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
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
            Séries Populares do Momento
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