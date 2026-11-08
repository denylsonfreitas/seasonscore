import { Box, Flex } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getPopularReviews } from "../../services/reviews";
import { SectionBase } from "../common/SectionBase";
import { Carousel } from "../common/Carousel";
import { ReviewCard, ReviewCardSkeleton } from "./ReviewCard";

export function ReviewCarouselSkeleton() {
  return (
    <Flex gap={4} overflow="hidden">
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          flex={{ base: "0 0 100%", md: "0 0 calc(50% - 8px)", lg: "0 0 calc(33.33% - 11px)" }}
        >
          <ReviewCardSkeleton />
        </Box>
      ))}
    </Flex>
  );
}

export function PopularReviews() {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["popularReviews"],
    queryFn: () => getPopularReviews(),
    staleTime: 1000 * 60 * 5,
  });

  const popular = reviews.filter((review) => review.likes > 0).slice(0, 12);

  return (
    <SectionBase
      eyebrow="Comunidade"
      title="Avaliações mais curtidas"
      link="/reviews"
      isLoading={isLoading}
      isEmpty={popular.length === 0}
      emptyMessage="Nenhuma avaliação curtida ainda."
      emptyDescription="Avalie uma temporada e curta as avaliações que você concorda."
      loadingElement={<ReviewCarouselSkeleton />}
      renderContent={() => (
        <Carousel preset="lists" gap={4} label="Avaliações mais curtidas">
          {popular.map((review) => (
            <ReviewCard key={`${review.id}-${review.seasonNumber}`} review={review} />
          ))}
        </Carousel>
      )}
    />
  );
}
