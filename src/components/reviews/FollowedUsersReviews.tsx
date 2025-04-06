import { Box, VStack, Text, HStack, Grid, Icon, useDisclosure, Badge, Center, LinkBox } from "@chakra-ui/react";
import { useState } from "react";
import { getRecentFollowedUsersReviews, PopularReview, getSeriesReviews } from "../../services/reviews";
import { Heart, TelevisionSimple } from "@phosphor-icons/react";
import { RatingStars } from "../common/RatingStars";
import { UserAvatar } from "../common/UserAvatar";
import { ReviewDetailsModal } from "./ReviewDetailsModal";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getSeriesDetails } from "../../services/tmdb";
import { UserName } from "../common/UserName";
import { useAuth } from "../../contexts/AuthContext";
import { LazyImage } from "../common/LazyImage";
import { SectionBase } from "../common/SectionBase";

export function FollowedUsersReviews() {
  const [selectedReview, setSelectedReview] = useState<PopularReview | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["followedUsersReviews"],
    queryFn: () => getRecentFollowedUsersReviews(12),
    enabled: !!currentUser,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const { data: selectedSeries } = useQuery({
    queryKey: ["series", selectedReview?.seriesId],
    queryFn: () => getSeriesDetails(selectedReview?.seriesId || 0),
    enabled: !!selectedReview?.seriesId
  });

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

  const currentReview = selectedReview && seriesReviews.length > 0
    ? seriesReviews.find(r => r.id === selectedReview.id)
    : null;

  const seasonReview = currentReview?.seasonReviews.find(
    sr => sr.seasonNumber === selectedReview?.seasonNumber
  );

  const handleReviewUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: ["reviews", selectedReview?.seriesId],
    });
    
    queryClient.invalidateQueries({
      queryKey: ["followedUsersReviews"],
    });
  };

  // Componente de carregamento
  const loadingElement = (
    <Grid 
      templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} 
      gap={6}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Box
          key={i}
          bg="gray.800"
          p={4}
          borderRadius="lg"
          height="300px"
        />
      ))}
    </Grid>
  );

  // Componente para mensagem quando o usuário não está logado
  const emptyElement = !currentUser ? (
    <Box 
      bg="gray.800" 
      p={6} 
      borderRadius="lg" 
      textAlign="center"
    >
      <Text color="gray.400">
        Faça login para ver avaliações de usuários que você segue.
      </Text>
    </Box>
  ) : (
    <Box 
      bg="gray.800" 
      p={6} 
      borderRadius="lg" 
      textAlign="center"
    >
      <Text color="gray.400">
        Você ainda não tem avaliações de usuários seguidos. Comece a seguir usuários para ver suas avaliações aqui.
      </Text>
    </Box>
  );

  // Renderizar o conteúdo
  const renderContent = (limitItems: boolean) => {
    const displayedReviews = limitItems ? reviews.slice(0, 6) : reviews;
    
    return (
      <Grid 
        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} 
        gap={4}
      >
        {displayedReviews.map((review) => (
          <Box
            key={review.id}
            as={LinkBox}
            bg="gray.800"
            borderRadius="lg"
            overflow="hidden"
            transition="transform 0.2s"
            _hover={{ transform: "translateY(-4px)" }}
            cursor="pointer"
            onClick={() => handleReviewClick(review)}
            h="225px"
            position="relative"
          >
            {review.seriesPoster ? (
              <LazyImage
                src={`https://image.tmdb.org/t/p/w500${review.seriesPoster}`}
                alt={review.seriesName}
                height="100%"
                width="100%"
                objectFit="cover"
                fallbackText="Imagem não disponível"
                onClick={(e) => handlePosterClick(e, review.seriesId)}
              />
            ) : (
              <Center height="100%" py={4} px={2} bg="gray.700" position="relative">
                <VStack spacing={2} align="center" justify="center">
                  <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
                  <Text color="white" fontSize="md" fontWeight="bold" textAlign="center" noOfLines={2}>
                    {review.seriesName}
                  </Text>
                </VStack>
              </Center>
            )}

            {/* Overlay na parte inferior do card */}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg="rgba(0, 0, 0, 0.7)"
              p={3}
              borderBottomRadius="lg"
            >
              <VStack align="start" spacing={1}>
                <HStack justify="space-between" width="100%">
                  <HStack spacing={2} align="center">
                    <UserAvatar
                      size="xs"
                      photoURL={review.userAvatar}
                      name={review.userName}
                      userId={review.userId}
                    />
                    <UserName userId={review.userId} />
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={Heart} weight="fill" color="red.500" />
                    <Text color="white" fontSize="xs">{review.likes}</Text>
                  </HStack>
                </HStack>
                
                <HStack justify="space-between" width="100%">
                  <RatingStars rating={review.rating} size={16} showNumber={false} />
                </HStack>
              </VStack>
            </Box>
            
            {/* Badge para mostrar a temporada */}
            <Badge
              position="absolute"
              top={3}
              right={3}
              colorScheme="purple"
              borderRadius="md"
            >
              T{review.seasonNumber}
            </Badge>
          </Box>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <SectionBase
        title="Quem você segue avaliou"
        link="/reviews"
        linkText="Ver todas"
        isLoading={isLoading}
        isEmpty={!currentUser || reviews.length === 0}
        emptyElement={emptyElement}
        loadingElement={loadingElement}
        expandable={reviews.length > 6}
        renderContent={renderContent}
      />

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
            reactions: { 
              likes: [],
            },
            createdAt: seasonReview?.createdAt || selectedReview.createdAt
          }}
          onReviewUpdated={handleReviewUpdated}
        />
      )}
    </>
  );
} 