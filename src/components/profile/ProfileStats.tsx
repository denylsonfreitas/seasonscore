import {
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Box,
  useColorModeValue,
  Divider,
  Flex,
  Hide,
  Show,
} from "@chakra-ui/react";

export interface ProfileStatsProps {
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  watchlistCount: number;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
  onShowReviews: () => void;
  onShowWatchlist: () => void;
  isOwnProfile: boolean | null;
  activeSection?: "reviews" | "watchlist";
}

export function ProfileStats({
  reviewsCount,
  followersCount,
  followingCount,
  watchlistCount,
  onShowFollowers,
  onShowFollowing,
  onShowReviews,
  onShowWatchlist,
  isOwnProfile,
  activeSection = "reviews"
}: ProfileStatsProps) {
  const hoverBg = useColorModeValue("gray.700", "gray.700");
  const activeBg = useColorModeValue("primary.500", "primary.500");

  return (
    <Box
      bg="gray.800"
      p={3}
      borderRadius="md"
    >
      <Flex
        direction="row"
        justify="space-around"
        align="center"
        gap={1}
        flexWrap="wrap"
      >

        {/* Avaliações e Watchlist */}
        <HStack 
          spacing={{ base: 3, md: 6 }}
          flex={1}
          justify="center"
          py={1}
        >
          <Stat
            px={{ base: 1, md: 3 }}
            py={1}
            textAlign="center"
            borderRadius="md"
            cursor="pointer"
            bg={activeSection === "reviews" ? activeBg : "transparent"}
            _hover={{ bg: activeSection === "reviews" ? activeBg : hoverBg }}
            onClick={onShowReviews}
            transition="all 0.2s"
            minW={{ base: "70px", md: "100px" }}
          >
            <StatLabel 
              fontSize={{ base: "2xs", md: "sm" }} 
              color={activeSection === "reviews" ? "white" : "gray.400"}
              fontWeight={activeSection === "reviews" ? "medium" : "normal"}
            >
              Avaliações
            </StatLabel>
            <StatNumber fontSize={{ base: "md", md: "xl" }} color="white">
              {reviewsCount}
            </StatNumber>
          </Stat>

          {isOwnProfile && (
            <Stat
              px={{ base: 1, md: 3 }}
              py={1}
              textAlign="center"
              borderRadius="md"
              cursor="pointer"
              bg={activeSection === "watchlist" ? activeBg : "transparent"}
              _hover={{ bg: activeSection === "watchlist" ? activeBg : hoverBg }}
              onClick={onShowWatchlist}
              transition="all 0.2s"
              minW={{ base: "70px", md: "100px" }}
            >
              <StatLabel 
                fontSize={{ base: "2xs", md: "sm" }} 
                color={activeSection === "watchlist" ? "white" : "gray.400"}
                fontWeight={activeSection === "watchlist" ? "medium" : "normal"}
              >
                Watchlist
              </StatLabel>
              <StatNumber fontSize={{ base: "md", md: "xl" }} color="white">
                {watchlistCount}
              </StatNumber>
            </Stat>
          )}
        </HStack>

        {/* Divisor Vertical */}
        <Divider 
          orientation="vertical"
          height={{ base: "40px", md: "50px" }}
          mx={{ base: 1, md: 4 }}
          bg="gray.600"
        />

        {/* Seguidores e Seguindo */}
        <HStack 
          spacing={{ base: 3, md: 6 }}
          flex={1}
          justify="center"
          py={1}
        >
          <Stat
            px={{ base: 1, md: 3 }}
            py={1}
            textAlign="center"
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            onClick={onShowFollowers}
            transition="all 0.2s"
            minW={{ base: "70px", md: "100px" }}
          >
            <StatLabel fontSize={{ base: "2xs", md: "sm" }} color="gray.400">
              Seguidores
            </StatLabel>
            <StatNumber fontSize={{ base: "md", md: "xl" }} color="white">
              {followersCount}
            </StatNumber>
          </Stat>

          <Stat
            px={{ base: 1, md: 3 }}
            py={1}
            textAlign="center"
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: hoverBg }}
            onClick={onShowFollowing}
            transition="all 0.2s"
            minW={{ base: "70px", md: "100px" }}
          >
            <StatLabel fontSize={{ base: "2xs", md: "sm" }} color="gray.400">
              Seguindo
            </StatLabel>
            <StatNumber fontSize={{ base: "md", md: "xl" }} color="white">
              {followingCount}
            </StatNumber>
          </Stat>
        </HStack>
      </Flex>
    </Box>
  );
} 