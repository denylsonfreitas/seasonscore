import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: PhosphorIcon;
  /** O fato: "Nenhuma avaliação ainda." */
  title: ReactNode;
  /** A próxima ação: "Avalie uma temporada para ela aparecer aqui." */
  description?: ReactNode;
  action?: ReactNode;
}

/** Estado vazio alinhado à esquerda, discreto, com a próxima ação. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Flex
      gap={4}
      align="flex-start"
      py={6}
      px={5}
      border="1px dashed"
      borderColor="ink.700"
      borderRadius="lg"
    >
      {icon && <Icon as={icon} boxSize={6} color="ink.400" flexShrink={0} mt="1px" />}
      <Box>
        <Text color="ink.100" fontWeight={600}>
          {title}
        </Text>
        {description && (
          <Text mt={1} color="ink.300" fontSize="sm">
            {description}
          </Text>
        )}
        {action && <Box mt={4}>{action}</Box>}
      </Box>
    </Flex>
  );
}
