import type { Series } from "../../services/tmdb";
import type { ExtendedUser as User } from "../../types/auth";
import type { ReviewClickHandler, SeasonReview } from "../../types/review";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowRight,
  ChatCircleText,
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { useMemo } from "react";
import type { SeriesReview } from "../../services/reviews";
import { SeasonStrip, type SeasonScore } from "./SeasonStrip";
import { ScoreBadge } from "../common/ScoreBadge";
import { RatingStars } from "../common/RatingStars";
import { EmptyState } from "../common/EmptyState";
import { ReviewListItem } from "../reviews/ReviewListItem";
import { getGlobalLoginPopover } from "../layout/Navbar";
import { yearOf } from "../../utils/score";

interface SeasonsSectionProps {
  series: Series;
  reviews: SeriesReview[];
  userReview?: SeriesReview;
  currentUser: User | null;
  selectedSeason: number;
  onSeasonSelect: (season: number) => void;
  onOpenReviewModal: () => void;
  onEditReview: (review: SeriesReview) => void;
  onDeleteReview: (season: number) => void;
  onReviewClick: ReviewClickHandler;
}

type SeasonEntry = SeasonReview & { id: string };

const PREVIEW_COUNT = 4;

function toTime(date: SeasonReview["createdAt"]) {
  if (!date) return 0;
  return date instanceof Date ? date.getTime() : date.seconds * 1000;
}

