import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Image,
  Heading,
  Text,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Grid,
  Icon,
  Progress,
  Spinner,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Avatar,
  Divider,
  Wrap,
  WrapItem,
  Link,
  Skeleton,
} from "@chakra-ui/react";
import { Star, Heart, CaretDown, CaretUp, TelevisionSimple } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails } from "../services/tmdb";
import { ReviewSection } from "../components/ReviewSection";
import { RatingStars } from "../components/RatingStars";
import { ReviewModal } from "../components/ReviewModal";
import { ReviewEditModal } from "../components/ReviewEditModal";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SeriesReview, getSeriesReviews } from "../services/reviews";
import { Footer } from "../components/Footer";
import { WatchlistButton } from "../components/WatchlistButton";
import { UserReview } from "../components/UserReview";

export function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [existingReview, setExistingReview] = useState<SeriesReview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const queryClient = useQueryClient();

  const { data: series, isLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
  });

  // Buscar avaliação do usuário atual
  const userReview = reviews.find(
    (review) => review.userId === currentUser?.uid
  );

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (!series) {
    return (
      <Box bg="gray.900" minH="100vh" pt="80px">
        <Container maxW="1200px" py={8}>
          <Text color="white">Série não encontrada</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" >
        <Box position="relative">
          {/* Banner */}
          <Box
            h="400px"
            w="100%"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgImage={`url(https://image.tmdb.org/t/p/original${series.backdrop_path})`}
              bgSize="cover"
              bgPosition="center"
              _after={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.5), rgba(23, 25, 35, 1))",
              }}
            />
          </Box>
        </Box>

        {/* Conteúdo Principal */}
        <Container maxW="1200px" position="relative" pb={16}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt="-200px">
            <Box>
              <Image
                src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                alt={series.name}
                borderRadius="lg"
                width="100%"
                maxW="400px"
                mx="auto"
                boxShadow="xl"
              />
            </Box>
            <VStack align="start" spacing={6}>
              <Box width="100%">
                <Skeleton isLoaded={!isLoading} startColor="gray.700" endColor="gray.800">
                  {series.images?.logos?.[0]?.file_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${series.images.logos[0].file_path}`}
                      alt={series.name}
                      maxH="120px"
                      objectFit="contain"
                    />
                  ) : (
                    <Heading color="white" size="2xl">
                      {series.name}
                    </Heading>
                  )}
                </Skeleton>
              </Box>

              <Box>
                <Text color="gray.400" noOfLines={isExpanded ? undefined : 3}>
                  {series.overview}
                </Text>
                {series.overview.length > 250 && (
                  <Button
                    variant="link"
                    color="teal.400"
                    onClick={() => setIsExpanded(!isExpanded)}
                    rightIcon={isExpanded ? <CaretUp /> : <CaretDown />}
                    size="sm"
                    mt={2}
                  >
                    {isExpanded ? "Menos" : "Mais..."}
                  </Button>
                )}
              </Box>

              <HStack spacing={4}>
                <Text color="white">
                  {series.number_of_seasons}{" "}
                  {series.number_of_seasons === 1 ? "temporada" : "temporadas"}
                </Text>
                <Text color="white">
                  Lançamento: {new Date(series.first_air_date).getFullYear()}
                </Text>
                <WatchlistButton series={series} />
              </HStack>

              <Wrap spacing={2}>
                {series.genres.map((genre) => (
                  <WrapItem key={genre.id}>
                    <Badge colorScheme="teal">{genre.name}</Badge>
                  </WrapItem>
                ))}
              </Wrap>

              <Box width="100%">
                <Tabs variant="enclosed" colorScheme="teal" size="sm">
                  <TabList borderBottomColor="gray.700">
                    <Tab
                      color="gray.400"
                      _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
                    >
                      Temporadas
                    </Tab>
                    <Tab
                      color="gray.400"
                      _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
                    >
                      Detalhes
                    </Tab>
                    <Tab
                      color="gray.400"
                      _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
                    >
                      Onde Assistir
                    </Tab>
                    <Tab
                      color="gray.400"
                      _selected={{ color: "white", bg: "gray.800", borderColor: "gray.700" }}
                    >
                      Elenco
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Painel de Temporadas */}
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        <Accordion allowMultiple>
                          {Array.from(
                            { length: series.number_of_seasons },
                            (_, i) => i + 1
                          )
                            .slice(0, showAllSeasons ? undefined : 3)
                            .map((season) => {
                              const seasonReviews = reviews.flatMap((review) =>
                                review.seasonReviews.filter((sr) => sr.seasonNumber === season)
                              );

                              const averageRating =
                                seasonReviews.length > 0
                                  ? seasonReviews.reduce(
                                      (acc, review) => acc + review.rating,
                                      0
                                    ) / seasonReviews.length
                                  : 0;

                              return (
                                <AccordionItem key={`season-${season}`} border="none">
                                  <AccordionButton
                                    bg="gray.700"
                                    _hover={{ bg: "gray.600" }}
                                    mb={2}
                                    borderRadius="md"
                                  >
                                    <Box flex="1" textAlign="left">
                                      <HStack>
                                        <Text color="white" fontWeight="medium">Temporada {season}</Text>
                                        {averageRating > 0 && (
                                          <Badge colorScheme="yellow">
                                            {averageRating.toFixed(1)} ★
                                          </Badge>
                                        )}
                                      </HStack>
                                    </Box>
                                    <AccordionIcon color="white" />
                                  </AccordionButton>
                                  <AccordionPanel pb={4} bg="gray.800" borderRadius="md">
                                    <VStack spacing={4} align="stretch">
                                      {userReview?.seasonReviews.find(
                                        (sr) => sr.seasonNumber === season
                                      ) ? (
                                        <Box bg="gray.800" p={4} borderRadius="lg">
                                          <HStack justify="space-between" mb={2}>
                                            <Text color="white" fontWeight="bold">
                                              Sua avaliação
                                            </Text>
                                            <Button
                                              size="sm"
                                              colorScheme="teal"
                                              onClick={() => setExistingReview(userReview)}
                                            >
                                              Editar
                                            </Button>
                                          </HStack>
                                          <RatingStars
                                            rating={
                                              userReview.seasonReviews.find(
                                                (sr) => sr.seasonNumber === season
                                              )?.rating || 0
                                            }
                                          />
                                          {userReview.seasonReviews.find(
                                            (sr) => sr.seasonNumber === season
                                          )?.comment && (
                                            <Text color="gray.400" mt={2}>
                                              {
                                                userReview.seasonReviews.find(
                                                  (sr) => sr.seasonNumber === season
                                                )?.comment
                                              }
                                            </Text>
                                          )}
                                        </Box>
                                      ) : (
                                        <Box bg="gray.800" pt={2} borderRadius="lg">
                                          <Button 
                                            colorScheme="teal" 
                                            onClick={() => {
                                              setSelectedSeason(season);
                                              onOpen();
                                              queryClient.invalidateQueries({
                                                queryKey: ["reviews", id],
                                              });
                                            }}
                                            width="100%"
                                          >
                                            Avaliar Temporada {season}
                                          </Button>
                                        </Box>
                                      )}

                                      {seasonReviews.length > 0 && (
                                        <Box>
                                          <Text color="white" fontWeight="bold" mb={2}>
                                            Avaliações dos usuários
                                          </Text>
                                          <VStack spacing={4} align="stretch">
                                            {seasonReviews
                                              .filter(
                                                (review) => review.userId !== currentUser?.uid
                                              )
                                              .map((review) => (
                                                <UserReview
                                                  key={`review-${review.userId}-${season}`}
                                                  userId={review.userId}
                                                  userEmail={review.userEmail}
                                                  rating={review.rating}
                                                  comment={review.comment}
                                                  createdAt={review.createdAt}
                                                />
                                              ))}
                                          </VStack>
                                        </Box>
                                      )}
                                    </VStack>
                                  </AccordionPanel>
                                </AccordionItem>
                              );
                            })}
                        </Accordion>
                        {series.number_of_seasons > 3 && (
                          <Button
                            variant="ghost"
                            color="teal.400"
                            onClick={() => setShowAllSeasons(!showAllSeasons)}
                            rightIcon={showAllSeasons ? <CaretUp /> : <CaretDown />}
                            alignSelf="center"
                          >
                            {showAllSeasons 
                              ? "Ver menos" 
                              : `Ver mais (${series.number_of_seasons - 3} temporadas)`}
                          </Button>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Painel de Detalhes */}
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={6}>
                        <Box>
                          <Heading size="md" color="white" mb={4}>
                            Informações Gerais
                          </Heading>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <Box>
                              <Text color="gray.400">Status</Text>
                              <Text color="white">{series.status}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.400">Tipo</Text>
                              <Text color="white">{series.type}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.400">País de Origem</Text>
                              <Text color="white">{series.origin_country.join(", ")}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.400">Idioma Original</Text>
                              <Text color="white">{series.original_language}</Text>
                            </Box>
                          </SimpleGrid>
                        </Box>

                        {series.created_by.length > 0 && (
                          <Box>
                            <Heading size="md" color="white" mb={4}>
                              Criado por
                            </Heading>
                            <Wrap spacing={4}>
                              {series.created_by.map((creator) => (
                                <WrapItem key={creator.id}>
                                  <Box>
                                    <Avatar
                                      size="md"
                                      name={creator.name}
                                      src={
                                        creator.profile_path
                                          ? `https://image.tmdb.org/t/p/w200${creator.profile_path}`
                                          : undefined
                                      }
                                    />
                                    <Text color="white" fontSize="sm" mt={2} textAlign="center">
                                      {creator.name}
                                    </Text>
                                  </Box>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </Box>
                        )}

                        <Box>
                          <Heading size="md" color="white" mb={4}>
                            Produção
                          </Heading>
                          <Wrap spacing={4}>
                            {series.production_companies.map((company) => (
                              <WrapItem key={company.id}>
                                <Box
                                  bg="gray.800"
                                  p={4}
                                  borderRadius="md"
                                  textAlign="center"
                                  minW="150px"
                                >
                                  {company.logo_path ? (
                                    <Image
                                      src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                                      alt={company.name}
                                      height="50px"
                                      objectFit="contain"
                                      mx="auto"
                                      mb={2}
                                    />
                                  ) : (
                                    <Text color="white" fontSize="xl" mb={2}>
                                      {company.name[0]}
                                    </Text>
                                  )}
                                  <Text color="white" fontSize="sm">
                                    {company.name}
                                  </Text>
                                </Box>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Painel de Onde Assistir */}
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={6}>
                        {series["watch/providers"]?.results?.BR ? (
                          <>
                            {series["watch/providers"].results.BR.flatrate && (
                              <Box>
                                <Heading size="md" color="white" mb={4}>
                                  Disponível no Streaming
                                </Heading>
                                <Wrap spacing={4}>
                                  {series["watch/providers"].results.BR.flatrate.map(
                                    (provider) => (
                                      <WrapItem key={provider.provider_id}>
                                        <Box
                                          bg="gray.800"
                                          p={4}
                                          borderRadius="md"
                                          textAlign="center"
                                        >
                                          <Image
                                            src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            width="50px"
                                            height="50px"
                                            objectFit="contain"
                                            mx="auto"
                                          />
                                          <Text color="white" fontSize="sm" mt={2}>
                                            {provider.provider_name}
                                          </Text>
                                        </Box>
                                      </WrapItem>
                                    )
                                  )}
                                </Wrap>
                              </Box>
                            )}

                            {series["watch/providers"].results.BR.rent && (
                              <Box>
                                <Heading size="md" color="white" mb={4}>
                                  Alugar
                                </Heading>
                                <Wrap spacing={4}>
                                  {series["watch/providers"].results.BR.rent.map(
                                    (provider) => (
                                      <WrapItem key={provider.provider_id}>
                                        <Box
                                          bg="gray.800"
                                          p={4}
                                          borderRadius="md"
                                          textAlign="center"
                                        >
                                          <Image
                                            src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            width="50px"
                                            height="50px"
                                            objectFit="contain"
                                            mx="auto"
                                          />
                                          <Text color="white" fontSize="sm" mt={2}>
                                            {provider.provider_name}
                                          </Text>
                                        </Box>
                                      </WrapItem>
                                    )
                                  )}
                                </Wrap>
                              </Box>
                            )}

                            {series["watch/providers"].results.BR.buy && (
                              <Box>
                                <Heading size="md" color="white" mb={4}>
                                  Comprar
                                </Heading>
                                <Wrap spacing={4}>
                                  {series["watch/providers"].results.BR.buy.map(
                                    (provider) => (
                                      <WrapItem key={provider.provider_id}>
                                        <Box
                                          bg="gray.800"
                                          p={4}
                                          borderRadius="md"
                                          textAlign="center"
                                        >
                                          <Image
                                            src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            width="50px"
                                            height="50px"
                                            objectFit="contain"
                                            mx="auto"
                                          />
                                          <Text color="white" fontSize="sm" mt={2}>
                                            {provider.provider_name}
                                          </Text>
                                        </Box>
                                      </WrapItem>
                                    )
                                  )}
                                </Wrap>
                              </Box>
                            )}

                            <Link
                              href={series["watch/providers"].results.BR.link}
                              isExternal
                              color="teal.400"
                              textAlign="center"
                              mt={4}
                            >
                              <Button
                                rightIcon={<TelevisionSimple weight="bold" />}
                                colorScheme="teal"
                                variant="outline"
                              >
                                Ver todas as opções de streaming
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Text color="gray.400" textAlign="center">
                            Não há informações disponíveis sobre onde assistir esta série no
                            Brasil.
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Painel de Elenco */}
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={6}>
                        {series.credits?.cast && series.credits.cast.length > 0 ? (
                          <>
                            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                              {series.credits.cast
                                .slice(0, showAllCast ? undefined : 6)
                                .map((actor) => (
                                  <Box
                                    key={actor.id}
                                    bg="gray.800"
                                    p={4}
                                    borderRadius="lg"
                                    display="flex"
                                    alignItems="center"
                                    gap={4}
                                  >
                                    <Avatar
                                      size="md"
                                      name={actor.name}
                                      src={
                                        actor.profile_path
                                          ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                                          : undefined
                                      }
                                    />
                                    <Box>
                                      <Text color="white" fontWeight="bold" fontSize="sm">
                                        {actor.name}
                                      </Text>
                                      <Text color="gray.400" fontSize="sm">
                                        {actor.character}
                                      </Text>
                                    </Box>
                                  </Box>
                                ))}
                            </SimpleGrid>
                            {series.credits.cast.length > 6 && (
                              <Button
                                variant="ghost"
                                color="teal.400"
                                onClick={() => setShowAllCast(!showAllCast)}
                                rightIcon={showAllCast ? <CaretUp /> : <CaretDown />}
                                alignSelf="center"
                              >
                                {showAllCast ? "Ver menos" : `Ver mais (${series.credits.cast.length - 6} atores)`}
                              </Button>
                            )}
                          </>
                        ) : (
                          <Text color="gray.400" textAlign="center">
                            Não há informações disponíveis sobre o elenco.
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      <Footer />

      <ReviewModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          queryClient.invalidateQueries({ queryKey: ["reviews", id] });
        }}
        seriesId={Number(id)}
        seriesName={series.name}
        numberOfSeasons={series.number_of_seasons}
        initialSeason={selectedSeason}
      />

      {existingReview && (
        <ReviewEditModal
          isOpen={!!existingReview}
          onClose={() => setExistingReview(null)}
          review={{
            ...existingReview,
            series: {
              name: series.name,
              poster_path: series.poster_path ?? '',
            },
          }}
          onReviewUpdated={() => {
            setExistingReview(null);
            queryClient.invalidateQueries({
              queryKey: ["reviews", id],
            });
          }}
        />
      )}
    </Flex>
  );
}
