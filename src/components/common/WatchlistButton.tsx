import { useState, useEffect } from "react";
import { IconButton, Tooltip, useToast } from "@chakra-ui/react";
import { Bookmark, BookmarkSimple } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "../../services/watchlist";
import { Series } from "../../services/tmdb";

interface WatchlistButtonProps {
  series: {
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string;
  };
  size?: string;
  variant?: string;
}

export function WatchlistButton({ series, size = "md", variant = "ghost" }: WatchlistButtonProps) {
  const { currentUser } = useAuth();
  const [isInList, setIsInList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      checkWatchlistStatus();
    }
  }, [currentUser, series.id]);

  async function checkWatchlistStatus() {
    if (!currentUser) return;
    try {
      const status = await isInWatchlist(currentUser.uid, series.id);
      setIsInList(status);
    } catch (error) {
      console.error("Erro ao verificar status da watchlist:", error);
    }
  }

  async function handleWatchlistClick() {
    if (!currentUser) {
      toast({
        title: "Faça login para adicionar à sua watchlist",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isInList) {
        await removeFromWatchlist(currentUser.uid, series.id);
        toast({
          title: "Removido da sua watchlist",
          status: "success",
          duration: 2000,
        });
      } else {
        await addToWatchlist(currentUser.uid, series);
        toast({
          title: "Adicionado à sua watchlist",
          status: "success",
          duration: 2000,
        });
      }
      setIsInList(!isInList);
    } catch (error) {
      toast({
        title: "Erro ao atualizar watchlist",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tooltip label={isInList ? "Remover da watchlist" : "Adicionar à watchlist"}>
      <IconButton
        aria-label="Watchlist"
        icon={isInList ? <Bookmark weight="fill" /> : <BookmarkSimple />}
        size={size}
        variant={variant}
        colorScheme="teal"
        color="white"
        bg="blackAlpha.600"
        _hover={{ bg: "blackAlpha.700" }}
        isLoading={isLoading}
        onClick={handleWatchlistClick}
      />
    </Tooltip>
  );
} 