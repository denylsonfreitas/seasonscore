import {
  Box,
  Text,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { Heart, HeartBreak, DotsThree, Trash } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { Comment } from "../../types/review";
import { deleteComment, toggleCommentReaction } from "../../services/reviews";
import { useState, useEffect } from "react";
import { getUserData } from "../../services/users";
import { UserName } from "../common/UserName";
import { useUserData } from "../../hooks/useUserData";
import { useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "../common/UserAvatar";

interface ReviewCommentProps {
  reviewId: string;
  seasonNumber: number;
  seriesId: number;
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
  seriesId,
  comment,
  onCommentDeleted,
}: ReviewCommentProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { userData } = useUserData(comment.userId);
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [currentComment, setCurrentComment] = useState(comment);

  const userLiked = currentUser && comment.reactions.likes.includes(currentUser.uid);
  const userDisliked = currentUser && comment.reactions.dislikes.includes(currentUser.uid);

  useEffect(() => {
    setCurrentComment(comment);
  }, [comment]);

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

    // Atualização otimista do cache
    const previousData = queryClient.getQueryData(["reviews", seriesId]);
    
    // Atualizar o cache imediatamente
    queryClient.setQueryData(["reviews", seriesId], (oldData: any) => {
      if (!oldData) return []; // Se não houver dados, retorna array vazio

      return oldData.map((review: any) => {
        if (review.id === reviewId) {
          const updatedSeasonReviews = review.seasonReviews.map((sr: any) => {
            if (sr.seasonNumber === seasonNumber) {
              return {
                ...sr,
                comments: sr.comments.map((c: any) => {
                  if (c.id === comment.id) {
                    const isReacted = c.reactions[type].includes(currentUser.uid);
                    return {
                      ...c,
                      reactions: {
                        ...c.reactions,
                        [type]: isReacted
                          ? c.reactions[type].filter((id: string) => id !== currentUser.uid)
                          : [...c.reactions[type], currentUser.uid]
                      }
                    };
                  }
                  return c;
                })
              };
            }
            return sr;
          });

          return {
            ...review,
            seasonReviews: updatedSeasonReviews
          };
        }
        return review;
      });
    });

    try {
      await toggleCommentReaction(reviewId, seasonNumber, comment.id, type);
      // Força uma nova busca dos dados
      await queryClient.refetchQueries({ queryKey: ["reviews", seriesId] });
    } catch (error) {
      // Reverter a atualização otimista em caso de erro
      if (previousData) {
        queryClient.setQueryData(["reviews", seriesId], previousData);
      }
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
    // Atualização otimista para deleção
    const previousData = queryClient.getQueryData(["reviews", seriesId]);
    
    // Atualizar o cache imediatamente removendo o comentário
    queryClient.setQueryData(["reviews", seriesId], (oldData: any) => {
      if (!oldData) return []; // Se não houver dados, retorna array vazio

      return oldData.map((review: any) => {
        if (review.id === reviewId) {
          const updatedSeasonReviews = review.seasonReviews.map((sr: any) => {
            if (sr.seasonNumber === seasonNumber) {
              return {
                ...sr,
                comments: sr.comments.filter((c: any) => c.id !== comment.id)
              };
            }
            return sr;
          });

          return {
            ...review,
            seasonReviews: updatedSeasonReviews
          };
        }
        return review;
      });
    });

    try {
      await deleteComment(reviewId, seasonNumber, comment.id);
      // Força uma nova busca dos dados
      await queryClient.refetchQueries({ queryKey: ["reviews", seriesId] });

    } catch (error) {
      // Reverter a atualização otimista em caso de erro
      if (previousData) {
        queryClient.setQueryData(["reviews", seriesId], previousData);
      }
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
        <UserAvatar 
          size="sm"
          userId={comment.userId}
          userEmail={comment.userEmail}
          photoURL={userData?.photoURL}
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
                  icon={<Heart weight={userLiked ? "fill" : "regular"} />}
                  size="sm"
                  variant="ghost"
                  color={userLiked ? "reactions.like" : "gray.400"}
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
                  icon={<HeartBreak weight={userDisliked ? "fill" : "regular"} />}
                  size="sm"
                  variant="ghost"
                  color={userDisliked ? "reactions.dislike" : "gray.400"}
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
                      color="primary.700"
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