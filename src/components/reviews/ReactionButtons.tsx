import { HStack, IconButton, Text } from "@chakra-ui/react";
import { Heart, HeartBreak } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";

interface ReactionButtonsProps {
  reviewId: string;
  seasonNumber: number;
  likes: string[];
  dislikes: string[];
  onReaction: (reviewId: string, seasonNumber: number, type: "likes" | "dislikes", event: React.MouseEvent) => void;
}

export function ReactionButtons({ 
  reviewId, 
  seasonNumber, 
  likes = [], 
  dislikes = [], 
  onReaction 
}: ReactionButtonsProps) {
  const { currentUser } = useAuth();
  
  const userLiked = currentUser && likes.includes(currentUser.uid);
  const userDisliked = currentUser && dislikes.includes(currentUser.uid);

  return (
    <>
      <HStack>
        <IconButton
          aria-label="Like"
          icon={<Heart weight={userLiked ? "fill" : "regular"} />}
          size="sm"
          variant="ghost"
          color={userLiked ? "reactions.like" : "gray.400"}
          onClick={(e) => onReaction(reviewId, seasonNumber, "likes", e)}
          _hover={{ 
            bg: "transparent", 
            color: "reactions.like",
            transform: "scale(1.1)",
            transition: "all 0.2s ease"
          }}
        />
        <Text color="gray.400" fontSize="sm">
          {likes.length || 0}
        </Text>
      </HStack>

      <HStack>
        <IconButton
          aria-label="Dislike"
          icon={<HeartBreak weight={userDisliked ? "fill" : "regular"} />}
          size="sm"
          variant="ghost"
          color={userDisliked ? "reactions.dislike" : "gray.400"}
          onClick={(e) => onReaction(reviewId, seasonNumber, "dislikes", e)}
          _hover={{ 
            bg: "transparent", 
            color: "reactions.dislike",
            transform: "scale(1.1)",
            transition: "all 0.2s ease"
          }}
        />
        <Text color="gray.400" fontSize="sm">
          {dislikes.length || 0}
        </Text>
      </HStack>
    </>
  );
} 