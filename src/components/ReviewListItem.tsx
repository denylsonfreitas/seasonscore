import { Box, HStack, Avatar, VStack, Text, Button } from "@chakra-ui/react";
import { useUserData } from "../hooks/useUserData";
import { UserName } from "./UserName";
import { RatingStars } from "./RatingStars";
import { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

interface ReviewListItemProps {
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  onClick: () => void;
}

const COMMENT_MAX_LENGTH = 280;

export function ReviewListItem({ userId, userEmail, rating, comment, onClick }: ReviewListItemProps) {
  const { userData } = useUserData(userId);
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowExpandButton = comment.length > COMMENT_MAX_LENGTH;

  const displayedComment = isExpanded ? comment : comment.slice(0, COMMENT_MAX_LENGTH);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Box
      bg="gray.800"
      p={4}
      borderRadius="lg"
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: "gray.700" }}
    >
      <HStack justify="space-between" align="start">
        <HStack spacing={3}>
          <Avatar
            size="md"
            name={userEmail}
            src={userData?.photoURL || undefined}
          />
          <VStack align="start" spacing={1}>
            <UserName userId={userId} />
            <Box>
              <Text 
                color="gray.300" 
                fontSize="sm" 
                noOfLines={isExpanded ? undefined : 3}
                whiteSpace="pre-wrap"
                wordBreak="break-word"
              >
                {displayedComment}
                {!isExpanded && shouldShowExpandButton && "..."}
              </Text>
              {shouldShowExpandButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  color="teal.400"
                  rightIcon={isExpanded ? <CaretUp /> : <CaretDown />}
                  onClick={handleExpandClick}
                  mt={1}
                >
                  {isExpanded ? "Ver menos" : "Ver mais"}
                </Button>
              )}
            </Box>
          </VStack>
        </HStack>
        <RatingStars
          rating={rating}
          size={16}
          showNumber={false}
        />
      </HStack>
    </Box>
  );
} 