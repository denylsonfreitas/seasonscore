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
import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SeriesReview, getSeriesReviews, deleteReview } from "../services/reviews";
import { Footer } from "../components/common/Footer";
import { ReviewModal } from "../components/reviews/ReviewModal";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { ReviewDetailsModal } from "../components/reviews/ReviewDetailsModal";
import { getUserData } from "../services/users";
import { SeriesHeader } from "../components/series/SeriesHeader";
import { User as FirebaseUser } from "firebase/auth";

// Componente memoizado para séries relacionadas
const RelatedSeries = memo(({ relatedSeries, isLoading, currentSeriesId }: any) => {
  // Se não tiver séries relacionadas ou estiver carregando, não renderiza
  if (isLoading || !relatedSeries?.results || relatedSeries.results.length === 0) return null;

  return (
    <Container maxW="1200px" py={8}>
      <Box>
        <Flex direction="column" gap={4}>
          {relatedSeries.results.map((series: any) => (
            <Box key={series.id}>
              {/* Conteúdo existente... */}
            </Box>
          ))}
        </Flex>
      </Box>
    </Container>
  );
});

RelatedSeries.displayName = 'RelatedSeries';

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
  const seriesDetailsRef = useRef<HTMLDivElement>(null);
  const userDataFetched = useRef(false);

  // Priorizar o carregamento dos dados da série primeiro
  const { data: series, isLoading, isError, error } = useQuery({
    queryKey: ["series", id],
    queryFn: () => getSeriesDetails(Number(id)),
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  // Redirecionar para a página NotFound se a série não for encontrada
  useEffect(() => {
    if (!isLoading && !series && isError) {
      navigate('/404', { replace: true });
    }
  }, [isLoading, series, isError, navigate]);

  // Carregar avaliações depois da série principal
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getSeriesReviews(Number(id)),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled: !!series, // Só carrega após o series estar disponível
  });

  // Buscar avaliação do usuário atual - memoizado para evitar recálculos
  const userReview = useMemo(() => 
    reviews.find((review) => review.userId === currentUser?.uid),
    [reviews, currentUser?.uid]
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
      seriesName: series.name || "",
      seriesPoster: series.poster_path || "",
      seasonNumber: selectedSeason,
      rating: seasonReview.rating,
      comment: seasonReview.comment || "",
      comments: seasonReview.comments || [],
      reactions: seasonReview.reactions || { likes: [], dislikes: [] },
      createdAt: seasonReview.createdAt || new Date()
    };
  }, [selectedReview?.id, selectedSeason, id, series?.name, series?.poster_path, reviews]);

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
      seriesName: series.name || "",
      seriesPoster: series.poster_path || "",
      seasonNumber: selectedSeason,
      rating: seasonReview.rating,
      comment: seasonReview.comment || "",
      comments: seasonReview.comments || [],
      reactions: seasonReview.reactions || { likes: [], dislikes: [] },
      createdAt: seasonReview.createdAt || new Date()
    };
  }, [userReview?.id, selectedSeason, id, series?.name, series?.poster_path]);

  // Atualiza o selectedReview quando os reviews forem atualizados
  useEffect(() => {
    if (selectedReview && reviews.length > 0) {
      const updatedReview = reviews
        .find(review => review.id === selectedReview.id)
        ?.seasonReviews
        .find(sr => sr.seasonNumber === selectedSeason);

      if (updatedReview) {
        setSelectedReview((prev: typeof selectedReview) => ({
          ...prev,
          ...updatedReview
        }));
      }
    }
  }, [reviews, selectedReview?.id, selectedSeason]);

  // Carregar séries relacionadas apenas após o carregamento da série principal
  const { data: relatedSeries, isLoading: isLoadingRelated } = useQuery({
    queryKey: ["related-series", id],
    queryFn: () => getRelatedSeries(Number(id)),
    enabled: !!series, // Só carrega após o series estar disponível
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Usar useCallback para evitar recriações desnecessárias da função
  const fetchUserData = useCallback(async (user: FirebaseUser) => {
    if (userDataFetched.current) return;
    
    try {
      const data = await getUserData(user.uid);
      setUserData(data);
      userDataFetched.current = true;
    } catch (error) {
    }
  }, []);

  // Buscar dados do usuário apenas uma vez
  useEffect(() => {
    if (currentUser && !userDataFetched.current) {
      fetchUserData(currentUser);
    }
  }, [currentUser, fetchUserData]);

  const handleDeleteReview = useCallback(async () => {
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
  }, [userReview, seasonToDelete, id, queryClient, toast]);

  // Processamento de URLs com parâmetros de consulta
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reviewId = searchParams.get('reviewId');
    const seasonNumberParam = searchParams.get('seasonNumber');
    
    if (reviewId && series && !isLoading) {
      // Processar com atraso curto para garantir que os componentes estejam carregados
      const timer = setTimeout(() => {
        const handleReviewFromUrl = async () => {
          try {
            // Verificar primeiro se já temos as avaliações carregadas
            let reviewsData = reviews;
            
            // Se não tivermos avaliações carregadas ou se precisarmos atualizar
            if (!reviewsData.length) {
              reviewsData = await queryClient.fetchQuery({
                queryKey: ["reviews", id],
                queryFn: () => getSeriesReviews(Number(id)),
              });
            }
            
            if (!reviewsData || !reviewsData.length) {
              return;
            }
            
            const review = reviewsData.find(r => r.id === reviewId);
            if (!review) {
              return;
            }
            
            const season = seasonNumberParam ? parseInt(seasonNumberParam, 10) : review.seasonReviews[0]?.seasonNumber || 1;
            const seasonReview = review.seasonReviews.find(sr => sr.seasonNumber === season);
            
            if (!seasonReview) {
              return;
            }
            
            setSelectedSeason(season);
            
            const reviewForModal = {
              id: review.id,
              seriesId: id!,
              userId: review.userId,
              userEmail: review.userEmail,
              seriesName: series.name || "",
              seriesPoster: series.poster_path || "",
              seasonNumber: season,
              rating: seasonReview.rating,
              comment: seasonReview.comment || "",
              comments: seasonReview.comments || [],
              reactions: seasonReview.reactions || { likes: [], dislikes: [] },
              createdAt: seasonReview.createdAt || new Date()
            };
            
            setSelectedReview(reviewForModal);
            setIsReviewDetailsOpen(true);
            
            // Limpar parâmetros de URL
            navigate(`/series/${id}`, { replace: true });
          } catch (error) {
          }
        };
        
        handleReviewFromUrl();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [id, series, isLoading, navigate, queryClient, reviews]);

  // Memoize o componente renderizado para o estado de carregamento
  const LoadingComponent = useMemo(() => (
    <Center minH="70vh">
      <Spinner size="xl" color="primary.500" />
    </Center>
  ), []);

  // Memoize o componente de erro
  const NotFoundComponent = useMemo(() => (
    <Box bg="gray.900" minH="100vh" pt="80px">
      <Container maxW="1200px" py={8}>
        <Box>Série não encontrada</Box>
      </Container>
    </Box>
  ), []);

  if (isLoading) return LoadingComponent;
  if (!series) return NotFoundComponent;

  return (
    <Flex direction="column" minH="100vh" bg="gray.900" ref={seriesDetailsRef}>
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

        {/* Séries Relacionadas - renderização condicional */}
        {!isLoadingRelated && relatedSeries?.results && Array.isArray(relatedSeries.results) && relatedSeries.results.length > 0 && (
          <RelatedSeries 
            relatedSeries={relatedSeries} 
            isLoading={isLoadingRelated} 
            currentSeriesId={id!}
          />
        )}
      </Box>

      <Footer />

      {/* Modais */}
      {isOpen && (
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
      )}

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
        review={currentReview}
        onReviewUpdated={() => {
          queryClient.invalidateQueries({
            queryKey: ["reviews", id],
          });
        }}
      />
    </Flex>
  );
}