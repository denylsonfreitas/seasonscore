import { Button } from "@chakra-ui/react";
import { UsersThree } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRecentFollowedUsersReviews } from "../../services/reviews";
import { useAuth } from "../../contexts/AuthContext";
import { SectionBase } from "../common/SectionBase";
import { Carousel } from "../common/Carousel";
import { EmptyState } from "../common/EmptyState";
import { ReviewCard } from "./ReviewCard";
import { ReviewCarouselSkeleton } from "./PopularReviews";

export function FollowedUsersReviews() {
  const { currentUser } = useAuth();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["followedUsersReviews"],
    queryFn: () => getRecentFollowedUsersReviews(12),
    enabled: !!currentUser,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  return (
    <SectionBase
      eyebrow="Seguindo"
      title="Quem você segue avaliou"
      link="/reviews"
      isLoading={isLoading}
      isEmpty={reviews.length === 0}
      emptyElement={
        <EmptyState
          icon={UsersThree}
          title="Você ainda não segue ninguém que avaliou algo."
          description="Siga pessoas na comunidade para ver as avaliações delas aqui."
          action={
            <Button as={RouterLink} to="/community" variant="outline" size="sm">
              Explorar a comunidade
            </Button>
          }
        />
      }
      loadingElement={<ReviewCarouselSkeleton />}
      renderContent={() => (
        <Carousel preset="lists" gap={4} label="Avaliações de quem você segue">
          {reviews.map((review) => (
            <ReviewCard key={`${review.id}-${review.seasonNumber}`} review={review} />
          ))}
        </Carousel>
      )}
    />
  );
}
