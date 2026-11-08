import { Text, Tooltip, useColorModeValue, Flex, Icon, Spinner } from "@chakra-ui/react";
import { Heart } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState, useRef } from "react";

interface ReactionButtonProps {
  likes: string[];
  onReaction: (event: React.MouseEvent) => void;
  size?: "xs" | "sm" | "md" | "lg";
  showCount?: boolean;
  tooltipText?: string;
  isLoading?: boolean;
  forcedLikeState?: boolean;
  forcedLikesCount?: number;
}

export function ReactionButton({
  likes = [],
  onReaction,
  size = "sm",
  showCount = true,
  tooltipText = "Curtir",
  isLoading = false,
  forcedLikeState,
  forcedLikesCount,
}: ReactionButtonProps) {
  const { currentUser } = useAuth();
  const [likesCount, setLikesCount] = useState(
    forcedLikesCount !== undefined ? forcedLikesCount : likes.length
  );
  const [isLiked, setIsLiked] = useState(
    forcedLikeState !== undefined ? forcedLikeState : currentUser && likes.includes(currentUser.uid)
  );
  const prevLikesRef = useRef(likes);
  const prevForcedLikeStateRef = useRef(forcedLikeState);
  const prevForcedLikesCountRef = useRef(forcedLikesCount);

  useEffect(() => {
    if (forcedLikeState !== undefined) {
      setIsLiked(forcedLikeState);
      prevForcedLikeStateRef.current = forcedLikeState;
    }

    if (forcedLikesCount !== undefined) {
      setLikesCount(forcedLikesCount);
      prevForcedLikesCountRef.current = forcedLikesCount;
    }

    if (forcedLikeState === undefined && forcedLikesCount === undefined) {
      if (JSON.stringify(prevLikesRef.current) !== JSON.stringify(likes)) {
        setLikesCount(likes.length);
        setIsLiked(currentUser && likes.includes(currentUser.uid));
        prevLikesRef.current = likes;
      }
    }
  }, [likes, currentUser, forcedLikeState, forcedLikesCount]);

  const handleReaction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    onReaction(e);
  };

  const effectiveIsLiked = Boolean(forcedLikeState !== undefined ? forcedLikeState : isLiked);
  const effectiveLikesCount = forcedLikesCount !== undefined ? forcedLikesCount : likesCount;

  const likeColor = useColorModeValue("reactions.like", "reactions.like");

  const button = (
    <Flex
      align="center"
      cursor="pointer"
      transition="all 0.2s"
      onClick={handleReaction}
      _hover={{ color: likeColor }}
      role="button"
      tabIndex={0}
      aria-pressed={effectiveIsLiked}
      aria-label={effectiveIsLiked ? "Descurtir" : "Curtir"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleReaction(e as unknown as React.MouseEvent);
      }}
    >
      {isLoading ? (
        <Flex justify="center" w={size === "xs" ? "14px" : size === "sm" ? "16px" : "20px"} mr={2}>
          <Spinner
            size={size === "xs" ? "xs" : "sm"}
            color={effectiveIsLiked ? likeColor : "ink.400"}
          />
        </Flex>
      ) : (
        <Icon
          as={Heart}
          weight={effectiveIsLiked ? "fill" : "regular"}
          color={effectiveIsLiked ? likeColor : "ink.400"}
          mr={2}
          boxSize={size === "xs" ? "14px" : size === "sm" ? "16px" : "20px"}
        />
      )}
      {showCount && (
        <Text
          fontFamily="mono"
          fontWeight="medium"
          color={effectiveIsLiked ? likeColor : "ink.400"}
          fontSize={size === "xs" ? "xs" : size === "sm" ? "sm" : "md"}
        >
          {effectiveLikesCount || 0}
        </Text>
      )}
    </Flex>
  );

  return tooltipText ? <Tooltip label={tooltipText}>{button}</Tooltip> : button;
}
