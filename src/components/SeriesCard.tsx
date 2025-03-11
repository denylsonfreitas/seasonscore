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
  },
  md: {
    container: { maxW: "250px" },
    title: { fontSize: "lg" },
    overview: { fontSize: "sm" },
    rating: { fontSize: "md" },
    badge: { fontSize: "lg" },
  },
  lg: {
    container: { maxW: "300px" },
    title: { fontSize: "xl" },
    overview: { fontSize: "md" },
    rating: { fontSize: "lg" },
    badge: { fontSize: "xl" },
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
        
        {series.rating && (
          <Flex align="center" gap={1}>
            <Star weight="fill" color="#F6E05E" size={size === "sm" ? 16 : size === "md" ? 20 : 24} />
            <Text color="yellow.400" fontWeight="bold" {...styles.rating}>
              {series.rating.toFixed(1)}
            </Text>
          </Flex>
        )}
        
        <Text color="gray.400" noOfLines={2} {...styles.overview}>
          {series.overview || "Nenhuma descrição disponível para esta série no momento."}
        </Text>
      </VStack>
    </LinkBox>
  );
}
