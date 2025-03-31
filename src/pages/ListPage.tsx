import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Avatar,
  HStack,
  Tag,
  TagLabel,
  SimpleGrid,
  Button,
  IconButton,
  Divider,
  useColorModeValue,
  Skeleton,
  Tooltip,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Input,
  InputGroup,
  InputRightElement,
  Grid,
  GridItem,
  Image,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisV, FaTrash, FaEdit, FaPlus, FaSearch } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/dateUtils';
import { SeriesCard } from '../components/series/SeriesCard';
import { CommentSection } from '../components/comments/CommentSection';
import { 
  getListById, 
  toggleListReaction, 
  deleteList,
  removeSeriesFromList,
  addSeriesToList
} from '../services/lists';
import { ListWithUserData } from '../types/list';
import { Link } from 'react-router-dom';
import { AddToListButton } from '../components/lists/AddToListButton';
import { SeriesListItem, searchSeries } from '../services/tmdb';
import { EditListModal } from '../components/lists/EditListModal';

export default function ListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // Usar cores do tema
  const bgColor = useColorModeValue('secondary.800', 'secondary.700');
  const borderColor = useColorModeValue('gray.700', 'gray.600');
  const textColor = useColorModeValue('white', 'white');
  const subtextColor = useColorModeValue('gray.300', 'gray.300');
  
  const [list, setList] = useState<ListWithUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingSeries, setIsRemovingSeries] = useState<number | null>(null);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  
  // Estado para o modal de pesquisa de séries
  const { isOpen: isSearchModalOpen, onOpen: onSearchModalOpen, onClose: onSearchModalClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SeriesListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingSeries, setIsAddingSeries] = useState<number | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();

  // Estado para controle do AlertDialog de confirmação para remover série
  const [seriesIdToRemove, setSeriesIdToRemove] = useState<number | null>(null);
  const [seriesNameToRemove, setSeriesNameToRemove] = useState<string>('');
  const { isOpen: isRemoveAlertOpen, onOpen: onRemoveAlertOpen, onClose: onRemoveAlertClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchList = async () => {
      if (!listId || typeof listId !== 'string') return;
      
      try {
        setLoading(true);
        const listData = await getListById(listId);
        
        if (!listData) {
          setError('Lista não encontrada');
          navigate('/404', { replace: true });
          return;
        }
        
        setList(listData);
        setLikesCount(listData.likesCount || 0);
        
        // Verificar se o usuário atual curtiu esta lista usando reactions do BD
        if (currentUser && listData.reactions) {
          const userReaction = listData.reactions.find(
            reaction => reaction.userId === currentUser.uid && reaction.type === 'like'
          );
          setIsLiked(!!userReaction);
        } else {
          setIsLiked(false);
        }
      } catch (error: any) {
        console.error('Erro ao carregar lista:', error);
        setError(error.message || 'Erro ao carregar a lista');
        navigate('/404', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [listId, currentUser, navigate]);

  useEffect(() => {
    // Atualizar o título da página quando a lista for carregada
    document.title = 'SeasonScore';
  }, [list]);

  const handleLikeToggle = async () => {
    if (!currentUser || !list) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para curtir listas',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Evitar múltiplos cliques
    if (isTogglingLike) return;
    
    try {
      setIsTogglingLike(true);
      const newIsLiked = !isLiked;
      
      // Atualize o estado UI imediatamente para feedback
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      // Fazer a chamada para o backend
      await toggleListReaction(list.id, 'like');
      
      // Uma vez que a operação foi bem-sucedida, não precisamos fazer mais nada
      // O estado UI já foi atualizado
    } catch (error: any) {
      // Em caso de erro, revertemos o estado UI
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua reação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleDeleteList = async () => {
    if (!list || !currentUser) return;
    
    if (list.userId !== currentUser.uid) {
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para excluir esta lista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsDeleting(true);
      await deleteList(list.id);
      
      toast({
        title: 'Lista excluída',
        description: 'Sua lista foi excluída com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/profile');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a lista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para confirmar remoção de série
  const confirmRemoveSeries = (seriesId: number, seriesName: string) => {
    setSeriesIdToRemove(seriesId);
    setSeriesNameToRemove(seriesName);
    onRemoveAlertOpen();
  };

  const handleRemoveSeriesFromList = async (seriesId: number) => {
    if (!list || !currentUser) return;
    
    if (list.userId !== currentUser.uid) {
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para editar esta lista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsRemovingSeries(seriesId);
      await removeSeriesFromList(list.id, seriesId);
      
      // Atualizar o estado local removendo a série
      setList(prevList => {
        if (!prevList) return null;
        
        return {
          ...prevList,
          items: prevList.items.filter(item => item.seriesId !== seriesId),
        };
      });
      
      toast({
        title: 'Série removida',
        description: 'A série foi removida da lista com sucesso',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover a série da lista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRemovingSeries(null);
      onRemoveAlertClose();
    }
  };

  const handleShare = async () => {
    if (!list) return;

    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      
      toast({
        title: 'Link copiado!',
        description: 'O link para esta lista foi copiado para sua área de transferência',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Função para buscar séries no API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const response = await searchSeries(searchQuery, 1);
      // Modificando para incluir apenas as propriedades necessárias para renderização
      const seriesResults = response.results.map(item => ({
        id: item.id,
        name: item.name,
        overview: item.overview,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        first_air_date: item.first_air_date,
        vote_average: item.vote_average
      }));
      setSearchResults(seriesResults);
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar séries',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Função para adicionar uma série à lista
  const handleAddSeriesToList = async (series: SeriesListItem) => {
    if (!listId || !currentUser) return;
    
    // Verificar se a série já está na lista
    if (list?.items.some(item => item.seriesId === series.id)) {
      toast({
        title: 'Série já adicionada',
        description: 'Esta série já está na sua lista',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    setIsAddingSeries(series.id);
    try {
      await addSeriesToList(listId, {
        id: series.id,
        name: series.name,
        poster_path: series.poster_path,
      });
      
      // Atualizar o estado local adicionando a série
      setList(prevList => {
        if (!prevList) return null;
        
        return {
          ...prevList,
          items: [
            ...prevList.items,
            {
              seriesId: series.id,
              name: series.name,
              poster_path: series.poster_path,
              addedAt: new Date(),
            },
          ],
        };
      });
      
      toast({
        title: 'Série adicionada',
        description: 'A série foi adicionada à lista com sucesso',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar a série à lista',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingSeries(null);
    }
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Skeleton height="40px" width="50%" mb={4} />
        <Skeleton height="20px" width="30%" mb={6} />
        <Skeleton height="200px" mb={8} />
        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} height="250px" borderRadius="md" />
          ))}
        </SimpleGrid>
      </Container>
    );
  }

  if (error || !list) {
    // O redirecionamento para a página 404 já está sendo tratado no useEffect
    return null;
  }

  return (
    <Container maxW="6xl" py={8}>
      <Box
        bg={bgColor}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        mb={8}
      >
        <Box p={6}>
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Flex align="center" mb={2}>
                <Heading as="h1" size="lg" color={textColor}>
                  {list.title}
                </Heading>
                <Badge ml={2} colorScheme={list.isPublic ? "green" : "gray"} fontSize="sm" px={2} py={1} borderRadius="md">
                  {list.isPublic ? "Pública" : "Privada"}
                </Badge>
              </Flex>

              {list.description && (
                <Text fontSize="md" color={subtextColor} mb={4}>
                  {list.description}
                </Text>
              )}
              
              <HStack spacing={2} mb={4}>
                {list.tags && list.tags.map((tag, index) => (
                  <Tag key={index} size="sm" colorScheme="primary" borderRadius="full">
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                ))}
              </HStack>

              <Flex alignItems="center" mb={4}>
                <Link to={`/u/${list.username || list.userId}`} style={{ textDecoration: 'none' }}>
                  <Flex alignItems="center">
                    <Avatar size="sm" src={list.userPhotoURL || undefined} name={list.username || list.userDisplayName} mr={2} />
                    <Text fontWeight="medium" color={textColor} _hover={{ color: "primary.400" }}>
                      @{list.username || list.userDisplayName || 'Usuário'}
                    </Text>
                  </Flex>
                </Link>
                <Text fontSize="sm" color={subtextColor} ml={2}>
                  • {formatRelativeTime(list.createdAt)}
                </Text>
              </Flex>


            </Box>

            {currentUser && list.userId === currentUser.uid && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FaEllipsisV />}
                  variant="ghost"
                  size="sm"
                  aria-label="Opções"
                  color="gray.400"
                />
                <MenuList bg="gray.800" borderColor="gray.700">
                  <MenuItem icon={<FaEdit />} onClick={onEditModalOpen} bg="gray.800" _hover={{ bg: "gray.700" }}>
                    Editar lista
                  </MenuItem>
                  <MenuItem 
                    icon={<FaTrash />} 
                    onClick={handleDeleteList}
                    isDisabled={isDeleting}
                    color="red.500"
                    bg="gray.800"
                    _hover={{ bg: "gray.700" }}
                  >
                    Excluir lista
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>

          <HStack spacing={4} mb={4}>
            <Tooltip label={isLiked ? "Descurtir" : "Curtir"}>
              <Button
                leftIcon={isLiked ? <FaHeart /> : <FaRegHeart />}
                variant="ghost"
                _hover={{ bg: "gray.700" }}
                size="sm"
                color={isLiked ? "red.500" : textColor}
                onClick={handleLikeToggle}
                isLoading={isTogglingLike}
              >
                {likesCount > 0 && likesCount}
              </Button>
            </Tooltip>

            <Tooltip label="Comentários">
              <Button
                leftIcon={<FaComment />}
                variant="ghost"
                _hover={{ bg: "gray.700" }}
                size="sm"
                color={textColor}
                onClick={() => {
                  const commentsSection = document.getElementById('comments');
                  commentsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {list.commentsCount > 0 && list.commentsCount}
              </Button>
            </Tooltip>

            <Tooltip label="Compartilhar">
              <Button
                leftIcon={<FaShare />}
                variant="ghost"
                _hover={{ bg: "gray.700" }}
                size="sm"
                color={textColor}
                onClick={handleShare}
              >
                Compartilhar
              </Button>
            </Tooltip>
          </HStack>
        </Box>

        <Divider />
        
        <Box p={6}>
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading as="h2" size="md" color={textColor}>
              Séries nesta lista ({list.items.length})
            </Heading>
            
            {currentUser && list.userId === currentUser.uid && (
              <Tooltip label="Adicionar séries à lista">
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="primary"
                  size="sm"
                  onClick={onSearchModalOpen}
                >
                  Adicionar séries
                </Button>
              </Tooltip>
            )}
          </Flex>

          {list.items.length === 0 ? (
            <Alert status="info" borderRadius="md" bg="gray.700" borderColor="gray.700">
              <AlertIcon />
              <AlertTitle>Esta lista está vazia</AlertTitle>
            </Alert>
          ) : (
            <SimpleGrid columns={{ base: 3, md: 4, lg: 6, xl: 7 }} spacing={3}>
              {list.items.map(item => {
                // Criar um objeto com propriedades mínimas para o SeriesCard
                const seriesData = {
                  id: item.seriesId,
                  name: item.name,
                  poster_path: item.poster_path,
                  // Adicionar propriedades padrão para satisfazer o tipo
                  backdrop_path: '',
                  overview: '',
                  vote_average: 0,
                  first_air_date: '',
                  number_of_seasons: 0,
                  genres: [],
                  networks: [],
                  status: '',
                  popularity: 0,
                  in_production: false,
                  homepage: '',
                  last_air_date: ''
                };
                
                return (
                  <Box key={item.seriesId} position="relative">
                    <SeriesCard series={seriesData as any} size="sm" />
                    {currentUser && list.userId === currentUser.uid && (
                      <Box 
                        position="absolute"
                        bottom={2}
                        right={2}
                        zIndex={10}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          icon={<FaTrash size={12} />}
                          aria-label="Remover série"
                          size="sm"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            confirmRemoveSeries(item.seriesId, item.name);
                          }}
                          isLoading={isRemovingSeries === item.seriesId}
                          opacity={1}
                          _hover={{ 
                            transform: "scale(1.1)",
                            boxShadow: "0 0 0 1px var(--chakra-colors-red-500)"
                          }}
                          transition="all 0.2s"
                          borderRadius="full"
                          bg="rgba(229, 62, 62, 0.85)"
                          boxShadow="0 0 4px rgba(0,0,0,0.3)"
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      <Box id="comments" mt={8}>
        <CommentSection
          objectId={list.id}
          objectType="list"
          commentsCount={list.commentsCount || 0}
        />
      </Box>

      {list && currentUser && list.userId === currentUser.uid && (
        <EditListModal
          isOpen={isEditModalOpen}
          onClose={onEditModalClose}
          list={list}
          onListUpdated={(updatedList) => {
            setList(prevList => {
              if (!prevList) return null;
              return {
                ...prevList,
                title: updatedList.title,
                description: updatedList.description,
                tags: updatedList.tags,
                isPublic: updatedList.isPublic,
              };
            });
          }}
        />
      )}

      {/* Modal de pesquisa de séries */}
      <Modal 
        isOpen={isSearchModalOpen} 
        onClose={() => {
          onSearchModalClose();
          setSearchQuery('');
          setSearchResults([]);
          setSearchPerformed(false);
        }}
        size="xl"
      >
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Adicionar Séries à Lista</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <InputGroup mb={4}>
              <Input 
                placeholder="Buscar séries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                bg="gray.700"
                borderColor="gray.600"
              />
              <InputRightElement width="4.5rem">
                <Button 
                  h="1.75rem" 
                  size="sm" 
                  colorScheme="primary"
                  onClick={handleSearch}
                  isLoading={isSearching}
                >
                  <FaSearch />
                </Button>
              </InputRightElement>
            </InputGroup>
            
            {searchResults.length > 0 ? (
              <Grid templateColumns="repeat(3, 1fr)" gap={4} maxH="400px" overflowY="auto">
                {searchResults.map(series => (
                  <GridItem key={series.id}>
                    <Box 
                      position="relative" 
                      borderRadius="md"
                      overflow="hidden"
                      cursor="pointer"
                      borderWidth="1px"
                      borderColor="gray.700"
                      _hover={{ borderColor: "primary.500" }}
                    >
                      <Image 
                        src={series.poster_path 
                          ? `https://image.tmdb.org/t/p/w200${series.poster_path}` 
                          : 'https://placehold.co/200x300/222222/FFFFFF?text=Sem+Imagem'
                        }
                        alt={series.name}
                        objectFit="cover"
                        h="150px"
                        w="100%"
                      />
                      <Box p={2}>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{series.name}</Text>
                        <Text fontSize="xs" color="gray.400" noOfLines={1}>
                          {series.first_air_date ? new Date(series.first_air_date).getFullYear() : 'Sem data'}
                        </Text>
                      </Box>
                      <Button
                        position="absolute"
                        top={2}
                        right={2}
                        size="xs"
                        colorScheme="primary"
                        onClick={() => handleAddSeriesToList(series)}
                        isLoading={isAddingSeries === series.id}
                        leftIcon={<FaPlus />}
                      >
                        Adicionar
                      </Button>
                    </Box>
                  </GridItem>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={8}>
                {isSearching ? (
                  <Skeleton height="100px" />
                ) : searchPerformed ? (
                  <Text color="gray.400">
                    Nenhum resultado encontrado. Tente outra busca.
                  </Text>
                ) : (
                  <Text color="gray.400">
                    Digite o nome de uma série e clique na lupa para buscar.
                  </Text>
                )}
              </Box>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={() => {
              onSearchModalClose();
              setSearchQuery('');
              setSearchResults([]);
              setSearchPerformed(false);
            }}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AlertDialog para confirmar remoção de série */}
      <AlertDialog
        isOpen={isRemoveAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover série
            </AlertDialogHeader>

            <AlertDialogBody>
              Tem certeza que deseja remover "{seriesNameToRemove}" da lista?
              Esta ação não pode ser desfeita.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRemoveAlertClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => seriesIdToRemove && handleRemoveSeriesFromList(seriesIdToRemove)} 
                ml={3}
                isLoading={isRemovingSeries === seriesIdToRemove}
              >
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
} 