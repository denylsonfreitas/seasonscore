import { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Button,
  Textarea,
  useToast,
  HStack,
  Avatar,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
} from "@chakra-ui/react";
import { Star } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import {
  SeriesReview,
  addSeasonReview,
  getSeriesReviews,
} from "../services/reviews";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ReviewSectionProps {
  seriesId: number;
  numberOfSeasons: number;
}

export function ReviewSection({
  seriesId,
  numberOfSeasons,
}: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [seasonNumber, setSeasonNumber] = useState(1);
  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", seriesId],
    queryFn: () => getSeriesReviews(seriesId),
  });

  const mutation = useMutation({
    mutationFn: () => addSeasonReview(seriesId, seasonNumber, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", seriesId] });
      setRating(0);
      setComment("");
      toast({
        title: "Avaliação enviada com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente mais tarde.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      return toast({
        title: "Selecione uma classificação",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
    mutation.mutate();
  }

  // Calcula a média das avaliações por temporada
  const seasonAverages = Array.from({ length: numberOfSeasons }, (_, i) => {
    const seasonReviews = reviews.flatMap((review) =>
      review.seasonReviews.filter((sr) => sr.seasonNumber === i + 1)
    );
    if (seasonReviews.length === 0) return null;
    const average =
      seasonReviews.reduce((acc, review) => acc + review.rating, 0) /
      seasonReviews.length;
    return average.toFixed(1);
  });

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch" mb={8}>
          <Text color="white" fontSize="lg" fontWeight="bold">
            Sua avaliação
          </Text>
          <HStack spacing={2}>
            <Text color="white">Temporada:</Text>
            <select
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(Number(e.target.value))}
              style={{
                background: "#2D3748",
                color: "white",
                padding: "8px",
                borderRadius: "4px",
                border: "none",
              }}
            >
              {Array.from({ length: numberOfSeasons }, (_, i) => i + 1).map(
                (season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                )
              )}
            </select>
          </HStack>
          <HStack spacing={2}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="ghost"
                color={value <= rating ? "yellow.400" : "gray.400"}
                onClick={() => setRating(value)}
                _hover={{ color: "yellow.400" }}
              >
                <Star size={24} weight={value <= rating ? "fill" : "regular"} />
              </Button>
            ))}
          </HStack>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva sua avaliação..."
            bg="gray.700"
            border="none"
            color="white"
            _focus={{ ring: 1, ringColor: "teal.500" }}
            minH="120px"
          />
          <Button
            type="submit"
            colorScheme="teal"
            isLoading={mutation.isPending}
          >
            Enviar avaliação
          </Button>
        </VStack>
      </form>

      <Divider borderColor="gray.700" mb={8} />

      <VStack align="stretch" spacing={4}>
        <Text color="white" fontSize="lg" fontWeight="bold">
          Avaliações dos usuários
        </Text>
        {isLoading ? (
          <Text color="gray.400">Carregando avaliações...</Text>
        ) : reviews.length === 0 ? (
          <Text color="gray.400">Nenhuma avaliação ainda.</Text>
        ) : (
          <Accordion allowMultiple>
            {Array.from({ length: numberOfSeasons }, (_, i) => i + 1).map(
              (season) => {
                const seasonReviews = reviews.flatMap((review) =>
                  review.seasonReviews.filter(
                    (sr) => sr.seasonNumber === season
                  )
                );

                if (seasonReviews.length === 0) return null;

                return (
                  <AccordionItem key={`season-${season}`} border="none">
                    <AccordionButton
                      bg="gray.800"
                      _hover={{ bg: "gray.700" }}
                      mb={2}
                      borderRadius="md"
                    >
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <Text color="white">Temporada {season}</Text>
                          {seasonAverages[season - 1] && (
                            <Badge colorScheme="yellow">
                              {seasonAverages[season - 1]} ★
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                      <AccordionIcon color="white" />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <VStack spacing={4} align="stretch">
                        {seasonReviews.map((review) => (
                          <Box
                            key={`review-${review.userId}-${season}`}
                            bg="gray.800"
                            p={4}
                            borderRadius="lg"
                          >
                            <HStack spacing={4} mb={2}>
                              <Avatar
                                size="sm"
                                name={review.userEmail || "Usuário"}
                                bg="teal.500"
                              />
                              <VStack align="start" spacing={0}>
                                <Text color="white">{review.userEmail}</Text>
                                <HStack>
                                  {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                      key={`star-${review.userId}-${season}-${index}`}
                                      size={16}
                                      weight={
                                        index < review.rating
                                          ? "fill"
                                          : "regular"
                                      }
                                      color={
                                        index < review.rating
                                          ? "#F6E05E"
                                          : "#A0AEC0"
                                      }
                                    />
                                  ))}
                                </HStack>
                              </VStack>
                            </HStack>
                            <Text color="gray.300">{review.comment}</Text>
                            <Text color="gray.500" fontSize="sm" mt={2}>
                              {review.createdAt instanceof Date
                                ? review.createdAt.toLocaleDateString("pt-BR")
                                : review.createdAt
                                    ?.toDate()
                                    .toLocaleDateString("pt-BR")}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                );
              }
            )}
          </Accordion>
        )}
      </VStack>
    </Box>
  );
}
