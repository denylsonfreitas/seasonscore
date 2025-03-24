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
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000
  });

  // Buscar avaliação do usuário atual
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

  // Capturar parâmetros da URL para abrir automaticamente detalhes da avaliação
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reviewId = searchParams.get('reviewId');
    const seasonNumberParam = searchParams.get('seasonNumber');
    
    if (reviewId && series && !isLoading) {
      // Adicionar um pequeno atraso para garantir que os dados estejam disponíveis
      const timer = setTimeout(() => {
        try {
          // Buscar avaliações da série
          queryClient.fetchQuery({
            queryKey: ["reviews", id],
            queryFn: () => getSeriesReviews(Number(id)),
          }).then((reviews) => {
            // Garantir que temos algo para processar
            if (!reviews || reviews.length === 0) {
              console.log("Nenhuma avaliação encontrada para a série");
              return;
            }
            
            // Encontrar a avaliação específica
            const review = reviews.find(review => review.id === reviewId);
            if (!review) {
              console.log(`Avaliação com ID ${reviewId} não encontrada`);
              return;
            }
            
            // Selecionar a temporada correta se fornecida
            const season = seasonNumberParam ? parseInt(seasonNumberParam, 10) : review.seasonReviews[0]?.seasonNumber || 1;
            
            // Encontrar a avaliação da temporada específica
            const seasonReview = review.seasonReviews.find(sr => sr.seasonNumber === season);
            
            if (!seasonReview) {
              console.log(`Temporada ${season} não encontrada na avaliação`);
              return;
            }
            
            // Atualizar o estado da temporada selecionada
            setSelectedSeason(season);
            
            // Criar objeto para o modal com os dados necessários
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
            
            // Definir a avaliação selecionada e abrir o modal
            setSelectedReview(reviewForModal);
            setIsReviewDetailsOpen(true);
            
            // Limpar os parâmetros da URL para evitar abrir novamente ao atualizar
            navigate(`/series/${id}`, { replace: true });
          }).catch(error => {
            console.error("Erro ao buscar detalhes da avaliação:", error);
          });
        } catch (error) {
          console.error("Erro ao processar parâmetros de URL:", error);
        }
      }, 300); // Pequeno atraso para garantir que os componentes estejam montados
      
      return () => clearTimeout(timer);
    }
  }, [id, series, isLoading, navigate, queryClient]);

  if (isLoading) {
    return (
      <Center minH="70vh">
        <Spinner size="xl" color="primary.500" />
      </Center>
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