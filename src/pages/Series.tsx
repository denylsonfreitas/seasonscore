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
import { useState, useEffect, useMemo } from "react";
import { SeriesFilter } from "../components/series/SeriesFilter";
import { Footer } from "../components/common/Footer";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  MagnifyingGlass, 
  Calendar, 
  SortDescending, 
  Television, 
  Star, 
  TrendUp 
} from "@phosphor-icons/react";
import { getSeriesReviews } from "../services/reviews";
import { getListById } from "../services/lists";

export function Series() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeSearch, setActiveSearch] = useState(searchParams.get("search") || "");
  const [genreFilter, setGenreFilter] = useState(searchParams.get("genre") || "");
  const [genreName, setGenreName] = useState(searchParams.get("name") || "");
  const [sortBy, setSortBy] = useState("popularity.desc");
  
  const navigate = useNavigate();
  
  // Verificar se estamos adicionando a uma lista específica
  const [listId, setListId] = useState<string | null>(searchParams.get("list_id"));
  const [listInfo, setListInfo] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    // Atualiza os estados com base nos parâmetros da URL
    if (searchParams.get("search")) {
      const search = searchParams.get("search") || "";
      setSearchQuery(search);
      setActiveSearch(search);
    }
    
    if (searchParams.get("genre")) {
      const genre = searchParams.get("genre") || "";
      const name = searchParams.get("name") || "";
      setGenreFilter(genre);
      setGenreName(decodeURIComponent(name));
    }
    
    // Verificar se há um list_id e buscar informações da lista
    const listIdParam = searchParams.get("list_id");
    if (listIdParam) {
      setListId(listIdParam);
      fetchListInfo(listIdParam);
    }
    
    if (searchParams.get("sortBy")) {
      setSortBy(searchParams.get("sortBy") || "popularity.desc");
    }
  }, [searchParams]);
  
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
    queryKey: ["series", "all", activeSearch, genreFilter, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      if (activeSearch) {
        return searchSeries(activeSearch, pageParam as number);
      } else if (genreFilter) {
        return getFilteredSeries({ 
          genre: genreFilter,
          sortBy: sortBy 
        }, pageParam as number);
      } else {
        return getFilteredSeries({ 
          sortBy: sortBy
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
  }, [sortBy, refetchAllSeries]);

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
  
  // Estatísticas
  const stats = useMemo(() => {
    const totalSeries = seriesWithRatings.length;
    
    // Séries com avaliações
    const seriesWithRatingsCount = seriesWithRatings.filter(s => s.rating !== undefined).length;
    
    // Média de avaliações
    const ratings = seriesWithRatings
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
  }, [seriesWithRatings]);

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
    updateSearchParams();
  };

  const handleGenreChange = (genre: string, name: string = "") => {
    setGenreFilter(genre);
    setGenreName(name);
    updateSearchParams();
  };

  const clearGenreFilter = () => {
    setGenreFilter("");
    setGenreName("");
    updateSearchParams();
  };
  
  // Função para atualizar os parâmetros da URL
  const updateSearchParams = () => {
    const params: Record<string, string> = {};
    
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    
    if (genreFilter) {
      params.genre = genreFilter;
      if (genreName) params.name = genreName;
    }
    
    if (sortBy !== "popularity.desc") {
      params.sortBy = sortBy;
    }
    
    if (listId) {
      params.list_id = listId;
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
      <Box flex="1">
        <Container maxW="container.lg" py={8} pb={16}>
          <Flex 
            direction={{ base: "column", md: "row" }} 
            align={{ base: "start", md: "center" }} 
            justify="space-between" 
            mb={6}
          >
            <VStack align="start" spacing={1}>
              <Heading color="white" size="2xl">
                Séries
              </Heading>
              <Text color="gray.400">
                Explore e descubra novas séries para assistir
              </Text>
            </VStack>
            
            {/* Filtros em dispositivos maiores */}
            <HStack 
              display={{ base: "none", md: "flex" }} 
              spacing={4} 
              mt={{ base: 4, md: 0 }}
            >
              <Select 
                id="sort-select"
                name="sort-select"
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateSearchParams();
                }}
                bg="gray.800"
                border="none"
                width="220px"
                icon={<SortDescending />}
              >
                <option value="popularity.desc">Popularidade</option>
                <option value="vote_average.desc">Avaliação</option>
                <option value="first_air_date.desc">Data (mais recente)</option>
                <option value="first_air_date.asc">Data (mais antiga)</option>
              </Select>
            </HStack>
          </Flex>
          
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
          
          {/* Filtros em dispositivos móveis */}
          <VStack 
            display={{ base: "flex", md: "none" }} 
            spacing={3} 
            mb={5}
          >
            <Select 
              id="sort-select-mobile"
              name="sort-select-mobile"
              value={sortBy} 
              onChange={(e) => {
                setSortBy(e.target.value);
                updateSearchParams();
              }}
              bg="gray.800"
              border="none"
              icon={<SortDescending />}
            >
              <option value="popularity.desc">Popularidade</option>
              <option value="vote_average.desc">Avaliação</option>
              <option value="first_air_date.desc">Data (mais recente)</option>
              <option value="first_air_date.asc">Data (mais antiga)</option>
            </Select>
          </VStack>

          <Flex 
            gap={4} 
            mb={6} 
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            bg="gray.800"
            p={4}
            borderRadius="lg"
          >
            <Box flex={1}>
              <InputGroup>
                <Input
                  id="series-search"
                  name="series-search"
                  placeholder="Buscar séries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  bg="gray.700"
                  color="white"
                  border="none"
                  _placeholder={{ color: "gray.400" }}
                />
                <InputRightElement width="4.5rem">
                  {activeSearch && (
                    <Button 
                      h="1.75rem" 
                      size="sm" 
                      mr={1}
                      variant="ghost"
                      color="gray.400"
                      _hover={{ color: "white" }}
                      onClick={clearSearch}
                    >
                      ✕
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white" }}
                    onClick={handleSearchClick}
                    aria-label="Buscar"
                    h="1.75rem"
                    size="sm"
                    mr={6}
                  >
                    <MagnifyingGlass size={24} weight="bold" />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>

            <Box minW={{ base: "100%", md: "200px" }}>
              <SeriesFilter
                genreFilter={genreFilter}
                onGenreChange={handleGenreChange}
              />
            </Box>
          </Flex>
          
          {/* Mostrar tags de filtros ativos */}
          {(activeSearch || genreFilter || sortBy !== "popularity.desc") && (
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
                {sortBy !== "popularity.desc" && (
                  <Tag colorScheme="green" size="md">
                    Ordenação: {
                      sortBy === "vote_average.desc" ? "Avaliação" :
                      sortBy === "first_air_date.desc" ? "Data (mais recente)" :
                      sortBy === "first_air_date.asc" ? "Data (mais antiga)" : ""
                    }
                  </Tag>
                )}
              </HStack>
            </Box>
          )}
          
          <Divider mb={6} borderColor="gray.700" />

          <SeriesGrid
            series={seriesWithRatings}
            isLoading={isLoading && seriesWithRatings.length === 0}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}
