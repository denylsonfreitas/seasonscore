import { useState, useEffect } from "react";
import { IconButton, Tooltip, useToast, useMediaQuery } from "@chakra-ui/react";
import { Bookmark, BookmarkSimple } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "../../services/watchlist";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      checkWatchlistStatus();
    }
  }, [currentUser, series.id]);

  // Auto-close tooltip on mobile after action
  useEffect(() => {
    if (isMobile && isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1500); // Fechar após 1.5 segundos
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, isOpen]);

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

    // Mostrar tooltip temporariamente para feedback visual
    setIsOpen(true);
    
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
      
      // Fechar tooltip imediatamente para desktop ou agendar fechamento para mobile 
      if (!isMobile) {
        setIsOpen(false);
      }
    }
  }

  return (
    <Tooltip 
      label={isInList ? "Remover da watchlist" : "Adicionar à watchlist"}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      hasArrow
      placement="top"
      closeOnClick={true}
      gutter={10}
    >
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
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
        onTouchStart={() => isMobile && setIsOpen(true)}
      />
    </Tooltip>
  );
} 