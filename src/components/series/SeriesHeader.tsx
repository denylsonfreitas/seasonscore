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
  Wrap,
  WrapItem,
  Badge,
  Skeleton,
} from "@chakra-ui/react";
import { CaretDown, CaretUp, Calendar, PlayCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { WatchlistButton } from "../common/WatchlistButton";
import { SeriesDetailsTabs } from "./SeriesDetailsTabs";
import { SeriesReview } from "../../services/reviews";

interface SeriesHeaderProps {
  series: any; // O tipo completo seria melhor, mas usando any para simplicidade
  isLoading: boolean;
  reviews: SeriesReview[];
  userReview?: SeriesReview;
  currentUser: any | null;
  userData: { photoURL?: string | null } | null;
  seriesId: string;
  onSeasonSelect: (season: number) => void;
  onOpenReviewModal: () => void;
  onSetExistingReview: (review: SeriesReview) => void;
  onSetDeleteAlertOpen: (isOpen: boolean) => void;
  onSetSeasonToDelete: (season: number | null) => void;
  onReviewClick: (review: any) => void;
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
      <Container maxW="1200px" position="relative" pb={16}>
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

            <Box>
              <Text color="gray.400" noOfLines={isExpanded ? undefined : 3}>
                {series.overview}
              </Text>
              {series.overview && series.overview.length > 250 && (
                <Button
                  variant="link"
                  color="teal.400"
                  onClick={() => setIsExpanded(!isExpanded)}
                  rightIcon={isExpanded ? <CaretUp /> : <CaretDown />}
                  size="sm"
                  mt={2}
                >
                  {isExpanded ? "Menos" : "Mais..."}
                </Button>
              )}
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
                <Icon as={PlayCircle} color="teal.400" boxSize={5} weight="fill" />
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
                <Icon as={Calendar} color="teal.400" boxSize={5} weight="fill" />
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

            <Wrap spacing={2}>
              {series.genres?.map((genre: any) => (
                <WrapItem key={genre.id}>
                  <Badge colorScheme="teal">{genre.name}</Badge>
                </WrapItem>
              ))}
            </Wrap>
            
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