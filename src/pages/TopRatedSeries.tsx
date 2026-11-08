import { Box, Flex, Heading, LinkBox, LinkOverlay, Skeleton, Text, VStack } from "@chakra-ui/react";
import { Trophy } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { getSeriesDetails, type Series } from "../services/tmdb";
import { getTopRatedSeries as getTopRatedReviews } from "../services/reviews";
import { PageHeader } from "../components/common/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { EmptyState } from "../components/common/EmptyState";
import { ScoreBadge } from "../components/common/ScoreBadge";
import { yearOf } from "../utils/score";

type RankedSeries = Series & { averageRating: number; ratingsCount: number };

function RankRow({ series, rank }: { series: RankedSeries; rank: number }) {
  const meta = [
    yearOf(series.first_air_date),
    `${series.number_of_seasons} ${series.number_of_seasons === 1 ? "temporada" : "temporadas"}`,
  ].filter(Boolean);

  return (
    <LinkBox
      as="li"
      display="grid"
      gridTemplateColumns={{ base: "32px 56px 1fr", md: "56px 72px 1fr auto" }}
      gap={{ base: 3, md: 5 }}
      alignItems="center"
      py={4}
      borderBottom="1px solid"
      borderColor="ink.800"
      role="group"
    >
      <Text
        fontFamily="mono"
        fontWeight={600}
        fontSize={{ base: "lg", md: "2xl" }}
        color={rank <= 3 ? "signal.300" : "ink.400"}
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {String(rank).padStart(2, "0")}
      </Text>
      <Box
        aspectRatio={2 / 3}
        borderRadius="sm"
        overflow="hidden"
        bg="ink.850"
        transition="box-shadow 120ms ease"
        _groupHover={{ boxShadow: "0 0 0 1px var(--chakra-colors-signal-400)" }}
      >
        {series.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w154${series.poster_path}`}
            alt=""
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </Box>
      <Box minW={0}>
        <LinkOverlay as={RouterLink} to={`/series/${series.id}`}>
          <Heading as="h2" size="h3" fontSize={{ base: "md", md: "lg" }} noOfLines={1}>
            {series.name}
          </Heading>
        </LinkOverlay>
        <Text mt={1} fontFamily="mono" fontSize="xs" color="ink.400">
          {meta.join(" · ")}
        </Text>
        <Text
          mt={1}
          fontSize="sm"
          color="ink.300"
          noOfLines={1}
          display={{ base: "none", md: "block" }}
        >
          {series.genres?.map((g) => g.name).join(", ")}
        </Text>
        <Flex mt={2} align="center" gap={2} display={{ base: "flex", md: "none" }}>
          <ScoreBadge score={series.averageRating} size="sm" />
          <Text fontSize="xs" color="ink.400">
            {series.ratingsCount} notas
          </Text>
        </Flex>
      </Box>
      <Box textAlign="right" display={{ base: "none", md: "block" }}>
        <ScoreBadge score={series.averageRating} size="lg" />
        <Text mt={1.5} fontSize="xs" color="ink.400" fontFamily="mono">
          {series.ratingsCount} {series.ratingsCount === 1 ? "nota" : "notas"}
        </Text>
      </Box>
    </LinkBox>
  );
}

export function TopRatedSeries() {
  // Média calculada no banco (view series_ratings) + detalhes da série no TMDB
  const { data: topSeries = [], isLoading } = useQuery({
    queryKey: ["topRatedSeries"],
    queryFn: async () => {
      const ranking = await getTopRatedReviews(10);
      const details = await Promise.all(
        ranking.map(async (entry) => {
          try {
            const series = await getSeriesDetails(entry.seriesId);
            return {
              ...series,
              averageRating: entry.averageRating,
              ratingsCount: entry.ratingsCount,
            } as RankedSeries;
          } catch {
            return null;
          }
        })
      );
      return details.filter((item): item is RankedSeries => item !== null);
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <PageHeader
        title="Top 10"
        subtitle="As séries com a melhor média de notas por temporada na comunidade."
      />

      <PageContainer pb={{ base: 12, md: 16 }}>
        {isLoading ? (
          <VStack align="stretch" spacing={3}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton
                key={i}
                h="96px"
                startColor="ink.900"
                endColor="ink.850"
                borderRadius="md"
              />
            ))}
          </VStack>
        ) : topSeries.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="O ranking ainda está vazio."
            description="Ele aparece quando as séries recebem notas da comunidade. Só entram séries com média 3,0 ou maior."
          />
        ) : (
          <Box as="ol" listStyleType="none" borderTop="1px solid" borderColor="ink.800">
            {topSeries.map((series, i) => (
              <RankRow key={series.id} series={series} rank={i + 1} />
            ))}
          </Box>
        )}
      </PageContainer>
    </>
  );
}
