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
  FormControl,
  FormLabel,
  Spinner,
  Center,
  HStack,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { RatingStars } from "../common/RatingStars";
import { addSeasonReview } from "../../services/reviews";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getSeriesReviews } from "../../services/reviews";
import { getSeriesDetails } from "../../services/tmdb";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesId: number;
  seriesName?: string;
  numberOfSeasons?: number;
  initialSeason?: number;
  onBack?: () => void;
}

const COMMENT_MAX_LENGTH = 280;

export function ReviewModal({
  isOpen,
  onClose,
  seriesId,
  seriesName: propSeriesName,
  numberOfSeasons: propNumberOfSeasons,
  initialSeason = 1,
  onBack,
}: ReviewModalProps) {
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [seriesDetails, setSeriesDetails] = useState<{
    name: string;
    number_of_seasons: number;
  } | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const seriesName = propSeriesName || seriesDetails?.name || "";
  const numberOfSeasons = propNumberOfSeasons || seriesDetails?.number_of_seasons || 0;

  useEffect(() => {
    if (isOpen && !propSeriesName && !propNumberOfSeasons) {
      const fetchSeriesDetails = async () => {
        setIsLoading(true);
        try {
          const details = await getSeriesDetails(seriesId);
          setSeriesDetails(details);
        } catch (error) {
          console.error("Erro ao buscar detalhes da série:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os detalhes da série",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchSeriesDetails();
    }
  }, [isOpen, seriesId, propSeriesName, propNumberOfSeasons, toast]);

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

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Carregando...</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Center py={10}>
              <Spinner size="xl" color="teal.400" />
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (!seriesName || numberOfSeasons === 0) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl"
      scrollBehavior="inside"
      blockScrollOnMount={false}
    >
      <ModalOverlay />
      <ModalContent bg="gray.900">
        <ModalHeader color="white">Avaliar {seriesName}</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text color="gray.400" mb={2}>Temporada:</Text>
              <Select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                sx={{
                  "& option": {
                    bg: "gray.800",
                    color: "white"
                  }
                }}
              >
                {Array.from({ length: numberOfSeasons }, (_, i) => i + 1).map((season) => (
                  <option key={season} value={season}>
                    Temporada {season}
                  </option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text color="gray.400" mb={2}>Avaliação:</Text>
              <RatingStars
                rating={rating}
                onRatingChange={setRating}
                size={32}
                isEditable
              />
            </Box>

            <FormControl mt={4}>
              <FormLabel color="white">Comentário (opcional)</FormLabel>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário sobre a temporada..."
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                _hover={{ borderColor: "gray.500" }}
                _focus={{ borderColor: "teal.400", boxShadow: "none" }}
                maxLength={COMMENT_MAX_LENGTH}
              />
              <Text color="gray.400" fontSize="sm" mt={1} textAlign="right">
                {comment.length}/{COMMENT_MAX_LENGTH} caracteres
              </Text>
            </FormControl>

            <HStack spacing={4} justify="space-between">
              {onBack && (
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  colorScheme="teal"
                  borderColor="teal.500"
                  color="teal.300"
                  _hover={{ bg: "rgba(49, 151, 149, 0.2)" }}
                >
                  Voltar para busca
                </Button>
              )}
              <Button
                colorScheme="teal"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Salvando..."
                ml={onBack ? 0 : 'auto'}
              >
                Salvar avaliação
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
