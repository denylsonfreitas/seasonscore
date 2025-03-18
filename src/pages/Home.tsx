import { HomeSeriesSection } from "../components/series/HomeSeriesSection";
import { Box, Container, VStack, Flex } from "@chakra-ui/react";
import {
  getPopularSeries,
  getAiringTodaySeries,
} from "../services/tmdb";
import { Footer } from "../components/common/Footer";
import { TrendingBanner } from "../components/series/TrendingBanner";
import { PopularReviews } from "../components/reviews/PopularReviews";
import { ScrollToTop } from "../components/common/ScrollToTop";

export function Home() {
  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        <Container maxW="1200px" py={8} pb={16}>
          <TrendingBanner />

          

          <HomeSeriesSection
            title="Séries Populares do Momento"
            queryKey={["popular"]}
            queryFn={() => {
              return getPopularSeries();
            }}
            link="/series/popular"
          />

          <HomeSeriesSection
            title="Novidades"
            queryKey={["recent"]}
            queryFn={() => {
              return getAiringTodaySeries();
            }}
            link="/series/recent"
          />

          <PopularReviews />
        </Container>
      </Box>
      <Footer />
      <ScrollToTop />
    </Flex>
  );
}
