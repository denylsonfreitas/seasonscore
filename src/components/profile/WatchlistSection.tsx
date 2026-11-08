import { Box, Button, IconButton, SimpleGrid, Skeleton, Tooltip, useToast } from "@chakra-ui/react";
import { BookmarkSimple, X } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { removeFromWatchlist, type WatchlistItem } from "../../services/watchlist";
import type { ExtendedUser } from "../../types/auth";
import { SeriesCard } from "../series/SeriesCard";
import { EmptyState } from "../common/EmptyState";

interface WatchlistSectionProps {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  isOwnProfile: boolean;
  currentUser: ExtendedUser | null;
}

export function WatchlistSection({
  watchlist,
  isLoading,
  isOwnProfile,
  currentUser,
}: WatchlistSectionProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const handleRemove = async (seriesId: number) => {
    if (!currentUser) return;
    try {
      await removeFromWatchlist(currentUser.uid, seriesId);
      queryClient.invalidateQueries({ queryKey: ["userWatchlist"] });
      toast({ title: "Removida da watchlist", status: "success", duration: 2000 });
    } catch {
      toast({ title: "Não foi possível remover", status: "error", duration: 3000 });
    }
  };

  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 3, md: 5, lg: 6 }} spacing={4}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton
            key={i}
            aspectRatio={2 / 3}
            borderRadius="md"
            startColor="ink.900"
            endColor="ink.850"
          />
        ))}
      </SimpleGrid>
    );
  }

  if (watchlist.length === 0) {
    return (
      <EmptyState
        icon={BookmarkSimple}
        title={isOwnProfile ? "Sua watchlist está vazia." : "A watchlist está vazia."}
        description={isOwnProfile ? "Guarde aqui as séries que você quer ver." : undefined}
        action={
          isOwnProfile ? (
            <Button as={RouterLink} to="/series" size="sm" variant="outline">
              Explorar séries
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <SimpleGrid
      columns={{ base: 3, sm: 4, md: 5, lg: 6 }}
      spacingX={{ base: 3, md: 4 }}
      spacingY={6}
    >
      {watchlist.map((item) => (
        <Box key={item.seriesId} position="relative" role="group">
          <SeriesCard
            series={{
              id: item.seriesId,
              name: item.seriesData.name,
              poster_path: item.seriesData.poster_path,
              first_air_date: item.seriesData.first_air_date ?? "",
              overview: "",
              backdrop_path: null,
              vote_average: 0,
            }}
            size="lg"
          />
          {isOwnProfile && (
            <Tooltip label="Remover da watchlist" openDelay={300}>
              <IconButton
                aria-label={`Remover ${item.seriesData.name} da watchlist`}
                icon={<X size={14} />}
                size="xs"
                position="absolute"
                top={1.5}
                left={1.5}
                zIndex={3}
                bg="rgba(15,15,14,0.85)"
                color="ink.100"
                _hover={{ bg: "ink.800" }}
                opacity={0}
                _groupHover={{ opacity: 1 }}
                _focus={{ opacity: 1 }}
                onClick={() => handleRemove(item.seriesId)}
              />
            </Tooltip>
          )}
        </Box>
      ))}
    </SimpleGrid>
  );
}
