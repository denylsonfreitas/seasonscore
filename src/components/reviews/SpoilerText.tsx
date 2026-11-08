import { Box, Button, HStack, Text, type TextProps } from "@chakra-ui/react";
import { Eye, Warning } from "@phosphor-icons/react";
import { useState, type MouseEvent } from "react";

interface SpoilerTextProps extends TextProps {
  text: string;
  hasSpoiler?: boolean;
  /** O próprio autor sempre vê o texto (com um aviso discreto). */
  isOwn?: boolean;
}

/**
 * Texto de avaliação que fica escondido quando o autor marcou spoiler.
 * O texto só aparece depois que a pessoa escolhe ver; a escolha vale para este texto.
 */
export function SpoilerText({
  text,
  hasSpoiler = false,
  isOwn = false,
  ...textProps
}: SpoilerTextProps) {
  const [revealed, setRevealed] = useState(false);

  if (!hasSpoiler || isOwn || revealed) {
    return (
      <Box>
        {hasSpoiler && (
          <HStack spacing={1} mb={1} color="score.mid" fontSize="xs" fontWeight={500}>
            <Warning size={12} />
            <Text as="span">Contém spoiler</Text>
          </HStack>
        )}
        <Text {...textProps}>{text}</Text>
      </Box>
    );
  }

  const reveal = (e: MouseEvent) => {
    // Dentro de cards clicáveis, mostrar o texto não deve abrir a avaliação
    e.preventDefault();
    e.stopPropagation();
    setRevealed(true);
  };

  return (
    <Box position="relative" zIndex={1}>
      <Text
        {...textProps}
        aria-hidden="true"
        filter="blur(6px)"
        userSelect="none"
        pointerEvents="none"
        opacity={0.7}
      >
        {text}
      </Text>
      <Box
        position="absolute"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="flex-start"
      >
        <Button
          size="xs"
          variant="outline"
          bg="ink.900"
          leftIcon={<Eye size={14} />}
          onClick={reveal}
          aria-label="Contém spoiler. Mostrar o texto da avaliação"
        >
          Contém spoiler · Mostrar
        </Button>
      </Box>
    </Box>
  );
}
