import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Avatar,
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
} from '../../services/comments';
import { UserName } from '../common/UserName';

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
}

export function CommentSection({ objectId, objectType, commentsCount }: CommentSectionProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  
  const bgColor = 'gray.800';
  const borderColor = 'gray.700';

  useEffect(() => {
    loadComments();
  }, [objectId, objectType]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await getComments(objectId, objectType);
      setComments(commentsData);
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
      
      const addedComment = await addComment(objectId, objectType, newComment.trim());
      
      setComments([addedComment, ...comments]);
      setNewComment('');
      
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
      
      setComments(comments.filter(comment => comment.id !== commentToDelete));
      
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
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 0);
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

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
    >
      <Box p={6}>
        <Heading as="h2" size="md" mb={6}>
          Comentários ({comments.length || commentsCount})
        </Heading>

        {currentUser ? (
          <Flex mb={6}>
            <Avatar
              size="sm"
              src={currentUser.photoURL || undefined}
              name={currentUser.displayName || currentUser.email || undefined}
              mr={2}
            />
            <Box flex="1">
              <Input
                ref={commentInputRef}
                placeholder={
                  editingComment
                    ? "Editar comentário..."
                    : "Deixe seu comentário..."
                }
                value={editingComment ? editContent : newComment}
                onChange={editingComment ? 
                  (e) => setEditContent(e.target.value) : 
                  (e) => setNewComment(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    editingComment ? handleUpdateComment() : handleAddComment();
                  }
                }}
                bg="gray.700"
                borderColor="gray.600"
              />
            </Box>
            <Button
              ml={2}
              colorScheme="primary"
              isLoading={isSubmitting}
              onClick={editingComment ? handleUpdateComment : handleAddComment}
            >
              {editingComment ? "Atualizar" : "Comentar"}
            </Button>
            {editingComment && (
              <Button
                ml={2}
                variant="ghost"
                color="gray.500"
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
              >
                Cancelar
              </Button>
            )}
          </Flex>
        ) : (
          <Text mb={6} fontStyle="italic" textAlign="center">
            <Link to="/login">
              <Text color="primary.500" fontWeight="medium">
                Faça login
              </Text>
            </Link>
            {' '}para deixar um comentário
          </Text>
        )}

        <Divider mb={6} />

        <VStack spacing={4} align="stretch">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} p={4} borderWidth="1px" borderRadius="md">
                <Flex>
                  <Skeleton height="32px" width="32px" borderRadius="full" mr={2} />
                  <Box flex="1">
                    <Skeleton height="20px" width="120px" mb={2} />
                    <Skeleton height="16px" width="100%" />
                  </Box>
                </Flex>
              </Box>
            ))
          ) : comments.length === 0 ? (
            <Text textAlign="center" fontStyle="italic" color="gray.500">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </Text>
          ) : (
            comments.map((comment) => (
              <Box
                key={comment.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor={borderColor}
                bg="gray.700"
              >
                <Flex justify="space-between" mb={2}>
                  <HStack>
                    <Flex alignItems="center">
                      <Avatar 
                        size="sm" 
                        src={comment.userPhotoURL || undefined}
                        name={comment.userDisplayName || comment.username} 
                        mr={2} 
                      />
                      <UserName userId={comment.userId} />
                    </Flex>
                    <Text fontSize="sm" color="gray.500">
                      • {formatRelativeTime(comment.createdAt)}
                      {comment.updatedAt && comment.updatedAt > comment.createdAt && (
                        <Text as="span" fontSize="xs" ml={1}>
                          (editado)
                        </Text>
                      )}
                    </Text>
                  </HStack>

                  {currentUser && currentUser.uid === comment.userId && (
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FaEllipsisV />}
                        variant="ghost"
                        size="sm"
                        aria-label="Opções"
                        color="gray.400"
                      />
                      <MenuList bg="gray.800" borderColor="gray.700">
                        <MenuItem 
                          icon={<FaEdit />} 
                          onClick={() => handleEditClick(comment)}
                          _hover={{ bg: "gray.700" }}
                          bg="gray.800"
                        >
                          Editar
                        </MenuItem>
                        <MenuItem 
                          icon={<FaTrash />} 
                          onClick={() => handleDeleteClick(comment.id)}
                          color="red.500"
                          _hover={{ bg: "gray.700" }}
                          bg="gray.800"
                        >
                          Excluir
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                </Flex>

                <Text mt={2}>{comment.content}</Text>
              </Box>
            ))
          )}
        </VStack>
      </Box>

      <AlertDialog
        isOpen={deleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Excluir comentário
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 