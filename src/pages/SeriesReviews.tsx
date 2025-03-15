import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Avatar,
  Text,
  Select,
  Flex,
  Spinner,
  useDisclosure,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails } from "../services/tmdb";
import { getSeriesReviews } from "../services/reviews";
import { RatingStars } from "../components/RatingStars";
import { UserName } from "../components/UserName";
import { ReviewDetailsModal } from "../components/ReviewDetailsModal";
import { useState, useMemo } from "react";
import { useUsersData } from "../hooks/useUsersData";
import { Heart, HeartBreak } from "@phosphor-icons/react";

export function SeriesReviews() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSeason, setSelectedSeason] = useState(
    Number(searchParams.get("season")) || 1
  );
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const starSize = useBreakpointValue({ base: 16, md: 20 });

  const { data: series, isLoading: isLoadingSeries } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
  });

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
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt.seconds * 1000);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt.seconds * 1000);
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

  if (isLoadingSeries || isLoadingReviews || isLoadingUsers) {
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
        <Container maxW="1200px" position="relative" mt="-200px">
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="center" p={6} borderRadius="lg">
              <Heading color="white" size="lg">
                Avaliações de {series.name}
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
                {Array.from({ length: series.number_of_seasons }, (_, i) => i + 1).map(
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
                          <Avatar
                            size={{ base: "sm", md: "md" }}
                            name={review.userEmail}
                            src={usersData[review.userId]?.photoURL || undefined}
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
                        <HStack>
                          <Heart 
                            size={18}
                            weight={(review.reactions?.likes?.length || 0) > 0 ? "fill" : "regular"}
                            color={(review.reactions?.likes?.length || 0) > 0 ? "#E53E3E" : "#A0AEC0"}
                          />
                          <Text color="gray.400" fontSize="sm">
                            {review.reactions?.likes?.length || 0}
                          </Text>
                        </HStack>

                        <HStack>
                          <HeartBreak 
                            size={18}
                            weight={(review.reactions?.dislikes?.length || 0) > 0 ? "fill" : "regular"}
                            color={(review.reactions?.dislikes?.length || 0) > 0 ? "#E53E3E" : "#A0AEC0"}
                          />
                          <Text color="gray.400" fontSize="sm">
                            {review.reactions?.dislikes?.length || 0}
                          </Text>
                        </HStack>

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
            seriesName: series.name,
            seriesPoster: series.poster_path || "",
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