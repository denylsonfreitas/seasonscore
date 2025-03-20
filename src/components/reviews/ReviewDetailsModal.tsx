import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  VStack,
  Avatar,
  Text,
  Box,
  IconButton,
  Divider,
  Image,
  Button,
  useToast,
  Link,
} from "@chakra-ui/react";
import { RatingStars } from "../common/RatingStars";
import { UserName } from "../common/UserName";
import { Heart, HeartBreak, CaretDown, CaretUp } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { toggleReaction } from "../../services/reviews";
import { AddComment } from "./AddComment";
import { ReviewComment } from "./ReviewComment";
import { useState } from "react";
import { useUserData } from "../../hooks/useUserData";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface ReviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    id: string;
    seriesId: string;
    userId: string;
    userEmail: string;
    seriesName: string;
    seriesPoster: string;
    seasonNumber: number;
    rating: number;
    comment: string;
    comments: Array<{
      id: string;
      userId: string;
      userEmail: string;
      content: string;
      createdAt: Date;
      reactions: {
        likes: string[];
        dislikes: string[];
      };
    }>;
    reactions: {
      likes: string[];
      dislikes: string[];
    };
    createdAt: Date | { seconds: number };
  } | null;
  onReviewUpdated: () => void;
}

export function ReviewDetailsModal({
  isOpen,
  onClose,
  review,
  onReviewUpdated,
}: ReviewDetailsModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const { userData } = useUserData(review?.userId || "");
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const COMMENTS_PER_PAGE = 3;
  const hasMoreComments = (review?.comments?.length ?? 0) > COMMENTS_PER_PAGE;
  const visibleComments = showAllComments 
    ? review?.comments ?? []
    : review?.comments?.slice(0, COMMENTS_PER_PAGE) ?? [];

  const userLiked = currentUser && review?.reactions?.likes?.includes(currentUser.uid);
  const userDisliked = currentUser && review?.reactions?.dislikes?.includes(currentUser.uid);

  const handleReaction = async (type: "likes" | "dislikes") => {
    if (!currentUser || !review) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para reagir a uma avaliação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const userId = currentUser.uid;
    const isLikeAction = type === "likes";
    const isCurrentlyActive = isLikeAction 
      ? userLiked 
      : userDisliked;
    
    // Construir as novas reações
    const newReactions = {
      likes: [...(review.reactions?.likes || [])],
      dislikes: [...(review.reactions?.dislikes || [])]
    };

    // Remover reação oposta se existir
    const oppositeType = isLikeAction ? "dislikes" : "likes";
    const oppositeIndex = newReactions[oppositeType].indexOf(userId);
    if (oppositeIndex !== -1) {
      newReactions[oppositeType].splice(oppositeIndex, 1);
    }

    // Alternar a reação atual
    const currentIndex = newReactions[type].indexOf(userId);
    if (currentIndex === -1 && !isCurrentlyActive) {
      // Adicionar
      newReactions[type].push(userId);
    } else if (isCurrentlyActive) {
      // Remover
      const index = newReactions[type].indexOf(userId);
      if (index !== -1) {
        newReactions[type].splice(index, 1);
      }
    }

    // Salvamos as reações atuais para atualização local imediata
    const updatedReactions = { ...newReactions };

    // Alteramos diretamente o objeto review para refletir mudanças imediatamente na interface
    if (review.reactions) {
      review.reactions.likes = [...updatedReactions.likes];
      review.reactions.dislikes = [...updatedReactions.dislikes];
    }

    try {
      // Tentamos atualizar a reação no backend
      await toggleReaction(review.id, review.seasonNumber, type);
      
      // Se a atualização for bem-sucedida, atualizamos o cache com os dados mais recentes
      queryClient.invalidateQueries({
        queryKey: ["reviews", review.seriesId],
      });
      onReviewUpdated();
    } catch (error) {
      // Em caso de erro, revertemos as mudanças locais
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua reação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      
      // Revertemos as mudanças no objeto review
      if (review.reactions) {
        review.reactions.likes = newReactions.likes.filter(id => id !== userId);
        review.reactions.dislikes = newReactions.dislikes.filter(id => id !== userId);
      }
    }
  };

  const handleCommentAdded = () => {
    if (!review) return;
    
    onReviewUpdated();
    // Atualiza apenas os comentários sem recarregar toda a review
    queryClient.setQueryData(["reviews", review.seriesId], (old: any) => {
      if (!old) return old;
      return old.map((r: any) => {
        if (r.id === review.id) {
          return {
            ...r,
            seasonReviews: r.seasonReviews.map((sr: any) =>
              sr.seasonNumber === review.seasonNumber
                ? { ...sr, comments: [...(sr.comments || [])] }
                : sr
            )
          };
        }
        return r;
      });
    });
  };

  const handleSeriesClick = () => {
    if (review) {
      onClose();
      navigate(`/series/${review.seriesId}`);
    }
  };

  if (!review) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.900">
        <ModalHeader color="white">
          <HStack spacing={4}>
            <Avatar
              size="sm"
              name={review.userEmail}
              src={userData?.photoURL || undefined}
            />
            <Box>
              {currentUser?.uid === review.userId 
                ? <Text>Sua avaliação</Text>
                : (
                  <HStack>
                    <Box as="span">Avaliação de</Box>
                    <UserName userId={review.userId} />
                  </HStack>
                )
              }
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <Tabs 
            variant="line" 
            colorScheme="teal" 
            onChange={(index) => setActiveTab(index)}
            isFitted
          >
            <TabList borderBottomColor="gray.600">
              <Tab 
                color="gray.400" 
                _selected={{ color: "white", borderColor: "teal.400" }}
              >
                Avaliação
              </Tab>
              <Tab 
                color="gray.400" 
                _selected={{ color: "white", borderColor: "teal.400" }}
              >
                Comentários ({review.comments.length})
              </Tab>
            </TabList>

            <TabPanels>
              {/* Aba de Avaliação */}
              <TabPanel px={0}>
                <HStack align="start" spacing={6}>
                  <VStack align="stretch" spacing={6} flex={1}>
                    <HStack spacing={4}>
                      <Avatar 
                        size="md" 
                        name={review.userEmail} 
                        src={userData?.photoURL || undefined}
                      />
                      <VStack align="start" spacing={0}>
                        <UserName userId={review.userId} />
                        <Text color="gray.400" fontSize="sm">
                          {new Date(
                            review.createdAt instanceof Date 
                              ? review.createdAt 
                              : review.createdAt.seconds * 1000
                          ).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </HStack>

                    <Box>
                      <Text 
                        color="gray.400" 
                        fontSize="sm" 
                        mb={2}
                        onClick={handleSeriesClick}
                        cursor="pointer"
                        _hover={{ color: "teal.400", textDecoration: "underline" }}
                        display="inline-block"
                      >
                        {review.seriesName} • Temporada {review.seasonNumber}
                      </Text>
                      <HStack spacing={2} align="center">
                        <RatingStars rating={review.rating} size={24} />
                      </HStack>
                    </Box>

                    {review.comment && (
                      <Text 
                        color="gray.300" 
                        mt={4}
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                      >
                        {review.comment}
                      </Text>
                    )}

                    <HStack spacing={4}>
                      <HStack>
                        <IconButton
                          aria-label="Like"
                          icon={<Heart weight={userLiked ? "fill" : "regular"} />}
                          size="md"
                          variant="ghost"
                          color={userLiked ? "red.400" : "gray.400"}
                          onClick={() => handleReaction("likes")}
                        />
                        <Text color="gray.400" fontSize="sm">
                          {review.reactions.likes.length}
                        </Text>
                      </HStack>

                      <HStack>
                        <IconButton
                          aria-label="Dislike"
                          icon={<HeartBreak weight={userDisliked ? "fill" : "regular"} />}
                          size="md"
                          variant="ghost"
                          color={userDisliked ? "red.800" : "gray.400"}
                          onClick={() => handleReaction("dislikes")}
                        />
                        <Text color="gray.400" fontSize="sm">
                          {review.reactions.dislikes.length}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>

                  <Box 
                    width="150px" 
                    flexShrink={0}
                    cursor="pointer"
                    onClick={handleSeriesClick}
                    _hover={{ transform: "scale(1.03)", transition: "transform 0.2s ease" }}
                  >
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${review.seriesPoster}`}
                      alt={review.seriesName}
                      borderRadius="md"
                      width="100%"
                    />
                  </Box>
                </HStack>
              </TabPanel>

              {/* Aba de Comentários */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <AddComment
                    reviewId={review.id}
                    seasonNumber={review.seasonNumber}
                    seriesId={Number(review.seriesId)}
                    onCommentAdded={handleCommentAdded}
                  />

                  <Divider borderColor="gray.600" />

                  {visibleComments?.length > 0 ? (
                    <>
                      {visibleComments.map((comment) => (
                        <ReviewComment
                          key={comment.id}
                          reviewId={review.id}
                          seasonNumber={review.seasonNumber}
                          seriesId={Number(review.seriesId)}
                          comment={comment}
                          onCommentDeleted={() => {
                            onReviewUpdated();
                            queryClient.invalidateQueries({ queryKey: ["reviews", review.seriesId] });
                          }}
                        />
                      ))}
                      
                      {hasMoreComments && (
                        <Button
                          variant="ghost"
                          color="teal.400"
                          size="sm"
                          width="100%"
                          onClick={() => setShowAllComments(!showAllComments)}
                          rightIcon={showAllComments ? <CaretUp /> : <CaretDown />}
                        >
                          {showAllComments 
                            ? "Ver menos" 
                            : `Ver mais ${review.comments.length - COMMENTS_PER_PAGE} comentários`}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Text color="gray.400" textAlign="center" py={4}>
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </Text>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 