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
} from "@chakra-ui/react";
import { SeriesCard } from "../components/SeriesCard";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  searchSeries,
  getFilteredSeries,
  SeriesResponse,
  SeriesListItem,
} from "../services/tmdb";
import { useState, useEffect } from "react";
import { SeriesFilter } from "../components/SeriesFilter";
import { Footer } from "../components/Footer";
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function Series() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeSearch, setActiveSearch] = useState(searchParams.get("search") || "");
  const [genreFilter, setGenreFilter] = useState("");

  useEffect(() => {
    if (searchParams.get("search")) {
      const search = searchParams.get("search") || "";
      setSearchQuery(search);
      setActiveSearch(search);
    }
  }, [searchParams]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setActiveSearch(searchQuery);
      if (searchQuery.trim()) {
        setSearchParams({ search: searchQuery.trim() });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleSearchClick = () => {
    setActiveSearch(searchQuery);
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<SeriesResponse>({
      queryKey: ["series", activeSearch, genreFilter],
      queryFn: async ({ pageParam }) =>
        activeSearch
          ? searchSeries(activeSearch, pageParam as number)
          : getFilteredSeries({ genre: genreFilter }, pageParam as number),
      getNextPageParam: (lastPage: SeriesResponse) =>
        lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
      initialPageParam: 1,
    });

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.900">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  const allSeries = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1" pt="80px">
        <Container maxW="1200px" py={8} pb={16}>
          <Heading color="white" size="2xl" mb={8}>
            Explorar Séries
          </Heading>

          <SeriesFilter
            genreFilter={genreFilter}
            onGenreChange={setGenreFilter}
          />

          <InputGroup mb={8} maxW="600px" mx="auto">
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

          <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
            {allSeries.map((series: SeriesListItem) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </SimpleGrid>

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
    </Flex>
  );
}
