import { Box } from "@chakra-ui/react";
import { ReactionButton } from "../common/ReactionButton";

interface ReactionButtonsProps {
  reviewId: string;
  seasonNumber: number;
  likes: string[];
  onReaction: (reviewId: string, seasonNumber: number, type: "likes", event: React.MouseEvent) => void;
  isLoading?: boolean;
}

export function ReactionButtons({ 
  reviewId, 
  seasonNumber, 
  likes = [], 
  onReaction,
  isLoading = false
}: ReactionButtonsProps) {
  return (
    <Box>
      <ReactionButton
        likes={likes}
        onReaction={(e) => onReaction(reviewId, seasonNumber, "likes", e)}
        tooltipText="Curtir essa avaliação"
        isLoading={isLoading}
      />
    </Box>
  );
} 