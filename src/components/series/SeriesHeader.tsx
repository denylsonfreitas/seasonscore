import type { Series } from "../../services/tmdb";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Text,
} from "@chakra-ui/react";
import { Bookmark, BookmarkSimple, Play, Star } from "@phosphor-icons/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WatchlistButton } from "../common/WatchlistButton";
import { ScoreBadge } from "../common/ScoreBadge";
import { getSeriesVideos } from "../../services/tmdb";
import { useWatchlist } from "../../hooks/useWatchlist";
import { useAuth } from "../../contexts/AuthContext";
import { getGlobalLoginPopover, NAV_HEIGHT } from "../layout/Navbar";
import { yearOf } from "../../utils/score";

interface SeriesHeaderProps {
  series: Series;
  /** Média de todas as notas de temporada e quantas são. */
  communityScore?: { average: number; count: number };
  onRate: () => void;
}

export const STATUS_PT: Record<string, string> = {
  "Returning Series": "Em exibição",
  Ended: "Finalizada",
  Canceled: "Cancelada",
  "In Production": "Em produção",
  Planned: "Planejada",
  Pilot: "Piloto",
};

function yearsRange(series: Series) {
  const start = yearOf(series.first_air_date);
  if (!start) return "";
  if (series.status === "Returning Series" || series.in_production) return `${start}–`;
  const end = yearOf(series.last_air_date);
  return end && end !== start ? `${start}–${end}` : start;
}

/** Topo da página da série: fundo, pôster, título, nota da comunidade e ações. */
export function SeriesHeader({ series, communityScore, onRate }: SeriesHeaderProps) {
  const { currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const { isInWatchlist, isLoading: watchlistLoading, toggleWatchlist } = useWatchlist(series.id);

  const { data: trailerKey } = useQuery({
    queryKey: ["trailer", series.id],
    queryFn: async () => {
      const videos = await getSeriesVideos(series.id);
      const youtube = videos.filter((v) => v.site === "YouTube");
      return (
        (
          youtube.find((v) => v.type === "Trailer") ??
          youtube.find((v) => v.type === "Teaser") ??
          null
        )?.key ?? null
      );
    },
    staleTime: 1000 * 60 * 60,
  });

  const logo = series.images?.logos?.[0]?.file_path;
  const meta = [
    yearsRange(series),
    `${series.number_of_seasons} ${series.number_of_seasons === 1 ? "temporada" : "temporadas"}`,
    STATUS_PT[series.status],
  ].filter(Boolean);
  const genres = series.genres?.slice(0, 3).map((g) => g.name) ?? [];
  const longOverview = (series.overview?.length ?? 0) > 280;

  const requireLogin = (action: () => void) => () => {
    if (!currentUser) getGlobalLoginPopover()?.();
    else action();
  };

  return (
    <Box as="header" position="relative" mt={`-${NAV_HEIGHT}`}>
      {/* fundo */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h={{ base: "300px", md: "520px" }}
        overflow="hidden"
        bg="ink.900"
        aria-hidden="true"
      >
        {series.backdrop_path && (
          <Box
            position="absolute"
            inset={0}
            bgImage={`url(https://image.tmdb.org/t/p/w1280${series.backdrop_path})`}
            bgSize="cover"
            bgPosition="center 20%"
          />
        )}
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(to top, #0F0F0E 0%, rgba(15,15,14,0.75) 35%, rgba(15,15,14,0.2) 70%, rgba(15,15,14,0.6) 100%), linear-gradient(to right, rgba(15,15,14,0.7) 0%, rgba(15,15,14,0) 60%)"
        />
      </Box>

      <Grid
        position="relative"
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 6, lg: 8 }}
        pt={{ base: "180px", md: "260px" }}
        templateColumns={{ base: "104px 1fr", md: "220px 1fr" }}
        columnGap={{ base: 4, md: 10 }}
        rowGap={5}
        alignItems="end"
      >
        {/* pôster */}
        <Box
          gridRow={{ md: "span 2" }}
          alignSelf="start"
          borderRadius="md"
          overflow="hidden"
          bg="ink.850"
          aspectRatio={2 / 3}
          boxShadow="0 16px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)"
        >
          {series.poster_path && (
            <Image
              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
              alt={`Pôster de ${series.name}`}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          )}
        </Box>

        {/* título e dados */}
        <Box minW={0}>
          {logo ? (
            <>
              <Image
                src={`https://image.tmdb.org/t/p/w500${logo}`}
                alt=""
                maxH={{ base: "64px", md: "120px" }}
                maxW={{ base: "100%", md: "420px" }}
                objectFit="contain"
                objectPosition="left bottom"
              />
              <Heading as="h1" srOnly>
                {series.name}
              </Heading>
            </>
          ) : (
            <Heading as="h1" size="display" noOfLines={3}>
              {series.name}
            </Heading>
          )}

          <Text
            mt={{ base: 2, md: 4 }}
            fontFamily="mono"
            fontSize={{ base: "xs", md: "sm" }}
            color="ink.200"
          >
            {meta.join(" · ")}
          </Text>
          {genres.length > 0 && (
            <Text mt={1} fontSize="sm" color="ink.300" noOfLines={1}>
              {genres.join(", ")}
            </Text>
          )}

          {communityScore && communityScore.count > 0 && (
            <HStack mt={{ base: 3, md: 5 }} spacing={3}>
              <ScoreBadge score={communityScore.average} size="lg" />
              <Box lineHeight="short">
                <Text fontSize="sm" color="ink.100" fontWeight={500}>
                  Média da comunidade
                </Text>
                <Text fontSize="xs" color="ink.400" fontFamily="mono">
                  {communityScore.count} {communityScore.count === 1 ? "nota" : "notas"} de
                  temporada
                </Text>
              </Box>
            </HStack>
          )}
        </Box>

        {/* sinopse e ações */}
        <Box gridColumn={{ base: "1 / -1", md: "2" }} maxW="720px">
          {series.overview && (
            <Box>
              <Text color="ink.200" noOfLines={expanded ? undefined : 3}>
                {series.overview}
              </Text>
              {longOverview && (
                <Button
                  variant="link"
                  size="sm"
                  mt={1}
                  color="ink.300"
                  fontWeight={500}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? "Mostrar menos" : "Ler mais"}
                </Button>
              )}
            </Box>
          )}

          <Flex mt={5} gap={2} wrap="wrap" align="center">
            <Button leftIcon={<Star size={16} />} onClick={requireLogin(onRate)}>
              Avaliar
            </Button>
            <Button
              variant="outline"
              leftIcon={
                isInWatchlist ? <Bookmark size={16} weight="fill" /> : <BookmarkSimple size={16} />
              }
              color={isInWatchlist ? "signal.300" : undefined}
              isDisabled={watchlistLoading}
              onClick={requireLogin(() => toggleWatchlist(series))}
              aria-pressed={isInWatchlist}
            >
              {isInWatchlist ? "Na watchlist" : "Watchlist"}
            </Button>
            {trailerKey && (
              <>
                <Button
                  as="a"
                  href={`https://www.youtube.com/watch?v=${trailerKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  leftIcon={<Play size={16} />}
                  display={{ base: "none", sm: "inline-flex" }}
                >
                  Trailer
                </Button>
                <IconButton
                  as="a"
                  href={`https://www.youtube.com/watch?v=${trailerKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver trailer"
                  title="Ver trailer"
                  variant="ghost"
                  icon={<Play size={18} />}
                  display={{ base: "inline-flex", sm: "none" }}
                />
              </>
            )}
            <WatchlistButton series={series} variant="ghost" size="md" />
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}
