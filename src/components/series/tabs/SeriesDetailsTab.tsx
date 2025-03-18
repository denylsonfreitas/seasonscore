import {
  VStack,
  Box,
  Heading,
  SimpleGrid,
  Text,
  Wrap,
  WrapItem,
  Avatar,
  Image,
} from "@chakra-ui/react";

interface SeriesDetailsTabProps {
  series: any; // O tipo completo seria melhor
}

export function SeriesDetailsTab({ series }: SeriesDetailsTabProps) {
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="md" color="white" mb={4}>
          Informações Gerais
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box>
            <Text color="gray.400">Status</Text>
            <Text color="white">{series.status}</Text>
          </Box>
          <Box>
            <Text color="gray.400">Tipo</Text>
            <Text color="white">{series.type}</Text>
          </Box>
          <Box>
            <Text color="gray.400">País de Origem</Text>
            <Text color="white">{series.origin_country?.join(", ")}</Text>
          </Box>
          <Box>
            <Text color="gray.400">Idioma Original</Text>
            <Text color="white">{series.original_language}</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {series.created_by?.length > 0 && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Criado por
          </Heading>
          <Wrap spacing={4}>
            {series.created_by.map((creator: any) => (
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
                  <Text color="white" fontSize="sm" mt={2} textAlign="center">
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
          <Heading size="md" color="white" mb={4}>
            Produção
          </Heading>
          <Wrap spacing={4}>
            {series.production_companies.map((company: any) => (
              <WrapItem key={company.id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                  minW="150px"
                >
                  {company.logo_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                      alt={company.name}
                      height="50px"
                      objectFit="contain"
                      mx="auto"
                      mb={2}
                    />
                  ) : (
                    <Text color="white" fontSize="xl" mb={2}>
                      {company.name[0]}
                    </Text>
                  )}
                  <Text color="white" fontSize="sm">
                    {company.name}
                  </Text>
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
    </VStack>
  );
} 