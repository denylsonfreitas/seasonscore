import type { ReviewTarget } from "../types/review";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
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
  Center,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails, getRelatedSeries } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SeriesReview, getSeriesReviews, deleteReview } from "../services/reviews";
import { ReviewModal } from "../components/reviews/ReviewModal";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { SeriesHeader } from "../components/series/SeriesHeader";
import { SeasonsSection } from "../components/series/SeasonsSection";
import { SeriesDetailsTabs } from "../components/series/SeriesDetailsTabs";
import { PageContainer } from "../components/layout/PageContainer";
import { RelatedSeries } from "../components/series/RelatedSeries";
import { SEO } from "../components/common/SEO";

export function SeriesDetails() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [existingReview, setExistingReview] = useState<SeriesReview | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);

  // Combinar estados relacionados para reduzir re-renders
  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    seasonToDelete: null as number | null,
  });

  const cancelRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  // Queries
  const {
    data: series,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
    refetchOnWindowFocus: true,
    staleTime: 30000,
    enabled: !!series,
  });

  const { data: relatedSeries, isLoading: isLoadingRelated } = useQuery({
    queryKey: ["related-series", id],
    queryFn: () => getRelatedSeries(Number(id)),
    enabled: !!series,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Efeitos e dados derivados
  useEffect(() => {
    if (!isLoading && !series && isError) {
      navigate("/404", { replace: true });
    }
  }, [isLoading, series, isError, navigate]);

  const userReview = useMemo(
    () => reviews.find((review) => review.userId === currentUser?.uid),
    [reviews, currentUser?.uid]
  );
  // Memoizar dados do SEO para evitar recálculos
  const seoData = useMemo(
    () => ({
      title: series ? `${series.name} | SeasonScore` : "Carregando série | SeasonScore",
      description: series
        ? `Avalie e confira as reviews da série ${series.name} no SeasonScore.`
        : "Carregando detalhes da série.",
      image: series?.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : "",
    }),
    [series]
  );

  // Callbacks otimizados
  const handleDeleteReview = useCallback(async () => {
    if (!currentUser || !series || !deleteState.seasonToDelete || !userReview?.id) {
      toast({
        title: "Erro ao excluir avaliação",
        description: "Dados inválidos para exclusão da avaliação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await deleteReview(userReview.id, deleteState.seasonToDelete);
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      toast({
        title: "Avaliação excluída com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Erro ao excluir avaliação",
        description: "Por favor, tente novamente mais tarde.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteState({
        isOpen: false,
        seasonToDelete: null,
      });
    }
  }, [currentUser, series, deleteState.seasonToDelete, userReview, id, queryClient, toast]);

  const handleReviewClick = useCallback(
    (review: ReviewTarget) => {
      navigate(`/reviews/${review.id}/${review.seasonNumber}`);
    },
    [navigate]
  );
  const handleCancelDelete = useCallback(() => {
    setDeleteState({
      isOpen: false,
      seasonToDelete: null,
    });
  }, []);

  const handleModalClose = useCallback(() => {
    onClose();
    queryClient.invalidateQueries({ queryKey: ["reviews", id] });
  }, [onClose, queryClient, id]);

  const handleReviewEditModalClose = useCallback(() => {
    setExistingReview(null);
    queryClient.invalidateQueries({ queryKey: ["reviews", id] });
  }, [queryClient, id]);

  // Memoizar handlers para componentes filhos
  // Memoizar componentes que podem ser caros de renderizar
  const LoadingComponent = useMemo(
    () => (
      <Center minH="70vh">
        <Spinner size="lg" color="signal.400" />
      </Center>
    ),
    []
  );

  const NotFoundComponent = useMemo(
    () => (
      <PageContainer py={16}>
        <Box color="ink.300">Série não encontrada.</Box>
      </PageContainer>
    ),
    []
  );

  const communityScore = useMemo(() => {
    const ratings = reviews.flatMap((r) => r.seasonReviews.map((sr) => sr.rating));
    if (!ratings.length) return undefined;
    return { average: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length };
  }, [reviews]);

  if (isLoading) return LoadingComponent;
  if (!series) return NotFoundComponent;

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        image={seoData.image}
        type="article"
      />

      <Box>
        <SeriesHeader series={series} communityScore={communityScore} onRate={onOpen} />

        <PageContainer pb={{ base: 12, md: 16 }}>
          <SeasonsSection
            series={series}
            reviews={reviews}
            userReview={userReview}
            currentUser={currentUser}
            selectedSeason={selectedSeason}
            onSeasonSelect={setSelectedSeason}
            onOpenReviewModal={onOpen}
            onEditReview={setExistingReview}
            onDeleteReview={(season) => setDeleteState({ isOpen: true, seasonToDelete: season })}
            onReviewClick={handleReviewClick}
          />

          <SeriesDetailsTabs series={series} />

          <RelatedSeries
            relatedSeries={relatedSeries}
            isLoading={isLoadingRelated}
            currentSeriesId={id!}
          />
        </PageContainer>

        {isOpen && (
          <ReviewModal
            isOpen={isOpen}
            onClose={handleModalClose}
            seriesId={Number(id)}
            seriesName={series.name}
            numberOfSeasons={series.number_of_seasons}
            initialSeason={selectedSeason}
            posterPath={series.poster_path || undefined}
          />
        )}

        {existingReview && (
          <ReviewEditModal
            isOpen={!!existingReview}
            onClose={handleReviewEditModalClose}
            review={{
              ...existingReview,
              id: existingReview.id,
              userId: existingReview.userId,
              userEmail: existingReview.userEmail,
              seriesId: existingReview.seriesId,
              seasonReviews: existingReview.seasonReviews,
              series: {
                name: series?.name || "",
                poster_path: series?.poster_path || "",
              },
            }}
            initialSeasonNumber={selectedSeason}
            onReviewUpdated={handleReviewEditModalClose}
          />
        )}

        <AlertDialog
          isOpen={deleteState.isOpen}
          leastDestructiveRef={cancelRef}
          onClose={handleCancelDelete}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Excluir avaliação
              </AlertDialogHeader>
              <AlertDialogBody color="ink.200">
                Tem certeza que deseja excluir sua avaliação da temporada{" "}
                {deleteState.seasonToDelete}? Esta ação não pode ser desfeita.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={handleCancelDelete} variant="ghost">
                  Cancelar
                </Button>
                <Button colorScheme="red" onClick={handleDeleteReview} ml={3}>
                  Excluir
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </>
  );
}
