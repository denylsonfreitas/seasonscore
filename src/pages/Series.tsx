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
} from "@chakra-ui/react";
import { SeriesCard } from "../components/series/SeriesCard";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import {
  searchSeries,
  getFilteredSeries,
  SeriesResponse,
  SeriesListItem,
  getPopularSeries,
} from "../services/tmdb";
import { useState, useEffect, useMemo } from "react";
import { SeriesFilter } from "../components/series/SeriesFilter";
import { Footer } from "../components/common/Footer";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { getSeriesReviews } from "../services/reviews";
import { ScrollToTop } from "../components/common/ScrollToTop";

export function Series() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeSearch, setActiveSearch] = useState(searchParams.get("search") || "");
  const [genreFilter, setGenreFilter] = useState(searchParams.get("genre") || "");
  const [genreName, setGenreName] = useState(searchParams.get("name") || "");
  const navigate = useNavigate();

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
  }, [searchParams]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["series", activeSearch, genreFilter],
      queryFn: async ({ pageParam = 1 }) =>
        activeSearch
          ? searchSeries(activeSearch, pageParam as number)
          : getFilteredSeries({ genre: genreFilter }, pageParam as number),
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
      initialPageParam: 1,
    });

  const allSeries = data?.pages.flatMap((page) => page.results) ?? [];

  // Buscar avaliações para todas as séries
  const seriesReviewsQueries = useQueries({
    queries: allSeries.map(series => ({
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
    return allSeries.map((series, index) => ({
      ...series,
      rating: seriesReviewsQueries[index]?.data ?? undefined
    }));
  }, [allSeries, seriesReviewsQueries]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setActiveSearch(searchQuery);
      
      const params: Record<string, string> = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (genreFilter) {
        params.genre = genreFilter;
        if (genreName) params.name = genreName;
      }
      
      setSearchParams(params);
    }
  };

  const handleSearchClick = () => {
    setActiveSearch(searchQuery);
    
    const params: Record<string, string> = {};
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (genreFilter) {
      params.genre = genreFilter;
      if (genreName) params.name = genreName;
    }
    
    setSearchParams(params);
  };

  const handleGenreChange = (genre: string, name: string = "") => {
    setGenreFilter(genre);
    setGenreName(name);
    
    const params: Record<string, string> = {};
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (genre) {
      params.genre = genre;
      if (name) params.name = name;
    }
    
    setSearchParams(params);
  };

  const clearGenreFilter = () => {
    setGenreFilter("");
    setGenreName("");
    
    const params: Record<string, string> = {};
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" pt="80px">
        <Container maxW="1200px" py={8} pb={16}>
          <Heading color="white" size="2xl" mb={8}>
            Explorar Séries
          </Heading>

          {genreFilter && genreName && (
            <Box mb={6}>
              <HStack spacing={2}>
                <Text color="white">Filtrando por gênero:</Text>
                <Tag colorScheme="teal" size="lg">
                  <HStack spacing={2}>
                    <Text>{genreName}</Text>
                    <CloseButton size="sm" onClick={clearGenreFilter} />
                  </HStack>
                </Tag>
              </HStack>
            </Box>
          )}

          <Flex 
            gap={4} 
            mb={8} 
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            bg="gray.800"
            p={4}
            borderRadius="lg"
          >
            <Box flex={1}>
              <InputGroup>
                <Input
                  placeholder="Buscar séries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  bg="gray.700"
                  color="white"
                  border="none"
                  _placeholder={{ color: "gray.400" }}
                />
                <InputRightElement width="3.5rem">
                  <Button
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white" }}
                    onClick={handleSearchClick}
                    aria-label="Buscar"
                    h="1.75rem"
                    size="sm"
                    width="100%"
                  >
                    <MagnifyingGlass size={24} weight="bold" />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>

            <Box minW={{ base: "100%", md: "200px" }}>
              <SeriesFilter
                genreFilter={genreFilter}
                onGenreChange={(genre) => handleGenreChange(genre)}
              />
            </Box>
          </Flex>

          {seriesWithRatings.length > 0 ? (
            <SimpleGrid columns={{ base: 3, md: 4, lg: 6 }} spacing={4}>
              {seriesWithRatings.map((series) => (
                <SeriesCard key={series.id} series={series} />
              ))}
            </SimpleGrid>
          ) : (
            <Box textAlign="center" py={12}>
              <Text color="gray.400" fontSize="lg">
                Nenhuma série encontrada com os filtros aplicados.
              </Text>
            </Box>
          )}

          {hasNextPage && (
            <Box textAlign="center" mt={4}>
              <Button
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                colorScheme="gray"
                size="lg"
              >
                {isFetchingNextPage ? "Carregando mais..." : "Carregar mais séries"}
              </Button>
            </Box>
          )}
        </Container>
      </Box>
      <Footer />
      <ScrollToTop />
    </Flex>
  );
}
