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
  Box,
  Text,
  InputGroup,
  InputRightElement,
  Spinner,
  Heading,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { searchSeries } from "../../services/tmdb";
import { EnhancedImage } from "../common/EnhancedImage";
import { SeriesSearchResult } from "../../types/series";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (seriesId: number) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Modal para busca de séries
 */
export function SearchModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  title = "Buscar Séries", 
  subtitle = "Digite o nome da série que deseja encontrar" 
}: SearchModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SeriesSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setResults([]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await searchSeries(search);
        setResults(data.results || []);
      } catch (error) {
        console.error("Erro na busca:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>
          <Heading size="md">{title}</Heading>
          <Text fontSize="sm" color="gray.400" mt={1}>
            {subtitle}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <InputGroup mb={6}>
            <Input
              ref={inputRef}
              id="series-search"
              name="series-search"
              placeholder="Nome da série"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="gray.700"
              border="none"
              _focus={{ 
                boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)",
                borderColor: "primary.500"
              }}
            />
            <InputRightElement>
              {isLoading && <Spinner size="sm" color="primary.500" />}
            </InputRightElement>
          </InputGroup>
          
          {results.length > 0 ? (
            <VStack spacing={4} maxH="60vh" overflowY="auto" pr={2} align="stretch">
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
                  <Box width="46px" height="69px" borderRadius="md" overflow="hidden">
                    <EnhancedImage
                      src={`https://image.tmdb.org/t/p/w92${series.poster_path}`}
                      alt={series.name}
                      tmdbWidth="w92"
                      fallbackText="Poster"
                    />
                  </Box>
                  <Box flex="1">
                    <Text color="white" fontWeight="bold">
                      {series.name}
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      {series.first_air_date ? new Date(series.first_air_date).getFullYear() : 'Desconhecido'}
                    </Text>
                  </Box>
                </HStack>
              ))}
            </VStack>
          ) : search && !isLoading ? (
            <Text color="gray.400" textAlign="center">
              Nenhuma série encontrada.
            </Text>
          ) : isLoading && search.trim().length >= 2 ? (
            <VStack spacing={4} align="stretch">
              {[1, 2, 3, 4, 5].map((i) => (
                <HStack
                  key={i}
                  spacing={4}
                  p={2}
                  borderRadius="md"
                  bg="gray.700"
                >
                  <Skeleton 
                    width="46px" 
                    height="69px" 
                    borderRadius="md" 
                    startColor="gray.600" 
                    endColor="gray.500"
                  />
                  <Box flex="1">
                    <Skeleton height="20px" width="80%" mb={2} startColor="gray.600" endColor="gray.500" />
                    <Skeleton height="15px" width="40%" startColor="gray.600" endColor="gray.500" />
                  </Box>
                </HStack>
              ))}
            </VStack>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 