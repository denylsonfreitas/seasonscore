import type { Series } from "../../../services/tmdb";
import { STATUS_PT } from "../SeriesHeader";
import React from "react";
import {
  VStack,
  Box,
  Heading,
  SimpleGrid,
  Text,
  Wrap,
  WrapItem,
  Center,
  Image,
  Flex,
  Avatar,
} from "@chakra-ui/react";

const TYPE_PT: Record<string, string> = {
  Scripted: "Roteirizada",
  Reality: "Reality",
  Documentary: "Documentário",
  Miniseries: "Minissérie",
  "Talk Show": "Talk show",
  News: "Jornalismo",
  Video: "Vídeo",
};

/** Nome de idioma ou país em português, usando o Intl do navegador. */
function displayName(type: "language" | "region", code?: string) {
  if (!code) return "—";
  try {
    const name = new Intl.DisplayNames(["pt-BR"], { type }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
}

interface SeriesDetailsTabProps {
  series: Series;
}

export function SeriesDetailsTab({ series }: SeriesDetailsTabProps) {
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading as="h3" size="h3" mb={4}>
          Informações Gerais
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box>
            <Text color="ink.400">Situação</Text>
            <Text color="ink.100">{STATUS_PT[series.status] ?? series.status}</Text>
          </Box>
          <Box>
            <Text color="ink.400">Tipo</Text>
            <Text color="ink.100">{TYPE_PT[series.type] ?? series.type}</Text>
          </Box>
          <Box>
            <Text color="ink.400">País de origem</Text>
            <Text color="ink.100">
              {series.origin_country?.map((c) => displayName("region", c)).join(", ")}
            </Text>
          </Box>
          <Box>
            <Text color="ink.400">Idioma original</Text>
            <Text color="ink.100">{displayName("language", series.original_language)}</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {series.created_by?.length > 0 && (
        <Box>
          <Heading as="h3" size="h3" mb={4}>
            Criado por
          </Heading>
          <Wrap spacing={4}>
            {series.created_by.map((creator) => (
              <WrapItem key={creator.id}>
                <Box>
                  <Avatar
                    size="md"
                    name={creator.name}
                    src={
                      creator.profile_path
                        ? `https://image.tmdb.org/t/p/w200${creator.profile_path}`
                        : undefined
                    }
                  />
                  <Text color="ink.100" fontSize="sm" mt={2} textAlign="center">
                    {creator.name}
                  </Text>
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {series.production_companies?.length > 0 && (
        <Box>
          <Heading as="h3" size="h3" mb={4}>
            Produção
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
            {series.production_companies.map((company) => (
              <Box
                key={company.id}
                bg="gray.800"
                p={4}
                borderRadius="md"
                textAlign="center"
                height="150px"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Center flex="1" mb={3}>
                  {company.logo_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                      alt={company.name}
                      maxH="60px"
                      maxW="95%"
                      objectFit="contain"
                      mx="auto"
                    />
                  ) : (
                    <Flex
                      align="center"
                      justify="center"
                      bg="gray.700"
                      width="60px"
                      height="60px"
                      borderRadius="md"
                    >
                      <Text color="ink.100" fontSize="xl">
                        {company.name.charAt(0)}
                      </Text>
                    </Flex>
                  )}
                </Center>
                <Text color="ink.100" fontSize="sm" isTruncated title={company.name}>
                  {company.name}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
}
