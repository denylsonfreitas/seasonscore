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
  Center,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getSeriesDetails, getRelatedSeries } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SeriesReview, getSeriesReviews, deleteReview } from "../services/reviews";
import { Footer } from "../components/common/Footer";
import { ReviewModal } from "../components/reviews/ReviewModal";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { getUserData } from "../services/users";
import { SeriesHeader } from "../components/series/SeriesHeader";
import { RelatedSeries } from "../components/series/RelatedSeries";
import { User as FirebaseUser } from "firebase/auth";
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
    seasonToDelete: null as number | null
  });
  
  const [userData, setUserData] = useState<{ photoURL?: string | null } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const seriesDetailsRef = useRef<HTMLDivElement>(null);
  const userDataFetched = useRef(false);

  // Queries
  const { data: series, isLoading, isError } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
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
      navigate('/404', { replace: true });
    }
  }, [isLoading, series, isError, navigate]);

  const userReview = useMemo(() => 
    reviews.find((review) => review.userId === currentUser?.uid),
    [reviews, currentUser?.uid]
  );

  const currentUserReview = useMemo(() => {
    if (!userReview || !series) return null;

    const seasonReview = userReview.seasonReviews.find(sr => sr.seasonNumber === selectedSeason);
    if (!seasonReview) return null;

    return {
      id: userReview.id!,
      seriesId: id!,
      userId: userReview.userId!,
      userEmail: userReview.userEmail!,
      seriesName: series.name || "",
      seriesPoster: series.poster_path || "",
      seasonNumber: selectedSeason,
      rating: seasonReview.rating,
      comment: seasonReview.comment || "",
      comments: seasonReview.comments || [],
      reactions: seasonReview.reactions || { likes: [] },
      createdAt: seasonReview.createdAt || new Date()
    };
  }, [userReview, series, selectedSeason, id]);

  // Memoizar dados do SEO para evitar recálculos
  const seoData = useMemo(() => ({
    title: series ? `${series.name} | SeasonScore` : 'Carregando série | SeasonScore',
    description: series 
      ? `Avalie e confira as reviews da série ${series.name} no SeasonScore.`
      : 'Carregando detalhes da série.',
    image: series?.poster_path 
      ? `https://image.tmdb.org/t/p/w500${series.poster_path}` 
      : ''
  }), [series]);

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
        seasonToDelete: null
      });
    }
  }, [currentUser, series, deleteState.seasonToDelete, userReview?.id, id, queryClient, toast]);

  const handleReviewClick = useCallback((review: any) => {
    navigate(`/reviews/${review.id}/${review.seasonNumber}`);
  }, [navigate]);

  const handleEditReview = useCallback((seasonNumber: number) => {
    navigate(`/series/${id}/season/${seasonNumber}/review`);
  }, [navigate, id]);

  const handleDeleteClick = useCallback((seasonNumber: number) => {
    setDeleteState({
      isOpen: true,
      seasonToDelete: seasonNumber
    });
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteState({
      isOpen: false,
      seasonToDelete: null
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
  const handleSetDeleteAlertOpen = useCallback((isOpen: boolean) => {
    setDeleteState(prev => ({ ...prev, isOpen }));
  }, []);

  const handleSetSeasonToDelete = useCallback((seasonToDelete: number | null) => {
    setDeleteState(prev => ({ ...prev, seasonToDelete }));
  }, []);

  // Buscar dados do usuário
  useEffect(() => {
    if (!currentUser || userDataFetched.current) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getUserData(currentUser.uid);
        if (userDoc) {
          setUserData(userDoc);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    userDataFetched.current = true;
  }, [currentUser]);

  // Memoizar componentes que podem ser caros de renderizar
  const LoadingComponent = useMemo(() => (
    <Center minH="70vh">
      <Spinner size="xl" color="primary.500" />
    </Center>
  ), []);

  const NotFoundComponent = useMemo(() => (
    <Box bg="gray.900" minH="100vh" pt="80px">
      <Container maxW="container.lg" py={8}>
        <Box>Série não encontrada</Box>
      </Container>
    </Box>
  ), []);

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
      
      <Flex direction="column" minH="100vh" bg="gray.900" ref={seriesDetailsRef}>
        <Box flex="1">
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
            onSetDeleteAlertOpen={handleSetDeleteAlertOpen}
            onSetSeasonToDelete={handleSetSeasonToDelete}
            onReviewClick={handleReviewClick}
            navigate={navigate}
          />

          <RelatedSeries 
            relatedSeries={relatedSeries} 
            isLoading={isLoadingRelated} 
            currentSeriesId={id!}
          />
        </Box>

        <Footer />

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
                name: series?.name || '',
                poster_path: series?.poster_path || '',
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
            <AlertDialogContent bg="gray.800">
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
                Excluir avaliação
              </AlertDialogHeader>
              <AlertDialogBody color="white">
                Tem certeza que deseja excluir sua avaliação da temporada {deleteState.seasonToDelete}? Esta ação não pode ser desfeita.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button
                  ref={cancelRef}
                  onClick={handleCancelDelete}
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
                >
                  Excluir
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Flex>
    </>
  );
}