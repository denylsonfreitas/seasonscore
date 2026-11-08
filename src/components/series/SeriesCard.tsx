import { Box, Flex, Heading, LinkBox, LinkOverlay, Skeleton, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { SeriesListItem } from "../../services/tmdb";
import { WatchlistButton } from "../common/WatchlistButton";
import { EnhancedImage } from "../common/EnhancedImage";
import { ScoreBadge } from "../common/ScoreBadge";
import { yearOf } from "../../utils/score";

interface SeriesCardProps {
  series: SeriesListItem & { rating?: number };
  size?: "sm" | "md" | "lg";
  /** Posição em um ranking (Top 10). */
  position?: number;
  /** Mantém o botão da watchlist sempre visível. */
  highlightAddToList?: boolean;
  /** Personagem, na página de um ator. */
  showCharacter?: string;
  /** Mostra título, ano e nota abaixo do pôster. */
  showTitle?: boolean;
}

const maxW = { sm: "150px", md: "200px", lg: "240px" };

export function SeriesCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <Box maxW={maxW[size]} w="100%" mx="auto">
      <Skeleton aspectRatio={2 / 3} borderRadius="md" startColor="ink.850" endColor="ink.800" />
      <Skeleton mt={2} h="14px" w="70%" startColor="ink.850" endColor="ink.800" />
    </Box>
  );
}

/** Pôster 2:3 com título, ano e nota da comunidade. */
export function SeriesCard({
  series,
  size = "md",
  position,
  highlightAddToList = false,
  showCharacter,
  showTitle = true,
}: SeriesCardProps) {
  const year = yearOf(series.first_air_date);

  return (
    <LinkBox as="article" role="group" w="100%" maxW={maxW[size]} mx="auto">
      <Box
        position="relative"
        aspectRatio={2 / 3}
        borderRadius="md"
        overflow="hidden"
        bg="ink.850"
        transition="transform 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms ease"
        boxShadow="inset 0 0 0 1px rgba(255,255,255,0.06)"
        _groupHover={{
          transform: "translateY(-2px)",
          boxShadow: "0 0 0 1px var(--chakra-colors-signal-400)",
        }}
      >
        {series.poster_path ? (
          <EnhancedImage
            src={`https://image.tmdb.org/t/p/w342${series.poster_path}`}
            alt=""
            fallbackText={series.name}
            tmdbWidth="w342"
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Flex h="100%" p={3} align="flex-end">
            <Heading as="span" size="h3" fontSize="md" color="ink.200" noOfLines={4}>
              {series.name}
            </Heading>
          </Flex>
        )}

        {/* contorno interno sobre a imagem, para pôsteres escuros não sumirem */}
        <Box
          position="absolute"
          inset={0}
          borderRadius="md"
          boxShadow="inset 0 0 0 1px rgba(255,255,255,0.06)"
          pointerEvents="none"
        />

        {position != null && (
          <Box
            position="absolute"
            top={0}
            left={0}
            px={2}
            py={1}
            bg="rgba(15,15,14,0.85)"
            color={position <= 3 ? "signal.300" : "ink.100"}
            fontFamily="mono"
            fontWeight={600}
            fontSize={size === "sm" ? "xs" : "sm"}
            borderBottomRightRadius="md"
            zIndex={2}
          >
            {String(position).padStart(2, "0")}
          </Box>
        )}

        <Box
          position="absolute"
          top={1.5}
          right={1.5}
          zIndex={2}
          opacity={highlightAddToList ? 1 : 0}
          _groupHover={{ opacity: 1 }}
          _focusWithin={{ opacity: 1 }}
          transition="opacity 120ms ease"
          onClick={(e) => e.preventDefault()}
        >
          <WatchlistButton series={series} variant="solid" size="sm" menuAsBox />
        </Box>

        {showCharacter && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            px={2}
            py={1.5}
            bg="rgba(15,15,14,0.88)"
            zIndex={1}
          >
            <Text fontSize="xs" color="ink.200" noOfLines={1}>
              {showCharacter}
            </Text>
          </Box>
        )}
      </Box>

      {showTitle ? (
        <Box mt={2}>
          <LinkOverlay
            as={RouterLink}
            to={`/series/${series.id}`}
            display="block"
            fontSize="sm"
            fontWeight={500}
            color="ink.100"
            noOfLines={1}
            title={series.name}
            _groupHover={{ color: "ink.50" }}
          >
            {series.name}
          </LinkOverlay>
          <Flex mt={1} align="center" gap={2} minH="20px">
            {year && (
              <Text fontFamily="mono" fontSize="xs" color="ink.400">
                {year}
              </Text>
            )}
            {series.rating != null && series.rating > 0 && (
              <ScoreBadge score={series.rating} size="sm" />
            )}
          </Flex>
        </Box>
      ) : (
        <LinkOverlay as={RouterLink} to={`/series/${series.id}`} aria-label={series.name} />
      )}
    </LinkBox>
  );
}
