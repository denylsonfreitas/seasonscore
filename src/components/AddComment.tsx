import {
  Box,
  Button,
  Textarea,
  VStack,
  useToast,
  HStack,
  Avatar,
  Text,
  Collapse,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { addCommentToReview } from "../services/reviews";
import { ChatCircle } from "@phosphor-icons/react";

interface AddCommentProps {
  reviewId: string;
  seasonNumber: number;
  onCommentAdded?: () => void;
}

const MAX_COMMENT_LENGTH = 200;

export function AddComment({
  reviewId,
  seasonNumber,
  onCommentAdded,
}: AddCommentProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_COMMENT_LENGTH) {
      setContent(newContent);
    }
  };

  const remainingChars = MAX_COMMENT_LENGTH - content.length;
  const isNearLimit = remainingChars <= 50;

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comentar",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!currentUser.email) {
      toast({
        title: "Erro",
        description: "Seu email não foi encontrado. Por favor, faça login novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "O comentário não pode estar vazio",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCommentToReview(reviewId, seasonNumber, content.trim());
      setContent("");
      setIsExpanded(false);
      onCommentAdded?.();
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o comentário",
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
          name={currentUser.email || undefined} 
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
                >
                  Cancelar
                </Button>
                <Button
                  colorScheme="teal"
                  size="sm"
                  isLoading={isSubmitting}
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