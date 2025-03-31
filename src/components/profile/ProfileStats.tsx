import React from "react";
import {
  Flex,
  Box,
  Text,
  HStack,
  Divider,
} from "@chakra-ui/react";

export interface ProfileStatsProps {
  reviewsCount: number;
  watchlistCount: number;
  listsCount: number;
  onShowReviews: () => void;
  onShowWatchlist: () => void;
  onShowLists: () => void;
  isOwnProfile: boolean | null;
  activeSection?: "reviews" | "watchlist" | "lists";
}

export function ProfileStats({
  reviewsCount,
  watchlistCount,
  listsCount,
  onShowReviews,
  onShowWatchlist,
  onShowLists,
  isOwnProfile,
  activeSection = "reviews"
}: ProfileStatsProps) {

  const menuItems = [
    {
      key: "reviews",
      label: "Avaliações",
      count: reviewsCount,
      onClick: onShowReviews,
    },
    {
      key: "watchlist",
      label: "Watchlist",
      count: watchlistCount,
      onClick: onShowWatchlist,
    },
    {
      key: "lists",
      label: "Listas",
      count: listsCount,
      onClick: onShowLists,
    },
  ];

  return (
    <Box
      w="100%"
    >
      <HStack spacing={6} align="center" justify="flex-start" py={2}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.key}>
            <Flex 
              align="center" 
              onClick={item.onClick}
              cursor="pointer"
              position="relative"
              py={2}
              _after={
                activeSection === item.key
                  ? {
                      content: '""',
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                      right: "0",
                      height: "2px",
                      bg: "primary.500",
                      borderRadius: "2px",
                    }
                  : {}
              }
            >
              <Text 
                fontWeight={activeSection === item.key ? "bold" : "medium"} 
                color={activeSection === item.key ? "primary.300" : "gray.300"}
                mr={2}
                transition="all 0.2s"
                _hover={{ color: "white" }}
              >
                {item.label}
              </Text>
              <Box 
                bg={activeSection === item.key ? "primary.500" : "gray.700"} 
                color={activeSection === item.key ? "white" : "gray.400"}
                px={2} 
                py={0.5} 
                borderRadius="full" 
                fontSize="xs"
                minW="24px"
                textAlign="center"
              >
                {item.count}
              </Box>
            </Flex>
          </React.Fragment>
        ))}
      </HStack>
      <Divider borderColor="gray.700" />
    </Box>
  );
} 