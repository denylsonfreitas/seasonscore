import {
  Box,
  Container,
  SimpleGrid,
  Flex,
  Spinner,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Heading,
  Text,
  InputLeftElement,
  VStack,
  Tag,
  HStack,
  CloseButton,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Icon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  useDisclosure,
  Portal,
} from "@chakra-ui/react";
import { SeriesGrid } from "../components/series/SeriesGrid";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import {
  searchSeries,
  getFilteredSeries,
  SeriesResponse,
  SeriesListItem,
  getPopularSeries,
  getAiringTodaySeries,
} from "../services/tmdb";
import { useState, useEffect, useMemo, useRef } from "react";
import { SeriesFilter } from "../components/series/SeriesFilter";
import { Footer } from "../components/common/Footer";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  MagnifyingGlass, 
  Calendar, 
  SortDescending, 
  Television, 
  Star, 
  TrendUp,
  Funnel,
} from "@phosphor-icons/react";
import { getSeriesReviews } from "../services/reviews";
import { getListById } from "../services/lists";
import { PageHeader } from "../components/common/PageHeader";

export function Series() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeSearch, setActiveSearch] = useState(searchParams.get("search") || "");
  const [genreFilter, setGenreFilter] = useState(searchParams.get("genre") || "");
  const [genreName, setGenreName] = useState(searchParams.get("name") || "");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const filterPopoverRef = useRef<HTMLButtonElement>(null);
  
  const navigate = useNavigate();
  
  // Verificar se estamos adicionando a uma lista específica
  const [listId, setListId] = useState<string | null>(searchParams.get("list_id"));
  const [listInfo, setListInfo] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Efeito que sincroniza os parâmetros da URL com o estado local
  // Este efeito só é executado uma vez na montagem do componente
  useEffect(() => {
    // Inicialização dos estados a partir dos parâmetros da URL
    const search = searchParams.get("search") || "";
    const genre = searchParams.get("genre") || "";
    const name = searchParams.get("name") || "";
    const listIdParam = searchParams.get("list_id");

    setSearchQuery(search);
    setActiveSearch(search);
    setGenreFilter(genre);
    setGenreName(name ? decodeURIComponent(name) : "");
    
    if (listIdParam) {
      setListId(listIdParam);
      fetchListInfo(listIdParam);
    }
  }, []); // Sem dependências - executado apenas na montagem
  
  const fetchListInfo = async (id: string) => {
    setIsLoadingList(true);
    try {
      const list = await getListById(id);
      setListInfo(list);
    } catch (error) {
      console.error("Erro ao buscar informações da lista:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Query para todas as séries
  const { 
    data: allSeriesData, 
    fetchNextPage: fetchAllSeriesNextPage, 
    hasNextPage: hasAllSeriesNextPage, 
    isFetchingNextPage: isAllSeriesFetchingNextPage, 
    isLoading: isAllSeriesLoading,
    refetch: refetchAllSeries
  } = useInfiniteQuery({
    queryKey: ["series", "all", activeSearch, genreFilter],
    queryFn: async ({ pageParam = 1 }) => {
      if (activeSearch) {
        return searchSeries(activeSearch, pageParam as number);
      } else if (genreFilter) {
        return getFilteredSeries({ 
          genre: genreFilter,
          sortBy: "popularity.desc"
        }, pageParam as number);
      } else {
        return getFilteredSeries({ 
          sortBy: "popularity.desc"
        }, pageParam as number);
      }
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
  
  // Atualizar a busca quando os filtros mudarem
  useEffect(() => {
    refetchAllSeries();
  }, [activeSearch, genreFilter, refetchAllSeries]);

  // Processamento de dados
  const currentQueryData = allSeriesData;
  const isLoading = isAllSeriesLoading;
  const hasNextPage = hasAllSeriesNextPage;
  const isFetchingNextPage = isAllSeriesFetchingNextPage;
  const fetchNextPage = fetchAllSeriesNextPage;
  
  const allSeries = currentQueryData?.pages.flatMap((page) => page.results) ?? [];
  
  // Remover séries duplicadas
  const uniqueSeries = allSeries.filter(
    (series, index, self) =>
      index === self.findIndex((s) => s.id === series.id)
  );

  // Buscar avaliações para todas as séries
  const seriesReviewsQueries = useQueries({
    queries: uniqueSeries.map(series => ({
      queryKey: ['series-reviews', series.id],
      queryFn: async () => {
        const reviews = await getSeriesReviews(series.id);
        if (reviews.length > 0) {
          const allRatings = reviews.flatMap(review => 
            review.seasonReviews.map(sr => sr.rating)
          );
          return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }
        return null;
      },
      staleTime: 1000 * 60 * 5, // 5 minutos
    }))
  });

  // Mapear as avaliações para as séries
  const seriesWithRatings = useMemo(() => {
    return uniqueSeries.map((series, index) => ({
      ...series,
      rating: seriesReviewsQueries[index]?.data ?? undefined
    }));
  }, [uniqueSeries, seriesReviewsQueries]);
  
  // Ordenação das séries por popularidade (padrão da API)
  const sortedSeriesWithRatings = useMemo(() => {
    // Clonar array para não modificar o original
    const sorted = [...seriesWithRatings];
    // Ordenar por popularidade (padrão)
    return sorted;
  }, [seriesWithRatings]);
  
  // Estatísticas
  const stats = useMemo(() => {
    const totalSeries = sortedSeriesWithRatings.length;
    
    // Séries com avaliações
    const seriesWithRatingsCount = sortedSeriesWithRatings.filter(s => s.rating !== undefined).length;
    
    // Média de avaliações
    const ratings = sortedSeriesWithRatings
      .filter(s => s.rating !== undefined)
      .map(s => s.rating as number);
    
    const averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
    
    // Séries por gênero (simulado - em um app real poderia buscar de uma API)
    const genresCount = {
      drama: Math.floor(totalSeries * 0.4),
      comedia: Math.floor(totalSeries * 0.25),
      acao: Math.floor(totalSeries * 0.2),
      outros: Math.floor(totalSeries * 0.15),
    };
    
    return {
      totalSeries,
      seriesWithRatingsCount,
      averageRating,
      genresCount,
    };
  }, [sortedSeriesWithRatings]);

  // Cores para o modo escuro do site
  const statBgColor = useColorModeValue("gray.700", "gray.800");
  const statBorderColor = useColorModeValue("gray.600", "gray.700");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setActiveSearch(searchQuery);
      updateSearchParams();
    }
  };

  const handleSearchClick = () => {
    setActiveSearch(searchQuery);
    updateSearchParams();
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    
    // Remover o parâmetro de busca da URL
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("search");
    setSearchParams(newParams);
  };

  const handleGenreChange = (genre: string, name: string = "") => {
    setGenreFilter(genre);
    setGenreName(name);
    updateSearchParams();
  };

  const clearGenreFilter = () => {
    setGenreFilter("");
    setGenreName("");
    
    // Remover os parâmetros de gênero da URL
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("genre");
    newParams.delete("name");
    setSearchParams(newParams);
  };
  
  // Função para atualizar os parâmetros da URL
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (activeSearch.trim()) {
      params.set("search", activeSearch.trim());
    }
    
    if (genreFilter) {
      params.set("genre", genreFilter);
      if (genreName) params.set("name", genreName);
    }
    
    if (listId) {
      params.set("list_id", listId);
    }
    
    setSearchParams(params);
  };

  if (isLoading && seriesWithRatings.length === 0) {
    return (
      <Center minH="70vh">
        <Spinner size="xl" color="primary.500" />
      </Center>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <PageHeader
        title="Séries"
        subtitle="Explore e descubra novas séries para assistir"
        showSearch={true}
        searchPlaceholder="Buscar séries..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        onSearchSubmit={handleSearch}
        actionButton={
          <Popover
            isOpen={isOpen}
            onClose={onClose}
            placement="bottom-end"
            closeOnBlur={true}
            isLazy
          >
            <PopoverTrigger>
              <Button
                ref={filterPopoverRef}
                leftIcon={<Icon as={Funnel} weight="bold" />}
                colorScheme="primary"
                variant="solid"
                onClick={onOpen}
                size="md"
              >
                Filtros
              </Button>
            </PopoverTrigger>
            <Portal>
              <PopoverContent 
                bg="gray.800" 
                borderColor="gray.700" 
                width={{ base: "300px", md: "400px" }}
                _focus={{ boxShadow: "none" }}
              >
                <PopoverArrow bg="gray.800" />
                <PopoverCloseButton color="gray.400" />
                <PopoverBody p={4}>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text color="gray.300" fontWeight="medium" mb={2}>Gênero</Text>
                      <SeriesFilter
                        genreFilter={genreFilter}
                        onGenreChange={(genre, name) => {
                          handleGenreChange(genre, name);
                          onClose();
                        }}
                      />
                    </Box>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Portal>
          </Popover>
        }
      />

      <Container maxW="container.lg" flex="1" py={8}>
        {listId && listInfo && (
          <Alert status="info" mb={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Adicionando séries à lista:</AlertTitle>
              <AlertDescription>
                "{listInfo.title}" - Use o botão de listas em cada série para adicionar à sua lista.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Mostrar tags de filtros ativos */}
        {(activeSearch || genreFilter) && (
          <Box mb={6}>
            <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={2}>
              Filtros ativos:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {activeSearch && (
                <Tag colorScheme="primary" size="md">
                  <HStack spacing={2}>
                    <Text>Busca: {activeSearch}</Text>
                    <CloseButton size="sm" onClick={clearSearch} />
                  </HStack>
                </Tag>
              )}
              {genreFilter && genreName && (
                <Tag colorScheme="purple" size="md">
                  <HStack spacing={2}>
                    <Text>Gênero: {genreName}</Text>
                    <CloseButton size="sm" onClick={clearGenreFilter} />
                  </HStack>
                </Tag>
              )}
            </HStack>
          </Box>
        )}
        
        <Divider mb={6} borderColor="gray.700" />

        <SeriesGrid
          series={sortedSeriesWithRatings}
          isLoading={isLoading && sortedSeriesWithRatings.length === 0}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </Container>
      <Footer />
    </Flex>
  );
}
