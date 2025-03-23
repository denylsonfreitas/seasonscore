import {
  VStack,
  Grid,
  Flex,
  Button,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { SeriesReview } from "../../services/reviews";
import { ProfileReviewCard } from "./ProfileReviewCard";

interface ReviewsSectionProps {
  reviews: SeriesReview[];
  isLoading: boolean;
  onReviewClick: (review: SeriesReview) => void;
}

export function ReviewsSection({
  reviews,
  isLoading,
  onReviewClick,
}: ReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner color="primary.500" />
      </Flex>
    );
  }

  if (reviews.length === 0) {
    return (
      <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>
        Nenhuma avaliação ainda.
      </Text>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Grid 
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} 
        gap={6}
      >
        {reviews
          .slice(0, showAllReviews ? undefined : 6)
          .map((review) => (
            <ProfileReviewCard
              key={review.id}
              review={review}
              isExpanded={!!expandedReviews[review.id]}
              onToggleExpand={toggleReviewExpansion}
              onReviewClick={onReviewClick}
            />
          ))}
      </Grid>
      
      {reviews.length > 6 && (
        <Flex justify="center" mt={6}>
          <Button
            variant="ghost"
            colorScheme="primary"
            onClick={() => setShowAllReviews(!showAllReviews)}
            rightIcon={showAllReviews ? <CaretUp weight="bold" size={20} /> : <CaretDown weight="bold" size={20} />}
            transition="all 0.2s ease"
          >
            {showAllReviews ? "Ver Menos" : `Ver Mais (${reviews.length - 6})`}
          </Button>
        </Flex>
      )}
    </VStack>
  );
} 