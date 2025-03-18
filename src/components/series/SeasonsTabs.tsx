import {
  VStack,
  Accordion,
  Button,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { useState } from "react";
import { SeriesReview } from "../../services/reviews";
import { SeasonAccordionItem } from "./SeasonAccordionItem";

interface SeasonsTabsProps {
  series: any; // Tipo completo seria melhor
  reviews: SeriesReview[];
  userReview?: SeriesReview;
  currentUser: any | null;
  userData: { photoURL?: string | null } | null;
  seriesId: string;
  onSeasonSelect: (season: number) => void;
  onOpenReviewModal: () => void;
  onSetExistingReview: (review: SeriesReview) => void;
  onSetDeleteAlertOpen: (isOpen: boolean) => void;
  onSetSeasonToDelete: (season: number | null) => void;
  onReviewClick: (review: any) => void;
  navigate: (path: string) => void;
}

export function SeasonsTabs({
  series,
  reviews,
  userReview,
  currentUser,
  userData,
  seriesId,
  onSeasonSelect,
  onOpenReviewModal,
  onSetExistingReview,
  onSetDeleteAlertOpen,
  onSetSeasonToDelete,
  onReviewClick,
  navigate,
}: SeasonsTabsProps) {
  const [showAllSeasons, setShowAllSeasons] = useState(false);
  const queryClient = useQueryClient();

  // Calcular a avaliação média para cada temporada
  const calculateAverageRating = (season: number) => {
    const seasonReviews = reviews.flatMap((review) =>
      review.seasonReviews
        .filter((sr) => sr.seasonNumber === season)
        .map((sr) => ({
          ...sr,
          id: review.id || "",
          userId: review.userId,
          userEmail: review.userEmail,
          comments: sr.comments || [],
        }))
    );

    return seasonReviews.length > 0
      ? seasonReviews.reduce((acc, review) => acc + review.rating, 0) / seasonReviews.length
      : 0;
  };

  // Preparar reviews para uma temporada específica
  const getSeasonReviews = (season: number) => {
    return reviews.flatMap((review) =>
      review.seasonReviews
        .filter((sr) => sr.seasonNumber === season)
        .map((sr) => ({
          ...sr,
          id: review.id || "",
          userId: review.userId,
          userEmail: review.userEmail,
          comments: sr.comments || [],
        }))
    );
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Accordion allowMultiple>
        {Array.from(
          { length: series.number_of_seasons },
          (_, i) => i + 1
        )
          .slice(0, showAllSeasons ? undefined : 3)
          .map((season) => {
            const averageRating = calculateAverageRating(season);
            const seasonReviews = getSeasonReviews(season);

            return (
              <SeasonAccordionItem
                key={`season-${season}`}
                season={season}
                averageRating={averageRating}
                seasonReviews={seasonReviews}
                userReview={userReview}
                currentUser={currentUser}
                userData={userData}
                seriesId={seriesId}
                onSeasonSelect={onSeasonSelect}
                onOpenReviewModal={() => {
                  onOpenReviewModal();
                  queryClient.invalidateQueries({
                    queryKey: ["reviews", seriesId],
                  });
                }}
                onEditReview={onSetExistingReview}
                onDeleteReview={(season) => {
                  onSetSeasonToDelete(season);
                  onSetDeleteAlertOpen(true);
                }}
                onReviewClick={onReviewClick}
                navigate={navigate}
              />
            );
          })}
      </Accordion>
      {series.number_of_seasons > 3 && (
        <Button
          variant="ghost"
          color="teal.400"
          onClick={() => setShowAllSeasons(!showAllSeasons)}
          rightIcon={showAllSeasons ? <CaretUp /> : <CaretDown />}
          alignSelf="center"
        >
          {showAllSeasons 
            ? "Ver menos" 
            : `Ver mais (${series.number_of_seasons - 3} temporadas)`}
        </Button>
      )}
    </VStack>
  );
} 