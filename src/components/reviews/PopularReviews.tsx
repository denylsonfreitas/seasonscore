import { Box, Heading, VStack, Text, Avatar, HStack, Flex, Grid, Image, Icon, useDisclosure, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getPopularReviews, PopularReview, getSeriesReviews } from "../../services/reviews";
import { Heart, CaretDown } from "@phosphor-icons/react";
import { RatingStars } from "../common/RatingStars";
import { UserName } from "../common/UserName";
import { ReviewDetailsModal } from "./ReviewDetailsModal";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getSeriesDetails } from "../../services/tmdb";

export function PopularReviews() {
  const [selectedReview, setSelectedReview] = useState<PopularReview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ["popularReviews"],
    queryFn: getPopularReviews,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Buscar detalhes da série selecionada
  const { data: selectedSeries } = useQuery({
    queryKey: ["series", selectedReview?.seriesId],
    queryFn: () => getSeriesDetails(selectedReview?.seriesId || 0),
    enabled: !!selectedReview?.seriesId
  });

  // Buscar reviews atualizadas da série
  const { data: seriesReviews = [] } = useQuery({
    queryKey: ["reviews", selectedReview?.seriesId],
    queryFn: () => getSeriesReviews(selectedReview?.seriesId || 0),
    enabled: !!selectedReview?.seriesId,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const handleReviewClick = (review: PopularReview) => {
    setSelectedReview(review);
    onOpen();
  };

  const handlePosterClick = (e: React.MouseEvent, seriesId: number) => {
    e.stopPropagation();
    navigate(`/series/${seriesId}`);
  };

  // Encontrar a review atualizada
  const currentReview = selectedReview && seriesReviews.length > 0
    ? seriesReviews.find(r => r.id === selectedReview.id)
    : null;

  const seasonReview = currentReview?.seasonReviews.find(
    sr => sr.seasonNumber === selectedReview?.seasonNumber
  );

  // Filtrar reviews com pelo menos 1 like
  const popularReviews = reviews.filter(review => review.likes > 0);
  const displayedReviews = isExpanded ? popularReviews : popularReviews.slice(0, 6);

  // Função para atualizar dados após mudanças
  const handleReviewUpdated = () => {
    // Invalidar ambas as queries para garantir dados atualizados
    queryClient.invalidateQueries({
      queryKey: ["reviews", selectedReview?.seriesId],
    });
    
    queryClient.invalidateQueries({
      queryKey: ["popularReviews"],
    });
  };

  return (
    <Box mt={12}>
      <Heading color="white" size="lg" mb={6}>
        Avaliações Populares da Semana
      </Heading>
      
      {popularReviews.length === 0 ? (
        <Box 
          bg="gray.800" 
          p={6} 
          borderRadius="lg" 
          textAlign="center"
        >
          <Text color="gray.400">
            Nenhuma avaliação popular esta semana. Seja o primeiro a avaliar uma série!
          </Text>
        </Box>
      ) : (
        <>
          <Grid 
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} 
            gap={6}
          >
            {displayedReviews.map((review) => (
              <Box
                key={review.id}
                bg="gray.800"
                p={4}
                borderRadius="lg"
                _hover={{ transform: "translateY(-2px)", transition: "all 0.2s ease" }}
                cursor="pointer"
                onClick={() => handleReviewClick(review)}
              >
                <Flex gap={4} mb={4}>
                  <Image
                    src={review.seriesPoster 
                      ? `https://image.tmdb.org/t/p/w92${review.seriesPoster}`
                      : "https://dummyimage.com/92x138/ffffff/000000.png&text=No+Image"
                    }
                    alt={review.seriesName}
                    w="80px"
                    h="120px"
                    objectFit="cover"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={(e) => handlePosterClick(e, review.seriesId)}
                    _hover={{ transform: "scale(1.05)", transition: "transform 0.2s ease" }}
                  />
                  <VStack align="start" spacing={1} flex="1">
                    <HStack>
                      <Avatar size="sm" src={review.userAvatar} name={review.userName} />
                      <UserName userId={review.userId} />
                    </HStack>
                    <Text color="white" fontSize="md" fontWeight="bold">
                      {review.seriesName}
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Temporada {review.seasonNumber}
                    </Text>
                    <RatingStars rating={review.rating} size={16} showNumber={false} />
                  </VStack>
                </Flex>

                <Text color="gray.300" fontSize="sm" mb={3} noOfLines={3}>
                  {review.comment}
                </Text>

                <HStack spacing={4} color="gray.400" fontSize="sm">
                  <HStack spacing={1}>
                    <Icon as={Heart} weight="fill" />
                    <Text>{review.likes}</Text>
                  </HStack>
                  <Text color="gray.500" fontSize="xs">
                    {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                  </Text>
                </HStack>
              </Box>
            ))}
          </Grid>

          {popularReviews.length > 6 && (
            <Flex justify="center" mt={6}>
              <Button
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={() => setIsExpanded(!isExpanded)}
                rightIcon={<CaretDown weight="bold" size={20} />}
                _hover={{ bg: "whiteAlpha.200" }}
                transform={isExpanded ? "rotate(180deg)" : "none"}
                transition="all 0.2s ease"
              >
                {isExpanded ? "Ver Menos" : "Ver Mais"}
              </Button>
            </Flex>
          )}
        </>
      )}

      {selectedReview && selectedSeries && (
        <ReviewDetailsModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedReview(null);
          }}
          review={{
            id: selectedReview.id,
            seriesId: selectedReview.seriesId.toString(),
            userId: selectedReview.userId,
            userEmail: selectedReview.userName,
            seriesName: selectedSeries.name,
            seriesPoster: selectedSeries.poster_path || "",
            seasonNumber: selectedReview.seasonNumber,
            rating: seasonReview?.rating || selectedReview.rating,
            comment: seasonReview?.comment || selectedReview.comment,
            comments: seasonReview?.comments || [],
            reactions: seasonReview?.reactions || {
              likes: [],
              dislikes: []
            },
            createdAt: seasonReview?.createdAt || selectedReview.createdAt
          }}
          onReviewUpdated={handleReviewUpdated}
        />
      )}
    </Box>
  );
} 