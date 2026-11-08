import { Box, Flex, HStack, Text, Button } from "@chakra-ui/react";
import { useState } from "react";
import { useUserData } from "../../hooks/useUserData";
import { UserName } from "../common/UserName";
import { RatingStars } from "../common/RatingStars";
import { UserAvatar } from "../common/UserAvatar";

interface ReviewListItemProps {
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  onClick: () => void;
}

const COMMENT_MAX_LENGTH = 220;

/** Linha de avaliação: autor, estrelas e texto (expandível). */
export function ReviewListItem({
  userId,
  userEmail,
  rating,
  comment,
  onClick,
}: ReviewListItemProps) {
  const { userData } = useUserData(userId);
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = comment.length > COMMENT_MAX_LENGTH;
  const shown = isExpanded ? comment : comment.slice(0, COMMENT_MAX_LENGTH);

  return (
    <Box
      as="article"
      p={4}
      bg="ink.900"
      border="1px solid"
      borderColor="ink.800"
      borderRadius="md"
      cursor="pointer"
      onClick={onClick}
      transition="border-color 120ms ease"
      _hover={{ borderColor: "ink.600" }}
    >
      <Flex justify="space-between" align="center" gap={3}>
        <HStack spacing={2.5} minW={0}>
          <UserAvatar
            userId={userId}
            userEmail={userEmail}
            photoURL={userData?.photoURL}
            size="sm"
            isDeletedExtra={userData?.isDeleted}
          />
          {userData?.isDeleted ? (
            <Text fontSize="sm" fontStyle="italic" color="ink.400">
              Usuário excluído
            </Text>
          ) : (
            <UserName userId={userId} color="ink.100" />
          )}
        </HStack>
        <RatingStars rating={rating} size={14} showNumber={false} />
      </Flex>

      {shown && (
        <Text mt={2.5} fontSize="sm" color="ink.200" whiteSpace="pre-wrap">
          {shown}
          {isLong && !isExpanded && "…"}
        </Text>
      )}
      {isLong && (
        <Button
          variant="link"
          size="sm"
          mt={1.5}
          color="ink.300"
          fontWeight={500}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((v) => !v);
          }}
        >
          {isExpanded ? "Mostrar menos" : "Ler tudo"}
        </Button>
      )}
    </Box>
  );
}
