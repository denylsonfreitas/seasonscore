import React, { useState, useEffect, useMemo } from "react";
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
import { UserAvatar } from "../common/UserAvatar";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { toggleReaction, getSeriesReviews } from "../../services/reviews";
import { AddComment } from "./AddComment";
import { ReviewComment } from "./ReviewComment";
import { useUserData } from "../../hooks/useUserData";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ReactionButtons } from "./ReactionButtons";
import { FieldValue } from "firebase/firestore";

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
    createdAt: Date | { seconds: number } | FieldValue;
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
  const { userData } = useUserData(review?.userId || "");
  const [activeTab, setActiveTab] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const COMMENTS_PER_PAGE = 5;
  const hasMoreComments = (review?.comments?.length || 0) > COMMENTS_PER_PAGE;
  const visibleComments = showAllComments
    ? review?.comments || []
    : review?.comments?.slice(0, COMMENTS_PER_PAGE) || [];

  const userLiked = currentUser && review?.reactions?.likes?.includes(currentUser.uid);
  const userDisliked = currentUser && review?.reactions?.dislikes?.includes(currentUser.uid);

  // Consulta para buscar atualizações em tempo real da revisão
  const { data: updatedReviews } = useQuery({
    queryKey: ["reviews", review?.seriesId],
    queryFn: () => review?.seriesId ? getSeriesReviews(Number(review.seriesId)) : Promise.resolve([]),
    enabled: isOpen && !!review?.seriesId,
    refetchInterval: isOpen ? 15000 : false, // Aumentar o intervalo para 15 segundos
    staleTime: 10000 // Aumentar o staleTime para 10 segundos
  });

  // Encontrar a versão mais atualizada da revisão selecionada
  const updatedReview = useMemo(() => {
    if (!updatedReviews || !review) return review;

    const fullReview = updatedReviews.find(r => r.id === review.id);
    if (!fullReview) return review;

    const seasonReview = fullReview.seasonReviews.find(sr => sr.seasonNumber === review.seasonNumber);
    if (!seasonReview) return review;

    // Comparar com a versão atual para evitar renderizações desnecessárias
    const currentComments = review.comments || [];
    const updatedComments = seasonReview.comments || [];
    const currentReactions = review.reactions || { likes: [], dislikes: [] };
    const updatedReactions = seasonReview.reactions || { likes: [], dislikes: [] };

    // Só atualizar se os comentários ou reações mudaram
    if (
      JSON.stringify(currentComments) === JSON.stringify(updatedComments) &&
      JSON.stringify(currentReactions) === JSON.stringify(updatedReactions)
    ) {
      return review;
    }

    // Retorna a versão mais atualizada da revisão com todos os comentários e reações
    return {
      ...review,
      comments: updatedComments,
      reactions: updatedReactions
    };
  }, [updatedReviews, review]);

  // Usar o review atualizado para os componentes renderizados
  const activeReview = useMemo(() => {
    if (!updatedReview && !review) return null;

    const currentReview = (updatedReview || review) as NonNullable<typeof review>;
    
    return {
      id: currentReview.id,
      seriesId: currentReview.seriesId,
      userId: currentReview.userId,
      userEmail: currentReview.userEmail,
      seriesName: currentReview.seriesName || "",
      seriesPoster: currentReview.seriesPoster || "",
      seasonNumber: currentReview.seasonNumber,
      rating: currentReview.rating,
      comment: currentReview.comment || "",
      comments: currentReview.comments || [],
      reactions: currentReview.reactions || { likes: [], dislikes: [] },
      createdAt: currentReview.createdAt || new Date()
    };
  }, [updatedReview, review]);

  const handleReaction = async (type: "likes" | "dislikes") => {
    if (!currentUser || !activeReview) {
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
      ? activeReview.reactions?.likes?.includes(userId)
      : activeReview.reactions?.dislikes?.includes(userId);
    
    // Construir as novas reações
    const newReactions = {
      likes: [...(activeReview.reactions?.likes || [])],
      dislikes: [...(activeReview.reactions?.dislikes || [])]
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

    try {
      // Tentamos atualizar a reação no backend
      await toggleReaction(activeReview.id, activeReview.seasonNumber, type);
      
      // Se a atualização for bem-sucedida, atualizamos o cache com os dados mais recentes
      queryClient.invalidateQueries({
        queryKey: ["reviews", activeReview.seriesId],
      });
      onReviewUpdated();
    } catch (error) {
      // Em caso de erro, mostramos mensagem ao usuário
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua reação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Criar um wrapper para ser compatível com o ReactionButtons
  const handleReactionWrapper = (reviewId: string, seasonNumber: number, type: "likes" | "dislikes", e: React.MouseEvent) => {
    e.preventDefault();
    handleReaction(type);
  };

  const handleCommentAdded = () => {
    if (!activeReview) return;
    
    onReviewUpdated();
    // Atualiza apenas os comentários sem recarregar toda a review
    queryClient.setQueryData(["reviews", activeReview.seriesId], (old: any) => {
      if (!old) return old;
      return old.map((r: any) => {
        if (r.id === activeReview.id) {
          return {
            ...r,
            seasonReviews: r.seasonReviews.map((sr: any) =>
              sr.seasonNumber === activeReview.seasonNumber
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
    if (activeReview) {
      onClose();
      navigate(`/series/${activeReview.seriesId}`);
    }
  };

  const formatDate = (date: Date | { seconds: number } | FieldValue | undefined) => {
    if (!date) return "Data não disponível";
    
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      
      if (typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000).toLocaleDateString();
      }
      
      // Se for FieldValue, retorna uma data genérica
      if (typeof date === 'object' && 'isEqual' in date) {
        return new Date().toLocaleDateString();
      }
      
      return "Data não disponível";
    } catch (error) {
      return "Data não disponível";
    }
  };

  if (!activeReview) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      motionPreset="slideInBottom"
      blockScrollOnMount={false}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent bg="gray.900">
        <ModalHeader color="white">
          <HStack spacing={4}>
            <Box>
              {currentUser?.uid === activeReview.userId 
                ? <Text>Sua avaliação</Text>
                : (
                  <HStack>
                    <Box as="span">Avaliação de</Box>
                    <UserName userId={activeReview.userId} />
                  </HStack>
                )
              }
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <Tabs 
            variant="line" 
            colorScheme="primary" 
            onChange={(index) => setActiveTab(index)}
            isFitted
          >
            <TabList borderBottomColor="gray.600">
              <Tab 
                color="gray.400" 
                _selected={{ color: "white", borderColor: "primary.500" }}
              >
                Avaliação
              </Tab>
              <Tab 
                color="gray.400" 
                _selected={{ color: "white", borderColor: "primary.500" }}
              >
                Comentários ({activeReview.comments.length})
              </Tab>
            </TabList>

            <TabPanels>
              {/* Aba de Avaliação */}
              <TabPanel px={0}>
                <HStack align="start" spacing={6}>
                  <VStack align="stretch" spacing={6} flex={1}>
                    <HStack spacing={4}>
                      <UserAvatar 
                        size="md" 
                        userId={activeReview.userId}
                        userEmail={activeReview.userEmail}
                        photoURL={userData?.photoURL}
                      />
                      <VStack align="start" spacing={0}>
                        <UserName userId={activeReview.userId} />
                        <Text color="gray.400" fontSize="sm">
                          {formatDate(activeReview.createdAt)}
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
                        _hover={{ color: "primary.500", textDecoration: "underline" }}
                        display="inline-block"
                      >
                        {activeReview.seriesName} • Temporada {activeReview.seasonNumber}
                      </Text>
                      <HStack spacing={2} align="center">
                        <RatingStars rating={activeReview.rating} size={24} />
                      </HStack>
                    </Box>

                    {activeReview.comment && (
                      <Text 
                        color="gray.300" 
                        mt={4}
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                      >
                        {activeReview.comment}
                      </Text>
                    )}

                    <HStack spacing={4}>
                      <ReactionButtons 
                        reviewId={activeReview.id}
                        seasonNumber={activeReview.seasonNumber}
                        likes={activeReview.reactions?.likes || []}
                        dislikes={activeReview.reactions?.dislikes || []}
                        onReaction={handleReactionWrapper}
                      />
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
                      src={`https://image.tmdb.org/t/p/w500${activeReview.seriesPoster}`}
                      alt={activeReview.seriesName}
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
                    reviewId={activeReview.id}
                    seasonNumber={activeReview.seasonNumber}
                    seriesId={Number(activeReview.seriesId)}
                    onCommentAdded={handleCommentAdded}
                  />

                  <Divider borderColor="gray.600" />

                  {(visibleComments?.length || 0) > 0 ? (
                    <>
                      {visibleComments?.map((comment) => (
                        <ReviewComment
                          key={comment.id}
                          reviewId={activeReview.id}
                          seasonNumber={activeReview.seasonNumber}
                          seriesId={Number(activeReview.seriesId)}
                          comment={comment}
                          onCommentDeleted={() => {
                            onReviewUpdated();
                            queryClient.invalidateQueries({ queryKey: ["reviews", activeReview.seriesId] });
                          }}
                        />
                      ))}
                      
                      {hasMoreComments && (
                        <Button
                          variant="ghost"
                          color="primary.500"
                          size="sm"
                          width="100%"
                          onClick={() => setShowAllComments(!showAllComments)}
                          rightIcon={showAllComments ? <CaretUp /> : <CaretDown />}
                        >
                          {showAllComments 
                            ? "Ver menos" 
                            : `Ver mais ${activeReview.comments.length - COMMENTS_PER_PAGE} comentários`}
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