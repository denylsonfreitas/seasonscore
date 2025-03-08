import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { updateReview, deleteReview } from "../services/reviews";
import { RatingStars } from "./RatingStars";
import { useAuth } from "../contexts/AuthContext";
import { SeriesReview } from "../services/reviews";

interface ReviewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: SeriesReview & {
    series: {
      name: string;
    };
  };
  onReviewUpdated: () => void;
}

export function ReviewEditModal({
  isOpen,
  onClose,
  review,
  onReviewUpdated,
}: ReviewEditModalProps) {
  const [rating, setRating] = useState(review.seasonReviews?.[0]?.rating || 0);
  const [comment, setComment] = useState(
    review.seasonReviews?.[0]?.comment || ""
  );
  const [seasonNumber, setSeasonNumber] = useState(
    review.seasonReviews?.[0]?.seasonNumber || 1
  );
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
      await updateReview(review.id!, seasonNumber, rating, comment);
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
      console.error("Erro ao atualizar avaliação:", error);
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
      console.error("Erro ao excluir avaliação:", error);
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
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">
            Editar avaliação - {review.series.name}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="white">Temporada</FormLabel>
                <Select
                  value={seasonNumber}
                  onChange={(e) => {
                    const newSeasonNumber = Number(e.target.value);
                    setSeasonNumber(newSeasonNumber);
                    const seasonReview = review.seasonReviews.find(
                      (sr) => sr.seasonNumber === newSeasonNumber
                    );
                    setRating(seasonReview?.rating || 0);
                    setComment(seasonReview?.comment || "");
                  }}
                  bg="gray.700"
                  color="white"
                  borderColor="gray.600"
                  _hover={{ borderColor: "gray.500" }}
                >
                  {review.seasonReviews.map((sr) => (
                    <option key={sr.seasonNumber} value={sr.seasonNumber} style={{ backgroundColor: "#2D3748" }}>
                      Temporada {sr.seasonNumber}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="white">Nota</FormLabel>
                <RatingStars
                  rating={rating}
                  isEditable
                  onChange={(newRating) => setRating(newRating)}
                />
              </FormControl>
              <FormControl>
                <FormLabel color="white">Comentário</FormLabel>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Adicione um comentário (opcional)"
                  bg="gray.700"
                  color="white"
                  borderColor="gray.600"
                  _hover={{ borderColor: "gray.500" }}
                  _placeholder={{ color: "gray.400" }}
                  resize="vertical"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={() => setIsDeleteAlertOpen(true)}
              isLoading={isDeleting}
            >
              Excluir
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleUpdateReview}
              isLoading={isUpdating}
            >
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Excluir avaliação
            </AlertDialogHeader>
            <AlertDialogBody color="white">
              Tem certeza que deseja excluir sua avaliação da temporada {seasonNumber}? Esta ação não pode ser desfeita.
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
                colorScheme="red"
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
