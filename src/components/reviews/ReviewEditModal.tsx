import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  useToast,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  HStack,
  Box,
  Image,
  Flex,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { updateReview, deleteReview, SeriesReview } from "../../services/reviews";
import { RatingStars } from "../common/RatingStars";
import { useAuth } from "../../contexts/AuthContext";
import { SpoilerToggle } from "./SpoilerToggle";

interface ReviewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: SeriesReview & {
    series: {
      name: string;
      poster_path?: string | null;
    };
  };
  onReviewUpdated: () => void;
  initialSeasonNumber?: number;
}

const COMMENT_MAX_LENGTH = 200;

export function ReviewEditModal({
  isOpen,
  onClose,
  review,
  onReviewUpdated,
  initialSeasonNumber,
}: ReviewEditModalProps) {
  // Encontrar a avaliação da temporada inicial
  const initialSeasonReview = initialSeasonNumber
    ? review.seasonReviews.find(
        (sr: { seasonNumber: number }) => sr.seasonNumber === initialSeasonNumber
      )
    : review.seasonReviews[0];

  const [rating, setRating] = useState(initialSeasonReview?.rating || 0);
  const [comment, setComment] = useState(initialSeasonReview?.comment || "");
  const [hasSpoiler, setHasSpoiler] = useState(!!initialSeasonReview?.hasSpoiler);
  const [seasonNumber, setSeasonNumber] = useState(initialSeasonReview?.seasonNumber || 1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { currentUser } = useAuth();

  // Se não houver avaliações, não renderiza o modal
  if (!review.seasonReviews?.length) {
    return null;
  }

  const handleUpdateReview = async () => {
    if (!currentUser) return;

    setIsUpdating(true);
    try {
      await updateReview(review.id!, seasonNumber, rating, comment, hasSpoiler);
      toast({
        title: "Avaliação atualizada",
        description: "Sua avaliação foi atualizada com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onReviewUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar sua avaliação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentUser) return;

    setIsDeleting(true);
    try {
      await deleteReview(review.id!, seasonNumber);
      toast({
        title: "Avaliação excluída",
        description: "Sua avaliação foi excluída com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onReviewUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir sua avaliação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        scrollBehavior="inside"
        blockScrollOnMount={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar avaliação</ModalHeader>
          <ModalCloseButton color="white" p={6} />
          <ModalBody pb={6}>
            <HStack spacing={6} align="start" mb={4}>
              {review.series.poster_path && (
                <Box width="93px" flexShrink={0}>
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${review.series.poster_path}`}
                    alt={review.series.name}
                    borderRadius="md"
                    width="100%"
                  />
                </Box>
              )}
              <VStack spacing={4} align="stretch" flex={1}>
                <Text color="white" fontSize="2xl" fontWeight="bold">
                  {review.series.name}
                </Text>
                <Box>
                  <Text color="gray.400" mb={2}>
                    Temporada:
                  </Text>
                  <Select
                    value={seasonNumber}
                    onChange={(e) => {
                      const newSeasonNumber = Number(e.target.value);
                      setSeasonNumber(newSeasonNumber);
                      const seasonReview = review.seasonReviews.find(
                        (sr: {
                          seasonNumber: number;
                          rating: number;
                          comment?: string;
                          hasSpoiler?: boolean;
                        }) => sr.seasonNumber === newSeasonNumber
                      );
                      setRating(seasonReview?.rating || 0);
                      setComment(seasonReview?.comment || "");
                      setHasSpoiler(!!seasonReview?.hasSpoiler);
                    }}
                  >
                    {review.seasonReviews.map((sr: { seasonNumber: number }) => (
                      <option key={sr.seasonNumber} value={sr.seasonNumber}>
                        Temporada {sr.seasonNumber}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Box>
                  <Text color="gray.400" mb={2}>
                    Avaliação:
                  </Text>
                  <RatingStars rating={rating} onChange={setRating} size={32} isEditable />
                </Box>
                <FormControl mt={4}>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="O que você achou desta temporada?"
                    maxLength={COMMENT_MAX_LENGTH}
                  />
                  <Text color="ink.400" fontSize="xs" mt={1} textAlign="right" fontFamily="mono">
                    {comment.length}/{COMMENT_MAX_LENGTH}
                  </Text>
                  <SpoilerToggle
                    isChecked={hasSpoiler}
                    onChange={setHasSpoiler}
                    isDisabled={!comment.trim()}
                  />
                </FormControl>

                <Flex direction="row" gap={3} mt={2}>
                  <Button
                    bg="red.500"
                    _hover={{ bg: "red.600" }}
                    onClick={() => setIsDeleteAlertOpen(true)}
                    isLoading={isDeleting}
                    flex="1"
                  >
                    Excluir
                  </Button>
                  <Button
                    colorScheme="primary"
                    onClick={handleUpdateReview}
                    isLoading={isUpdating}
                    flex="1"
                  >
                    Salvar
                  </Button>
                </Flex>
              </VStack>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Excluir avaliação
            </AlertDialogHeader>
            <AlertDialogBody color="white">
              Tem certeza que deseja excluir sua avaliação da temporada {seasonNumber}? Esta ação
              não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => setIsDeleteAlertOpen(false)}
                variant="ghost"
                color="white"
                _hover={{ bg: "gray.700" }}
              >
                Cancelar
              </Button>
              <Button
                bg="red.500"
                _hover={{ bg: "red.600" }}
                onClick={handleDeleteReview}
                ml={3}
                isLoading={isDeleting}
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
