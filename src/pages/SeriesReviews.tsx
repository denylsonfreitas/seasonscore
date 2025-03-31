import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Select,
  Flex,
  Spinner,
  useDisclosure,
  useBreakpointValue,
  Center,
  IconButton,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { useParams, useSearchParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails } from "../services/tmdb";
import { getSeriesReviews, toggleReaction } from "../services/reviews";
import { RatingStars } from "../components/common/RatingStars";
import { UserName } from "../components/common/UserName";
import { ReviewDetailsModal } from "../components/reviews/ReviewDetailsModal";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useUsersData } from "../hooks/useUsersData";
import { useAuth } from "../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { ReactionButtons } from "../components/reviews/ReactionButtons";
import { Footer } from "../components/common/Footer";
import { UserAvatar } from "../components/common/UserAvatar";
import { FieldValue } from "firebase/firestore";

export function SeriesReviews() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSeason, setSelectedSeason] = useState(
    Number(searchParams.get("season")) || 1
  );
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const starSize = useBreakpointValue({ base: 16, md: 20 });

  const { data: series, isLoading: isLoadingSeries, isError: isSeriesError } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
  });

  // Adicionar redirecionamento para página 404 quando série não for encontrada
  useEffect(() => {
    if (!isLoadingSeries && !series && isSeriesError) {
      navigate('/404', { replace: true });
    }
  }, [isLoadingSeries, series, isSeriesError, navigate]);

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const seasonReviews = reviews.flatMap((review) =>
    review.seasonReviews
      .filter((sr) => sr.seasonNumber === selectedSeason)
      .map((sr) => ({
        ...sr,
        id: review.id || "",
        userId: review.userId,
        userEmail: review.userEmail,
        comments: sr.comments || [],
        createdAt: sr.createdAt || new Date()
      }))
  );

  const sortedReviews = [...seasonReviews].sort((a, b) => {
    // Primeiro por número de likes
    const likesComparison = (b.reactions?.likes?.length || 0) - (a.reactions?.likes?.length || 0);
    if (likesComparison !== 0) return likesComparison;
    
    // Depois por data de criação (mais recentes primeiro)
    const dateA = a.createdAt instanceof Date 
      ? a.createdAt 
      : 'seconds' in a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date();
    const dateB = b.createdAt instanceof Date 
      ? b.createdAt 
      : 'seconds' in b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date();
    return dateB.getTime() - dateA.getTime();
  });

  // Buscar dados de todos os usuários de uma vez
  const userIds = useMemo(() => [...new Set(sortedReviews.map(review => review.userId))], [sortedReviews]);
  const { usersData, isLoading: isLoadingUsers } = useUsersData(userIds);

  // Usar useMemo para atualizar o selectedReview
  const selectedReview = useMemo(() => {
    if (!selectedReviewId || !reviews.length) return null;

    const review = reviews.find(r => r.id === selectedReviewId);
    if (!review) return null;

    const seasonReview = review.seasonReviews.find(sr => sr.seasonNumber === selectedSeason);
    if (!seasonReview) return null;

    return {
      ...seasonReview,
      id: review.id,
      userId: review.userId,
      userEmail: review.userEmail
    };
  }, [selectedReviewId, reviews, selectedSeason]);

  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleReaction = useCallback(async (reviewId: string, seasonNumber: number, type: "likes" | "dislikes", event: React.MouseEvent) => {
    event.stopPropagation(); // Impedir que abra o modal

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para reagir a uma avaliação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await toggleReaction(reviewId, seasonNumber, type);
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua reação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [currentUser, id, queryClient, toast]);

  if (isLoadingSeries || isLoadingReviews || isLoadingUsers) {
    return (
      <Center minH="70vh">
        <Spinner size="xl" color="primary.500" />
      </Center>
    );
  }

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
        <Container maxW="1200px" position="relative" mt="-200px">
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center" p={6} borderRadius="lg">
              <Heading color="white" size="lg">
                Avaliações de {series?.name || 'Série'}
              </Heading>
              <Select
                value={selectedSeason}
                onChange={(e) => {
                  const season = Number(e.target.value);
                  setSelectedSeason(season);
                  setSearchParams({ season: season.toString() });
                }}
                width="auto"
                bg="gray.700"
                color="white"
                borderColor="gray.600"
                _hover={{ borderColor: "gray.500" }}
              >
                {Array.from({ length: series?.number_of_seasons || 1 }, (_, i) => i + 1).map(
                  (season) => (
                    <option key={season} value={season} style={{ backgroundColor: "#2D3748" }}>
                      Temporada {season}
                    </option>
                  )
                )}
              </Select>
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
                      setSelectedReviewId(review.id);
                      onOpen();
                    }}
                    _hover={{ bg: "gray.700" }}
                  >
                    <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between" align="start">
                        <HStack spacing={4} flex={1}>
                          <UserAvatar
                            userId={review.userId}
                            userEmail={review.userEmail}
                            photoURL={usersData[review.userId]?.photoURL}
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
                              {review.comment}
                            </Text>
                          </VStack>
                        </HStack>
                        <Box>
                          <RatingStars
                            rating={review.rating}
                            size={starSize}
                            showNumber={false}
                          />
                        </Box>
                      </HStack>

                      <HStack spacing={4} pl={{ base: 12, md: 16 }}>
                        <ReactionButtons 
                          reviewId={review.id}
                          seasonNumber={selectedSeason}
                          likes={review.reactions?.likes || []}
                          dislikes={review.reactions?.dislikes || []}
                          onReaction={handleReaction}
                        />
                        <Divider borderColor="gray.600" orientation="vertical" height="20px" display={{ base: "none", md: "flex" }} />
                        <HStack>
                          <Text color="gray.400" fontSize="sm">
                            {review.comments?.length || 0} comentários
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

      {selectedReview && (
        <ReviewDetailsModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedReviewId(null);
          }}
          review={{
            id: selectedReview.id!,
            seriesId: id!,
            userId: selectedReview.userId!,
            userEmail: selectedReview.userEmail!,
            seriesName: series?.name || "Série desconhecida",
            seriesPoster: series?.poster_path || "",
            seasonNumber: selectedSeason,
            rating: selectedReview.rating || 0,
            comment: selectedReview.comment || "",
            comments: selectedReview.comments || [],
            reactions: selectedReview.reactions || { likes: [], dislikes: [] },
            createdAt: selectedReview.createdAt || new Date()
          }}
          onReviewUpdated={() => {}}
        />
      )}
    </Flex>
  );
} 