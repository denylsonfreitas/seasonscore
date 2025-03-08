import { Box, Image, Text, Flex, Icon, Badge, VStack, HStack } from "@chakra-ui/react";
import { Star } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { SeriesListItem } from "../services/tmdb";
import { useQuery } from "@tanstack/react-query";
import { getSeriesReviews } from "../services/reviews";
import { WatchlistButton } from "./WatchlistButton";

export interface SeriesCardProps {
  series: SeriesListItem;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const year = series.first_air_date
    ? new Date(series.first_air_date).getFullYear()
    : null;

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", series.id],
    queryFn: () => getSeriesReviews(series.id),
  });

  // Calcula a média das avaliações de todas as temporadas
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => {
          const seasonAverage =
            review.seasonReviews.reduce((sum, sr) => sum + sr.rating, 0) /
            review.seasonReviews.length;
          return acc + seasonAverage;
        }, 0) / reviews.length
      : 0;

  return (
    <Box
      position="relative"
      borderRadius="lg"
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{
        transform: "scale(1.02)",
        "& > .watchlist-button": {
          opacity: 1,
        },
      }}
    >
      <Link to={`/series/${series.id}`}>
        <Image
          src={
            series.poster_path
              ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
              : "https://via.placeholder.com/500x750?text=Sem+Imagem"
          }
          alt={series.name}
          width="100%"
          height="auto"
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={4}
          background="linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)"
        >
          <Text color="white" fontWeight="bold" fontSize="lg" mb={2}>
            {series.name}
          </Text>
          <HStack spacing={2}>
            {year && (
              <Badge colorScheme="teal">
                {year}
              </Badge>
            )}
            <Badge colorScheme="yellow">
              {averageRating.toFixed(1)} ★
            </Badge>
          </HStack>
        </Box>
      </Link>
      <Box
        className="watchlist-button"
        position="absolute"
        top={2}
        right={2}
        opacity={0}
        transition="opacity 0.2s"
      >
        <WatchlistButton series={series} />
      </Box>
    </Box>
  );
}
