import {
  Box,
  Text,
  HStack,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { ThumbsUp, ThumbsDown, DotsThree, Trash } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import { Comment } from "../types/review";
import { deleteComment, toggleCommentReaction } from "../services/reviews";
import { useState, useEffect } from "react";
import { getUserData } from "../services/users";
import { UserName } from "./UserName";

interface ReviewCommentProps {
  reviewId: string;
  seasonNumber: number;
  comment: Comment;
  onCommentDeleted?: () => void;
}

function formatDate(date: Date | { seconds: number; nanoseconds: number }) {
  const dateObj = date instanceof Date ? date : new Date(date.seconds * 1000);
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  
  // Menos de 1 minuto
  if (diff < 60000) {
    return "Agora mesmo";
  }
  
  // Menos de 1 hora
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `Há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  // Menos de 24 horas
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  
  // Menos de 7 dias
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  
  // Data completa
  return dateObj.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function ReviewComment({
  reviewId,
  seasonNumber,
  comment,
  onCommentDeleted,
}: ReviewCommentProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [userData, setUserData] = useState<{ photoURL?: string | null } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData(comment.userId);
        setUserData(data);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
  }, [comment.userId]);

  const handleReaction = async (type: "likes" | "dislikes") => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para reagir a um comentário",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await toggleCommentReaction(reviewId, seasonNumber, comment.id, type);
      onCommentDeleted?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua reação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(reviewId, seasonNumber, comment.id);
      onCommentDeleted?.();
      toast({
        title: "Sucesso",
        description: "Comentário excluído com sucesso",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const userLiked = currentUser && comment.reactions.likes.includes(currentUser.uid);
  const userDisliked = currentUser && comment.reactions.dislikes.includes(currentUser.uid);

  return (
    <Box 
      bg="gray.700" 
      p={4} 
      borderRadius="md" 
      width="100%"
      _hover={{ bg: "gray.600" }}
      transition="background 0.2s"
    >
      <HStack spacing={3} align="start" width="100%">
        <Avatar 
          size="sm" 
          name={comment.userEmail} 
          src={userData?.photoURL || undefined}
        />
        <VStack spacing={2} align="stretch" flex={1}>
          <HStack justify="space-between" width="100%">
            <VStack spacing={0} align="start">
              <UserName userId={comment.userId} />
              <Text color="gray.400" fontSize="xs">
                {formatDate(comment.createdAt)}
              </Text>
            </VStack>
            <HStack spacing={2}>
              <HStack spacing={1}>
                <IconButton
                  aria-label="Like"
                  icon={<ThumbsUp weight={userLiked ? "fill" : "regular"} />}
                  size="sm"
                  variant="ghost"
                  color={userLiked ? "teal.400" : "gray.400"}
                  onClick={() => handleReaction("likes")}
                  _hover={{ bg: "gray.500" }}
                />
                {comment.reactions.likes.length > 0 && (
                  <Text color="gray.400" fontSize="sm">
                    {comment.reactions.likes.length}
                  </Text>
                )}
              </HStack>

              <HStack spacing={1}>
                <IconButton
                  aria-label="Dislike"
                  icon={<ThumbsDown weight={userDisliked ? "fill" : "regular"} />}
                  size="sm"
                  variant="ghost"
                  color={userDisliked ? "red.400" : "gray.400"}
                  onClick={() => handleReaction("dislikes")}
                  _hover={{ bg: "gray.500" }}
                />
                {comment.reactions.dislikes.length > 0 && (
                  <Text color="gray.400" fontSize="sm">
                    {comment.reactions.dislikes.length}
                  </Text>
                )}
              </HStack>

              {currentUser?.uid === comment.userId && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<DotsThree size={24} />}
                    variant="ghost"
                    color="gray.400"
                    aria-label="Opções do comentário"
                    size="sm"
                    _hover={{ bg: "gray.500" }}
                  />
                  <MenuList bg="gray.800" borderColor="gray.600">
                    <MenuItem
                      bg="gray.800"
                      color="red.400"
                      icon={<Trash size={20} />}
                      onClick={handleDelete}
                      _hover={{ bg: "gray.700" }}
                    >
                      Excluir comentário
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </HStack>

          <Text color="gray.100" fontSize="sm">
            {comment.content}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
} 