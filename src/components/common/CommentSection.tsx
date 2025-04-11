import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Input,
  VStack,
  HStack,
  Divider,
  Skeleton,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Textarea,
} from '@chakra-ui/react';
import { FaEllipsisV, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';
import {
  addComment,
  getComments,
  deleteComment,
  updateComment,
  toggleReviewCommentReaction
} from '../../services/comments';
import { UserName } from './UserName';
import { UserAvatar } from './UserAvatar';
import { ReactionButton } from './ReactionButton';
import { useQueryClient } from '@tanstack/react-query';
import { toggleListCommentReaction } from '../../services/lists';

export interface Comment {
  id: string;
  objectId: string;
  objectType: string;
  userId: string;
  username: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface CommentSectionProps {
  objectId: string;
  objectType: 'review' | 'list';
  commentsCount: number;
  seasonNumber?: number;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentSection({ 
  objectId, 
  objectType, 
  commentsCount, 
  seasonNumber,
  onCommentsCountChange 
}: CommentSectionProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  // Estados para controlar reações com UI otimista
  const [commentReactions, setCommentReactions] = useState<Record<string, {
    isLiked: boolean;
    likesCount: number;
    isToggling: boolean;
  }>>({});
  
  const bgColor = 'gray.800';
  const borderColor = 'gray.700';

  useEffect(() => {
    loadComments();
  }, [objectId, objectType]);

  // Inicializar estados de reação quando os comentários são carregados
  useEffect(() => {
    const newReactions: Record<string, { isLiked: boolean; likesCount: number; isToggling: boolean }> = {};
    
    comments.forEach(comment => {
      const likes = comment as any as { likes?: Record<string, boolean> };
      const likesMap = likes.likes || {};
      const likesCount = Object.keys(likesMap).length;
      const isLiked = currentUser ? !!likesMap[currentUser.uid] : false;
      
      newReactions[comment.id] = {
        isLiked,
        likesCount,
        isToggling: false
      };
    });
    
    setCommentReactions(newReactions);
  }, [comments, currentUser]);

  // Adicionar efeito para notificar o componente pai sobre o número atualizado de comentários
  useEffect(() => {
    if (onCommentsCountChange && !isLoading && comments.length !== commentsCount) {
      onCommentsCountChange(comments.length);
    }
  }, [comments.length, commentsCount, isLoading, onCommentsCountChange]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await getComments(objectId, objectType, seasonNumber);
      setComments(commentsData);
      
      // Notificar o componente pai sobre a contagem atualizada
      if (onCommentsCountChange && commentsData.length !== commentsCount) {
        onCommentsCountChange(commentsData.length);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast({
        title: 'Erro ao carregar comentários',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comentar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Comentário vazio',
        description: 'Digite algum texto para comentar',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const addedComment = await addComment(objectId, objectType, newComment.trim(), seasonNumber);
      
      const updatedComments = [addedComment, ...comments];
      setComments(updatedComments);
      setNewComment('');
      
      // Notificar o componente pai sobre a contagem atualizada
      if (onCommentsCountChange) {
        onCommentsCountChange(updatedComments.length);
      }
      
      toast({
        title: 'Comentário adicionado',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao comentar',
        description: error.message || 'Não foi possível adicionar o comentário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment(commentToDelete, objectId, objectType);
      
      const updatedComments = comments.filter(comment => comment.id !== commentToDelete);
      setComments(updatedComments);
      
      // Notificar o componente pai sobre a contagem atualizada
      if (onCommentsCountChange) {
        onCommentsCountChange(updatedComments.length);
      }
      
      toast({
        title: 'Comentário excluído',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o comentário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCommentToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEditClick = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editContent.trim()) return;

    try {
      setIsSubmitting(true);
      
      await updateComment(editingComment, objectId, objectType, editContent.trim());
      
      setComments(comments.map(comment => 
        comment.id === editingComment 
          ? { ...comment, content: editContent.trim(), updatedAt: new Date() } 
          : comment
      ));
      
      toast({
        title: 'Comentário atualizado',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      setEditingComment(null);
      setEditContent('');
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o comentário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adicionar função para lidar com reações em comentários
  const handleCommentReaction = async (commentId: string) => {
    if (!currentUser) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para reagir a um comentário',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Evitar múltiplos cliques
    if (commentReactions[commentId]?.isToggling) {
      return;
    }

    // Atualização otimista da UI
    setCommentReactions(prev => ({
      ...prev,
      [commentId]: {
        isLiked: !prev[commentId]?.isLiked,
        likesCount: prev[commentId]?.isLiked 
          ? Math.max(0, prev[commentId]?.likesCount - 1) 
          : (prev[commentId]?.likesCount || 0) + 1,
        isToggling: true
      }
    }));

    try {
      let result;
      
      if (objectType === 'list') {
        result = await toggleListCommentReaction(objectId, commentId);
      } else if (objectType === 'review' && seasonNumber !== undefined) {
        result = await toggleReviewCommentReaction(objectId, commentId, seasonNumber);
      } else {
        throw new Error('Tipo de objeto inválido ou temporada não especificada');
      }
      
      // Atualizar com o resultado real da API
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: {
          isLiked: result.liked,
          likesCount: result.likesCount,
          isToggling: false
        }
      }));
      
      // Atualizar localmente o objeto de comentários para refletir a alteração
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const commentWithLikes = comment as any;
          // Inicializar o objeto likes se não existir
          const currentLikes = commentWithLikes.likes || {};
          
          if (result.liked) {
            currentLikes[currentUser.uid] = true;
          } else {
            delete currentLikes[currentUser.uid];
          }
          
          return {
            ...comment,
            likes: currentLikes
          };
        }
        return comment;
      }));
      
    } catch (error) {
      // Restaurar estado anterior em caso de erro
      const previousState = commentReactions[commentId];
      setCommentReactions(prev => ({
        ...prev,
        [commentId]: {
          ...previousState,
          isToggling: false
        }
      }));
      
      console.error("Erro ao reagir ao comentário:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar sua reação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      overflow="hidden"
    >
      <Box p={6}>
        <Heading as="h2" size="md" mb={6}>
          Comentários ({comments.length || commentsCount})
        </Heading>

        {currentUser ? (
          <Flex mb={6}>
            <UserAvatar
              size="sm"
              userId={currentUser?.uid}
              photoURL={currentUser?.photoURL}
              mr={2}
              mt={1}
            />
            <Box flex="1">
              <Textarea
                value={editingComment ? editContent : newComment}
                onChange={(e) => 
                  editingComment 
                    ? setEditContent(e.target.value) 
                    : setNewComment(e.target.value)
                }
                placeholder="Adicione um comentário..."
                rows={3}
                resize="none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    editingComment ? handleUpdateComment() : handleAddComment();
                  }
                }}
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: "gray.500" }}
                _focus={{ borderColor: "primary.500", boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)" }}
              />

              <Flex justify="flex-end" mt={2}>
                {editingComment ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      mr={2}
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="primary"
                      isLoading={isSubmitting}
                      onClick={handleUpdateComment}
                    >
                      Atualizar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    colorScheme="primary"
                    isLoading={isSubmitting}
                    onClick={handleAddComment}
                  >
                    Comentar
                  </Button>
                )}
              </Flex>
            </Box>
          </Flex>
        ) : (
          <Flex
            mb={6}
            p={4}
            borderWidth="1px"
            borderColor="gray.700"
            borderRadius="md"
            align="center"
            justify="center"
            bg="gray.700"
          >
            <Text>
              <Link to="/login" style={{ color: "#63B3ED", fontWeight: "bold", textDecoration: "none" }}>
                Faça login
              </Link>{" "}
              para adicionar um comentário.
            </Text>
          </Flex>
        )}

        <Divider mb={6} borderColor="gray.600" />

        {isLoading ? (
          <VStack spacing={4} align="stretch">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} height="100px" />
            ))}
          </VStack>
        ) : comments.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {comments.map((comment) => {
              const likes = comment as any as { likes?: Record<string, boolean> };
              const likesMap = likes.likes || {};
              const reaction = commentReactions[comment.id] || { isLiked: false, likesCount: 0, isToggling: false };
              
              return (
                <Box
                  key={comment.id}
                  p={4}
                  borderWidth="1px"
                  borderColor="gray.700"
                  borderRadius="md"
                  bg="gray.700"
                  _hover={{ bg: "gray.650" }}
                  transition="all 0.2s"
                  boxShadow="sm"
                >
                  <Flex justify="space-between" align="start">
                    <HStack spacing={3} align="start" flex={1}>
                      <UserAvatar
                        size="sm"
                        userId={comment.userId}
                        photoURL={comment.userPhotoURL}
                      />
                      <Box flex="1">
                        <Flex justify="space-between" align="center" width="100%">
                          <HStack>
                            <UserName userId={comment.userId} />
                            <Text fontSize="xs" color="gray.400">
                              {formatRelativeTime(comment.createdAt)}
                              {comment.updatedAt && ' (editado)'}
                            </Text>
                          </HStack>
                          
                          <HStack spacing={3}>
                            {/* Botão de reação para comentários de listas */}
                            {(objectType === 'list' || objectType === 'review') && (
                              <ReactionButton
                                likes={Object.keys(likesMap)}
                                onReaction={() => handleCommentReaction(comment.id)}
                                size="xs"
                                tooltipText="Curtir este comentário"
                                forcedLikeState={reaction.isLiked}
                                forcedLikesCount={reaction.likesCount}
                                isLoading={reaction.isToggling}
                              />
                            )}
                            
                            {/* Separador visual entre o botão de reação e o menu de opções */}
                            {(objectType === 'list' || objectType === 'review') && currentUser && currentUser.uid === comment.userId && (
                              <Box
                                h="16px"
                                borderLeftWidth="1px"
                                borderColor="gray.600"
                                mx={1}
                              />
                            )}
                            
                            {currentUser && currentUser.uid === comment.userId && (
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FaEllipsisV />}
                                  variant="ghost"
                                  size="xs"
                                  aria-label="Opções"
                                />
                                <MenuList bg="gray.800" borderColor="gray.700">
                                  <MenuItem
                                    icon={<FaEdit />}
                                    onClick={() => handleEditClick(comment)}
                                    bg="gray.800"
                                    _hover={{ bg: "gray.700" }}
                                  >
                                    Editar
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FaTrash />}
                                    onClick={() => handleDeleteClick(comment.id)}
                                    color="red.500"
                                    bg="gray.800"
                                    _hover={{ bg: "gray.700" }}
                                  >
                                    Excluir
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            )}
                          </HStack>
                        </Flex>
                        <Text mt={2} whiteSpace="pre-wrap" fontSize="sm" color="gray.200">{comment.content}</Text>
                      </Box>
                    </HStack>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        ) : (
          <Box
            p={4}
            borderWidth="1px"
            borderColor="gray.700"
            borderRadius="md"
            bg="gray.700"
            textAlign="center"
          >
            <Text>Nenhum comentário ainda. Seja o primeiro a comentar!</Text>
          </Box>
        )}
      </Box>

      {/* Confirmação de exclusão */}
      <AlertDialog
        isOpen={deleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir Comentário
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button                 
              variant="ghost"
              color="white"
              _hover={{ bg: "gray.700" }}
              ref={cancelRef} 
              onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button bg="red.500" _hover={{ bg: "red.600" }} onClick={confirmDelete} ml={3}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 