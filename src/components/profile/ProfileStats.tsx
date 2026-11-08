import { Box, Flex, Text } from "@chakra-ui/react";

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

/** Abas do perfil com a contagem de cada seção. */
export function ProfileStats({
  reviewsCount,
  watchlistCount,
  listsCount,
  onShowReviews,
  onShowWatchlist,
  onShowLists,
  activeSection = "reviews",
}: ProfileStatsProps) {
  const tabs = [
    { key: "reviews", label: "Avaliações", count: reviewsCount, onClick: onShowReviews },
    { key: "watchlist", label: "Watchlist", count: watchlistCount, onClick: onShowWatchlist },
    { key: "lists", label: "Listas", count: listsCount, onClick: onShowLists },
  ] as const;

  return (
    <Flex role="tablist" gap={{ base: 5, md: 7 }} borderBottom="1px solid" borderColor="ink.800">
      {tabs.map((tab) => {
        const active = activeSection === tab.key;
        return (
          <Box
            as="button"
            type="button"
            role="tab"
            aria-selected={active}
            key={tab.key}
            onClick={tab.onClick}
            py={3}
            mb="-1px"
            borderBottom="2px solid"
            borderColor={active ? "signal.400" : "transparent"}
            color={active ? "ink.50" : "ink.300"}
            fontWeight={active ? 600 : 500}
            fontSize="sm"
            _hover={{ color: "ink.50" }}
            transition="color 120ms ease"
          >
            {tab.label}
            <Text
              as="span"
              ml={2}
              fontFamily="mono"
              fontSize="xs"
              color={active ? "signal.300" : "ink.400"}
            >
              {tab.count}
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}
