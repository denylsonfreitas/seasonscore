import { Box, Flex, HStack, LinkBox, LinkOverlay, Skeleton, Text } from "@chakra-ui/react";
import { Heart } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import type { PopularReview } from "../../services/reviews";
import { RatingStars } from "../common/RatingStars";
import { UserAvatar } from "../common/UserAvatar";
import { EnhancedImage } from "../common/EnhancedImage";

/** Avaliação de uma temporada: pôster, série, nota, trecho do texto e autor. */
export function ReviewCard({ review }: { review: PopularReview }) {
  return (
    <LinkBox
      as="article"
      h="100%"
      display="flex"
      flexDirection="column"
      gap={3}
      p={4}
      bg="ink.900"
      border="1px solid"
      borderColor="ink.800"
      borderRadius="md"
      transition="border-color 120ms ease"
      _hover={{ borderColor: "ink.600" }}
    >
      <Flex gap={3} align="flex-start">
        <Box
          flexShrink={0}
          w="48px"
          aspectRatio={2 / 3}
          borderRadius="sm"
          overflow="hidden"
          bg="ink.850"
        >
          {review.seriesPoster && (
            <EnhancedImage
              src={`https://image.tmdb.org/t/p/w154${review.seriesPoster}`}
              alt=""
              tmdbWidth="w154"
              w="100%"
              h="100%"
              objectFit="cover"
            />
          )}
        </Box>
        <Box minW={0}>
          <LinkOverlay
            as={RouterLink}
            to={`/reviews/${review.id}/${review.seasonNumber}`}
            display="block"
            fontWeight={600}
            color="ink.50"
            noOfLines={1}
          >
            {review.seriesName}
          </LinkOverlay>
          <Text fontFamily="mono" fontSize="xs" color="ink.400" mt={0.5}>
            Temporada {review.seasonNumber}
          </Text>
          <Box mt={1.5}>
            <RatingStars rating={review.rating} size={14} showNumber={false} />
          </Box>
        </Box>
      </Flex>

      <Text
        flex={1}
        fontSize="sm"
        color={review.comment ? "ink.200" : "ink.400"}
        fontStyle={review.comment ? undefined : "italic"}
        noOfLines={3}
      >
        {review.comment || "Avaliou sem comentar."}
      </Text>

      <Flex
        justify="space-between"
        align="center"
        pt={3}
        borderTop="1px solid"
        borderColor="ink.800"
      >
        <HStack spacing={2} minW={0}>
          <UserAvatar
            size="xs"
            photoURL={review.userAvatar}
            name={review.userName}
            userId={review.userId}
          />
          <Text fontSize="sm" color="ink.300" noOfLines={1}>
            {review.userName}
          </Text>
        </HStack>
        {review.likes > 0 && (
          <HStack
            spacing={1}
            color="ink.400"
            flexShrink={0}
            aria-label={`${review.likes} curtidas`}
          >
            <Heart size={14} />
            <Text fontFamily="mono" fontSize="xs">
              {review.likes}
            </Text>
          </HStack>
        )}
      </Flex>
    </LinkBox>
  );
}

export function ReviewCardSkeleton() {
  return (
    <Box p={4} bg="ink.900" border="1px solid" borderColor="ink.800" borderRadius="md" h="200px">
      <Flex gap={3}>
        <Skeleton w="48px" h="72px" borderRadius="sm" startColor="ink.850" endColor="ink.800" />
        <Box flex={1}>
          <Skeleton h="14px" w="60%" startColor="ink.850" endColor="ink.800" />
          <Skeleton mt={2} h="10px" w="30%" startColor="ink.850" endColor="ink.800" />
        </Box>
      </Flex>
      <Skeleton mt={4} h="40px" startColor="ink.850" endColor="ink.800" />
    </Box>
  );
}
