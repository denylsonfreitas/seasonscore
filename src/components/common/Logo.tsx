import { HStack, Text, type StackProps } from "@chakra-ui/react";

interface LogoProps extends StackProps {
  /** Mostra só o símbolo, sem o nome. */
  markOnly?: boolean;
  size?: "sm" | "md";
}

/** Símbolo: três barras crescentes, como notas de temporadas que melhoram. */
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2" y="11" width="4" height="7" rx="1" fill="#0BAA74" />
      <rect x="8" y="7" width="4" height="11" rx="1" fill="#26C287" />
      <rect x="14" y="2" width="4" height="16" rx="1" fill="#57D6A4" />
    </svg>
  );
}

export function Logo({ markOnly = false, size = "md", ...props }: LogoProps) {
  return (
    <HStack spacing={2} align="center" {...props}>
      <LogoMark size={size === "sm" ? 18 : 20} />
      {!markOnly && (
        <Text
          as="span"
          fontFamily="heading"
          fontWeight={800}
          fontSize={size === "sm" ? "lg" : "xl"}
          letterSpacing="-0.02em"
          lineHeight="1"
          color="ink.50"
          sx={{ fontStretch: "108%" }}
        >
          SeasonScore
        </Text>
      )}
    </HStack>
  );
}
