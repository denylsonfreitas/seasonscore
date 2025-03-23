import {
  VStack,
  Flex,
  Button,
  Spinner,
  Text,
  Box,
  Image,
  HStack,
  Badge,
  SlideFade,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { SeriesReview } from "../../services/reviews";
import { ProfileReviewCard } from "./ProfileReviewCard";

interface ReviewsSectionProps {
  reviews: SeriesReview[];
  isLoading: boolean;
  onReviewClick: (review: SeriesReview) => void;
}

export function ReviewsSection({
  reviews,
  isLoading,
  onReviewClick,
}: ReviewsSectionProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Ordenar avaliações por data (mais recentes primeiro)
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      // Se não houver data de criação em algum dos reviews, colocar no final
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      
      const dateA = new Date(
        a.createdAt instanceof Date
          ? a.createdAt
          : a.createdAt.seconds * 1000
      ).getTime();
      
      const dateB = new Date(
        b.createdAt instanceof Date
          ? b.createdAt
          : b.createdAt.seconds * 1000
      ).getTime();
      
      return dateB - dateA; // Mais recentes primeiro
    });
  }, [reviews]);

  if (isLoading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner color="primary.500" />
      </Flex>
    );
  }

  if (reviews.length === 0) {
    return (
      <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>
        Nenhuma avaliação ainda.
      </Text>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Text color="gray.400" fontSize="xs">
          {sortedReviews.length} {sortedReviews.length === 1 ? 'avaliação' : 'avaliações'}
        </Text>
      </Flex>
      
      {/* Lista de Avaliações */}
      <VStack spacing={3} align="stretch">
        {sortedReviews
          .slice(0, showAllReviews ? undefined : 6)
          .map((review, index) => (
            <SlideFade 
              key={review.id}
              in={true} 
              offsetY="20px"
              transition={{ enter: { duration: 0.3, delay: index * 0.1 } }}
            >
              <Box 
                borderWidth="1px" 
                borderColor="gray.700" 
                borderRadius="md"
                overflow="hidden"
                bg="gray.800"
                transition="all 0.2s"
                _hover={{ 
                  borderColor: "primary.500",
                  boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)"
                }}
              >
                <Flex direction={{ base: "column", md: "row" }} h={{ md: "100px" }}>
                  {/* Poster da série */}
                  <Box 
                    w={{ base: "100%", md: "100px" }} 
                    h={{ base: "150px", md: "100px" }}
                    flexShrink={0}
                    position="relative"
                    overflow="hidden"
                  >
                    <Image
                      src={review.series.poster_path 
                        ? `https://image.tmdb.org/t/p/w342${review.series.poster_path}` 
                        : "https://dummyimage.com/342x513/ffffff/000000.png&text=Poster"}
                      alt={review.series.name}
                      objectFit="cover"
                      objectPosition="center"
                      w="100%"
                      h="100%"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/series/${review.seriesId}`;
                      }}
                    />
                  </Box>
                  
                  {/* Conteúdo da avaliação */}
                  <Box flex="1" p={3} overflow="hidden">
                    <Flex 
                      justifyContent="space-between" 
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Text 
                        fontSize="md" 
                        fontWeight="bold" 
                        color="white"
                        cursor="pointer"
                        noOfLines={1}
                        _hover={{ color: "primary.400" }}
                        onClick={() => window.location.href = `/series/${review.seriesId}`}
                      >
                        {review.series.name}
                      </Text>
                      
                      <Text fontWeight="bold" color="primary.400" fontSize="sm">
                        {(review.seasonReviews.reduce((acc, s) => acc + s.rating, 0) / review.seasonReviews.length).toFixed(1)}
                      </Text>
                    </Flex>
                    
                    <Wrap spacing={1.5} align="left">
                      {review.seasonReviews.map(seasonReview => (
                        <WrapItem 
                          key={seasonReview.seasonNumber}
                          bg="gray.700"
                          px={2}
                          borderRadius="sm"
                          fontSize="xs"
                          cursor="pointer"
                          onClick={() => onReviewClick({
                            ...review,
                            selectedSeasonNumber: seasonReview.seasonNumber
                          })}
                          transition="all 0.2s"
                          _hover={{
                            bg: "primary.900"
                          }}
                        >
                          <Text>T{seasonReview.seasonNumber}</Text>
                          <Text fontWeight="bold" color="primary.300" ml={2}>
                            {seasonReview.rating.toFixed(1)}
                          </Text>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                </Flex>
              </Box>
            </SlideFade>
          ))}
      </VStack>
      
      {sortedReviews.length > 6 && (
        <Flex justify="center" mt={4}>
          <Button
            variant="ghost"
            colorScheme="primary"
            size="sm"
            onClick={() => setShowAllReviews(!showAllReviews)}
            rightIcon={showAllReviews ? <CaretUp weight="bold" size={16} /> : <CaretDown weight="bold" size={16} />}
            transition="all 0.2s ease"
            _hover={{ transform: showAllReviews ? "translateY(-2px)" : "translateY(2px)" }}
          >
            {showAllReviews ? "Ver Menos" : `Ver Mais (${sortedReviews.length - 6})`}
          </Button>
        </Flex>
      )}
    </VStack>
  );
} 