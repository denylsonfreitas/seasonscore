import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Flex,
  HStack,
  VStack,
  Spinner,
  Center,
  Image,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
  Link as ChakraLink,
  Badge,
  Icon,
  Divider,
  Select,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useParams, Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Footer } from "../components/common/Footer";
import { getSeriesDetails } from "../services/tmdb";
import { getSeriesReviews, SeriesReview, getUserReview } from "../services/reviews";
import { RatingStars } from "../components/common/RatingStars";
import { UserAvatar } from "../components/common/UserAvatar";
import { UserName } from "../components/common/UserName";
import { ReactionButtons } from "../components/reviews/ReactionButtons";
import { useAuth } from "../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, ChatCircle, Heart, ArrowLeft } from "@phosphor-icons/react";
import { PageHeader } from "../components/common/PageHeader";
import { useQuery } from "@tanstack/react-query";

export function SeriesReviews() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSeason, setSelectedSeason] = useState(
    Number(searchParams.get("season")) || 1
  );
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  
  const starSize = useBreakpointValue({ base: 16, md: 20 });
  
  const { data: series, isLoading: isLoadingSeries, isError: isSeriesError } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
  });
  
  const [reviews, setReviews] = useState<SeriesReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  
  // Buscar detalhes da série e avaliações
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setIsLoadingReviews(true);
      try {
        // Buscar avaliações da série
        const reviewsData = await getSeriesReviews(parseInt(id));
        setReviews(reviewsData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da série e avaliações",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingReviews(false);
      }
    };
    
    fetchData();
  }, [id, toast]);
  
  // Manipular clique na avaliação
  const handleReviewClick = (review: SeriesReview, seasonNumber: number) => {
    navigate(`/reviews/${review.id}/${seasonNumber}`);
  };
  
  // Filtrar avaliações por temporada
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => 
      review.seasonReviews.some(seasonReview => 
        seasonReview.seasonNumber === selectedSeason
      )
    );
  }, [reviews, selectedSeason]);
  
  // Obter temporadas únicas
  const seasons = useMemo(() => {
    const allSeasons = reviews.flatMap(review => 
      review.seasonReviews.map(season => season.seasonNumber)
    );
    return [...new Set(allSeasons)].sort((a, b) => a - b);
  }, [reviews]);
  
  // Verificar se o usuário já fez avaliação para esta temporada
  const userHasReviewed = useMemo(() => {
    if (!currentUser) return false;
    
    return reviews.some(review => 
      review.userId === currentUser.uid && 
      review.seasonReviews.some(sr => sr.seasonNumber === selectedSeason)
    );
  }, [reviews, currentUser, selectedSeason]);
  
  // Ordenar avaliações (mais recentes primeiro)
  const sortedReviews = useMemo(() => {
    return [...filteredReviews].sort((a, b) => {
      const aDate = a.seasonReviews.find(sr => sr.seasonNumber === selectedSeason)?.createdAt;
      const bDate = b.seasonReviews.find(sr => sr.seasonNumber === selectedSeason)?.createdAt;
      
      if (!aDate || !bDate) return 0;
      
      // Converter para timestamp se necessário
      const aTime = aDate instanceof Date ? aDate.getTime() : 
        ('seconds' in aDate ? aDate.seconds * 1000 : 0);
      const bTime = bDate instanceof Date ? bDate.getTime() : 
        ('seconds' in bDate ? bDate.seconds * 1000 : 0);
      
      return bTime - aTime;
    });
  }, [filteredReviews, selectedSeason]);

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
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
              bgImage={`url(https://image.tmdb.org/t/p/original${series?.backdrop_path || ''})`}
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
        <Container maxW="container.lg" position="relative" mt="-200px" pb={10}>
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center" p={6} borderRadius="lg">
              <Heading color="white" size="lg">
                Avaliações de {series?.name || 'Série'}
              </Heading>
              <HStack spacing={2} mr={6}>
                <Text color="gray.400" fontWeight="medium">
                  Temporada:
                </Text>
                <Select
                  value={selectedSeason}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const season = Number(e.target.value);
                    setSelectedSeason(season);
                  }}
                  width="auto"
                  borderColor="gray.600"
                  _hover={{ borderColor: "gray.500" }}
                >
                  {seasons.map((season) => (
                    <option key={season} value={season} style={{ backgroundColor: "#2D3748" }}>
                      Temporada {season}
                    </option>
                  ))}
                </Select>
              </HStack>
            </HStack>

            <VStack spacing={4} align="stretch">
              {sortedReviews.length > 0 ? (
                sortedReviews.map((review) => (
                  <Box
                    key={`${review.id}-${selectedSeason}`}
                    bg="gray.800"
                    p={{ base: 4, md: 6 }}
                    borderRadius="lg"
                    cursor="pointer"
                    onClick={() => {
                      // Redirecionar para a página de detalhes da avaliação
                      navigate(`/reviews/${review.id}/${selectedSeason}`);
                    }}
                    _hover={{ bg: "gray.700" }}
                    position="relative"
                  >
                    <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between" align="start">
                        <HStack spacing={4} flex={1}>
                          <UserAvatar
                            userId={review.userId}
                            userEmail={review.userEmail}
                            photoURL={undefined}
                            size="md"
                          />
                          <VStack align="start" spacing={2} flex={1}>
                            <UserName userId={review.userId} />
                            <Text 
                              color="gray.300"
                              fontSize={{ base: "sm", md: "md" }}
                              width="full"
                              whiteSpace="pre-wrap"
                              wordBreak="break-word"
                              maxW="100%"
                              overflowWrap="break-word"
                            >
                              {review.seasonReviews.find(sr => sr.seasonNumber === selectedSeason)?.comment}
                            </Text>
                          </VStack>
                        </HStack>
                        <Box>
                          <RatingStars
                            rating={review.seasonReviews.find(sr => sr.seasonNumber === selectedSeason)?.rating || 0}
                            size={20}
                            showNumber={false}
                          />
                        </Box>
                      </HStack>

                      <HStack spacing={4} pl={{ base: 12, md: 16 }}>
                        <ReactionButtons
                          reviewId={review.id}
                          seasonNumber={selectedSeason}
                          likes={review.seasonReviews.find(sr => sr.seasonNumber === selectedSeason)?.reactions?.likes || []}
                          onReaction={async (event) => {
                            // Implemente a lógica para reagir à avaliação
                          }}
                          isLoading={false}
                        />
                        <Divider borderColor="gray.600" orientation="vertical" height="20px" display={{ base: "none", md: "flex" }} />
                        <HStack>
                          <Text color="gray.400" fontSize="sm">
                            {review.seasonReviews.find(sr => sr.seasonNumber === selectedSeason)?.comments?.length || 0} comentários
                          </Text>
                        </HStack>
                      </HStack>
                    </VStack>
                  </Box>
                ))
              ) : (
                <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                  <Text color="gray.400">
                    Nenhuma avaliação encontrada para esta temporada.
                  </Text>
                </Box>
              )}
            </VStack>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
} 