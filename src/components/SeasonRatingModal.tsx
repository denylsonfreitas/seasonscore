import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Textarea,
  useToast,
  Box,
  Link,
} from "@chakra-ui/react";
import { useState } from "react";
import { RatingStars } from "./RatingStars";
import { useAuth } from "../contexts/AuthContext";
import { addSeasonReview } from "../services/reviews";
import { Link as RouterLink } from "react-router-dom";

interface SeasonRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesId: number;
  seasonNumber: number;
  onReviewAdded?: () => void;
}

export function SeasonRatingModal({
  isOpen,
  onClose,
  seriesId,
  seasonNumber,
  onReviewAdded,
}: SeasonRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para avaliar uma temporada",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma nota",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addSeasonReview(seriesId, seasonNumber, rating, comment);
      toast({
        title: "Sucesso",
        description: "Sua avaliação foi salva com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onReviewAdded?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar sua avaliação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader color="white">
          Avaliar Temporada {seasonNumber}
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          {currentUser ? (
            <VStack spacing={4} align="stretch">
              <Box>
                <Text color="white" mb={2}>Sua nota:</Text>
                <RatingStars
                  rating={rating}
                  onChange={setRating}
                  size={32}
                  isEditable
                />
              </Box>
              <Box>
                <Text color="white" mb={2}>Comentário (opcional):</Text>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="O que você achou desta temporada?"
                  bg="gray.700"
                  color="white"
                  border="none"
                  _placeholder={{ color: "gray.400" }}
                  resize="vertical"
                  minH="100px"
                />
              </Box>
              <Button
                colorScheme="teal"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                width="full"
              >
                Salvar Avaliação
              </Button>
            </VStack>
          ) : (
            <VStack spacing={4} align="center" py={4}>
              <Text color="white" textAlign="center">
                Você precisa estar logado para avaliar uma temporada
              </Text>
              <Link
                as={RouterLink}
                to="/login"
                onClick={onClose}
              >
                <Button colorScheme="teal">
                  Fazer Login
                </Button>
              </Link>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 