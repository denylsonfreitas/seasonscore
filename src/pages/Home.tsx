import { HomeSeriesSection } from "../components/series/HomeSeriesSection";
import { Box, Container, VStack, Flex } from "@chakra-ui/react";
import {
  getPopularSeries,
  getAiringTodaySeries,
} from "../services/tmdb";
import { Footer } from "../components/common/Footer";
import { TrendingBanner } from "../components/series/TrendingBanner";
import { PopularReviews } from "../components/reviews/PopularReviews";
import { PopularLists } from "../components/lists/PopularLists";
import { PersonalizedRecommendations } from "../components/series/PersonalizedRecommendations";

export function Home() {
  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        <TrendingBanner />
        
        <Container maxW="container.lg" py={8} pb={16}>
          <PersonalizedRecommendations />

          <HomeSeriesSection
            title="Populares"
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
          
          <PopularLists />
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}
