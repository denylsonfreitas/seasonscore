import {
  Box,
  Container,
  Image,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Stack,
  Icon,
  Divider,
  Skeleton,
  useToast,
  Flex,
} from "@chakra-ui/react";
import { CaretDown, CaretUp, Calendar, PlayCircle, VideoCamera } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { WatchlistButton } from "../common/WatchlistButton";
import { SeriesDetailsTabs } from "./SeriesDetailsTabs";
import { SeriesReview } from "../../services/reviews";
import { getSeriesVideos } from "../../services/tmdb";

// Definição para a estrutura de séries
interface Series {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  number_of_episodes?: number;
  number_of_seasons: number;
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
  }[];
  [key: string]: any; // Para outras propriedades que possam existir
}

// Definição para usuário atual
interface User {
  uid: string;
  email: string | null;
  [key: string]: any;
}

interface SeriesHeaderProps {
  series: Series;
  isLoading: boolean;
  reviews: SeriesReview[];
  userReview?: SeriesReview;
  currentUser: User | null;
  userData: { photoURL?: string | null } | null;
  seriesId: string;
  onSeasonSelect: (season: number) => void;
  onOpenReviewModal: () => void;
  onSetExistingReview: (review: SeriesReview) => void;
  onSetDeleteAlertOpen: (isOpen: boolean) => void;
  onSetSeasonToDelete: (season: number | null) => void;
  onReviewClick: (review: SeriesReview) => void;
  navigate: (path: string) => void;
}

export function SeriesHeader({ 
  series, 
  isLoading,
  reviews,
  userReview,
  currentUser,
  userData,
  seriesId,
  onSeasonSelect,
  onOpenReviewModal,
  onSetExistingReview,
  onSetDeleteAlertOpen,
  onSetSeasonToDelete,
  onReviewClick,
  navigate
}: SeriesHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const toast = useToast();
  
  // Buscar trailer da série
  useEffect(() => {
    const fetchTrailer = async () => {
      if (!seriesId) return;
      
      setIsLoadingTrailer(true);
      try {
        const videos = await getSeriesVideos(parseInt(seriesId));
        
        // Procurar por trailers, teasers ou clipes - pela ordem de preferência
        const trailer = videos.find(video => 
          video.type === "Trailer" && video.site === "YouTube"
        ) || videos.find(video => 
          video.type === "Teaser" && video.site === "YouTube"
        ) || videos.find(video => 
          (video.type === "Clip" || video.type === "Featurette") && video.site === "YouTube"
        );
        
        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
        }
      } catch (error) {
      } finally {
        setIsLoadingTrailer(false);
      }
    };
    
    fetchTrailer();
  }, [seriesId]);
  
  // Abrir trailer
  const handleOpenTrailer = () => {
    if (trailerUrl) {
      window.open(trailerUrl, "_blank", "noopener,noreferrer");
    } else {
      toast({
        title: "Trailer não disponível",
        description: "Não foi possível encontrar um trailer para esta série.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <Box position="relative">
        {/* Banner */}
        <Box
          h="400px"
          w="100%"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgImage={`url(https://image.tmdb.org/t/p/original${series.backdrop_path})`}
            bgSize="cover"
            bgPosition="center"
            _after={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.5), rgba(23, 25, 35, 1))",
            }}
          />
        </Box>
      </Box>

      {/* Conteúdo Principal */}
      <Container maxW="container.lg" position="relative" pb={16}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt="-200px">
          <Box>
            <Image
              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
              alt={series.name}
              borderRadius="lg"
              width="100%"
              maxW="400px"
              mx="auto"
              boxShadow="xl"
            />
          </Box>
          <VStack align="start" spacing={6}>
            <Box width="100%">
              <Skeleton isLoaded={!isLoading} startColor="gray.700" endColor="gray.800">
                {series.images?.logos?.[0]?.file_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${series.images.logos[0].file_path}`}
                    alt={series.name}
                    maxH="120px"
                    objectFit="contain"
                  />
                ) : (
                  <Heading color="white" size="2xl">
                    {series.name}
                  </Heading>
                )}
              </Skeleton>
            </Box>

            <Box width="100%">
              <Text color="gray.400" noOfLines={isExpanded ? undefined : 3}>
                {series.overview}
              </Text>
              <Flex mt={3} align="center" wrap="wrap" gap={2}>
                {series.overview && series.overview.length > 250 && (
                  <Button
                    variant="link"
                    color="primary.400"
                    onClick={() => setIsExpanded(!isExpanded)}
                    rightIcon={isExpanded ? <CaretUp /> : <CaretDown />}
                    size="sm"
                  >
                    {isExpanded ? "Menos" : "Mais..."}
                  </Button>
                )}
                
                {/* Botão para assistir trailer */}
                <Button
                  leftIcon={<VideoCamera weight="fill" />}
                  colorScheme="primary"
                  variant="outline"
                  size="sm"
                  isLoading={isLoadingTrailer}
                  loadingText="Carregando"
                  onClick={handleOpenTrailer}
                  _hover={{ bg: "primary.900" }}
                  transition="all 0.2s"
                  ml={series.overview && series.overview.length > 250 ? 2 : 0}
                >
                  Assistir Trailer
                </Button>
              </Flex>
            </Box>

            <Stack 
              direction="row"
              spacing={6} 
              align="center"
              bg="gray.800" 
              p={4} 
              borderRadius="lg"
              width="100%"
              flexWrap={{ base: "wrap", md: "nowrap" }}
              justify={{ base: "center", md: "flex-start" }}
              gap={4}
            >
              <HStack spacing={3} width="auto">
                <Icon as={PlayCircle} color="primary.400" boxSize={5} weight="fill" />
                <VStack spacing={0} align="start">
                  <Text color="gray.400" fontSize="sm">Temporadas</Text>
                  <Text color="white" fontSize="lg" fontWeight="bold">
                    {series.number_of_seasons}
                  </Text>
                </VStack>
              </HStack>

              <Divider orientation="vertical"
                      height="40px"
                      borderColor="gray.600" />
              
              <HStack spacing={3} width="auto">
                <Icon as={Calendar} color="primary.400" boxSize={5} weight="fill" />
                <VStack spacing={0} align="start">
                  <Text color="gray.400" fontSize="sm">Lançamento</Text>
                  <Text color="white" fontSize="lg" fontWeight="bold">
                    {series.first_air_date ? new Date(series.first_air_date).getFullYear() : "N/A"}
                  </Text>
                </VStack>
              </HStack>

              <Box flex={1} />
              <WatchlistButton series={series} />
            </Stack>

            {/* Abas de detalhes da série */}
            <SeriesDetailsTabs
              series={series}
              reviews={reviews}
              userReview={userReview}
              currentUser={currentUser}
              userData={userData}
              seriesId={seriesId}
              onSeasonSelect={onSeasonSelect}
              onOpenReviewModal={onOpenReviewModal}
              onSetExistingReview={onSetExistingReview}
              onSetDeleteAlertOpen={onSetDeleteAlertOpen}
              onSetSeasonToDelete={onSetSeasonToDelete}
              onReviewClick={onReviewClick}
              navigate={navigate}
            />
          </VStack>
        </SimpleGrid>
      </Container>
    </>
  );
} 