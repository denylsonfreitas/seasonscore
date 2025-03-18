import {
  VStack,
  Box,
  Heading,
  Wrap,
  WrapItem,
  Image,
  Text,
  Link,
  Button,
} from "@chakra-ui/react";
import { TelevisionSimple } from "@phosphor-icons/react";

interface SeriesWatchProvidersTabProps {
  series: any; // O tipo completo seria melhor
}

export function SeriesWatchProvidersTab({ series }: SeriesWatchProvidersTabProps) {
  const watchProviders = series["watch/providers"]?.results?.BR;

  if (!watchProviders) {
    return (
      <Text color="gray.400" textAlign="center">
        Não há informações disponíveis sobre onde assistir esta série no Brasil.
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={6}>
      {watchProviders.flatrate && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Disponível no Streaming
          </Heading>
          <Wrap spacing={4}>
            {watchProviders.flatrate.map((provider: any) => (
              <WrapItem key={provider.provider_id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                    alt={provider.provider_name}
                    width="50px"
                    height="50px"
                    objectFit="contain"
                    mx="auto"
                  />
                  <Text color="white" fontSize="sm" mt={2}>
                    {provider.provider_name}
                  </Text>
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {watchProviders.rent && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Alugar
          </Heading>
          <Wrap spacing={4}>
            {watchProviders.rent.map((provider: any) => (
              <WrapItem key={provider.provider_id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                    alt={provider.provider_name}
                    width="50px"
                    height="50px"
                    objectFit="contain"
                    mx="auto"
                  />
                  <Text color="white" fontSize="sm" mt={2}>
                    {provider.provider_name}
                  </Text>
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {watchProviders.buy && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Comprar
          </Heading>
          <Wrap spacing={4}>
            {watchProviders.buy.map((provider: any) => (
              <WrapItem key={provider.provider_id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                    alt={provider.provider_name}
                    width="50px"
                    height="50px"
                    objectFit="contain"
                    mx="auto"
                  />
                  <Text color="white" fontSize="sm" mt={2}>
                    {provider.provider_name}
                  </Text>
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {watchProviders.link && (
        <Link
          href={watchProviders.link}
          isExternal
          color="teal.400"
          textAlign="center"
          mt={4}
        >
          <Button
            rightIcon={<TelevisionSimple weight="bold" />}
            colorScheme="teal"
            variant="outline"
          >
            Ver todas as opções de streaming
          </Button>
        </Link>
      )}
    </VStack>
  );
} 