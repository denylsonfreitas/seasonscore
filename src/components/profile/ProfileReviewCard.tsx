import {
  Box,
  Text,
  Image,
  Flex,
  HStack,
  Badge,
  AspectRatio,
  Tooltip,
} from "@chakra-ui/react";
import { SeriesReview } from "../../services/reviews";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useMemo } from "react";
import { formatRating } from "../../utils/format";

interface ProfileReviewCardProps {
  review: SeriesReview;
  onReviewClick: (review: SeriesReview) => void;
}

export function ProfileReviewCard({
  review,
  onReviewClick,
}: ProfileReviewCardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Calcular a média das avaliações de todas as temporadas
  const averageRating = useMemo(() => {
    if (!review.seasonReviews.length) return 0;
    
    const sum = review.seasonReviews.reduce(
      (acc, season) => acc + season.rating,
      0
    );
    return sum / review.seasonReviews.length;
  }, [review.seasonReviews]);

  const handleReviewClick = (seasonNumber: number) => {
    // Criar uma cópia da review com apenas a temporada selecionada para mostrar detalhes
    const reviewWithSingleSeason = {
      ...review,
      selectedSeasonNumber: seasonNumber
    };
    onReviewClick(reviewWithSingleSeason);
  };

  return (
    <Box 
      bg="gray.800" 
      borderRadius="md" 
      overflow="hidden"
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "lg",
        bg: "gray.700",
      }}
    >
      <AspectRatio ratio={16 / 9} maxH="150px">
        <Image
          src={review.series.poster_path 
            ? `https://image.tmdb.org/t/p/w500${review.series.poster_path}` 
            : "/images/poster-placeholder.png"}
          alt={review.series.name}
          objectFit="cover"
          w="100%"
          h="100%"
          transition="transform 0.3s ease"
          _hover={{ transform: "scale(1.05)" }}
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/series/${review.seriesId}`);
          }}
        />
      </AspectRatio>

      <Box p={4}>
        <Flex justify="space-between" align="start" mb={2}>
          <Text
            fontWeight="bold"
            fontSize="md"
            noOfLines={1}
            color="white"
            transition="color 0.2s"
            _hover={{ color: "primary.300" }}
            cursor="pointer"
            onClick={() => navigate(`/series/${review.seriesId}`)}
          >
            {review.series.name}
          </Text>
          <Tooltip 
            label={`Média: ${formatRating(averageRating)}`} 
            placement="top"
            hasArrow
          >
            <Text fontWeight="bold" color="primary.400">
              {formatRating(averageRating)}
            </Text>
          </Tooltip>
        </Flex>

        <HStack spacing={2} wrap="wrap" mb={3}>
          <Badge colorScheme="primary">
            {review.seasonReviews.length} temporada{review.seasonReviews.length !== 1 ? 's' : ''}
          </Badge>
        </HStack>

        <HStack spacing={2} wrap="wrap">
          {review.seasonReviews.map((seasonReview) => (
            <Box 
              key={seasonReview.seasonNumber} 
              onClick={() => handleReviewClick(seasonReview.seasonNumber)}
              bg="gray.700"
              px={2}
              py={1}
              borderRadius="md"
              fontSize="xs"
              color="white"
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{
                bg: "primary.500",
                transform: "scale(1.05)"
              }}
            >
              <HStack spacing={3.5}>
                <Text>T{seasonReview.seasonNumber}</Text>
                <Text color="primary.300" fontWeight="bold">
                  {formatRating(seasonReview.rating)}
                </Text>
              </HStack>
            </Box>
          ))}
        </HStack>
      </Box>
    </Box>
  );
} 