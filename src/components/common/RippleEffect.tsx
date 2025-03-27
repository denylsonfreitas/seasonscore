import { Box, BoxProps } from "@chakra-ui/react";

interface RippleEffectProps extends BoxProps {
  /** Se o efeito de ripple está ativo */
  isRippling: boolean;
  /** Cor do efeito (com transparência) */
  color?: string;
  /** Duração da animação em ms */
  duration?: number;
  /** zIndex do efeito */
  zIndex?: number;
}

/**
 * Componente que cria um efeito de ondas ao clicar (ripple effect)
 */
export function RippleEffect({
  isRippling,
  color = "whiteAlpha.300",
  duration = 600,
  zIndex = 2,
  ...rest
}: RippleEffectProps) {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      width={isRippling ? "200%" : "0%"}
      height={isRippling ? "200%" : "0%"}
      borderRadius="full"
      bg={color}
      opacity={isRippling ? 1 : 0}
      transition={`all ${duration/1000}s cubic-bezier(0.25, 0.8, 0.25, 1)`}
      pointerEvents="none"
      zIndex={zIndex}
      {...rest}
    />
  );
} 