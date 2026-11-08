import { Box, Flex, Text, Tooltip } from "@chakra-ui/react";
import { formatScore, scoreColor } from "../../utils/score";

export interface SeasonScore {
  season: number;
  /** Média da comunidade (0,5–5). Ausente quando ninguém avaliou. */
  score?: number | null;
  count?: number;
}

interface SeasonStripProps {
  seasons: SeasonScore[];
  /** "full" mostra rótulos T1, T2…; "compact" é a versão de 24 px para cards. */
  variant?: "full" | "compact";
  height?: number;
  selected?: number;
  onSelect?: (season: number) => void;
}

/**
 * Faixa de temporadas: uma barra por temporada, com altura e cor pela nota média.
 * É o elemento-assinatura do SeasonScore (veja DESIGN.md).
 */
export function SeasonStrip({
  seasons,
  variant = "full",
  height,
  selected,
  onSelect,
}: SeasonStripProps) {
  const compact = variant === "compact";
  const barArea = height ?? (compact ? 24 : 72);
  const many = seasons.length > 12;

  return (
    <Flex
      role="list"
      aria-label="Nota média por temporada"
      align="flex-end"
      gap={compact ? "2px" : many ? 1 : 1.5}
      overflowX={compact ? "hidden" : "auto"}
      pb={compact ? 0 : 1}
      sx={{ scrollbarWidth: "thin" }}
    >
      {seasons.map(({ season, score, count }) => {
        const hasScore = score != null && score > 0;
        const pct = hasScore ? Math.max(8, (score / 5) * 100) : 100;
        const isSelected = selected === season;
        const label = hasScore
          ? `Temporada ${season}: ${formatScore(score)}${count ? ` (${count} ${count === 1 ? "avaliação" : "avaliações"})` : ""}`
          : `Temporada ${season}: sem avaliações`;

        const bar = (
          <Box
            role="listitem"
            as={onSelect ? "button" : "div"}
            {...(onSelect ? { type: "button" } : {})}
            aria-label={label}
            aria-pressed={onSelect ? isSelected : undefined}
            onClick={onSelect ? () => onSelect(season) : undefined}
            flex={compact ? 1 : "0 0 auto"}
            w={compact ? undefined : many ? "22px" : "32px"}
            minW={compact ? "3px" : undefined}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={1.5}
            cursor={onSelect ? "pointer" : "default"}
            _hover={onSelect ? { "& > .bar": { opacity: 1 } } : undefined}
          >
            {!compact && (
              <Text
                fontFamily="mono"
                fontSize="2xs"
                fontWeight={600}
                color={hasScore ? "ink.100" : "ink.600"}
                lineHeight={1}
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {hasScore ? formatScore(score) : "–"}
              </Text>
            )}
            <Box h={`${barArea}px`} w="100%" display="flex" alignItems="flex-end">
              <Box
                className="bar"
                w="100%"
                h={`${pct}%`}
                bg={hasScore ? scoreColor(score) : "transparent"}
                border={hasScore ? undefined : "1px dashed"}
                borderColor="ink.700"
                borderRadius="2px"
                opacity={selected == null || isSelected ? 1 : 0.45}
                outline={isSelected ? "2px solid" : undefined}
                outlineColor="ink.50"
                outlineOffset="2px"
                transition="opacity 120ms ease"
              />
            </Box>
            {!compact && (
              <Text
                textStyle="label"
                fontSize="2xs"
                color={isSelected ? "ink.50" : "ink.400"}
                lineHeight={1}
              >
                T{season}
              </Text>
            )}
          </Box>
        );

        return compact ? (
          <Box key={season} flex={1} display="flex">
            {bar}
          </Box>
        ) : (
          <Tooltip key={season} label={label} openDelay={300} hasArrow>
            {bar}
          </Tooltip>
        );
      })}
    </Flex>
  );
}
