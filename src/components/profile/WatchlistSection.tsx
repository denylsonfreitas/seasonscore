import {
  SimpleGrid,
  Box,
  Text,
  Image,
  IconButton,
  Flex,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Bookmark } from "@phosphor-icons/react";
import { removeFromWatchlist } from "../../services/watchlist";
import { useQueryClient } from "@tanstack/react-query";
import { ExtendedUser } from "../../types/auth";

interface WatchlistItem {
  seriesId: number;
  seriesData: {
    name: string;
    poster_path: string;
  };
}

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

  const handleRemoveFromWatchlist = async (seriesId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

    try {
      await removeFromWatchlist(currentUser.uid, seriesId);
      queryClient.invalidateQueries({
        queryKey: ["userWatchlist"],
      });
      toast({
        title: "Removido da watchlist",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erro ao remover da watchlist:", error);
      toast({
        title: "Erro ao remover da watchlist",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner color="primary.500" />
      </Flex>
    );
  }

  if (watchlist.length === 0) {
    return (
      <Text color="gray.400" fontSize={{ base: "sm", md: "md" }}>
        Nenhuma série na watchlist.
      </Text>
    );
  }

  return (
    <SimpleGrid columns={{ base: 2, sm: 3, lg: 4 }} spacing={{ base: 3, md: 6 }}>
      {watchlist.map((item) => (
        <Box
          key={item.seriesId}
          bg="gray.800"
          p={{ base: 2, md: 4 }}
          borderRadius="lg"
          position="relative"
          _hover={{
            "& .remove-button": {
              opacity: 1,
            },
          }}
        >
          {isOwnProfile && (
            <IconButton
              aria-label="Remover da watchlist"
              icon={<Bookmark weight="fill" />}
              size="sm"
              variant="solid"
              colorScheme="red"
              position="absolute"
              top={3}
              right={3}
              zIndex={2}
              opacity={0}
              className="remove-button"
              transition="opacity 0.2s"
              onClick={(e) => handleRemoveFromWatchlist(item.seriesId, e)}
            />
          )}
          <RouterLink to={`/series/${item.seriesId}`}>
            <Image
              src={`https://image.tmdb.org/t/p/w500${item.seriesData.poster_path}`}
              alt={item.seriesData.name}
              width="100%"
              height="auto"
              borderRadius="md"
            />
            <Text
              color="white"
              fontWeight="bold"
              mt={2}
              fontSize={{ base: "xs", md: "sm" }}
              noOfLines={2}
            >
              {item.seriesData.name}
            </Text>
          </RouterLink>
        </Box>
      ))}
    </SimpleGrid>
  );
} 