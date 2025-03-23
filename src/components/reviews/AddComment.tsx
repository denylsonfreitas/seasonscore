import {
  Box,
  Button,
  Textarea,
  VStack,
  useToast,
  HStack,
  Avatar,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { addCommentToReview } from "../../services/reviews";
import { ChatCircle } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";

interface AddCommentProps {
  reviewId: string;
  seasonNumber: number;
  seriesId: number;
  onCommentAdded?: () => void;
}

const MAX_COMMENT_LENGTH = 200;

export function AddComment({
  reviewId,
  seasonNumber,
  seriesId,
  onCommentAdded,
}: AddCommentProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_COMMENT_LENGTH) {
      setContent(newContent);
    }
  };

  const remainingChars = MAX_COMMENT_LENGTH - content.length;
  const isNearLimit = remainingChars <= 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    const newComment = {
      id: "",
      userId: currentUser.uid,
      userEmail: currentUser.email || "",
      content: content,
      createdAt: new Date(),
      reactions: {
        likes: [],
        dislikes: []
      }
    };

    // Atualização otimista do cache
    const previousData = queryClient.getQueryData<any>(["reviews", seriesId]);
    
    queryClient.setQueryData(["reviews", seriesId], (old: any) => {
      if (!old) return old;
      return old.map((review: any) => {
        if (review.id === reviewId) {
          const updatedReview = {
            ...review,
            seasonReviews: review.seasonReviews.map((sr: any) => {
              if (sr.seasonNumber === seasonNumber) {
                return {
                  ...sr,
                  comments: [...(sr.comments || []), newComment]
                };
              }
              return sr;
            })
          };
          return updatedReview;
        }
        return review;
      });
    });

    try {
      await addCommentToReview(reviewId, seasonNumber, content);
      setContent("");
      setIsExpanded(false);
      onCommentAdded?.();
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      // Reverte a atualização otimista em caso de erro
      queryClient.setQueryData(["reviews", seriesId], previousData);
      toast({
        title: "Erro ao adicionar comentário",
        description: "Ocorreu um erro ao adicionar seu comentário. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Box bg="gray.700" p={4} borderRadius="md" width="100%">
        <Text color="gray.400" fontSize="sm" textAlign="center">
          Faça login para comentar
        </Text>
      </Box>
    );
  }

  return (
    <Box bg="gray.700" p={4} borderRadius="md" width="100%">
      <HStack spacing={3} align="start">
        <Avatar 
          size="sm" 
          src={currentUser.photoURL || undefined}
        />
        <VStack spacing={3} flex={1}>
          {!isExpanded ? (
            <Button
              variant="unstyled"
              width="100%"
              height="40px"
              bg="gray.600"
              color="gray.400"
              textAlign="left"
              pl={4}
              _hover={{ bg: "gray.500" }}
              onClick={() => setIsExpanded(true)}
              leftIcon={<ChatCircle size={20} />}
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
            >
              Escreva um comentário...
            </Button>
          ) : (
            <>
              <VStack spacing={1} align="stretch" width="100%">
                <Textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Escreva seu comentário..."
                  bg="gray.600"
                  color="white"
                  border="none"
                  _placeholder={{ color: "gray.400" }}
                  resize="vertical"
                  minH="80px"
                  maxLength={MAX_COMMENT_LENGTH}
                  autoFocus
                />
                <Text 
                  fontSize="xs" 
                  color={isNearLimit ? (remainingChars === 0 ? "red.400" : "yellow.400") : "gray.400"}
                  alignSelf="flex-end"
                >
                  {remainingChars} caracteres restantes
                </Text>
              </VStack>
              <HStack spacing={2} alignSelf="flex-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                  }}
                  color="gray.500"
                >
                  Cancelar
                </Button>
                <Button
                  colorScheme="primary"
                  isLoading={isSubmitting}
                  size="sm"
                  onClick={handleSubmit}
                  isDisabled={!content.trim()}
                >
                  Comentar
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      </HStack>
    </Box>
  );
} 