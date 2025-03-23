import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  HStack,
  Text,
  Badge,
  VStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Button,
  Link,
} from "@chakra-ui/react";
import { DotsThree, Eye, PencilSimple, Trash } from "@phosphor-icons/react";
import { SeriesReview } from "../../services/reviews";
import { RatingStars } from "../common/RatingStars";
import { PopularReviewsList } from "../reviews/PopularReviewsList";

interface SeasonAccordionItemProps {
  season: number;
  averageRating: number;
  seasonReviews: any[];
  userReview?: SeriesReview;
  currentUser: any | null;
  userData: { photoURL?: string | null } | null;
  seriesId: string;
  onSeasonSelect: (season: number) => void;
  onOpenReviewModal: () => void;
  onEditReview: (review: SeriesReview) => void;
  onDeleteReview: (season: number) => void;
  onReviewClick: (review: any) => void;
  navigate: (path: string) => void;
}

export function SeasonAccordionItem({
  season,
  averageRating,
  seasonReviews,
  userReview,
  currentUser,
  userData,
  seriesId,
  onSeasonSelect,
  onOpenReviewModal,
  onEditReview,
  onDeleteReview,
  onReviewClick,
  navigate,
}: SeasonAccordionItemProps) {
  // Verificar se o usuário tem uma avaliação para esta temporada
  const hasUserReview = userReview !== undefined && userReview.seasonReviews.some(
    (sr) => sr.seasonNumber === season
  );

  // Obter a avaliação da temporada se existir
  const seasonReview = userReview?.seasonReviews.find(
    (sr) => sr.seasonNumber === season
  );

  // Função para renderizar o bloco de avaliação do usuário
  const renderUserReviewBox = () => {
    // Só renderizamos se ambos userReview e seasonReview existirem
    if (!userReview || !seasonReview) return null;
    
    return (
      <Box bg="gray.700" p={2} borderRadius="lg">
        <HStack pl={2} justify="space-between" align="center">
          <HStack spacing={4}>
            <Avatar
              size="sm"
              name={userReview.userEmail}
              src={userData?.photoURL || undefined}
            />
            <Text color="white" fontWeight="medium">
              Sua avaliação:
            </Text>
            <RatingStars
              rating={seasonReview.rating || 0}
              size={16}
              showNumber={false}
            />
          </HStack>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Opções"
              icon={<DotsThree size={24} />}
              variant="ghost"
              color="gray.400"
              _hover={{ bg: "gray.700" }}
            />
            <MenuList bg="gray.800" borderColor="gray.600">
              <MenuItem
                icon={<Eye size={20} />}
                onClick={() => {
                  onSeasonSelect(season);
                  const reviewData = {
                    id: userReview.id,
                    userId: userReview.userId,
                    userEmail: userReview.userEmail,
                    seasonNumber: season,
                    rating: seasonReview.rating,
                    comment: seasonReview.comment,
                    reactions: seasonReview.reactions,
                    comments: seasonReview.comments,
                  };
                  onReviewClick(reviewData);
                }}
                bg="gray.800"
                _hover={{ bg: "gray.700" }}
                color="white"
              >
                Ver detalhes
              </MenuItem>
              <MenuItem
                icon={<PencilSimple size={20} />}
                onClick={() => {
                  onSeasonSelect(season);
                  onEditReview(userReview);
                }}
                bg="gray.800"
                _hover={{ bg: "gray.700" }}
                color="white"
              >
                Editar avaliação
              </MenuItem>
              <MenuItem
                icon={<Trash size={20} />}
                onClick={() => onDeleteReview(season)}
                bg="gray.800"
                _hover={{ bg: "gray.700" }}
                color="primary.700"
              >
                Excluir avaliação
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>
    );
  };

  // Função para renderizar o botão de adicionar avaliação
  const renderAddReviewButton = () => {
    return (
      <Box bg="gray.800" pt={2} borderRadius="lg">
        {currentUser ? (
          <Button
            colorScheme="primary"
            onClick={() => {
              onSeasonSelect(season);
              onOpenReviewModal();
            }}
            width="100%"
          >
            Avaliar Temporada {season}
          </Button>
        ) : (
          <Button
            colorScheme="primary"
            onClick={() => navigate("/login")}
            width="100%"
          >
            Entrar para avaliar
          </Button>
        )}
      </Box>
    );
  };

  return (
    <AccordionItem key={`season-${season}`} border="none">
      <AccordionButton
        bg="gray.700"
        _hover={{ bg: "gray.600" }}
        mb={2}
        borderRadius="md"
      >
        <Box flex="1" textAlign="left">
          <HStack>
            <Text color="white" fontWeight="medium">
              Temporada {season}
            </Text>
            {averageRating > 0 && (
              <Badge colorScheme="yellow">
                {averageRating.toFixed(1)} ★
              </Badge>
            )}
          </HStack>
        </Box>
        <AccordionIcon color="white" />
      </AccordionButton>
      <AccordionPanel pb={4} bg="gray.800" borderRadius="md">
        <VStack spacing={4} align="stretch">
          {hasUserReview ? renderUserReviewBox() : renderAddReviewButton()}

          {seasonReviews.length > 0 && (
            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <Text color="white" fontWeight="bold">
                  Avaliações Populares
                </Text>
                <Button
                  as={Link}
                  href={`/series/${seriesId}/reviews?season=${season}`}
                  variant="link"
                  color="primary.400"
                  size="sm"
                >
                  Todas as avaliações
                </Button>
              </HStack>
              <PopularReviewsList
                reviews={[]} // Isso será preenchido pelo componente pai
                currentUserId={currentUser?.uid}
                season={season}
                onReviewClick={onReviewClick}
              />
            </Box>
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
} 