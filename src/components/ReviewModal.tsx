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
  Select,
  useToast,
  Box,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { RatingStars } from "./RatingStars";
import { addSeasonReview } from "../services/reviews";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { getSeriesReviews } from "../services/reviews";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesId: number;
  seriesName: string;
  numberOfSeasons: number;
  initialSeason?: number;
}

export function ReviewModal({
  isOpen,
  onClose,
  seriesId,
  seriesName,
  numberOfSeasons,
  initialSeason = 1,
}: ReviewModalProps) {
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  useEffect(() => {
    setSelectedSeason(initialSeason);
  }, [initialSeason]);

  useEffect(() => {
    async function loadUserReviews() {
      if (!currentUser) return;
      try {
        const reviews = await getSeriesReviews(seriesId);
        const userReview = reviews.find(review => review.userId === currentUser.uid);
        if (userReview) {
          const seasonReview = userReview.seasonReviews.find(
            sr => sr.seasonNumber === selectedSeason
          );
          if (seasonReview) {
            setRating(seasonReview.rating);
            setComment(seasonReview.comment || "");
          } else {
            setRating(0);
            setComment("");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar avaliações:", error);
      }
    }
    loadUserReviews();
  }, [currentUser, seriesId, selectedSeason]);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota para a temporada.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma nota válida (0.5 a 5, apenas incrementos de 0.5)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addSeasonReview(seriesId, selectedSeason, rating, comment);
      queryClient.invalidateQueries({ queryKey: ["reviews", seriesId] });
      toast({
        title: "Avaliação enviada",
        description: "Sua avaliação foi salva com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Ocorreu um erro ao salvar sua avaliação. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader color="white">Avaliar {seriesName}</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Text color="gray.400" mb={2}>Selecione a temporada:</Text>
              <Select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                bg="gray.700"
                color="white"
                borderColor="gray.600"
              >
                {Array.from({ length: numberOfSeasons }, (_, i) => i + 1).map(
                  (season) => (
                    <option key={season} value={season} style={{ backgroundColor: "#2D3748" }}>
                      Temporada {season}
                    </option>
                  )
                )}
              </Select>
            </Box>

            <Box>
              <Text color="gray.400" mb={2}>Sua avaliação:</Text>
              <RatingStars
                rating={rating}
                onChange={setRating}
                size={40}
                isEditable
              />
            </Box>

            <Box>
              <Text color="gray.400" mb={2}>Comentário (opcional):</Text>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário sobre a temporada..."
                bg="gray.700"
                color="white"
                borderColor="gray.600"
                _placeholder={{ color: "gray.400" }}
                rows={4}
              />
            </Box>

            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              width="full"
            >
              Enviar Avaliação
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
