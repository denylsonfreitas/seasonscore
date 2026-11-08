import { Box, Button } from "@chakra-ui/react";
import { Sparkle } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getPersonalizedRecommendations } from "../../services/recommendations";
import { SeriesCard } from "./SeriesCard";
import { Carousel } from "../common/Carousel";
import { SectionBase } from "../common/SectionBase";
import { EmptyState } from "../common/EmptyState";

/** Séries sugeridas a partir das avaliações e da watchlist do usuário. */
export function PersonalizedRecommendations() {
  const { currentUser } = useAuth();

  const {
    data: recommendations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["personalized-recommendations", currentUser?.uid],
    queryFn: () => getPersonalizedRecommendations(currentUser?.uid || ""),
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });

  if (!currentUser) return null;

  return (
    <SectionBase
      eyebrow="Para você"
      title="Com base no que você avaliou"
      isLoading={isLoading}
      error={error as Error | null}
      isEmpty={recommendations.length === 0}
      emptyElement={
        <EmptyState
          icon={Sparkle}
          title="Ainda não temos recomendações para você."
          description="Avalie algumas temporadas ou adicione séries à watchlist para recebê-las."
          action={
            <Button as={RouterLink} to="/series" variant="outline" size="sm">
              Explorar séries
            </Button>
          }
        />
      }
      renderContent={() => (
        <Carousel preset="series" gap={4} label="Recomendações para você">
          {recommendations.map((series) => (
            <Box key={series.id}>
              <SeriesCard series={series} />
            </Box>
          ))}
        </Carousel>
      )}
    />
  );
}
