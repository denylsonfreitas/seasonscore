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
      };
    }>;
    reactions: {
      likes: string[];
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
  const { userData } = useUserData(review?.userId ?? "");
  const [activeTab, setActiveTab] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [updatedReview, setUpdatedReview] = useState<typeof review | null>(null);

  const COMMENTS_PER_PAGE = 5;
  const [currentCommentPage, setCurrentCommentPage] = useState(0);
  
  useEffect(() => {
    setCurrentCommentPage(0);
  }, [activeTab]);
  
  useEffect(() => {
    setUpdatedReview(review);
  }, [review]);

  // Buscar reviews mais recentes
  const { data: updatedReviews } = useQuery({
    queryKey: ["reviews", review?.seriesId],
    queryFn: () => review?.seriesId ? getSeriesReviews(Number(review.seriesId)) : Promise.resolve([]),
    enabled: isOpen && !!review?.seriesId,
    refetchInterval: isOpen ? 15000 : false, // Aumentar o intervalo para 15 segundos
    staleTime: 10000 // Aumentar o staleTime para 10 segundos
  });

  // Encontrar a versão mais atualizada da revisão selecionada
  const activeReviewFromQuery = useMemo(() => {
    if (!updatedReviews || !review) return review;
    
    const currentReview = updatedReviews.find(r => r.id === review.id);
    if (!currentReview) return review;
    
    const currentSeasonReview = currentReview.seasonReviews.find(
      sr => sr.seasonNumber === review.seasonNumber
    );
    
    if (!currentSeasonReview) return review;
    
    return {
      ...review,
      seriesName: review.seriesName || "",
      seriesPoster: review.seriesPoster || "",
      rating: currentSeasonReview.rating,
      comment: currentSeasonReview.comment || "",
      comments: currentSeasonReview.comments || [],
      reactions: currentSeasonReview.reactions || { likes: [] },
      createdAt: currentSeasonReview.createdAt || new Date()
    };
  }, [updatedReviews, review]);
  
  // Usar a revisão atualizada pelo usuário ou a obtida da query
  const activeReview = updatedReview || activeReviewFromQuery;

  const handleReaction = async (type: "likes") => {
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
    const isCurrentlyActive = activeReview.reactions?.likes?.includes(userId);
    
    // Construir as novas reações
    const newReactions = {
      likes: [...(activeReview.reactions?.likes || [])]
    };

    // Alternar a reação atual
    const currentIndex = newReactions.likes.indexOf(userId);
    if (currentIndex === -1 && !isCurrentlyActive) {
      // Adicionar
      newReactions.likes.push(userId);
    } else if (isCurrentlyActive) {
      // Remover
      const index = newReactions.likes.indexOf(userId);
      if (index !== -1) {
        newReactions.likes.splice(index, 1);
      }
    }
    
    // Atualizando localmente primeiro para uma experiência mais responsiva
    setUpdatedReview(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        reactions: {
          ...prev.reactions,
          likes: newReactions.likes
        }
      };
    });
    
    // Atualização otimista do cache de React Query
    queryClient.setQueryData(["reviews", activeReview.seriesId], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((review: any) => {
        if (review.id === activeReview.id) {
          const updatedSeasonReviews = review.seasonReviews.map((sr: any) => {
            if (sr.seasonNumber === activeReview.seasonNumber) {
              return {
                ...sr,
                reactions: {
                  ...sr.reactions,
                  likes: newReactions.likes
                }
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
      // Tentamos atualizar a reação no backend
      await toggleReaction(activeReview.id, activeReview.seasonNumber, type);
      
      // Se a atualização for bem-sucedida, atualizamos o cache com os dados mais recentes
      // usando um pequeno atraso para evitar múltiplas atualizações imediatas
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["reviews", activeReview.seriesId],
        });
        onReviewUpdated();
      }, 500);
    } catch (error) {
      // Em caso de erro, revertemos a atualização local
      setUpdatedReview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          reactions: activeReview.reactions || { likes: [] }
        };
      });
      
      // E revertemos a atualização otimista do cache
      queryClient.setQueryData(["reviews", activeReview.seriesId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((review: any) => {
          if (review.id === activeReview.id) {
            const updatedSeasonReviews = review.seasonReviews.map((sr: any) => {
              if (sr.seasonNumber === activeReview.seasonNumber) {
                return {
                  ...sr,
                  reactions: activeReview.reactions
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
  const handleReactionWrapper = (reviewId: string, seasonNumber: number, type: "likes", e: React.MouseEvent) => {
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

                  {(activeReview.comments?.length || 0) > 0 ? (
                    <>
                      {activeReview.comments?.map((comment) => (
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
                      
                      {activeReview.comments?.length > COMMENTS_PER_PAGE && (
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