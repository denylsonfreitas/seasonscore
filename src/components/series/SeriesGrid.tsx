import { 
  Box, 
  SimpleGrid, 
  Spinner, 
  Flex, 
  Center, 
  Text, 
  HStack, 
  Button, 
  Icon,
  VStack,
  Badge,
  useBreakpointValue
} from "@chakra-ui/react";
import { SeriesCard, SeriesCardSkeleton } from "./SeriesCard";
import { SeriesListItem } from "../../services/tmdb";
import { InfiniteScroll } from "../common/InfiniteScroll";
import { GridFour, Rows, Star } from "@phosphor-icons/react";
import { useState } from "react";
import { EnhancedImage } from "../common/EnhancedImage";

// Estendendo o tipo SeriesListItem para incluir a propriedade rating
interface SeriesWithRating extends SeriesListItem {
  rating?: number;
}

interface SeriesGridProps {
  series: SeriesWithRating[];
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function SeriesGrid({ series, isLoading, hasNextPage, isFetchingNextPage, onLoadMore }: SeriesGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Configuração responsiva de colunas
  const columns = useBreakpointValue({ 
    base: 2, 
    sm: 3, 
    md: 4, 
    lg: 6, 
    xl: 6 
  }) || 4;
  
  if (isLoading && series.length === 0) {
    return (
      <Box>
        <HStack spacing={4} mb={4} justify="flex-end">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'solid' : 'ghost'}
            colorScheme="primary"
            onClick={() => setViewMode('grid')}
          >
            <Icon as={GridFour} weight="bold" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'solid' : 'ghost'}
            colorScheme="primary"
            onClick={() => setViewMode('list')}
          >
            <Icon as={Rows} weight="bold" />
          </Button>
        </HStack>
        
        {viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6, xl: 6 }} spacing={4}>
            {Array(12).fill(0).map((_, i) => (
              <SeriesCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={3} align="stretch">
            {Array(8).fill(0).map((_, i) => (
              <Box 
                key={i} 
                bg="gray.800" 
                p={3} 
                borderRadius="md" 
                height="80px"
                display="flex"
                alignItems="center"
              >
                <Flex flex={1} justifyContent="space-between">
                  <HStack spacing={3}>
                    <Box 
                      w="48px" 
                      h="64px" 
                      bg="gray.700" 
                      borderRadius="md" 
                    />
                    <VStack align="start" spacing={1}>
                      <Box h="16px" w="180px" bg="gray.700" borderRadius="sm" />
                      <Box h="12px" w="100px" bg="gray.700" borderRadius="sm" />
                    </VStack>
                  </HStack>
                  <HStack>
                    <Box h="24px" w="60px" bg="gray.700" borderRadius="md" />
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    );
  }

  if (series.length === 0) {
    return (
      <Center py={10}>
        <Box textAlign="center" color="gray.500">
          Nenhuma série encontrada
        </Box>
      </Center>
    );
  }

  // Componente para visualização em lista
  const SeriesListView = ({ series }: { series: SeriesWithRating[] }) => (
    <VStack spacing={3} align="stretch">
      {series.map((item) => (
        <Box 
          key={item.id} 
          bg="gray.800" 
          p={3} 
          borderRadius="md" 
          _hover={{ bg: "gray.700" }}
          as="a"
          href={`/series/${item.id}`}
          transition="all 0.2s"
        >
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Box 
                w="48px" 
                h="64px" 
                bg="gray.700" 
                borderRadius="md" 
                overflow="hidden"
              >
                {item.poster_path && (
                  <EnhancedImage
                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                    alt={item.name}
                    tmdbWidth="w92"
                    fallbackText=""
                  />
                )}
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" noOfLines={1}>{item.name}</Text>
                <Text fontSize="sm" color="gray.400" noOfLines={1}>
                  {item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'Sem data'}
                </Text>
              </VStack>
            </HStack>
            <HStack>
              {'rating' in item && item.rating !== undefined && (
                <Badge variant="rating" fontSize="sm" p={1}>
                  <HStack spacing={1}>
                    <Icon as={Star} weight="fill" />
                    <Text>{item.rating.toFixed(1)}</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>
          </Flex>
        </Box>
      ))}
    </VStack>
  );

  return (
    <InfiniteScroll 
      loadMore={onLoadMore || (() => {})}
      hasMore={!!hasNextPage}
      isLoading={!!isFetchingNextPage}
    >
      <Box>
        <HStack spacing={4} mb={4} justify="flex-end">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'solid' : 'ghost'}
            colorScheme="primary"
            onClick={() => setViewMode('grid')}
          >
            <Icon as={GridFour} weight="bold" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'solid' : 'ghost'}
            colorScheme="primary"
            onClick={() => setViewMode('list')}
          >
            <Icon as={Rows} weight="bold" />
          </Button>
        </HStack>
        
        {viewMode === 'grid' ? (
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6, xl: 6 }} spacing={4}>
            {series.map((item) => (
              <SeriesCard key={item.id} series={item} />
            ))}
            
            {/* Mostrar skeletons enquanto carrega mais itens */}
            {isFetchingNextPage && (
              <>
                {Array(columns).fill(0).map((_, i) => (
                  <SeriesCardSkeleton key={`skeleton-${i}`} />
                ))}
              </>
            )}
          </SimpleGrid>
        ) : (
          <Box>
            <SeriesListView series={series} />
            
            {/* Skeletons para modo lista */}
            {isFetchingNextPage && (
              <VStack mt={3} spacing={3} align="stretch">
                {Array(3).fill(0).map((_, i) => (
                  <Box 
                    key={`list-skeleton-${i}`} 
                    bg="gray.800" 
                    p={3} 
                    borderRadius="md" 
                    height="80px"
                    display="flex"
                    alignItems="center"
                  >
                    <Flex flex={1} justifyContent="space-between">
                      <HStack spacing={3}>
                        <Box 
                          w="48px" 
                          h="64px" 
                          bg="gray.700" 
                          borderRadius="md" 
                        />
                        <VStack align="start" spacing={1}>
                          <Box h="16px" w="180px" bg="gray.700" borderRadius="sm" />
                          <Box h="12px" w="100px" bg="gray.700" borderRadius="sm" />
                        </VStack>
                      </HStack>
                      <HStack>
                        <Box h="24px" w="60px" bg="gray.700" borderRadius="md" />
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        )}
      </Box>
    </InfiniteScroll>
  );
}
