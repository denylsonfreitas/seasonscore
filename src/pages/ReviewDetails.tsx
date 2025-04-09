import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Image,
  Divider,
  useToast,
  Spinner,
  Center,
  Icon,
  Badge,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorModeValue,
  Tooltip,
  Grid,
  GridItem,
  Collapse,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { ArrowLeft, ChatCircle, Heart, Star, NotePencil, User, Calendar, Clock } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import { getReviewDetails, toggleReaction } from "../services/reviews";
import { getUserData } from "../services/users";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RatingStars } from "../components/common/RatingStars";
import { UserAvatar } from "../components/common/UserAvatar";
import { UserName } from "../components/common/UserName";
import { ReviewEditModal } from "../components/reviews/ReviewEditModal";
import { CommentSection } from "../components/common/CommentSection";
import { ReactionButtons } from "../components/reviews/ReactionButtons";
import { Footer } from "../components/common/Footer";
import { PageHeader } from "../components/common/PageHeader";

export function ReviewDetails() {
  const { reviewId, seasonNumber: seasonNumberParam } = useParams<{ reviewId: string; seasonNumber: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  
  const [review, setReview] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasonNumberParam ? parseInt(seasonNumberParam) : 1
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loadingReactions, setLoadingReactions] = useState<{[key: string]: boolean}>({});
  const { isOpen: isCommentExpanded, onToggle: toggleComments } = useDisclosure();

  // Cores e estilos
  const cardBg = useColorModeValue("gray.800", "gray.800");
  const cardBorderColor = useColorModeValue("gray.700", "gray.700");
  const cardHoverBg = useColorModeValue("gray.750", "gray.750");
  const primaryColor = useColorModeValue("primary.500", "primary.400");
  const textColor = useColorModeValue("white", "white");
  const mutedTextColor = useColorModeValue("gray.400", "gray.400");

  // Seleção da temporada atual para exibição
  const activeSeasonReview = review?.seasonReviews?.find(
    (sr: any) => sr.seasonNumber === selectedSeasonNumber
  );

  // Buscar detalhes da avaliação
  const fetchReviewDetails = useCallback(async () => {
    if (!reviewId) return;
    
    setIsLoading(true);
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
          (sr: any) => sr.seasonNumber === parseInt(seasonNumberParam)
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
      setIsLoading(false);
    }
  }, [reviewId, seasonNumberParam, navigate, toast]);

  useEffect(() => {
    fetchReviewDetails();
  }, [fetchReviewDetails]);

  // Função para atualizar a avaliação após edição
  const handleReviewUpdated = useCallback(() => {
    fetchReviewDetails();
  }, [fetchReviewDetails]);

  // Lidar com reações (curtidas)
  const handleReaction = useCallback(async (reviewId: string, seasonNumber: number, type: "likes", event: React.MouseEvent) => {
    if (!currentUser) {
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
    setLoadingReactions(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      await toggleReaction(reviewId, seasonNumber, type);
      fetchReviewDetails();
    } catch (error) {
      console.error("Erro ao reagir à avaliação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua reação.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingReactions(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [currentUser, fetchReviewDetails, toast]);

  if (isLoading) {
    return (
      <Center minH="100vh" bg="gray.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="primary.500" thickness="4px" speed="0.65s" />
          <Text color="gray.400" fontWeight="medium">Carregando avaliação...</Text>
        </VStack>
      </Center>
    );
  }

  if (!review || !activeSeasonReview) {
    return (
      <Center minH="100vh" bg="gray.900">
        <VStack spacing={6} p={8} bg="gray.800" borderRadius="xl" boxShadow="lg" maxW="md" textAlign="center">
          <Icon as={ChatCircle} boxSize={16} color="gray.500" />
          <Text color="gray.400" fontSize="lg">Avaliação não encontrada</Text>
          <Button 
            as={RouterLink} 
            to="/reviews" 
            leftIcon={<ArrowLeft />}
            colorScheme="primary"
            size="lg"
            w="full"
            borderRadius="lg"
          >
            Voltar para avaliações
          </Button>
        </VStack>
      </Center>
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
    else if (activeSeasonReview.createdAt && 
             typeof activeSeasonReview.createdAt === 'object' && 
             'toDate' in activeSeasonReview.createdAt && 
             typeof activeSeasonReview.createdAt.toDate === 'function') {
      createdAtDate = activeSeasonReview.createdAt.toDate();
    }
    // Verificar se é um timestamp numérico (em segundos ou milissegundos)
    else if (typeof activeSeasonReview.createdAt === 'number') {
      // Se for em segundos (timestamp do Firestore), converter para milissegundos
      const timestamp = activeSeasonReview.createdAt < 1000000000000 
        ? activeSeasonReview.createdAt * 1000 // É em segundos, converter para milissegundos
        : activeSeasonReview.createdAt; // Já está em milissegundos
      createdAtDate = new Date(timestamp);
    }
    // Se for uma string, tentar parseá-la
    else if (typeof activeSeasonReview.createdAt === 'string') {
      createdAtDate = new Date(activeSeasonReview.createdAt);
    }
    // Caso não seja nenhum dos formatos reconhecidos
    else {
      console.warn('Formato de data não reconhecido:', activeSeasonReview.createdAt);
      createdAtDate = new Date(); // Usar data atual como fallback
    }
  } catch (error) {
    console.error('Erro ao processar data:', error);
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

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">

      <Container maxW="container.lg" py={8} flex="1">
        {/* Breadcrumbs com efeito de hover */}
        <Breadcrumb 
          mb={6} 
          color="gray.400" 
          separator=">" 
          fontSize="sm" 
          fontWeight="medium"
          spacing={2}
        >
          <BreadcrumbItem>
            <BreadcrumbLink 
              as={RouterLink} 
              to="/series" 
              _hover={{ color: "primary.300", textDecoration: "none" }}
              transition="color 0.2s ease"
            >
              Séries
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink 
              as={RouterLink} 
              to={`/series/${review.seriesId}`} 
              _hover={{ color: "primary.300", textDecoration: "none" }}
              transition="color 0.2s ease"
            >
              {review.series.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink 
              as={RouterLink} 
              to={`/series/${review.seriesId}/reviews`} 
              _hover={{ color: "primary.300", textDecoration: "none" }}
              transition="color 0.2s ease"
            >
              Avaliações
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text color="primary.300">Temporada {selectedSeasonNumber}</Text>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Card principal com gradiente e efeitos visuais */}
        <Box 
          bg={cardBg} 
          borderRadius="xl" 
          overflow="hidden" 
          mb={8}
          boxShadow="lg"
          position="relative"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            bgGradient: "linear(to-r, primary.500, primary.300)",
            borderTopRadius: "xl",
          }}
        >
          <Box p={{ base: 4, md: 8 }}>
            {/* Informações do usuário e data */}
            <Grid 
              templateColumns={{ base: "1fr", md: "auto 1fr auto" }}
              gap={4} 
              mb={6}
              alignItems="center"
            >
              <HStack spacing={4}>
                <UserAvatar 
                  userId={review.userId} 
                  userEmail={review.userEmail} 
                  photoURL={userData?.photoURL}
                  size="md"
                  showBorder
                />
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Text fontWeight="medium" color={textColor}>
                      Avaliação de 
                    </Text>
                    <Text 
                      as={RouterLink}
                      to={`/u/${userData?.username || review.userId}`}
                      fontWeight="bold" 
                      color={primaryColor} 
                      _hover={{ textDecoration: "underline" }}
                      transition="color 0.2s"
                    >
                      @{userData?.username || userData?.displayName || 'Usuário'}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Icon as={Calendar} color={mutedTextColor} weight="fill" />
                    <Tooltip label={formattedDate} placement="bottom">
                      <Text color={mutedTextColor} fontSize="sm">
                        {formattedDateDistance}
                      </Text>
                    </Tooltip>
                  </HStack>
                </VStack>
              </HStack>

              {/* Badge da temporada em telas grandes */}
              <Box display={{ base: "none", md: "flex" }} justifyContent="flex-end">
                <Badge 
                  colorScheme="primary" 
                  fontSize="md" 
                  py={1} 
                  px={3} 
                  borderRadius="full"
                >
                  Temporada {selectedSeasonNumber}
                </Badge>
              </Box>
            </Grid>

            {/* Conteúdo principal da avaliação */}
            <Grid 
              templateColumns={{ base: "1fr", md: "auto 1fr" }} 
              gap={{ base: 4, md: 6 }}
              mb={6}
            >
              {/* Poster com efeito de sombra */}
              {review.series.poster_path && (
                <GridItem>
                  <Box 
                    width={{ base: "140px", md: "180px" }} 
                    mx={{ base: "auto", md: 0 }}
                    borderRadius="lg" 
                    overflow="hidden"
                    boxShadow="md"
                    transition="transform 0.3s ease, box-shadow 0.3s ease"
                    _hover={{
                      transform: "translateY(-5px) scale(1.02)",
                      boxShadow: "xl",
                    }}
                  >
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${review.series.poster_path}`}
                      alt={review.series.name}
                      width="100%"
                      height="auto"
                    />
                  </Box>
                </GridItem>
              )}

              {/* Detalhes da avaliação */}
              <GridItem>
                <VStack align="start" spacing={4} h="100%">
                  <Box>
                    <Text 
                      as={RouterLink}
                      to={`/series/${review.seriesId}`}
                      fontSize={{ base: "xl", md: "2xl" }} 
                      fontWeight="bold" 
                      color={textColor}
                      lineHeight="shorter"
                      mb={1}
                      display="inline-block"
                      _hover={{ 
                        color: primaryColor,
                        textDecoration: "none" 
                      }}
                      transition="color 0.2s"
                    >
                      {review.series.name}
                    </Text>
                    <Text 
                      fontSize={{ base: "md", md: "lg" }} 
                      fontWeight="medium" 
                      color={mutedTextColor}
                      display={{ base: "block", md: "none" }}
                      mb={3}
                    >
                      Temporada {selectedSeasonNumber}
                    </Text>
                  </Box>

                  {/* Estrelas de avaliação */}
                  <Box 
                    p={2} 
                    bg="gray.700" 
                    borderRadius="lg" 
                    alignSelf="flex-start"
                  >
                    <RatingStars 
                      rating={activeSeasonReview.rating || 0} 
                      size={24} 
                      showNumber={true}
                    />
                  </Box>

                  {/* Comentário */}
                  {activeSeasonReview.comment && (
                    <Box 
                      w="full" 
                      p={4} 
                      bg="gray.850" 
                      borderRadius="lg" 
                      borderLeftWidth="4px" 
                      borderLeftColor="primary.500"
                      overflowWrap="break-word"
                      wordBreak="break-word"
                    >
                      <Text 
                        color={textColor} 
                        fontSize="md" 
                        whiteSpace="pre-wrap"
                        lineHeight="taller"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                        sx={{
                          hyphens: "auto"
                        }}
                      >
                        {activeSeasonReview.comment}
                      </Text>
                    </Box>
                  )}

                  {/* Botões de ação */}
                  <HStack spacing={4} mt={2} pt={2} borderTopWidth="1px" borderTopColor="gray.700" w="full">
                    <Box onClick={(e) => e.stopPropagation()}>
                      <ReactionButtons 
                        reviewId={reviewId || ""} 
                        seasonNumber={selectedSeasonNumber}
                        likes={activeSeasonReview.reactions?.likes || []}
                        onReaction={handleReaction}
                        isLoading={loadingReactions[`${reviewId}-${selectedSeasonNumber}-likes`] || false}
                      />
                    </Box>
                    
                    <Button
                      leftIcon={<Icon as={ChatCircle} />}
                      variant="ghost"
                      size="sm"
                      onClick={toggleComments}
                      color={isCommentExpanded ? "primary.400" : mutedTextColor}
                      _hover={{ color: "primary.300" }}
                    >
                      {(activeSeasonReview.comments?.length || 0)} comentários
                    </Button>
                    
                    {currentUser?.uid === review.userId && (
                      <Button 
                        size="sm" 
                        leftIcon={<Icon as={NotePencil} />}
                        onClick={() => setIsEditModalOpen(true)}
                        colorScheme="primary"
                        variant="outline"
                        ml="auto"
                      >
                        Editar avaliação
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </GridItem>
            </Grid>

            {/* Seletor de temporadas caso exista mais de uma avaliação */}
            {review.seasonReviews.length > 1 && (
              <Box 
                mb={6} 
                p={4} 
                bg="gray.750" 
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.700"
              >
                <Text color={mutedTextColor} mb={3} fontWeight="medium">
                  Outras temporadas avaliadas:
                </Text>
                <Flex gap={2} wrap="wrap">
                  {review.seasonReviews.map((sr: any) => (
                    <Button
                      key={sr.seasonNumber}
                      size="sm"
                      variant={sr.seasonNumber === selectedSeasonNumber ? "solid" : "outline"}
                      colorScheme={sr.seasonNumber === selectedSeasonNumber ? "primary" : "gray"}
                      onClick={() => navigate(`/reviews/${reviewId}/${sr.seasonNumber}`)}
                      borderRadius="full"
                      _hover={{
                        transform: sr.seasonNumber !== selectedSeasonNumber ? "translateY(-2px)" : "none",
                      }}
                      transition="transform 0.2s ease"
                    >
                      Temporada {sr.seasonNumber}
                    </Button>
                  ))}
                </Flex>
              </Box>
            )}
          </Box>
        </Box>

        {/* Seção de comentários com animação de collapse */}
        <Collapse in={isCommentExpanded} animateOpacity>
          <Box 
            bg={cardBg} 
            borderRadius="xl" 
            mb={8}
            boxShadow="md"
          >
            <CommentSection 
              objectId={reviewId || ""}
              seasonNumber={selectedSeasonNumber}
              objectType="review"
              commentsCount={activeSeasonReview?.comments?.length || 0}
            />
          </Box>
        </Collapse>
        
        {/* Botão para expandir/colapsar comentários quando fechados */}
        {!isCommentExpanded && activeSeasonReview?.comments?.length > 0 && (
          <Button
            onClick={toggleComments}
            variant="outline"
            colorScheme="gray"
            leftIcon={<Icon as={ChatCircle} />}
            mb={8}
            w="full"
            borderRadius="lg"
            _hover={{ bg: "gray.700" }}
          >
            Ver {activeSeasonReview.comments.length} comentários
          </Button>
        )}
      </Container>

      {/* Modal de edição */}
      {isEditModalOpen && (
        <ReviewEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          review={review}
          onReviewUpdated={handleReviewUpdated}
          initialSeasonNumber={selectedSeasonNumber}
        />
      )}

      <Footer />
    </Flex>
  );
} 