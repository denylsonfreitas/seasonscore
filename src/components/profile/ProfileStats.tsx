import React from "react";
import {
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  GridItem,
  useBreakpointValue,
  Divider,
} from "@chakra-ui/react";
import { 
  FaStar, 
  FaEye, 
  FaUserFriends, 
  FaListUl 
} from "react-icons/fa";

export interface ProfileStatsProps {
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  watchlistCount: number;
  listsCount: number;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
  onShowReviews: () => void;
  onShowWatchlist: () => void;
  onShowLists: () => void;
  isOwnProfile: boolean | null;
  activeSection?: "reviews" | "watchlist" | "lists";
}

export function ProfileStats({
  reviewsCount,
  followersCount,
  followingCount,
  watchlistCount,
  listsCount,
  onShowFollowers,
  onShowFollowing,
  onShowReviews,
  onShowWatchlist,
  onShowLists,
  isOwnProfile,
  activeSection = "reviews"
}: ProfileStatsProps) {
  const statSize = useBreakpointValue({ base: "sm", md: "md" });
  const gridTemplate = useBreakpointValue({
    base: "repeat(2, 1fr)",
    md: "repeat(5, 1fr)",
  });

  return (
    <Grid
      templateColumns={gridTemplate}
      gap={4}
      w="100%"
      p={4}
      bg="gray.800"
      borderRadius="lg"
      mb={6}
    >
      <GridItem>
        <Stat
          p={2}
          borderRadius="md"
          textAlign="center"
          bg={activeSection === "reviews" ? "gray.700" : "transparent"}
          _hover={{ bg: "gray.700" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onShowReviews}
        >
          <StatLabel fontSize={statSize} display="flex" alignItems="center" justifyContent="center">
            <FaStar style={{ marginRight: "6px" }} /> Avaliações
          </StatLabel>
          <StatNumber fontSize={{ base: "lg", md: "xl" }}>{reviewsCount}</StatNumber>
        </Stat>
      </GridItem>

      <GridItem>
        <Stat
          p={2}
          borderRadius="md"
          textAlign="center"
          bg={activeSection === "watchlist" ? "gray.700" : "transparent"}
          _hover={{ bg: "gray.700" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onShowWatchlist}
        >
          <StatLabel fontSize={statSize} display="flex" alignItems="center" justifyContent="center">
            <FaEye style={{ marginRight: "6px" }} /> Watchlist
          </StatLabel>
          <StatNumber fontSize={{ base: "lg", md: "xl" }}>{watchlistCount}</StatNumber>
        </Stat>
      </GridItem>
      
      <GridItem>
        <Stat
          p={2}
          borderRadius="md"
          textAlign="center"
          bg={activeSection === "lists" ? "gray.700" : "transparent"}
          _hover={{ bg: "gray.700" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onShowLists}
        >
          <StatLabel fontSize={statSize} display="flex" alignItems="center" justifyContent="center">
            <FaListUl style={{ marginRight: "6px" }} /> Listas
          </StatLabel>
          <StatNumber fontSize={{ base: "lg", md: "xl" }}>{listsCount}</StatNumber>
        </Stat>
      </GridItem>

      <GridItem>
        <Stat
          p={2}
          borderRadius="md"
          textAlign="center"
          _hover={{ bg: "gray.700" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onShowFollowers}
        >
          <StatLabel fontSize={statSize} display="flex" alignItems="center" justifyContent="center">
            <FaUserFriends style={{ marginRight: "6px" }} /> Seguidores
          </StatLabel>
          <StatNumber fontSize={{ base: "lg", md: "xl" }}>{followersCount}</StatNumber>
        </Stat>
      </GridItem>

      <GridItem>
        <Stat
          p={2}
          borderRadius="md"
          textAlign="center"
          _hover={{ bg: "gray.700" }}
          transition="all 0.2s"
          cursor="pointer"
          onClick={onShowFollowing}
        >
          <StatLabel fontSize={statSize} display="flex" alignItems="center" justifyContent="center">
            <FaUserFriends style={{ marginRight: "6px" }} /> Seguindo
          </StatLabel>
          <StatNumber fontSize={{ base: "lg", md: "xl" }}>{followingCount}</StatNumber>
        </Stat>
      </GridItem>
    </Grid>
  );
} 