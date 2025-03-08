import { Box, Text, HStack, Spinner } from "@chakra-ui/react";
import { RatingStars } from "./RatingStars";
import { useUserInfo } from "../hooks/useUserInfo";
import { UserName } from "./UserName";

interface UserReviewProps {
  userId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: Date | { seconds: number };
}

export function UserReview({ userId, userEmail, rating, comment, createdAt }: UserReviewProps) {
  const { userInfo, isLoading } = useUserInfo(userId);

  const formattedDate = createdAt instanceof Date 
    ? createdAt.toLocaleDateString()
    : new Date(createdAt.seconds * 1000).toLocaleDateString();

  return (
    <Box bg="gray.800" p={4} borderRadius="lg">
      <HStack spacing={2} mb={2}>
        {isLoading ? (
          <Spinner size="sm" color="teal.500" />
        ) : (
          <UserName
            userId={userId}
            color="teal.300"
          />
        )}
        <Text color="gray.400" fontSize="sm">
          • {formattedDate}
        </Text>
      </HStack>
      <RatingStars rating={rating} size={20} />
      {comment && (
        <Text color="white" mt={2}>
          {comment}
        </Text>
      )}
    </Box>
  );
} 