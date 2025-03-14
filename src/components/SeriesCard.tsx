import {
  Box,
  Image,
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
import { SeriesListItem } from "../services/tmdb";
import { Star, Trophy, TelevisionSimple } from "@phosphor-icons/react";
import { WatchlistButton } from "./WatchlistButton";

interface SeriesCardProps {
  series: SeriesListItem & { rating?: number };
  size?: "sm" | "md" | "lg";
  position?: number;
}

const sizeStyles = {
  sm: {
    container: { maxW: "200px" },
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
    container: { maxW: "250px" },
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
    container: { maxW: "300px" },
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
        bg: "teal.500",
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
      <Box position="relative" bg="gray.700">
        {series.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
            alt={series.name}
            width="100%"
            height="auto"
            fallback={
              <Center py={20}>
                <VStack spacing={4}>
                  <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
                  <Text color="gray.500" fontSize="sm" textAlign="center">
                    Imagem não disponível
                  </Text>
                </VStack>
              </Center>
            }
          />
        ) : (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
              <Text color="gray.500" fontSize="sm" textAlign="center">
                Imagem não disponível
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
      
      <VStack align="stretch" p={4} spacing={2}>
        <LinkOverlay as={RouterLink} to={`/series/${series.id}`}>
          <Text
            color="white"
            fontWeight="bold"
            noOfLines={1}
            {...styles.title}
          >
            {series.name}
          </Text>
        </LinkOverlay>
        
        <Text color="gray.400" noOfLines={2} {...styles.overview}>
          {series.overview || "Nenhuma descrição disponível para esta série no momento."}
        </Text>
      </VStack>
    </LinkBox>
  );
}
