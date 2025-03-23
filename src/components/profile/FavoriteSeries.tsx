import { Box, Text, Flex, Image } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ExtendedUser } from "../../types/auth";
import { UserData } from "../../services/users";

interface FavoriteSeriesProps {
  isOwnProfile: boolean;
  currentUser: ExtendedUser | null;
  profileUser: UserData | null;
}

export function FavoriteSeries({
  isOwnProfile,
  currentUser,
  profileUser,
}: FavoriteSeriesProps) {
  const favoriteSeries = isOwnProfile
    ? currentUser?.favoriteSeries
    : profileUser?.favoriteSeries;

  if (!favoriteSeries) return null;

  return (
    <Box
      bg="gray.800"
      borderRadius="lg"
      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
      height={{ base: "100px", md: "120px" }}
      position="relative"
      overflow="hidden"
    >
      <RouterLink to={`/series/${favoriteSeries?.id}`}>
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgImage={`url(https://image.tmdb.org/t/p/w780${
            favoriteSeries?.backdrop_path || favoriteSeries?.poster_path
          })`}
          bgSize="cover"
          bgPosition="center"
          transition="all 0.3s ease"
          _hover={{ transform: "scale(1.05)" }}
          _after={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.3), rgba(23, 25, 35, 0.8))",
          }}
        />

        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          align="center"
          justify="center"
          p={4}
          zIndex={1}
        >
          {favoriteSeries?.images?.logos?.[0]?.file_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${favoriteSeries?.images?.logos?.[0]?.file_path}`}
              alt={favoriteSeries?.name || ""}
              maxH={{ base: "60px", md: "70px" }}
              objectFit="contain"
            />
          ) : (
            <Text
              color="white"
              fontWeight="bold"
              fontSize={{ base: "md", md: "lg" }}
              textAlign="center"
              textShadow="0 2px 4px rgba(0,0,0,0.4)"
              noOfLines={2}
            >
              {favoriteSeries?.name}
            </Text>
          )}
        </Flex>
      </RouterLink>
    </Box>
  );
} 