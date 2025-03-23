import {
  Box,
  Text,
  VStack,
  Badge,
  LinkBox,
  LinkOverlay,
  Flex,
  Center,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { SeriesListItem } from "../../services/tmdb";
import { Star, Trophy, TelevisionSimple } from "@phosphor-icons/react";
import { WatchlistButton } from "../common/WatchlistButton";
import { LazyImage } from "../common/LazyImage";

interface SeriesCardProps {
  series: SeriesListItem & { rating?: number };
  size?: "sm" | "md" | "lg";
  position?: number;
}

const sizeStyles = {
  sm: {
    container: { 
      maxW: "150px",
      aspectRatio: "2/3"
    },
    title: { fontSize: "md" },
    overview: { fontSize: "xs" },
    rating: { fontSize: "sm" },
    badge: { fontSize: "md" },
    ratingBox: { 
      p: 2,
      minW: "45px",
      height: "45px",
    },
  },
  md: {
    container: { 
      maxW: "200px",
      aspectRatio: "2/3"
    },
    title: { fontSize: "lg" },
    overview: { fontSize: "sm" },
    rating: { fontSize: "md" },
    badge: { fontSize: "lg" },
    ratingBox: { 
      p: 2,
      minW: "50px",
      height: "50px",
    },
  },
  lg: {
    container: { 
      maxW: "250px",
      aspectRatio: "2/3"
    },
    title: { fontSize: "xl" },
    overview: { fontSize: "md" },
    rating: { fontSize: "lg" },
    badge: { fontSize: "xl" },
    ratingBox: { 
      p: 2,
      minW: "55px",
      height: "55px",
    },
  },
};

const getBadgeStyle = (position: number) => {
  switch (position) {
    case 1:
      return {
        bg: "yellow.400",
        color: "yellow.900",
        icon: <Trophy weight="fill" />,
      };
    case 2:
      return {
        bg: "gray.100",
        color: "gray.800",
        icon: <Star weight="fill" />,
      };
    case 3:
      return {
        bg: "orange.200",
        color: "orange.800",
        icon: <Star weight="fill" />,
      };
    case 4:
    case 5:
      return {
        bg: "gray.600",
        color: "white",
        icon: <Star weight="fill" />,
      };
    default:
      return {
        bg: "primary.500",
        color: "white",
        icon: null,
      };
  }
};

export function SeriesCard({ series, size = "md", position }: SeriesCardProps) {
  const styles = sizeStyles[size];
  const badgeStyle = position ? getBadgeStyle(position) : null;

  return (
    <LinkBox
      as="article"
      bg="gray.800"
      borderRadius="lg"
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{ transform: "translateY(-4px)" }}
      position="relative"
      {...styles.container}
      mx="auto"
      role="group"
    >
      <Box as={RouterLink} to={`/series/${series.id}`}>
        <Box position="relative" bg="gray.700" height="100%">
          {series.poster_path ? (
            <LazyImage
              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
              alt={series.name}
              fallbackText="Imagem não disponível"
            />
          ) : (
            <Center height="100%" py={4} px={2} bg="gray.700" position="relative">
              <VStack spacing={2} align="center" justify="center">
                <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
                <Text color="white" fontSize={styles.title.fontSize} fontWeight="bold" textAlign="center" noOfLines={2}>
                  {series.name}
                </Text>
                <Text color="gray.400" fontSize="xs" textAlign="center" noOfLines={3}>
                  {series.overview.substring(0, 100)}
                  {series.overview.length > 100 ? "..." : ""}
                </Text>
              </VStack>
            </Center>
          )}

          {/* Posição (se existir) */}
          {position && (
            <Badge
              position="absolute"
              top={3}
              left={3}
              bg={badgeStyle?.bg}
              color={badgeStyle?.color}
              fontSize={styles.badge.fontSize}
              p={2}
              borderRadius="lg"
              zIndex={1}
            >
              <Flex align="center" gap={2}>
                {badgeStyle?.icon}
                #{position}
              </Flex>
            </Badge>
          )}

          {/* Botão de Watchlist */}
          <Box
            position="absolute"
            top={3}
            right={3}
            opacity={0}
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.2s"
            zIndex={1}
            onClick={(e) => e.preventDefault()}
          >
            <WatchlistButton series={series} variant="ghost" size={size === "sm" ? "sm" : "md"} />
          </Box>

          {/* Nota do SeasonScore */}
          {series.rating && (
            <Badge
              position="absolute"
              bottom={3}
              left={3}
              colorScheme="yellow"
              fontSize="xs"
              py={0.5}
              px={1.5}
              borderRadius="md"
              zIndex={1}
            >
              {series.rating.toFixed(1)} ★
            </Badge>
          )}
        </Box>
      </Box>
    </LinkBox>
  );
}
