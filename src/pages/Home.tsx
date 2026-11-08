import { Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { TrendingBanner } from "../components/series/TrendingBanner";
import { HomeSeriesSection } from "../components/series/HomeSeriesSection";
import { SeasonStrip } from "../components/series/SeasonStrip";
import { PopularReviews } from "../components/reviews/PopularReviews";
import { PopularLists } from "../components/lists/PopularLists";
import { PersonalizedRecommendations } from "../components/series/PersonalizedRecommendations";
import { FollowedUsersReviews } from "../components/reviews/FollowedUsersReviews";
import { FollowedUsersLists } from "../components/lists/FollowedUsersLists";
import { PageContainer } from "../components/layout/PageContainer";
import { useAuth } from "../contexts/AuthContext";
import { useAuthUIStore } from "../services/uiState";
import { getGlobalLoginPopover } from "../components/layout/Navbar";
import { getAiringTodaySeries, getPopularSeries } from "../services/tmdb";

// Ilustração do conceito: uma série que cai na T3 e se recupera.
const EXAMPLE_STRIP = [
  { season: 1, score: 4.4 },
  { season: 2, score: 4.1 },
  { season: 3, score: 2.6 },
  { season: 4, score: 3.4 },
  { season: 5, score: 4.6 },
];

function Intro() {
  const { openRegister } = useAuthUIStore();

  return (
    <Flex
      as="section"
      py={{ base: 10, md: 14 }}
      gap={{ base: 8, md: 16 }}
      direction={{ base: "column", md: "row" }}
      align={{ base: "flex-start", md: "center" }}
      justify="space-between"
      borderBottom="1px solid"
      borderColor="ink.800"
    >
      <Box maxW="560px">
        <Heading as="h1" size="h1">
          Nenhuma série é igual do começo ao fim.
        </Heading>
        <Text mt={4} color="ink.300" fontSize={{ base: "md", md: "lg" }}>
          No SeasonScore você dá nota a cada temporada, vê onde a série cresceu ou caiu e descobre o
          que vale a pena com quem assiste junto.
        </Text>
        <HStack mt={6} spacing={3}>
          <Button onClick={openRegister}>Criar conta</Button>
          <Button variant="outline" onClick={() => getGlobalLoginPopover()?.()}>
            Entrar
          </Button>
        </HStack>
      </Box>

      <Box
        flexShrink={0}
        p={5}
        border="1px solid"
        borderColor="ink.800"
        borderRadius="lg"
        bg="ink.900"
        aria-hidden="true"
      >
        <Text textStyle="label" color="ink.400" mb={4}>
          Exemplo · nota por temporada
        </Text>
        <SeasonStrip seasons={EXAMPLE_STRIP} height={88} />
      </Box>
    </Flex>
  );
}

export function Home() {
  const { currentUser } = useAuth();

  return (
    <>
      <TrendingBanner />

      <PageContainer pb={{ base: 12, md: 16 }}>
        {currentUser ? (
          <>
            <PersonalizedRecommendations />
            <FollowedUsersReviews />
            <HomeSeriesSection
              eyebrow="Populares"
              title="O que todo mundo está vendo"
              queryKey={["home", "popular"]}
              queryFn={() => getPopularSeries()}
              link="/series"
            />
            <PopularReviews />
            <FollowedUsersLists />
            <PopularLists />
          </>
        ) : (
          <>
            <Intro />
            <HomeSeriesSection
              eyebrow="Populares"
              title="O que todo mundo está vendo"
              queryKey={["home", "popular"]}
              queryFn={() => getPopularSeries()}
              link="/series"
            />
            <PopularReviews />
            <HomeSeriesSection
              eyebrow="Estreias"
              title="Chegaram neste mês"
              queryKey={["home", "airing"]}
              queryFn={() => getAiringTodaySeries()}
            />
            <PopularLists />
          </>
        )}
      </PageContainer>
    </>
  );
}
