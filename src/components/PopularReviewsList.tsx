import { VStack } from "@chakra-ui/react";
import { ReviewListItem } from "./ReviewListItem";
import { SeriesReview } from "../services/reviews";

interface PopularReviewsListProps {
  reviews: SeriesReview[];
  currentUserId?: string;
  season: number;
  onReviewClick: (review: any) => void;
}

export function PopularReviewsList({ reviews, currentUserId, season, onReviewClick }: PopularReviewsListProps) {
  const popularReviews = reviews
    .flatMap((review) =>
      review.seasonReviews
        .filter((sr) => sr.seasonNumber === season)
        .map((sr) => ({
          ...sr,
          id: review.id || "",
          userId: review.userId,
          userEmail: review.userEmail,
          comments: sr.comments || [],
        }))
    )
    .filter((review) => review.userId !== currentUserId)
    .sort((a, b) => (b.reactions?.likes?.length || 0) - (a.reactions?.likes?.length || 0))
    .slice(0, 3);

  return (
    <VStack spacing={4} align="stretch">
      {popularReviews.map((review) => (
        <ReviewListItem
          key={`${review.id}-${season}`}
          userId={review.userId}
          userEmail={review.userEmail}
          rating={review.rating}
          comment={review.comment}
          onClick={() => onReviewClick(review)}
        />
      ))}
    </VStack>
  );
} 