/** Faixa de temporadas com o painel da temporada escolhida logo abaixo. */
export function SeasonsSection({
  series,
  reviews,
  userReview,
  currentUser,
  selectedSeason,
  onSeasonSelect,
  onOpenReviewModal,
  onEditReview,
  onDeleteReview,
  onReviewClick,
}: SeasonsSectionProps) {
  // Agrupa todas as notas por temporada de uma vez
  const bySeason = useMemo(() => {
    const map = new Map<number, SeasonEntry[]>();
    for (const review of reviews) {
      for (const sr of review.seasonReviews) {
        const list = map.get(sr.seasonNumber) ?? [];
        list.push({ ...sr, id: review.id, userId: review.userId, userEmail: review.userEmail });
        map.set(sr.seasonNumber, list);
      }
    }
    return map;
  }, [reviews]);

  const seasonNumbers = Array.from({ length: series.number_of_seasons }, (_, i) => i + 1);
  const strip: SeasonScore[] = seasonNumbers.map((season) => {
    const entries = bySeason.get(season) ?? [];
    const average = entries.length
      ? entries.reduce((sum, e) => sum + e.rating, 0) / entries.length
      : null;
    return { season, score: average, count: entries.length };
  });

  const current = strip.find((s) => s.season === selectedSeason) ?? strip[0];
  const info = series.seasons?.find((s) => s.season_number === current?.season);
  const entries = (bySeason.get(current?.season ?? 0) ?? [])
    .filter((e) => e.userId !== currentUser?.uid)
    .sort(
      (a, b) =>
        Number(!!b.comment) - Number(!!a.comment) || toTime(b.createdAt) - toTime(a.createdAt)
    );
  const mine = userReview?.seasonReviews.find((sr) => sr.seasonNumber === current?.season);
  const ratedCount = strip.filter((s) => s.count).length;

  if (!current) return null;

  const seasonMeta = [
    yearOf(info?.air_date),
    info?.episode_count ? `${info.episode_count} episódios` : null,
  ].filter(Boolean);

  return (
    <Box as="section" aria-labelledby="temporadas" py={{ base: 8, md: 10 }}>
      <Flex justify="space-between" align="flex-end" gap={4} mb={5} wrap="wrap">
        <Box>
          <Text textStyle="label" color="ink.400" mb={1.5}>
            Nota por temporada
          </Text>
          <Heading as="h2" id="temporadas" size="h2">
            Temporadas
          </Heading>
        </Box>
        <Text fontSize="sm" color="ink.400">
          {ratedCount === 0
            ? "Nenhuma temporada avaliada ainda"
            : `${ratedCount} de ${strip.length} ${strip.length === 1 ? "temporada avaliada" : "temporadas avaliadas"}`}
        </Text>
      </Flex>

      <Box
        p={{ base: 4, md: 5 }}
        bg="ink.900"
        border="1px solid"
        borderColor="ink.800"
        borderRadius="lg"
      >
        <SeasonStrip
          seasons={strip}
          selected={current.season}
          onSelect={onSeasonSelect}
          height={96}
        />
      </Box>

      {/* painel da temporada escolhida */}
      <Box mt={6}>
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <Box>
            <Heading as="h3" size="h3" fontSize="xl">
              Temporada {current.season}
            </Heading>
            {seasonMeta.length > 0 && (
              <Text mt={1} fontFamily="mono" fontSize="xs" color="ink.400">
                {seasonMeta.join(" · ")}
              </Text>
            )}
          </Box>
          {current.score != null && (
            <HStack spacing={2}>
              <ScoreBadge score={current.score} />
              <Text fontSize="sm" color="ink.400">
                {current.count} {current.count === 1 ? "avaliação" : "avaliações"}
              </Text>
            </HStack>
          )}
        </Flex>

        {/* sua avaliação */}
        <Box mt={4}>
          {mine && userReview ? (
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              p={4}
              bg="ink.900"
              border="1px solid"
              borderColor="ink.800"
              borderLeft="2px solid"
              borderLeftColor="signal.400"
              borderRadius="md"
            >
              <Box minW={0}>
                <HStack spacing={3}>
                  <Text fontSize="sm" fontWeight={600} color="ink.100">
                    Sua nota
                  </Text>
                  <RatingStars rating={mine.rating} size={16} showNumber={false} />
                </HStack>
                {mine.comment && (
                  <Text mt={1.5} fontSize="sm" color="ink.300" noOfLines={2}>
                    {mine.comment}
                  </Text>
                )}
              </Box>
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  aria-label="Opções da sua avaliação"
                  icon={<DotsThree size={20} />}
                  variant="ghost"
                  size="sm"
                />
                <MenuList>
                  <MenuItem
                    icon={<Eye size={16} />}
                    onClick={() =>
                      onReviewClick({ id: userReview.id, seasonNumber: current.season })
                    }
                  >
                    Ver avaliação
                  </MenuItem>
                  <MenuItem
                    icon={<PencilSimple size={16} />}
                    onClick={() => onEditReview(userReview)}
                  >
                    Editar
                  </MenuItem>
                  <MenuItem
                    icon={<Trash size={16} />}
                    color="danger"
                    onClick={() => onDeleteReview(current.season)}
                  >
                    Excluir
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          ) : (
            <Button
              variant="outline"
              onClick={() => (currentUser ? onOpenReviewModal() : getGlobalLoginPopover()?.())}
            >
              {currentUser ? `Avaliar a temporada ${current.season}` : "Entre para avaliar"}
            </Button>
          )}
        </Box>

        {/* avaliações da comunidade */}
        <Box mt={6}>
          {entries.length === 0 ? (
            <EmptyState
              icon={ChatCircleText}
              title={
                mine
                  ? `Ninguém mais avaliou a temporada ${current.season} ainda.`
                  : `Ninguém avaliou a temporada ${current.season} ainda.`
              }
              description={mine ? undefined : "Sua avaliação pode ser a primeira."}
            />
          ) : (
            <VStack align="stretch" spacing={2}>
              {entries.slice(0, PREVIEW_COUNT).map((entry) => (
                <ReviewListItem
                  key={`${entry.id}-${entry.seasonNumber}`}
                  userId={entry.userId}
                  userEmail={entry.userEmail}
                  rating={entry.rating}
                  comment={entry.comment}
                  onClick={() => onReviewClick({ id: entry.id, seasonNumber: entry.seasonNumber })}
                />
              ))}
            </VStack>
          )}
          {(current.count ?? 0) > 0 && (
            <Link
              as={RouterLink}
              to={`/series/${series.id}/reviews?season=${current.season}`}
              mt={4}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              fontSize="sm"
              color="ink.300"
              _hover={{ color: "ink.50", textDecoration: "none" }}
            >
              Ver todas as avaliações da temporada
              <ArrowRight size={14} />
            </Link>
          )}
        </Box>
      </Box>
    </Box>
  );
}
