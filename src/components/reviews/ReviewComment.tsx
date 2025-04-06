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
import { DotsThree, Trash } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { Comment } from "../../types/review";
import { deleteComment, toggleCommentReaction } from "../../services/reviews";
import { useState, useEffect } from "react";
import { getUserData } from "../../services/users";
import { UserName } from "../common/UserName";
import { useUserData } from "../../hooks/useUserData";
import { useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "../common/UserAvatar";
import { ReactionButton } from "../common/ReactionButton";

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
  const [currentComment, setCurrentComment] = useState(comment);
  const [forcedLikeState, setForcedLikeState] = useState<boolean | undefined>(undefined);
  const [forcedLikesCount, setForcedLikesCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    setCurrentComment(comment);
    // Resetar estados forçados quando o comentário for atualizado externamente
    setForcedLikeState(undefined);
    setForcedLikesCount(undefined);
  }, [comment]);

  const handleReaction = async () => {
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

    // Verificar se o usuário já curtiu o comentário
    const likes = currentComment.reactions.likes;
    const userId = currentUser.uid;
    const userLikedIndex = likes.indexOf(userId);
    const userLiked = userLikedIndex !== -1;
    
    // Calcular otimisticamente o novo estado
    let newLikes = [...likes];
    if (userLiked) {
      // Remover o like
      newLikes = newLikes.filter(id => id !== userId);
    } else {
      // Adicionar o like
      newLikes.push(userId);
    }
    
    // Definir estados forçados para atualização otimista
    setForcedLikeState(!userLiked);
    setForcedLikesCount(newLikes.length);
    
    // Atualização otimista do cache de React Query
    queryClient.setQueryData(["reviews", seriesId], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((review: any) => {
        if (review.id === reviewId) {
          const updatedSeasonReviews = review.seasonReviews.map((sr: any) => {
            if (sr.seasonNumber === seasonNumber) {
              const updatedComments = sr.comments.map((c: any) => {
                if (c.id === comment.id) {
                  return {
                    ...c,
                    reactions: {
                      ...c.reactions,
                      likes: newLikes
                    }
                  };
                }
                return c;
              });
              
              return {
                ...sr,
                comments: updatedComments
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
      // Chamar a API para persistir a alteração
      await toggleCommentReaction(reviewId, seasonNumber, comment.id, "likes");
      
      // Após sucesso, invalidar a query para eventualmente buscar dados atualizados do backend
      // com um pequeno atraso para evitar sobrecarga
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["reviews", seriesId] });
      }, 500);
    } catch (error) {
      // Reverter a atualização otimista em caso de erro
      setForcedLikeState(userLiked);
      setForcedLikesCount(likes.length);
      
      // Reverter o cache
      queryClient.setQueryData(["reviews", seriesId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((review: any) => {
          if (review.id === reviewId) {
            const updatedSeasonReviews = review.seasonReviews.map((sr: any) => {
              if (sr.seasonNumber === seasonNumber) {
                const updatedComments = sr.comments.map((c: any) => {
                  if (c.id === comment.id) {
                    return {
                      ...c,
                      reactions: {
                        ...c.reactions,
                        likes: likes
                      }
                    };
                  }
                  return c;
                });
                
                return {
                  ...sr,
                  comments: updatedComments
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
          isDeletedExtra={userData?.isDeleted}
        />
        <VStack spacing={2} align="stretch" flex={1}>
          <HStack justify="space-between" width="100%">
            <VStack spacing={0} align="start">
              {userData?.isDeleted ? (
                <Text fontSize="sm" fontStyle="italic" color="gray.400">Usuário excluído</Text>
              ) : (
                <UserName userId={comment.userId} />
              )}
              <Text color="gray.400" fontSize="xs">
                {formatDate(comment.createdAt)}
              </Text>
            </VStack>
            <HStack spacing={2}>
              <ReactionButton
                likes={currentComment.reactions.likes}
                onReaction={handleReaction}
                size="xs"
                tooltipText="Curtir este comentário"
                forcedLikeState={forcedLikeState}
                forcedLikesCount={forcedLikesCount}
              />
              
              {currentUser && (currentUser.uid === comment.userId) && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<DotsThree weight="bold" />}
                    variant="ghost"
                    aria-label="Opções"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem 
                      icon={<Trash />} 
                      onClick={handleDelete} 
                      color="red.500"
                    >
                      Excluir
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </HStack>
          
          <Text whiteSpace="pre-wrap" fontSize="sm">{currentComment.content}</Text>
        </VStack>
      </HStack>
    </Box>
  );
} 