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
  Flex,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { TelevisionSimple, Info } from "@phosphor-icons/react";
import { EnhancedImage } from "../../common/EnhancedImage";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface WatchProviders {
  flatrate?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
  link?: string;
}

interface SeriesWatchProvidersTabProps {
  series: {
    "watch/providers"?: {
      results?: {
        BR?: WatchProviders;
      };
    };
    [key: string]: any;
  };
}

export function SeriesWatchProvidersTab({ series }: SeriesWatchProvidersTabProps) {
  const watchProviders = series["watch/providers"]?.results?.BR;

  if (!watchProviders) {
    return (
      <Box py={8}>
        <Flex 
          direction="column" 
          alignItems="center" 
          justifyContent="center" 
          textAlign="center" 
          p={6} 
          bg="gray.800" 
          borderRadius="lg"
        >
          <Icon as={Info} boxSize={12} color="gray.500" mb={4} />
          <Heading size="md" color="white" mb={2}>
            Informações não disponíveis
          </Heading>
          <Text color="gray.400">
            Não encontramos informações sobre onde assistir esta série no Brasil.
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={8}>
      {watchProviders.link && (
        <Box mt={4} mb={2}>
          <Link href={watchProviders.link} isExternal>
            <Button colorScheme="primary" size="sm">
              Ver todas as opções
            </Button>
          </Link>
        </Box>
      )}
      
      {watchProviders.flatrate && (
        <Box>
          <Heading size="md" color="white" mb={4}>
            Streaming
          </Heading>
          <Wrap spacing={4}>
            {watchProviders.flatrate.map((provider: Provider) => (
              <WrapItem key={provider.provider_id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Box 
                    width="50px" 
                    height="50px" 
                    mx="auto"
                  >
                    <EnhancedImage
                      src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                      alt={provider.provider_name}
                      tmdbWidth="w200"
                    />
                  </Box>
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
            {watchProviders.rent.map((provider: Provider) => (
              <WrapItem key={provider.provider_id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Box 
                    width="50px" 
                    height="50px" 
                    mx="auto"
                  >
                    <EnhancedImage
                      src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                      alt={provider.provider_name}
                      tmdbWidth="w200"
                    />
                  </Box>
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
            {watchProviders.buy.map((provider: Provider) => (
              <WrapItem key={provider.provider_id}>
                <Box
                  bg="gray.800"
                  p={4}
                  borderRadius="md"
                  textAlign="center"
                >
                  <Box 
                    width="50px" 
                    height="50px" 
                    mx="auto"
                  >
                    <EnhancedImage
                      src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                      alt={provider.provider_name}
                      tmdbWidth="w200"
                    />
                  </Box>
                  <Text color="white" fontSize="sm" mt={2}>
                    {provider.provider_name}
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