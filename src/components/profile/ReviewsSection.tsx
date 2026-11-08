import { Box, Button, Flex, Image, Link, Skeleton, Text, VStack } from "@chakra-ui/react";
import { Star } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import type { SeriesReview } from "../../services/reviews";
import { SeasonStrip } from "../series/SeasonStrip";
import { ScoreBadge } from "../common/ScoreBadge";
import { EmptyState } from "../common/EmptyState";
import { SpoilerText } from "../reviews/SpoilerText";

interface ReviewsSectionProps {
  reviews: SeriesReview[];
  isLoading: boolean;
  onReviewClick: (review: SeriesReview) => void;
  isOwnProfile?: boolean;
}

const PAGE = 8;

/** Séries avaliadas pelo usuário, cada uma com a faixa das notas dele por temporada. */
export function ReviewsSection({
  reviews,
  isLoading,
  onReviewClick,
  isOwnProfile,
}: ReviewsSectionProps) {
  const [visible, setVisible] = useState(PAGE);

  const sorted = useMemo(
    () =>
      [...reviews].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      ),
    [reviews]
  );

  if (isLoading) {
    return (
      <VStack align="stretch" spacing={3}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} h="112px" borderRadius="md" startColor="ink.900" endColor="ink.850" />
        ))}
      </VStack>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title={
          isOwnProfile ? "Você ainda não avaliou nenhuma temporada." : "Nenhuma avaliação ainda."
        }
        description={
          isOwnProfile ? "Abra uma série e dê nota às temporadas que você viu." : undefined
        }
        action={
          isOwnProfile ? (
            <Button as={RouterLink} to="/series" size="sm" variant="outline">
              Explorar séries
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      {sorted.slice(0, visible).map((review) => {
        const seasons = [...review.seasonReviews].sort((a, b) => a.seasonNumber - b.seasonNumber);
        const average = seasons.reduce((sum, s) => sum + s.rating, 0) / (seasons.length || 1);
        const latest = [...seasons].reverse().find((s) => s.comment);

        return (
          <Flex
            as="article"
            key={review.id}
            gap={4}
            p={4}
            bg="ink.900"
            border="1px solid"
            borderColor="ink.800"
            borderRadius="md"
            align="flex-start"
          >
            <Link as={RouterLink} to={`/series/${review.seriesId}`} flexShrink={0}>
              <Box
                w={{ base: "56px", md: "64px" }}
                aspectRatio={2 / 3}
                borderRadius="sm"
                overflow="hidden"
                bg="ink.850"
              >
                {review.series.poster_path && (
                  <Image
                    src={`https://image.tmdb.org/t/p/w154${review.series.poster_path}`}
                    alt=""
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    loading="lazy"
                  />
                )}
              </Box>
            </Link>

            <Box flex={1} minW={0}>
              <Flex justify="space-between" align="flex-start" gap={3}>
                <Box minW={0}>
                  <Link
                    as={RouterLink}
                    to={`/series/${review.seriesId}`}
                    fontWeight={600}
                    color="ink.50"
                    noOfLines={1}
                    _hover={{ color: "signal.300", textDecoration: "none" }}
                  >
                    {review.series.name}
                  </Link>
                  <Text fontFamily="mono" fontSize="xs" color="ink.400" mt={0.5}>
                    {seasons.length}{" "}
                    {seasons.length === 1 ? "temporada avaliada" : "temporadas avaliadas"}
                  </Text>
                </Box>
                <ScoreBadge score={average} size="sm" flexShrink={0} />
              </Flex>

              {latest && (
                <Box mt={2}>
                  <SpoilerText
                    text={latest.comment}
                    hasSpoiler={latest.hasSpoiler}
                    isOwn={isOwnProfile}
                    fontSize="sm"
                    color="ink.300"
                    noOfLines={2}
                  />
                </Box>
              )}

              <Box mt={3}>
                <SeasonStrip
                  seasons={seasons.map((s) => ({ season: s.seasonNumber, score: s.rating }))}
                  height={32}
                  onSelect={(season) => onReviewClick({ ...review, selectedSeasonNumber: season })}
                />
              </Box>
            </Box>
          </Flex>
        );
      })}

      {sorted.length > visible && (
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() => setVisible((v) => v + PAGE)}
        >
          Mostrar mais ({sorted.length - visible})
        </Button>
      )}
    </VStack>
  );
}
