import type { SeasonReview } from "../types/review";
import type { UserData } from "../services/users";
import {
  Box,
  HStack,
  Text,
  Button,
  Image,
  useToast,
  Spinner,
  Center,
  Grid,
  Heading,
  Link,
  Tooltip,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { ArrowLeft, ChatCircle, NotePencil, Share } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import { getReviewDetails, toggleReaction } from "../services/reviews";
import { getUserData } from "../services/users";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RatingStars } from "../components/common/RatingStars";
import { UserAvatar } from "../components/common/UserAvatar";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { CommentSection } from "../components/common/CommentSection";
import { ReactionButtons } from "../components/reviews/ReactionButtons";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/common/EmptyState";
import { SeasonStrip } from "../components/series/SeasonStrip";
import { SpoilerText } from "../components/reviews/SpoilerText";

type ReviewDetails = NonNullable<Awaited<ReturnType<typeof getReviewDetails>>>;

export function ReviewDetails() {
  const { reviewId, seasonNumber: seasonNumberParam } = useParams<{
    reviewId: string;
    seasonNumber: string;
  }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();

  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasonNumberParam ? parseInt(seasonNumberParam) : 1
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loadingReactions, setLoadingReactions] = useState<{ [key: string]: boolean }>({});
  const [localCommentsCount, setLocalCommentsCount] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Seleção da temporada atual para exibição
  const activeSeasonReview = review?.seasonReviews?.find(
    (sr: SeasonReview) => sr.seasonNumber === selectedSeasonNumber
  );

  // Buscar detalhes da avaliação
  const fetchReviewDetails = useCallback(async () => {
    if (!reviewId) return;

    // Só exibir o loading na primeira carga
    if (isInitialLoad) {
      setIsLoading(true);
    }

    try {
      const reviewData = await getReviewDetails(reviewId);
      if (!reviewData) {
        toast({
          title: "Avaliação não encontrada",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/reviews");
        return;
      }

      // Se temos um número de temporada na URL, verificar se existe
      if (seasonNumberParam) {
        const seasonExists = reviewData.seasonReviews.some(
          (sr: SeasonReview) => sr.seasonNumber === parseInt(seasonNumberParam)
        );

        if (!seasonExists) {
          // Se a temporada não existe, usar a primeira temporada disponível
          setSelectedSeasonNumber(reviewData.seasonReviews[0]?.seasonNumber || 1);
        }
      }

      setReview(reviewData);

      // Buscar dados do usuário que fez a avaliação
      const userDataResult = await getUserData(reviewData.userId);
      setUserData(userDataResult);

      // Após a primeira carga bem-sucedida, atualizar o estado
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes da avaliação:", error);
      toast({
        title: "Erro ao carregar avaliação",
        description: "Não foi possível carregar os detalhes da avaliação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [reviewId, seasonNumberParam, navigate, toast, isInitialLoad]);

  // Nova função para atualizar em segundo plano sem alterar o estado de loading
  const updateReviewInBackground = useCallback(async () => {
    if (!reviewId) return;

    try {
      const reviewData = await getReviewDetails(reviewId);
      if (!reviewData) return;

      setReview(reviewData);

      // Atualizar dados do usuário apenas se necessário
      if (!userData) {
        const userDataResult = await getUserData(reviewData.userId);
        setUserData(userDataResult);
      }
    } catch (error) {
      console.error("Erro ao atualizar avaliação em segundo plano:", error);
      // Não mostrar toast de erro para o usuário durante atualizações em segundo plano
    }
  }, [reviewId, userData]);

  useEffect(() => {
    fetchReviewDetails();
  }, [fetchReviewDetails]);

  // Função para atualizar a avaliação após edição
  const handleReviewUpdated = useCallback(() => {
    fetchReviewDetails();
  }, [fetchReviewDetails]);

  // Efeito para atualizar estados de reação quando a revisão muda
  useEffect(() => {
    if (activeSeasonReview?.reactions?.likes) {
      const userLiked = currentUser
        ? activeSeasonReview.reactions.likes.includes(currentUser.uid)
        : false;
      setIsLiked(userLiked);
      setLikesCount(activeSeasonReview.reactions.likes.length || 0);
    } else {
      setIsLiked(false);
      setLikesCount(0);
    }
  }, [activeSeasonReview, currentUser]);

  // Lidar com reações (curtidas) - Versão com UI otimista
  const handleReaction = useCallback(
    async (reviewId: string, seasonNumber: number, type: "likes", _event: React.MouseEvent) => {
      if (!currentUser || !review) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para reagir a uma avaliação",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const loadingKey = `${reviewId}-${seasonNumber}-${type}`;

      // Evitar múltiplos cliques
      if (loadingReactions[loadingKey]) return;

      setLoadingReactions((prev) => ({ ...prev, [loadingKey]: true }));

      try {
        // Atualizar UI imediatamente (abordagem otimista)
        setIsLiked(!isLiked);
        setLikesCount((prevCount) => (isLiked ? Math.max(0, prevCount - 1) : prevCount + 1));

        // Atualizar a cópia local do review para refletir a reação
        const updatedReview = { ...review };
        const seasonIndex = updatedReview.seasonReviews.findIndex(
          (sr: SeasonReview) => sr.seasonNumber === seasonNumber
        );

        if (seasonIndex !== -1) {
          // Garantir que o objeto reactions existe
          if (!updatedReview.seasonReviews[seasonIndex].reactions) {
            updatedReview.seasonReviews[seasonIndex].reactions = { likes: [] };
          }

          const likes = updatedReview.seasonReviews[seasonIndex].reactions.likes;

          if (isLiked) {
            // Remover o like
            const userIndex = likes.indexOf(currentUser.uid);
            if (userIndex !== -1) {
              likes.splice(userIndex, 1);
            }
          } else {
            // Adicionar o like
            if (!likes.includes(currentUser.uid)) {
              likes.push(currentUser.uid);
            }
          }

          setReview(updatedReview);
        }

        // Chamar API em background
        await toggleReaction(reviewId, seasonNumber, type);

        // Atualizar dados em segundo plano sem mostrar carregamento
        setTimeout(() => {
          updateReviewInBackground();
        }, 1000);
      } catch (error) {
        console.error("Erro ao reagir à avaliação:", error);

        // Reverter a UI em caso de erro
        setIsLiked(!isLiked); // Reverte a alteração otimista
        setLikesCount((prevCount) => (!isLiked ? Math.max(0, prevCount - 1) : prevCount + 1)); // Reverte a contagem

        toast({
          title: "Erro",
          description: "Não foi possível processar sua reação.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoadingReactions((prev) => ({ ...prev, [loadingKey]: false }));
      }
    },
    [currentUser, toast, loadingReactions, isLiked, likesCount, review, updateReviewInBackground]
  );

  const handleShare = async () => {
    if (!review) return;

    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);

      toast({
        title: "Link copiado!",
        description: "O link para esta avaliação foi copiado para sua área de transferência",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Função para atualizar a contagem de comentários localmente
  const handleCommentsCountChange = (count: number) => {
    setLocalCommentsCount(count);
  };

  // Resetar a contagem local de comentários quando a revisão ou temporada mudar
  useEffect(() => {
    setLocalCommentsCount(null);
  }, [reviewId, selectedSeasonNumber]);

  if (isLoading && isInitialLoad) {
    return (
      <Center minH="60vh">
        <Spinner size="lg" color="signal.400" />
      </Center>
    );
  }

  if (!review || !activeSeasonReview) {
    return (
      <PageContainer py={16}>
        <EmptyState
          icon={ChatCircle}
          title="Avaliação não encontrada."
          description="Ela pode ter sido excluída pelo autor."
          action={
            <Button as={RouterLink} to="/reviews" size="sm" variant="outline">
              Ver outras avaliações
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // Formatação das datas
  let createdAtDate;

  try {
    // Verificar o tipo de dado
    if (activeSeasonReview.createdAt instanceof Date) {
      createdAtDate = activeSeasonReview.createdAt;
    }
    // Verificar se é um objeto Firestore Timestamp
    else if (
      activeSeasonReview.createdAt &&
      typeof activeSeasonReview.createdAt === "object" &&
      "toDate" in activeSeasonReview.createdAt &&
      typeof activeSeasonReview.createdAt.toDate === "function"
    ) {
      createdAtDate = activeSeasonReview.createdAt.toDate();
    }
    // Verificar se é um timestamp numérico (em segundos ou milissegundos)
    else if (typeof activeSeasonReview.createdAt === "number") {
      // Se for em segundos (timestamp do Firestore), converter para milissegundos
      const timestamp =
        activeSeasonReview.createdAt < 1000000000000
          ? activeSeasonReview.createdAt * 1000 // É em segundos, converter para milissegundos
          : activeSeasonReview.createdAt; // Já está em milissegundos
      createdAtDate = new Date(timestamp);
    }
    // Se for uma string, tentar parseá-la
    else if (typeof activeSeasonReview.createdAt === "string") {
      createdAtDate = new Date(activeSeasonReview.createdAt);
    }
    // Caso não seja nenhum dos formatos reconhecidos
    else {
      console.warn("Formato de data não reconhecido:", activeSeasonReview.createdAt);
      createdAtDate = new Date(); // Usar data atual como fallback
    }
  } catch (error) {
    console.error("Erro ao processar data:", error);
    createdAtDate = new Date(); // Usar data atual como fallback
  }

  // Verificar se a data é válida
  const isValidDate = createdAtDate && !isNaN(createdAtDate.getTime());

  const formattedDateDistance = isValidDate
    ? formatDistanceToNow(createdAtDate, { locale: ptBR, addSuffix: true })
    : "Data desconhecida";
  const formattedDate = isValidDate
    ? format(createdAtDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data desconhecida";

  const commentsCount =
    localCommentsCount !== null ? localCommentsCount : activeSeasonReview.comments?.length || 0;
  const authorName = userData?.displayName || userData?.username || review.userEmail || "Usuário";

  return (
    <>
      <PageContainer py={{ base: 6, md: 10 }} maxW="960px">
        <Link
          as={RouterLink}
          to={`/series/${review.seriesId}`}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          fontSize="sm"
          color="ink.300"
          _hover={{ color: "ink.50", textDecoration: "none" }}
        >
          <ArrowLeft size={14} />
          {review.series.name}
        </Link>

        <Grid
          as="article"
          mt={6}
          templateColumns={{ base: "88px 1fr", md: "160px 1fr" }}
          columnGap={{ base: 4, md: 8 }}
          rowGap={6}
        >
          <Link as={RouterLink} to={`/series/${review.seriesId}`} alignSelf="start">
            <Box
              aspectRatio={2 / 3}
              borderRadius="md"
              overflow="hidden"
              bg="ink.850"
              boxShadow="inset 0 0 0 1px rgba(255,255,255,0.06)"
            >
              {review.series.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${review.series.poster_path}`}
                  alt={`Pôster de ${review.series.name}`}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              )}
            </Box>
          </Link>

          <Box minW={0}>
            <Text textStyle="label" color="ink.400">
              Avaliação · Temporada {selectedSeasonNumber}
            </Text>
            <Heading as="h1" size="h1" mt={1.5} noOfLines={2}>
              {review.series.name}
            </Heading>

            <HStack mt={4} spacing={3}>
              <UserAvatar
                userId={review.userId}
                userEmail={review.userEmail}
                photoURL={userData?.photoURL}
                name={authorName}
                size="sm"
              />
              <Box lineHeight="short">
                <Link
                  as={RouterLink}
                  to={`/u/${userData?.username || review.userEmail}`}
                  fontWeight={600}
                  color="ink.100"
                  fontSize="sm"
                  _hover={{ color: "signal.300", textDecoration: "none" }}
                >
                  {authorName}
                </Link>
                <Tooltip label={formattedDate} placement="bottom-start">
                  <Text fontSize="xs" color="ink.400" fontFamily="mono">
                    {formattedDateDistance}
                  </Text>
                </Tooltip>
              </Box>
            </HStack>

            <Box mt={4}>
              <RatingStars rating={activeSeasonReview.rating || 0} size={22} showNumber={false} />
            </Box>
          </Box>

          <Box gridColumn="1 / -1" maxW="720px">
            {activeSeasonReview.comment ? (
              <SpoilerText
                text={activeSeasonReview.comment}
                hasSpoiler={activeSeasonReview.hasSpoiler}
                isOwn={currentUser?.uid === review.userId}
                fontSize={{ base: "md", md: "lg" }}
                lineHeight="tall"
                color="ink.100"
                whiteSpace="pre-wrap"
                overflowWrap="anywhere"
              />
            ) : (
              <Text color="ink.400" fontStyle="italic">
                Avaliou sem comentar.
              </Text>
            )}

            <HStack
              mt={6}
              pt={4}
              spacing={1}
              borderTop="1px solid"
              borderColor="ink.800"
              flexWrap="wrap"
            >
              <Box onClick={(e) => e.stopPropagation()}>
                <ReactionButtons
                  reviewId={reviewId || ""}
                  seasonNumber={selectedSeasonNumber}
                  likes={activeSeasonReview.reactions?.likes || []}
                  onReaction={handleReaction}
                  isLoading={loadingReactions[`${reviewId}-${selectedSeasonNumber}-likes`] || false}
                  forcedLikeState={isLiked}
                  forcedLikesCount={likesCount}
                />
              </Box>
              <Button
                as="a"
                href="#comentarios"
                leftIcon={<ChatCircle size={16} />}
                variant="ghost"
                size="sm"
              >
                <Text as="span" fontFamily="mono">
                  {commentsCount}
                </Text>
              </Button>
              <Button
                leftIcon={<Share size={16} />}
                variant="ghost"
                size="sm"
                onClick={handleShare}
              >
                Copiar link
              </Button>
              {currentUser?.uid === review.userId && (
                <Button
                  leftIcon={<NotePencil size={16} />}
                  variant="ghost"
                  size="sm"
                  ml="auto"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Editar
                </Button>
              )}
            </HStack>
          </Box>
        </Grid>

        {review.seasonReviews.length > 1 && (
          <Box as="section" mt={10}>
            <Text textStyle="label" color="ink.400" mb={3}>
              Outras temporadas nesta avaliação
            </Text>
            <Box
              p={4}
              bg="ink.900"
              border="1px solid"
              borderColor="ink.800"
              borderRadius="md"
              display="inline-block"
            >
              <SeasonStrip
                seasons={[...review.seasonReviews]
                  .sort((a, b) => a.seasonNumber - b.seasonNumber)
                  .map((sr) => ({ season: sr.seasonNumber, score: sr.rating }))}
                selected={selectedSeasonNumber}
                onSelect={(season) => navigate(`/reviews/${reviewId}/${season}`)}
                height={48}
              />
            </Box>
          </Box>
        )}

        <Box as="section" id="comentarios" mt={10} scrollMarginTop="80px">
          <CommentSection
            objectId={reviewId || ""}
            seasonNumber={selectedSeasonNumber}
            objectType="review"
            commentsCount={activeSeasonReview?.comments?.length || 0}
            onCommentsCountChange={handleCommentsCountChange}
          />
        </Box>
      </PageContainer>

      {isEditModalOpen && (
        <ReviewEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          review={review}
          onReviewUpdated={handleReviewUpdated}
          initialSeasonNumber={selectedSeasonNumber}
        />
      )}
    </>
  );
}
