import { Box, type BoxProps } from "@chakra-ui/react";

/** Contêiner padrão das páginas: 1200px com margens laterais de 16/24/32px. */
export function PageContainer(props: BoxProps) {
  return <Box w="100%" maxW="1200px" mx="auto" px={{ base: 4, md: 6, lg: 8 }} {...props} />;
}
