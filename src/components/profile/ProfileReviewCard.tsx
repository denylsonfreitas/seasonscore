import {
  Box,
  Text,
  Image,
  Flex,
  VStack,
  HStack,
  Button,
  Avatar,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { RatingStars } from "../common/RatingStars";
import { UserName } from "../common/UserName";
import { Heart, CaretUp, CaretDown } from "@phosphor-icons/react";
import { SeriesReview } from "../../services/reviews";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface ProfileReviewCardProps {
  review: SeriesReview;
  isExpanded: boolean;
  onToggleExpand: (reviewId: string) => void;
  onReviewClick: (review: SeriesReview) => void;
}

export function ProfileReviewCard({
  review,
  isExpanded,
  onToggleExpand,
  onReviewClick,
}: ProfileReviewCardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Sempre mostrar a primeira avaliação de temporada
  const firstSeasonReview = review.seasonReviews[0];
  
  const formatDate = (date: Date | { seconds: number }) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return new Date(date.seconds * 1000).toLocaleDateString();
  };

  return (
    <Box
      bg="gray.800"
      p={4}
      borderRadius="lg"
      cursor="pointer"
      onClick={() => onReviewClick(review)}
      _hover={{ transform: "translateY(-2px)", transition: "all 0.2s ease" }}
    >
      <Flex gap={4} mb={4}>
        <Image
          src={`https://image.tmdb.org/t/p/w92${review.series.poster_path}`}
          alt={review.series.name}
          w="80px"
          h="120px"
          objectFit="cover"
          borderRadius="md"
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/series/${review.seriesId}`);
          }}
          _hover={{ transform: "scale(1.05)", transition: "transform 0.2s ease" }}
          fallbackSrc="https://dummyimage.com/92x138/ffffff/000000.png&text=No+Image"
        />
        <VStack align="start" spacing={1} flex="1">
          <HStack>
            <Avatar 
              size="sm" 
              src={currentUser?.photoURL || undefined} 
              name={currentUser?.displayName || undefined} 
            />
            <UserName userId={review.userId} />
          </HStack>
          <Text color="white" fontSize="md" fontWeight="bold">
            {review.series.name}
          </Text>
          <Text color="gray.400" fontSize="sm">
            Temporada {firstSeasonReview.seasonNumber}
          </Text>
          <RatingStars rating={firstSeasonReview.rating} size={16} showNumber={false} />
        </VStack>
      </Flex>

      <Text color="gray.300" fontSize="sm" mb={3} noOfLines={3}>
        {firstSeasonReview.comment}
      </Text>

      <HStack spacing={4} color="gray.400" fontSize="sm">
        {firstSeasonReview.reactions && (
          <HStack spacing={2}>
            <Icon as={Heart} weight="fill" color="gray.400" />
            <Text>{firstSeasonReview.reactions.likes?.length || 0}</Text>
          </HStack>
        )}
        <Text color="gray.500" fontSize="xs">
          {formatDate(firstSeasonReview.createdAt)}
        </Text>
      </HStack>
      
      {review.seasonReviews.length > 1 && (
        <Button
          variant="ghost"
          size="xs"
          color="primary.400"
          mt={2}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(review.id);
          }}
        >
          {isExpanded
            ? "Menos temporadas"
            : `+${review.seasonReviews.length - 1} temporada${
                review.seasonReviews.length - 1 > 1 ? "s" : ""
              }`}
        </Button>
      )}

      {isExpanded && review.seasonReviews.length > 1 && (
        <VStack mt={4} spacing={4} align="start">
          <Divider borderColor="gray.700" />
          {review.seasonReviews.slice(1).map((otherSeason) => (
            <Box key={`${review.id}_${otherSeason.seasonNumber}_expanded`} width="100%">
              <HStack justify="space-between" mb={1}>
                <Text color="gray.400" fontSize="sm">
                  Temporada {otherSeason.seasonNumber}
                </Text>
                <RatingStars rating={otherSeason.rating} size={14} showNumber={false} />
              </HStack>
              {otherSeason.comment && (
                <Text color="gray.300" fontSize="sm" mb={1}>
                  {otherSeason.comment}
                </Text>
              )}
              <Text color="gray.500" fontSize="xs">
                {formatDate(otherSeason.createdAt)}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
} 