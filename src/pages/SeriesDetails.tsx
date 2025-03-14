import { useParams, useNavigate } from "react-router-dom";
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
  Stack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  useToast,
} from "@chakra-ui/react";
import { Star, Heart, CaretDown, CaretUp, TelevisionSimple, Calendar, PlayCircle } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails, getRelatedSeries } from "../services/tmdb";
import { ReviewSection } from "../components/ReviewSection";
import { RatingStars } from "../components/RatingStars";
import { ReviewModal } from "../components/ReviewModal";
import { ReviewEditModal } from "../components/ReviewEditModal";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SeriesReview, getSeriesReviews, deleteReview } from "../services/reviews";
import { Footer } from "../components/Footer";
import { WatchlistButton } from "../components/WatchlistButton";
import { UserReview } from "../components/UserReview";
import { SeriesCard } from "../components/SeriesCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { SeasonReview } from "../services/reviews";

export function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [existingReview, setExistingReview] = useState<SeriesReview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<number | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAllRelated, setShowAllRelated] = useState(false);
  const toast = useToast();

  const { data: series, isLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
  });

  const { data: relatedSeries, isLoading: isLoadingRelated } = useQuery({
    queryKey: ["related-series", id],
    queryFn: () => getRelatedSeries(Number(id)),
  });

  // Buscar avaliação do usuário atual
  const userReview = reviews.find(
    (review) => review.userId === currentUser?.uid
  );

  const handleDeleteReview = async () => {
    if (!userReview || seasonToDelete === null) return;

    try {
      await deleteReview(userReview.id!, seasonToDelete);
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      toast({
        title: "Avaliação excluída",
        description: "Sua avaliação foi excluída com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir sua avaliação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setSeasonToDelete(null);
    }
  };

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

              <Stack 
                direction="row"
                spacing={6} 
                align="center"
                bg="gray.800" 
                p={4} 
                borderRadius="lg"
                width="100%"
                flexWrap={{ base: "wrap", md: "nowrap" }}
                justify={{ base: "center", md: "flex-start" }}
                gap={4}
              >
                <HStack spacing={3} width="auto">
                  <Icon as={PlayCircle} color="teal.400" boxSize={5} weight="fill" />
                  <VStack spacing={0} align="start">
                    <Text color="gray.400" fontSize="sm">Temporadas</Text>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                      {series.number_of_seasons}
                    </Text>
                  </VStack>
                </HStack>

                <Divider orientation="vertical"
                        height="40px"
                        borderColor="gray.600" />
                
                <HStack spacing={3} width="auto">
                  <Icon as={Calendar} color="teal.400" boxSize={5} weight="fill" />
                  <VStack spacing={0} align="start">
                    <Text color="gray.400" fontSize="sm">Lançamento</Text>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                      {new Date(series.first_air_date).getFullYear()}
                    </Text>
                  </VStack>
                </HStack>

                <Box flex={1} />
                <WatchlistButton series={series} />
              </Stack>

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
                                review.seasonReviews
                                  .filter((sr) => sr.seasonNumber === season)
                                  .map((sr) => ({
                                    ...sr,
                                    id: review.id || '',
                                    userId: review.userId,
                                    userEmail: review.userEmail,
                                    comments: sr.comments || []
                                  }))
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
                                          <UserReview
                                            key={`${userReview.id}-${season}`}
                                            reviewId={userReview.id!}
                                            userId={userReview.userId}
                                            userEmail={userReview.userEmail}
                                            rating={userReview.seasonReviews.find(sr => sr.seasonNumber === season)?.rating || 0}
                                            comment={userReview.seasonReviews.find(sr => sr.seasonNumber === season)?.comment || ""}
                                            seasonNumber={season}
                                            comments={userReview.seasonReviews.find(sr => sr.seasonNumber === season)?.comments || []}
                                            reactions={userReview.seasonReviews.find(sr => sr.seasonNumber === season)?.reactions || { likes: [], dislikes: [] }}
                                            createdAt={userReview.seasonReviews.find(sr => sr.seasonNumber === season)?.createdAt || new Date()}
                                            onReviewUpdated={() => {
                                              queryClient.invalidateQueries({
                                                queryKey: ["reviews", id],
                                              });
                                            }}
                                          >
                                            <HStack justify="flex-end" spacing={2}>
                                              <Button
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => {
                                                  setSeasonToDelete(season);
                                                  setIsDeleteAlertOpen(true);
                                                }}
                                              >
                                                Excluir
                                              </Button>
                                              <Button
                                                size="sm"
                                                colorScheme="teal"
                                                onClick={() => {
                                                  setSelectedSeason(season);
                                                  setExistingReview(userReview);
                                                }}
                                              >
                                                Editar
                                              </Button>
                                            </HStack>
                                          </UserReview>
                                        </Box>
                                      ) : (
                                        <Box bg="gray.800" pt={2} borderRadius="lg">
                                          {currentUser ? (
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
                                          ) : (
                                            <Button
                                              colorScheme="teal"
                                              onClick={() => navigate("/login")}
                                              width="100%"
                                            >
                                              Entrar para avaliar
                                            </Button>
                                          )}
                                        </Box>
                                      )}

                                      {seasonReviews.length > 0 && (
                                        <Box>
                                          <Text color="white" fontWeight="bold" mb={2}>
                                            Avaliações dos usuários
                                          </Text>
                                          <VStack spacing={4} align="stretch">
                                            {seasonReviews
                                              .filter((review) => review.userId !== currentUser?.uid)
                                              .map((review) => (
                                                <UserReview
                                                  key={`${review.id}-${season}`}
                                                  reviewId={review.id!}
                                                  userId={review.userId}
                                                  userEmail={review.userEmail}
                                                  rating={review.rating}
                                                  comment={review.comment || ""}
                                                  seasonNumber={season}
                                                  comments={review.comments ?? []}
                                                  reactions={review.reactions || { likes: [], dislikes: [] }}
                                                  createdAt={review.createdAt}
                                                  onReviewUpdated={() => {
                                                    queryClient.invalidateQueries({
                                                      queryKey: ["reviews", id],
                                                    });
                                                  }}
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

        {/* Séries Relacionadas */}
        <Container maxW="1200px" pb={16}>
          <Heading color="white" size="xl" mb={8}>
            Séries Relacionadas
          </Heading>

          <Box>
            {isLoadingRelated ? (
              <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={6}>
                {[...Array(6)].map((_, i) => (
                  <Box key={i}>
                    <Skeleton height="300px" borderRadius="lg" />
                  </Box>
                ))}
              </SimpleGrid>
            ) : relatedSeries?.results && relatedSeries.results.length > 0 ? (
              <>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={6}>
                  {relatedSeries.results
                    .filter(relatedSeries => relatedSeries.id !== Number(id))
                    .slice(0, showAllRelated ? undefined : 6)
                    .map((series) => (
                      <Box key={series.id}>
                        <SeriesCard
                          series={series}
                          size="sm"
                        />
                      </Box>
                    ))}
                </SimpleGrid>
                {relatedSeries.results.length > 6 && (
                  <Button
                    variant="ghost"
                    color="teal.400"
                    onClick={() => setShowAllRelated(!showAllRelated)}
                    rightIcon={showAllRelated ? <CaretUp /> : <CaretDown />}
                    mt={6}
                    mx="auto"
                    display="block"
                  >
                    {showAllRelated 
                      ? "Ver menos" 
                      : `Ver mais (${relatedSeries.results.length - 6} séries)`}
                  </Button>
                )}
              </>
            ) : (
              <Text color="gray.400" textAlign="center">
                Não há séries relacionadas disponíveis.
              </Text>
            )}
          </Box>
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
            id: existingReview.id,
            userId: existingReview.userId,
            userEmail: existingReview.userEmail,
            seriesId: existingReview.seriesId,
            seasonReviews: existingReview.seasonReviews,
            series: {
              name: series?.name || '',
              poster_path: series?.poster_path || '',
            },
          }}
          initialSeasonNumber={selectedSeason}
          onReviewUpdated={() => {
            setExistingReview(null);
            queryClient.invalidateQueries({
              queryKey: ["reviews", id],
            });
          }}
        />
      )}

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setIsDeleteAlertOpen(false);
          setSeasonToDelete(null);
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Excluir avaliação
            </AlertDialogHeader>
            <AlertDialogBody color="white">
              Tem certeza que deseja excluir sua avaliação da temporada {seasonToDelete}? Esta ação não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  setIsDeleteAlertOpen(false);
                  setSeasonToDelete(null);
                }}
                variant="ghost"
                color="white"
                _hover={{ bg: "gray.700" }}
              >
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteReview}
                ml={3}
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}