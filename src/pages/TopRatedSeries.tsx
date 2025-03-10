import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Flex,
  Spinner,
  Image,
  Badge,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getTopRatedSeries } from "../services/reviews";
import { getSeriesDetails } from "../services/tmdb";
import { SeriesCard } from "../components/SeriesCard";
import { Footer } from "../components/Footer";
import { Star, Trophy } from "@phosphor-icons/react";

interface TopRatedSeries {
  id: number;
  name: string;
  poster_path: string;
  overview: string;
  averageRating: number;
}

export function TopRatedSeries() {
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["topRatedSeries"],
    queryFn: getTopRatedSeries,
  });

  const { data: topSeries, isLoading: isLoadingSeries } = useQuery({
    queryKey: ["topSeriesDetails", reviews],
    queryFn: async () => {
      if (!reviews) return [];

      // Agrupar reviews por série e calcular média
      const seriesMap = new Map<number, { total: number; count: number }>();
      reviews.forEach((review) => {
        const seriesId = review.seriesId;
        const seasonRatings = review.seasonReviews.map((sr) => sr.rating);
        const averageRating =
          seasonRatings.reduce((a, b) => a + b, 0) / seasonRatings.length;

        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, { total: 0, count: 0 });
        }
        const current = seriesMap.get(seriesId)!;
        seriesMap.set(seriesId, {
          total: current.total + averageRating,
          count: current.count + 1,
        });
      });

      // Converter para array e ordenar
      const sortedSeries = Array.from(seriesMap.entries())
        .map(([seriesId, data]) => ({
          id: seriesId,
          averageRating: data.total / data.count,
        }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 10);

      // Buscar detalhes das séries
      const seriesDetails = await Promise.all(
        sortedSeries.map(async (series) => {
          const details = await getSeriesDetails(series.id);
          return {
            ...details,
            averageRating: series.averageRating,
          };
        })
      );

      return seriesDetails;
    },
    enabled: !!reviews,
  });

  const isLoading = isLoadingReviews || isLoadingSeries;

  if (isLoading) {
    return (
      <Flex
        minH="100vh"
        bg="gray.900"
        pt="80px"
        align="center"
        justify="center"
      >
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" pt="80px">
      <Container maxW="1200px" py={8}>
        <Box>
          <Heading color="white" size="2xl" mb={4}>
            Top 10 Séries
          </Heading>
          <Text color="gray.400" fontSize="lg">
            As séries mais bem avaliadas pela comunidade
          </Text>
        </Box>

        {topSeries && topSeries.length > 0 && (
          <>
            {/* Pódio Top 5 */}
            <Grid
              templateColumns={{ 
                base: "1fr",
                md: "repeat(5, 1fr)"
              }}
              gap={{ base: 6, md: 4 }}
              position="relative"
              my={12}
            >
              {/* Quarto Lugar */}
              <GridItem
                order={{ base: 4, md: 1 }}
                alignSelf={{ base: "start", md: "center" }}
                mt={{ base: 0, md: 8 }}
              >
                <SeriesCard
                  series={{
                    ...topSeries[3],
                    rating: topSeries[3].averageRating,
                  }}
                  size="sm"
                  position={4}
                />
              </GridItem>

              {/* Segundo Lugar */}
              <GridItem
                order={{ base: 2, md: 2 }}
                alignSelf={{ base: "start", md: "end" }}
                transform={{ base: "none", md: "translateY(-20px)" }}
              >
                <SeriesCard
                  series={{
                    ...topSeries[1],
                    rating: topSeries[1].averageRating,
                  }}
                  size="md"
                  position={2}
                />
              </GridItem>

              {/* Primeiro Lugar */}
              <GridItem
                order={{ base: 1, md: 3 }}
                transform={{ base: "none", md: "translateY(-40px)" }}
              >
                <SeriesCard
                  series={{
                    ...topSeries[0],
                    rating: topSeries[0].averageRating,
                  }}
                  size="lg"
                  position={1}
                />
              </GridItem>

              {/* Terceiro Lugar */}
              <GridItem
                order={{ base: 3, md: 4 }}
                alignSelf={{ base: "start", md: "end" }}
                transform={{ base: "none", md: "translateY(-20px)" }}
              >
                <SeriesCard
                  series={{
                    ...topSeries[2],
                    rating: topSeries[2].averageRating,
                  }}
                  size="md"
                  position={3}
                />
              </GridItem>

              {/* Quinto Lugar */}
              <GridItem
                order={{ base: 5, md: 5 }}
                alignSelf={{ base: "start", md: "center" }}
                mt={{ base: 0, md: 8 }}
              >
                <SeriesCard
                  series={{
                    ...topSeries[4],
                    rating: topSeries[4].averageRating,
                  }}
                  size="sm"
                  position={5}
                />
              </GridItem>
            </Grid>

            {/* Restante do Top 10 */}
            <SimpleGrid 
              columns={{ base: 2, sm: 3, md: 4, lg: 5 }} 
              spacing={4}
            >
              {topSeries.slice(5).map((series, index) => (
                <SeriesCard
                  key={series.id}
                  series={{
                    ...series,
                    rating: series.averageRating,
                  }}
                  size="sm"
                  position={index + 6}
                />
              ))}
            </SimpleGrid>
          </>
        )}
      </Container>
      <Footer />
    </Box>
  );
} 