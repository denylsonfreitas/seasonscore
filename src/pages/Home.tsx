import { Box, Container, Heading, Text, VStack, Flex } from "@chakra-ui/react";
import { HomeSeriesSection } from "../components/HomeSeriesSection";
import {
  getPopularSeries,
  getTopRatedSeries,
  getAiringTodaySeries,
  getNetworkSeries,
  streamingServices,
} from "../services/tmdb";
import { Footer } from "../components/Footer";

export function Home() {
  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" pt="80px">
        <Container maxW="1200px" py={8} pb={16}>
          <VStack align="stretch" spacing={4} mb={12}>
            <Heading color="white" size="2xl">
              Bem-vindo ao SeasonScore
            </Heading>
            <Text color="gray.400" fontSize="xl">
              Avalie e descubra suas séries favoritas, temporada por temporada
            </Text>
          </VStack>

          <HomeSeriesSection
            title="Séries Populares do Momento"
            queryKey={["popular"]}
            queryFn={() => {
              return getPopularSeries();
            }}
            link="/series/popular"
          />

          <HomeSeriesSection
            title="Lançamentos Recentes"
            queryKey={["recent"]}
            queryFn={() => {
              return getAiringTodaySeries();
            }}
            link="/series/recent"
          />

          <Heading color="white" size="lg" mb={8}>
            Por Streaming
          </Heading>

          <HomeSeriesSection
            title="Netflix"
            queryKey={["netflix"]}
            queryFn={() => getNetworkSeries(streamingServices.NETFLIX)}
            link="/streaming/netflix"
          />

          <HomeSeriesSection
            title="Disney+"
            queryKey={["disney"]}
            queryFn={() => getNetworkSeries(streamingServices.DISNEY_PLUS)}
            link="/streaming/disney"
          />

          <HomeSeriesSection
            title="HBO Max"
            queryKey={["hbo"]}
            queryFn={() => getNetworkSeries(streamingServices.HBO)}
            link="/streaming/hbo"
          />

          <HomeSeriesSection
            title="Amazon Prime"
            queryKey={["amazon"]}
            queryFn={() => getNetworkSeries(streamingServices.AMAZON)}
            link="/streaming/amazon"
          />

          <HomeSeriesSection
            title="Apple TV+"
            queryKey={["apple"]}
            queryFn={() => getNetworkSeries(streamingServices.APPLE_TV)}
            link="/streaming/apple"
          />
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}
