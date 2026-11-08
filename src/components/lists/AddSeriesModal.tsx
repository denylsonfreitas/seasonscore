import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Check, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { searchSeries, type SeriesListItem } from "../../services/tmdb";
import { yearOf } from "../../utils/score";

interface AddSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ids das séries que já estão na lista. */
  existingIds: Set<number>;
  onAdd: (series: SeriesListItem) => Promise<void>;
}

/** Busca no TMDB e adiciona séries à lista sem fechar o modal. */
export function AddSeriesModal({ isOpen, onClose, existingIds, onAdd }: AddSeriesModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SeriesListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchSeries(term, 1);
        if (!cancelled) setResults(response.results);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  const add = async (series: SeriesListItem) => {
    setAdding(series.id);
    try {
      await onAdd(series);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Adicionar séries</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="ink.400">
              <MagnifyingGlass size={16} />
            </InputLeftElement>
            <Input
              autoFocus
              type="search"
              placeholder="Nome da série"
              aria-label="Buscar série"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>

          <VStack align="stretch" spacing={0} mt={4}>
            {isSearching && results.length === 0
              ? [0, 1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    h="64px"
                    my={1}
                    borderRadius="md"
                    startColor="ink.900"
                    endColor="ink.850"
                  />
                ))
              : results.map((series) => {
                  const inList = existingIds.has(series.id);
                  return (
                    <Flex
                      key={series.id}
                      align="center"
                      gap={3}
                      py={2.5}
                      borderBottom="1px solid"
                      borderColor="ink.800"
                    >
                      <Box
                        w="36px"
                        aspectRatio={2 / 3}
                        borderRadius="sm"
                        overflow="hidden"
                        bg="ink.850"
                        flexShrink={0}
                      >
                        {series.poster_path && (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${series.poster_path}`}
                            alt=""
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        )}
                      </Box>
                      <Box flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight={500} color="ink.100" noOfLines={1}>
                          {series.name}
                        </Text>
                        <Text fontFamily="mono" fontSize="xs" color="ink.400">
                          {yearOf(series.first_air_date) || "—"}
                        </Text>
                      </Box>
                      <Button
                        size="sm"
                        variant={inList ? "ghost" : "outline"}
                        leftIcon={inList ? <Check size={14} /> : <Plus size={14} />}
                        isDisabled={inList}
                        isLoading={adding === series.id}
                        onClick={() => add(series)}
                      >
                        {inList ? "Na lista" : "Adicionar"}
                      </Button>
                    </Flex>
                  );
                })}
            {!isSearching && query.trim() && results.length === 0 && (
              <Text color="ink.400" fontSize="sm" py={4}>
                Nenhuma série encontrada para “{query.trim()}”.
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
