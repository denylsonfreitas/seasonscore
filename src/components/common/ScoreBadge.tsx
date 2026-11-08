import { Box, type BoxProps } from "@chakra-ui/react";
import { formatScore, scoreColor } from "../../utils/score";

interface ScoreBadgeProps extends BoxProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { fontSize: "xs", px: 1.5, h: "20px" },
  md: { fontSize: "sm", px: 2, h: "24px" },
  lg: { fontSize: "xl", px: 3, h: "40px" },
};

/** Nota em mono com um traço lateral na cor da faixa. Ex.: ▍4,5 */
export function ScoreBadge({ score, size = "md", ...props }: ScoreBadgeProps) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      bg="ink.850"
      color="ink.50"
      fontFamily="mono"
      fontWeight={600}
      lineHeight={1}
      borderRadius="xs"
      borderLeft="2px solid"
      borderLeftColor={scoreColor(score)}
      aria-label={`Nota ${formatScore(score)} de 5`}
      sx={{ fontVariantNumeric: "tabular-nums" }}
      {...sizes[size]}
      {...props}
    >
      {formatScore(score)}
    </Box>
  );
}
