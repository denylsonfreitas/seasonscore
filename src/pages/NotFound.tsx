import { Box, Button, Heading, HStack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { SeasonStrip } from "../components/series/SeasonStrip";

const STRIP = [
  { season: 1, score: 4.2 },
  { season: 2, score: 3.8 },
  { season: 3, score: 4.5 },
  { season: 4, score: null },
];

export function NotFound() {
  return (
    <PageContainer py={{ base: 16, md: 24 }}>
      <Box maxW="560px">
        <Text textStyle="label" color="ink.400">
          Erro 404
        </Text>
        <Heading as="h1" size="h1" mt={2}>
          Essa página foi cancelada antes de estrear.
        </Heading>
        <Text mt={4} color="ink.300" fontSize="lg">
          O endereço pode estar errado ou o conteúdo foi removido.
        </Text>
        <Box mt={8} aria-hidden="true">
          <SeasonStrip seasons={STRIP} height={64} />
        </Box>
        <HStack mt={8} spacing={3}>
          <Button as={Link} to="/">
            Ir para o início
          </Button>
          <Button as={Link} to="/series" variant="outline">
            Explorar séries
          </Button>
        </HStack>
      </Box>
    </PageContainer>
  );
}
