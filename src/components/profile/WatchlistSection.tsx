import {
  SimpleGrid,
  Box,
  Text,
  Image,
  IconButton,
  Flex,
  Spinner,
  useToast,
  Badge,
  AspectRatio,
  Tooltip,
  Center,
  SlideFade,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Bookmark, TelevisionSimple, BookmarkSimple } from "@phosphor-icons/react";
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
      <Center py={8}>
        <Spinner color="primary.500" size="lg" />
      </Center>
    );
  }

  if (watchlist.length === 0) {
    return (
      <Center py={8} flexDirection="column">
        <BookmarkSimple size={40} weight="light" color="#718096" />
        <Text color="gray.400" fontSize={{ base: "sm", md: "md" }} mt={3}>
          Nenhuma série na watchlist.
        </Text>
      </Center>
    );
  }

  return (
    <SimpleGrid 
      columns={{ base: 3, sm: 4, md: 5, lg: 6 }} 
      spacing={{ base: 3, md: 4 }}
      pb={4}
    >
      {watchlist.map((item, index) => (
        <SlideFade
          key={item.seriesId}
          in={true}
          offsetY="20px"
          transition={{ enter: { duration: 0.3, delay: index * 0.05 } }}
        >
          <Box
            position="relative"
            overflow="hidden"
            borderRadius="md"
            bg="gray.800"
            boxShadow="0 4px 8px rgba(0, 0, 0, 0.3)"
            transition="all 0.25s ease"
            height="100%"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.4)",
              "& .poster-overlay": {
                opacity: 1
              },
              "& .poster-image": {
                transform: "scale(1.05)"
              },
              "& .remove-button": {
                opacity: 1,
                transform: "translateY(0)"
              }
            }}
          >
            {isOwnProfile && (
              <Tooltip label="Remover da watchlist" placement="top">
                <IconButton
                  aria-label="Remover da watchlist"
                  icon={<Bookmark weight="fill" size={16} />}
                  size="sm"
                  variant="solid"
                  colorScheme="red"
                  position="absolute"
                  top={1}
                  right={1}
                  zIndex={10}
                  opacity={0}
                  transform="translateY(-8px)"
                  className="remove-button"
                  transition="all 0.3s ease"
                  onClick={(e) => handleRemoveFromWatchlist(item.seriesId, e)}
                />
              </Tooltip>
            )}
            
            <RouterLink to={`/series/${item.seriesId}`}>
              <Tooltip 
                label={item.seriesData.name} 
                placement="top" 
                hasArrow 
                openDelay={500}
              >
                <AspectRatio ratio={2/3}>
                  <Image
                    src={item.seriesData.poster_path 
                      ? `https://image.tmdb.org/t/p/w342${item.seriesData.poster_path}` 
                      : "https://dummyimage.com/342x513/333/ffffff.png&text=Sem+Poster"}
                    alt={item.seriesData.name}
                    objectFit="cover"
                    className="poster-image"
                    transition="transform 0.4s ease"
                    borderRadius="md"
                  />
                </AspectRatio>
              </Tooltip>
              
              {/* Overlay com informações */}
              <Box
                className="poster-overlay"
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)"
                py={1.5}
                px={1.5}
                opacity={0}
                transition="opacity 0.3s ease"
              >

              </Box>
            </RouterLink>
          </Box>
        </SlideFade>
      ))}
    </SimpleGrid>
  );
} 