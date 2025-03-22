import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Spinner,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails, getRelatedSeries } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SeriesReview, getSeriesReviews, deleteReview } from "../services/reviews";
import { Footer } from "../components/common/Footer";
import { ReviewModal } from "../components/reviews/ReviewModal";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { ReviewDetailsModal } from "../components/reviews/ReviewDetailsModal";
import { getUserData } from "../services/users";
import { SeriesHeader } from "../components/series/SeriesHeader";
import { RelatedSeries } from "../components/series/RelatedSeries";

export function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [existingReview, setExistingReview] = useState<SeriesReview | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<number | null>(null);
  const [isReviewDetailsOpen, setIsReviewDetailsOpen] = useState(false);
  const [userData, setUserData] = useState<{ photoURL?: string | null } | null>(null);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: series, isLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Buscar avaliação do usuário atual
  const userReview = reviews.find(
    (review) => review.userId === currentUser?.uid
  );

  // Encontra a review atualizada baseada no selectedReview
  const currentReview = useMemo(() => {
    if (!selectedReview || !series) return null;
    
    const review = reviews.find(r => r.id === selectedReview.id);
    if (!review) return null;

    const seasonReview = review.seasonReviews.find(sr => sr.seasonNumber === selectedSeason);
    if (!seasonReview) return null;

    return {
      id: review.id,
      seriesId: id!,
      userId: review.userId,
      userEmail: review.userEmail,
      seriesName: series.name,
      seriesPoster: series.poster_path || "",
      seasonNumber: selectedSeason,
      rating: seasonReview.rating,
      comment: seasonReview.comment || "",
      comments: seasonReview.comments || [],
      reactions: seasonReview.reactions || { likes: [], dislikes: [] },
      createdAt: seasonReview.createdAt || new Date()
    };
  }, [selectedReview, reviews, selectedSeason, id, series]);

  // Encontra a review do usuário atual
  const currentUserReview = useMemo(() => {
    if (!userReview || !series) return null;

    const seasonReview = userReview.seasonReviews.find(sr => sr.seasonNumber === selectedSeason);
    if (!seasonReview) return null;

    return {
      id: userReview.id!,
      seriesId: id!,
      userId: userReview.userId!,
      userEmail: userReview.userEmail!,
      seriesName: series.name,
      seriesPoster: series.poster_path || "",
      seasonNumber: selectedSeason,
      rating: seasonReview.rating,
      comment: seasonReview.comment || "",
      comments: seasonReview.comments || [],
      reactions: seasonReview.reactions || { likes: [], dislikes: [] },
      createdAt: seasonReview.createdAt || new Date()
    };
  }, [userReview, selectedSeason, id, series]);

  // Atualiza o selectedReview quando os reviews forem atualizados
  useEffect(() => {
    if (selectedReview && reviews.length > 0) {
      const updatedReview = reviews
        .find(review => review.id === selectedReview.id)
        ?.seasonReviews
        .find(sr => sr.seasonNumber === selectedSeason);

      if (updatedReview) {
        setSelectedReview({
          ...updatedReview,
          id: selectedReview.id,
          userId: selectedReview.userId,
          userEmail: selectedReview.userEmail
        });
      }
    }
  }, [reviews, selectedReview, selectedSeason]);

  const { data: relatedSeries, isLoading: isLoadingRelated } = useQuery({
    queryKey: ["related-series", id],
    queryFn: () => getRelatedSeries(Number(id)),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const data = await getUserData(currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleDeleteReview = async () => {
    if (!userReview || seasonToDelete === null) return;

    try {
      await deleteReview(userReview.id!, seasonToDelete);
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      toast({
        title: "Avaliação excluída",
        description: "Sua avaliação foi excluída com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir sua avaliação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setSeasonToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (!series) {
    return (
      <Box bg="gray.900" minH="100vh" pt="80px">
        <Container maxW="1200px" py={8}>
          <Box>Série não encontrada</Box>
        </Container>
      </Box>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        {/* Cabeçalho da Série com as abas */}
        <SeriesHeader 
          series={series} 
          isLoading={isLoading}
                                            reviews={reviews}
          userReview={userReview}
          currentUser={currentUser}
          userData={userData}
          seriesId={id!}
          onSeasonSelect={setSelectedSeason}
          onOpenReviewModal={onOpen}
          onSetExistingReview={setExistingReview}
          onSetDeleteAlertOpen={setIsDeleteAlertOpen}
          onSetSeasonToDelete={setSeasonToDelete}
                                            onReviewClick={(review) => {
                                              setSelectedReview(review);
                                              setIsReviewDetailsOpen(true);
                                            }}
          navigate={navigate}
        />

        {/* Séries Relacionadas */}
        <RelatedSeries 
          relatedSeries={relatedSeries} 
          isLoading={isLoadingRelated} 
          currentSeriesId={id!}
        />
      </Box>

      <Footer />

      {/* Modais */}
      <ReviewModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          queryClient.invalidateQueries({ queryKey: ["reviews", id] });
        }}
        seriesId={Number(id)}
        seriesName={series.name}
        numberOfSeasons={series.number_of_seasons}
        initialSeason={selectedSeason}
        posterPath={series.poster_path || undefined}
      />

      {existingReview && (
        <ReviewEditModal
          isOpen={!!existingReview}
          onClose={() => setExistingReview(null)}
          review={{
            ...existingReview,
            id: existingReview.id,
            userId: existingReview.userId,
            userEmail: existingReview.userEmail,
            seriesId: existingReview.seriesId,
            seasonReviews: existingReview.seasonReviews,
            series: {
              name: series?.name || '',
              poster_path: series?.poster_path || '',
            },
          }}
          initialSeasonNumber={selectedSeason}
          onReviewUpdated={() => {
            setExistingReview(null);
            queryClient.invalidateQueries({
              queryKey: ["reviews", id],
            });
          }}
        />
      )}

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setIsDeleteAlertOpen(false);
          setSeasonToDelete(null);
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Excluir avaliação
            </AlertDialogHeader>
            <AlertDialogBody color="white">
              Tem certeza que deseja excluir sua avaliação da temporada {seasonToDelete}? Esta ação não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  setIsDeleteAlertOpen(false);
                  setSeasonToDelete(null);
                }}
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
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <ReviewDetailsModal
        isOpen={isReviewDetailsOpen}
        onClose={() => {
          setIsReviewDetailsOpen(false);
          setSelectedReview(null);
        }}
        review={currentReview || currentUserReview}
        onReviewUpdated={() => {
          queryClient.invalidateQueries({
            queryKey: ["reviews", id],
          });
        }}
      />
    </Flex>
  );
}