import { useState, useEffect } from "react";
import { 
  IconButton, 
  Tooltip, 
  useToast, 
  useMediaQuery, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  MenuDivider,
  Box,
  Portal
} from "@chakra-ui/react";
import { Bookmark, BookmarkSimple, ListPlus, DotsThree } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "../../services/watchlist";
import { useSearchParams } from "react-router-dom";
import { AddToListButton } from "../lists/AddToListButton";
import { useQueryClient } from "@tanstack/react-query";

interface WatchlistButtonProps {
  series: {
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string;
  };
  size?: string;
  variant?: string;
  menuAsBox?: boolean;
}

export function WatchlistButton({ series, size = "md", variant = "ghost", menuAsBox = false }: WatchlistButtonProps) {
  const { currentUser } = useAuth();
  const [isInList, setIsInList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get("list_id");
  const queryClient = useQueryClient();

  // Se temos um list_id na URL, devemos mostrar o botão de adicionar à lista específica
  if (listId) {
    // Criar um objeto que atenda à interface Series esperada pelo AddToListButton
    const seriesForList = {
      ...series,
      // Adicionar propriedades adicionais exigidas pela interface Series
      backdrop_path: "",
      overview: "",
      vote_average: 0,
      number_of_seasons: 0,
      genres: [],
      networks: [],
      status: "",
      popularity: 0,
      in_production: false,
      homepage: "",
      last_air_date: ""
    };
    
    return <AddToListButton series={seriesForList as any} size={size as any} variant={variant as any} iconOnly useButtonElement={!menuAsBox} />;
  }

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
        // Invalidar a consulta da watchlist para atualizar a interface
        queryClient.invalidateQueries({ queryKey: ["userWatchlist"] });
        toast({
          title: "Removido da sua watchlist",
          status: "success",
          duration: 2000,
        });
      } else {
        await addToWatchlist(currentUser.uid, series);
        // Invalidar a consulta da watchlist para atualizar a interface
        queryClient.invalidateQueries({ queryKey: ["userWatchlist"] });
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

  // Criar um objeto completo para a série que atenda à interface Series
  const seriesForList = {
    ...series,
    backdrop_path: "",
    overview: "",
    vote_average: 0,
    number_of_seasons: 0,
    genres: [],
    networks: [],
    status: "",
    popularity: 0,
    in_production: false,
    homepage: "",
    last_air_date: ""
  };

  if (!currentUser) {
    return (
      <Tooltip 
        label="Faça login para adicionar à sua watchlist"
        hasArrow
        placement="top"
      >
        <IconButton
          aria-label="Opções"
          icon={<BookmarkSimple />}
          size={size}
          variant={variant}
          colorScheme="primary"
          color="white"
          bg="blackAlpha.600"
          _hover={{ bg: "blackAlpha.700" }}
          onClick={() => toast({
            title: "Faça login para adicionar à sua watchlist",
            status: "warning",
            duration: 3000,
            isClosable: true,
          })}
        />
      </Tooltip>
    );
  }

  // Versão com menu para usuários logados
  return (
    <Menu closeOnSelect={false} placement="bottom-end">
      {menuAsBox ? (
        <MenuButton
          as={Box}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="md"
          cursor="pointer"
          width="36px"
          height="36px"
          bg="blackAlpha.600"
          color="white"
          _hover={{ bg: "blackAlpha.700" }}
          p={0}
        >
          <Box display="flex" alignItems="center" justifyContent="center">
            <DotsThree weight="bold" size={20} />
          </Box>
        </MenuButton>
      ) : (
        <MenuButton
          as={IconButton}
          aria-label="Opções"
          icon={<DotsThree weight="bold" />}
          size={size}
          variant={variant}
          colorScheme="primary"
          color="white"
          bg="blackAlpha.600"
          _hover={{ bg: "blackAlpha.700" }}
        />
      )}
      <Portal>
        <MenuList bg="gray.900" borderColor="gray.700" minW="180px">
          <MenuItem 
            icon={isInList ? <Bookmark weight="fill" color="white" size={16} /> : <BookmarkSimple color="white" size={16} />}
            onClick={handleWatchlistClick}
            isDisabled={isLoading}
            bg="gray.800"
            _hover={{ bg: "gray.600" }}
            color="white"
          >
            <Box color="white">
              {isInList ? "Remover da watchlist" : "Adicionar à watchlist"}
            </Box>
          </MenuItem>
          <MenuDivider borderColor="gray.700" />
          <AddToListButton 
            series={seriesForList as any} 
            size={size as any} 
            variant="ghost" 
            useButtonElement={false} 
          />
        </MenuList>
      </Portal>
    </Menu>
  );
} 