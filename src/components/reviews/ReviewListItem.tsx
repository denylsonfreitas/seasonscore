import { Box, HStack, VStack, Text, Button } from "@chakra-ui/react";
import { useUserData } from "../../hooks/useUserData";
import { UserName } from "../common/UserName";
import { RatingStars } from "../common/RatingStars";
import { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { UserAvatar } from "../common/UserAvatar";

interface ReviewListItemProps {
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  onClick: () => void;
}

const COMMENT_MAX_LENGTH = 200;

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
      bg="gray.700"
      p={2}
      borderRadius="lg"
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: "gray.600" }}
    >
      <HStack justify="space-between" align="center" pr={2}>
        <HStack spacing={3} pl={1}>
          <UserAvatar
            userId={userId}
            userEmail={userEmail}
            photoURL={userData?.photoURL}
            size="sm"
            isDeletedExtra={userData?.isDeleted}
          />
          <VStack align="start" spacing={1}>
            {userData?.isDeleted ? (
              <Text fontSize="sm" fontStyle="italic" color="gray.400">Usuário excluído</Text>
            ) : (
              <UserName userId={userId} />
            )}
            <Box>
              {shouldShowExpandButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  color="primary.500"
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