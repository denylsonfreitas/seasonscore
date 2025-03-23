import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  HStack,
  Image,
  Text,
  Box,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { searchSeries } from "../../services/tmdb";
import { debounce } from "lodash";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (seriesId: number) => void;
  title?: string;
  subtitle?: string;
}

export function SearchModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  title = "Buscar Séries", 
  subtitle = "Digite o nome da série que deseja encontrar" 
}: SearchModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = debounce(async (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchSeries(query);
      setResults(data.results);
    } catch (error) {
      console.error("Erro ao buscar séries:", error);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(search);
    return () => debouncedSearch.cancel();
  }, [search]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg"
      scrollBehavior="inside"
      blockScrollOnMount={false}
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text color="gray.400" fontSize="sm">
              {subtitle}
            </Text>
            <Input
              placeholder="Buscar séries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="gray.700"
              border="none"
              _focus={{ ring: 1, ringColor: "primary.500" }}
              autoFocus
            />
          </VStack>

          {isLoading ? (
            <Box textAlign="center" py={4}>
              <Spinner color="primary.500" />
            </Box>
          ) : results.length > 0 ? (
            <VStack spacing={4} align="stretch" maxH="400px" overflowY="auto">
              {results.map((series) => (
                <HStack
                  key={series.id}
                  spacing={4}
                  p={2}
                  borderRadius="md"
                  bg="gray.700"
                  cursor="pointer"
                  _hover={{ bg: "gray.600" }}
                  onClick={() => onSelect(series.id)}
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${series.poster_path}`}
                    alt={series.name}
                    width="46px"
                    height="69px"
                    borderRadius="md"
                    objectFit="cover"
                    fallbackSrc="https://dummyimage.com/46x69/ffffff/000000.png&text=Poster"
                  />
                  <Box flex="1">
                    <Text color="white" fontWeight="bold">
                      {series.name}
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      {new Date(series.first_air_date).getFullYear()}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          ) : search && !isLoading ? (
            <Text color="gray.400" textAlign="center">
              Nenhuma série encontrada.
            </Text>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 