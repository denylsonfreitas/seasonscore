import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Spinner,
  useBreakpointValue,
  Grid,
  GridItem,
  Icon,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails } from "../services/tmdb";
import { SeriesCard } from "../components/series/SeriesCard";
import { Footer } from "../components/common/Footer";
import { TelevisionSimple } from "@phosphor-icons/react";
import { getTopRatedSeries as getTopRatedReviews } from "../services/reviews";
import { PageHeader } from "../components/common/PageHeader";

interface TopRatedSeries {
  id: number;
  name: string;
  poster_path: string;
  overview: string;
  averageRating: number;
}

export function TopRatedSeries() {
  const secondThirdSize = useBreakpointValue({ base: "sm", md: "md" }) as
    "sm" | "md" | "lg" | undefined;
  const firstPlaceSize = useBreakpointValue({ base: "md", md: "lg" }) as
    "sm" | "md" | "lg" | undefined;

  // Média calculada no banco (view series_ratings) + detalhes da série no TMDB
  const { data: topSeries, isLoading } = useQuery({
    queryKey: ["topRatedSeries"],
    queryFn: async () => {
      const ranking = await getTopRatedReviews(10);
      const details = await Promise.all(
        ranking.map(async (entry) => {
          try {
            const series = await getSeriesDetails(entry.seriesId);
            return { ...series, averageRating: entry.averageRating };
          } catch {
            return null;
          }
        })
      );
      return details.filter((item) => item !== null);
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <Flex minH="100vh" bg="gray.900" pt="80px" align="center" justify="center">
        <Spinner size="xl" color="primary.500" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900">
      <PageHeader title="Top 10 Séries" subtitle="As séries mais bem avaliadas pela comunidade" />

      <Container maxW="container.lg" pb={20}>
        {!topSeries || topSeries.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="60vh"
            textAlign="center"
            p={8}
          >
            <Icon as={TelevisionSimple} color="gray.500" boxSize={16} mb={4} />
            <Heading color="gray.500" size="lg" mb={2}>
              Nenhuma série avaliada ainda
            </Heading>
            <Text color="gray.400">
              Seja o primeiro a avaliar uma série! Apenas séries com nota 3 ou superior aparecem no
              ranking.
            </Text>
          </Flex>
        ) : (
          <>
            {/* Pódio Top 5 */}
            {topSeries.length >= 3 ? (
              <Grid
                templateColumns={{
                  base: "repeat(3, 1fr)",
                  md: `repeat(${Math.min(topSeries.length, 5)}, 1fr)`,
                }}
                gap={{ base: 4, md: 4 }}
                position="relative"
                my={12}
              >
                {/* Segundo Lugar */}
                {topSeries.length >= 2 && (
                  <GridItem
                    order={{ base: 1, md: 2 }}
                    alignSelf={{ base: "end", md: "end" }}
                    transform={{ base: "none", md: "translateY(-20px)" }}
                  >
                    <SeriesCard
                      series={{
                        ...topSeries[1],
                        rating: topSeries[1].averageRating,
                      }}
                      size={secondThirdSize}
                      position={2}
                    />
                  </GridItem>
                )}

                {/* Primeiro Lugar */}
                {topSeries.length >= 1 && (
                  <GridItem
                    order={{ base: 2, md: 3 }}
                    alignSelf="start"
                    transform={{ base: "translateY(-20px)", md: "translateY(-40px)" }}
                  >
                    <SeriesCard
                      series={{
                        ...topSeries[0],
                        rating: topSeries[0].averageRating,
                      }}
                      size={firstPlaceSize}
                      position={1}
                    />
                  </GridItem>
                )}

                {/* Terceiro Lugar */}
                {topSeries.length >= 3 && (
                  <GridItem
                    order={{ base: 3, md: 4 }}
                    alignSelf={{ base: "end", md: "end" }}
                    transform={{ base: "none", md: "translateY(-20px)" }}
                  >
                    <SeriesCard
                      series={{
                        ...topSeries[2],
                        rating: topSeries[2].averageRating,
                      }}
                      size={secondThirdSize}
                      position={3}
                    />
                  </GridItem>
                )}

                {/* Quarto Lugar */}
                {topSeries.length >= 4 && (
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
                )}

                {/* Quinto Lugar */}
                {topSeries.length >= 5 && (
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
                )}

                {/* Sexto Lugar */}
                {topSeries.length >= 6 && (
                  <GridItem
                    order={{ base: 6, md: 6 }}
                    alignSelf="start"
                    mt={{ base: 0, md: 8 }}
                    display={{ base: "block", md: "none" }}
                  >
                    <SeriesCard
                      series={{
                        ...topSeries[5],
                        rating: topSeries[5].averageRating,
                      }}
                      size="sm"
                      position={6}
                    />
                  </GridItem>
                )}
              </Grid>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} my={12}>
                {topSeries.map((series, index) => (
                  <SeriesCard
                    key={series.id}
                    series={{
                      ...series,
                      rating: series.averageRating,
                    }}
                    size="md"
                    position={index + 1}
                  />
                ))}
              </SimpleGrid>
            )}

            {/* Restante do Top 10 */}
            {topSeries.length > 6 && (
              <SimpleGrid
                columns={{ base: 2, sm: 3, md: 4, lg: 5 }}
                spacing={4}
                mt={{ base: 8, md: 4 }}
              >
                {/* Na versão desktop, mostrar a partir do 6º lugar */}
                {topSeries.slice(5).map(
                  (series, index) =>
                    series && (
                      <Box key={series.id} display={{ base: "none", md: "block" }}>
                        <SeriesCard
                          series={{
                            ...series,
                            rating: series.averageRating,
                          }}
                          size="sm"
                          position={index + 6}
                        />
                      </Box>
                    )
                )}
                {/* Na versão mobile, mostrar a partir do 7º lugar */}
                {topSeries.slice(6).map(
                  (series, index) =>
                    series && (
                      <Box key={`mobile-${series.id}`} display={{ base: "block", md: "none" }}>
                        <SeriesCard
                          series={{
                            ...series,
                            rating: series.averageRating,
                          }}
                          size="sm"
                          position={index + 7}
                        />
                      </Box>
                    )
                )}
              </SimpleGrid>
            )}
          </>
        )}
      </Container>
      <Footer />
    </Box>
  );
}
