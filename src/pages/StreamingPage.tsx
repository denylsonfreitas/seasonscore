import { Box, Container, Heading, Text, Flex } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getNetworkSeries, streamingServices } from "../services/tmdb";
import { SeriesGrid } from "../components/SeriesGrid";
import { Footer } from "../components/Footer";
import { ScrollToTop } from "../components/ScrollToTop";

const streamingNames: Record<string, { title: string; id: number }> = {
  netflix: { title: "Netflix", id: streamingServices.NETFLIX },
  disney: { title: "Disney+", id: streamingServices.DISNEY_PLUS },
  hbo: { title: "HBO", id: streamingServices.HBO },
  amazon: { title: "Amazon Prime", id: streamingServices.AMAZON },
  apple: { title: "Apple TV+", id: streamingServices.APPLE_TV },
};

export function StreamingPage() {
  const { streaming } = useParams<{ streaming: string }>();

  if (!streaming || !streamingNames[streaming]) {
    return (
      <Box bg="gray.900" minH="100vh" pt="80px">
        <Container maxW="1200px" py={8}>
          <Heading color="white" size="2xl" mb={4}>
            Streaming não encontrado
          </Heading>
          <Text color="gray.400">
            O streaming especificado não está disponível.
          </Text>
        </Container>
      </Box>
    );
  }

  const streamingInfo = streamingNames[streaming];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["streaming", streaming],
      queryFn: async ({ pageParam = 1 }) => {
        const result = await getNetworkSeries(
          streamingInfo.id,
          pageParam as number
        );
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
            {streamingInfo.title}
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
      <ScrollToTop />
    </Flex>
  );
}
