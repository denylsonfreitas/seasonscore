import { Box, Flex, Link, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Logo } from "./Logo";
import { PageContainer } from "../layout/PageContainer";

const footerLink = {
  color: "ink.300",
  fontSize: "sm",
  _hover: { color: "ink.50", textDecoration: "none" },
};

export function Footer() {
  return (
    <Box as="footer" mt="auto" borderTop="1px solid" borderColor="ink.800" bg="ink.950">
      <PageContainer py={{ base: 8, md: 10 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap={{ base: 6, md: 10 }}
        >
          <Box maxW="360px">
            <Logo size="sm" />
            <Text mt={3} color="ink.400" fontSize="sm">
              Avalie séries temporada por temporada. Projeto independente, sem fins lucrativos.
            </Text>
          </Box>

          <Stack direction="row" spacing={{ base: 10, md: 14 }}>
            <Stack spacing={2}>
              <Text textStyle="label" color="ink.400">
                Navegar
              </Text>
              <Link as={RouterLink} to="/series" {...footerLink}>
                Séries
              </Link>
              <Link as={RouterLink} to="/series/top10" {...footerLink}>
                Top 10
              </Link>
              <Link as={RouterLink} to="/lists" {...footerLink}>
                Listas
              </Link>
            </Stack>
            <Stack spacing={2}>
              <Text textStyle="label" color="ink.400">
                Projeto
              </Text>
              <Link
                href="https://github.com/denylsonfreitas/seasonscore"
                isExternal
                {...footerLink}
              >
                GitHub
              </Link>
              <Link
                href="https://github.com/denylsonfreitas/seasonscore/issues/new"
                isExternal
                {...footerLink}
              >
                Reportar um erro
              </Link>
              <Link href="https://linkedin.com/in/denylsonfreitas" isExternal {...footerLink}>
                LinkedIn
              </Link>
            </Stack>
          </Stack>
        </Flex>

        <Flex
          mt={8}
          pt={5}
          borderTop="1px solid"
          borderColor="ink.800"
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          gap={2}
        >
          <Text fontSize="xs" color="ink.400">
            © {new Date().getFullYear()} SeasonScore
          </Text>
          <Text fontSize="xs" color="ink.400">
            Dados de séries fornecidos pelo{" "}
            <Link href="https://www.themoviedb.org" isExternal color="ink.300">
              TMDB
            </Link>
            . Este produto não é endossado nem certificado pelo TMDB.
          </Text>
        </Flex>
      </PageContainer>
    </Box>
  );
}
