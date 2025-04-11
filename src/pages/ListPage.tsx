import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
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
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Collapse,
} from '@chakra-ui/react';
import { 
  Globe, 
  Lock, 
  Calendar, 
  ChatCircle, 
  NotePencil, 
  Share, 
  Plus, 
  MagnifyingGlass,
  Trash
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { SeriesCard } from '../components/series/SeriesCard';
import { CommentSection } from '../components/common/CommentSection';
import { ReactionButton } from '../components/common/ReactionButton';
import { 
  getListById, 
  toggleListReaction, 
  deleteList,
  removeSeriesFromList,
  addSeriesToList
} from '../services/lists';
import { ListWithUserData } from '../types/list';
import { SeriesListItem, searchSeries } from '../services/tmdb';
import { EditListModal } from '../components/lists/EditListModal';
import { UserAvatar } from '../components/common/UserAvatar';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

export default function ListPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Cores e estilos
  const cardBg = useColorModeValue("gray.800", "gray.800");
  const textColor = useColorModeValue("white", "white");
  const mutedTextColor = useColorModeValue("gray.400", "gray.400");
  const primaryColor = useColorModeValue("primary.500", "primary.400");
  
  const [list, setList] = useState<ListWithUserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingSeries, setIsRemovingSeries] = useState<number | null>(null);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isForceFetchingReaction, setIsForceFetchingReaction] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState<number | null>(null);
  
  const { isOpen: isSearchModalOpen, onOpen: onSearchModalOpen, onClose: onSearchModalClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SeriesListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingSeries, setIsAddingSeries] = useState<number | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();

  const [seriesIdToRemove, setSeriesIdToRemove] = useState<number | null>(null);
  const [seriesNameToRemove, setSeriesNameToRemove] = useState<string>('');
  const { isOpen: isRemoveAlertOpen, onOpen: onRemoveAlertOpen, onClose: onRemoveAlertClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const { isOpen: isCommentExpanded, onToggle: toggleComments } = useDisclosure();

  // Usar React Query para obter e manter os dados da lista atualizados
  const { data: queryList, refetch, isLoading, isError } = useQuery({
    queryKey: ['list', listId],
    queryFn: async () => {
      if (!listId) return null;
      
      try {
        const data = await getListById(listId);
        if (!data) {
          throw new Error("Lista não encontrada");
        }
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar a lista');
        navigate('/404', { replace: true });
        throw err;
      }
    },
    enabled: !!listId,
    staleTime: 1000, // 1 segundo
    refetchInterval: 5000, // Refetch a cada 5 segundos
    refetchOnWindowFocus: true,
  });
  
  // Sincronizar o estado local com os dados do React Query
  useEffect(() => {
    if (queryList) {
      setList(queryList);
      setLikesCount(queryList.likesCount || 0);
      
      if (currentUser && queryList.reactions) {
        const userReaction = queryList.reactions.find(
          reaction => reaction.userId === currentUser.uid && reaction.type === 'like'
        );
        setIsLiked(!!userReaction);
      } else {
        setIsLiked(false);
      }
    }
  }, [queryList, currentUser]);
  
  // Configurar um polling ativo para o estado da reação
  useEffect(() => {
    if (!listId || !currentUser) return;
    
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        // Forçar um refetch dos dados da lista a cada 3 segundos quando a página estiver visível
        refetch();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [listId, currentUser, refetch]);

  useEffect(() => {
    document.title = 'SeasonScore';
  }, [list]);

  // Função para buscar o estado atual da reação do usuário diretamente do banco de dados
  const fetchUserReactionState = useCallback(async () => {
    if (!currentUser || !listId) return;
    
    try {
      setIsForceFetchingReaction(true);
      const listData = await getListById(listId);
      
      if (listData && listData.reactions) {
        const userReaction = listData.reactions.find(
          reaction => reaction.userId === currentUser.uid && reaction.type === 'like'
        );
        
        setIsLiked(!!userReaction);
        setLikesCount(listData.likesCount || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar estado da reação:", error);
    } finally {
      setIsForceFetchingReaction(false);
    }
  }, [currentUser, listId]);

  // Efeito para forçar a atualização do estado de curtida periodicamente
  useEffect(() => {
    if (!currentUser || !listId) return;
    
    // Buscar inicialmente
    fetchUserReactionState();
    
    // Configurar um intervalo para buscar atualizações a cada 10 segundos
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchUserReactionState();
      }
    }, 10000);
    
    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, [currentUser, listId, fetchUserReactionState]);

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

    if (isTogglingLike) return;
    
    try {
      setIsTogglingLike(true);
      
      // Atualizar UI imediatamente para feedback instantâneo
      setIsLiked(!isLiked);
      setLikesCount(prevCount => isLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
      
      // Chamar API para persistir a mudança
      const result = await toggleListReaction(list.id, 'like');
      
      // Atualizar estado com dados do servidor
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['popularLists'] });
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      
      // Forçar um refetch imediato para atualizar todos os componentes
      refetch();
      
      setIsTogglingLike(false);
      
      // Programar refetches adicionais para garantir que todos os componentes estejam atualizados
      setTimeout(() => refetch(), 500);
      setTimeout(() => refetch(), 1500);
    } catch (error: any) {
      // Reverter alterações em caso de erro
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      setIsTogglingLike(false);
      
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua reação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const response = await searchSeries(searchQuery, 1);
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
  
  const handleAddSeriesToList = async (series: SeriesListItem) => {
    if (!listId || !currentUser) return;
    
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

  const handleTagClick = (tag: string) => {
    navigate(`/lists?tag=${encodeURIComponent(tag)}&source=listPage`);
  };

  // Função auxiliar para converter Timestamp para Date
  const convertToDate = (timestamp: Date | Timestamp | number | string | null | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000);
    }
    return new Date(timestamp);
  };

  // Função para atualizar a contagem de comentários localmente
  const handleCommentsCountChange = (count: number) => {
    setLocalCommentsCount(count);
  };

  // Resetar a contagem local de comentários quando a lista mudar
  useEffect(() => {
    setLocalCommentsCount(null);
  }, [listId]);

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
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

  if (isError || !list) {
    return null;
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Container maxW="container.lg" py={6} flex="1">
        {/* Breadcrumbs com efeito de hover */}
        <Breadcrumb 
          mb={6} 
          color="gray.400" 
          separator=">" 
          fontSize="sm" 
          fontWeight="medium"
          spacing={2}
        >
          <BreadcrumbItem>
            <BreadcrumbLink 
              as={RouterLink} 
              to="/lists" 
              _hover={{ color: "primary.300", textDecoration: "none" }}
              transition="color 0.2s ease"
            >
              Listas
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Text color="primary.300">{list?.title}</Text>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Card principal com gradiente e efeitos visuais */}
        <Box 
          bg={cardBg} 
          borderRadius="xl" 
        overflow="hidden"
        mb={8}
          boxShadow="lg"
          position="relative"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            borderTopRadius: "xl",
          }}
        >
          <Box p={{ base: 3, md: 8 }}>
            {/* Informações do usuário e data */}
            <Grid 
              templateColumns={{ base: "1fr", md: "auto 1fr auto" }}
              gap={{ base: 2, md: 4 }} 
              mb={{ base: 3, md: 6 }}
              alignItems="center"
            >
              <HStack spacing={{ base: 2, md: 4 }}>
                <UserAvatar 
                  userId={list?.userId} 
                  photoURL={list?.userPhotoURL}
                  size="sm"
                  showBorder
                />
                <VStack align="start" spacing={0}>
                  <HStack>
                    <Text 
                      fontWeight="medium" 
                      color={textColor}
                      fontSize={{ base: "xs", md: "md" }}
                    >
                      Lista criada por 
                    </Text>
                    <Text 
                      as={RouterLink}
                      to={`/u/${list?.username || list?.userId}`}
                      fontWeight="bold" 
                      color={primaryColor} 
                      _hover={{ textDecoration: "underline" }}
                      transition="color 0.2s"
                      fontSize={{ base: "xs", md: "md" }}
                    >
                      @{list?.username || list?.userDisplayName || 'Usuário'}
                    </Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={Calendar} color={mutedTextColor} weight="fill" size={12} />
                    <Tooltip label={format(convertToDate(list?.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} placement="bottom">
                      <Text 
                        color={mutedTextColor} 
                        fontSize={{ base: "xs", md: "sm" }}
                      >
                        {formatDistanceToNow(convertToDate(list?.createdAt), { locale: ptBR, addSuffix: true })}
                      </Text>
                    </Tooltip>
                  </HStack>
                </VStack>
              </HStack>

              {/* Badge de visibilidade e botão de edição */}
              <Box 
                display="flex" 
                justifyContent={{ base: "flex-start", md: "flex-end" }}
                position={{ base: "absolute", md: "relative" }}
                top={{ base: 3, md: 0 }}
                right={{ base: 3, md: -5 }}
                gap={2}
                alignItems="center"
              >
                <Badge 
                  colorScheme={list?.isPublic ? "green" : "gray"} 
                  fontSize={{ base: "xs", md: "md" }} 
                  py={1} 
                  px={2} 
                  borderRadius="full"
                >
                  <Flex align="center">
                    <Icon as={list?.isPublic ? Globe : Lock} weight="fill" mr={1} size={12} />
                    {list?.isPublic ? "Pública" : "Privada"}
                  </Flex>
                </Badge>
                
                {currentUser && list?.userId === currentUser.uid && (
                  <IconButton
                    icon={<Icon as={NotePencil} />}
                    aria-label="Editar lista"
                    size="sm"
                    colorScheme="primary"
                    variant="outline"
                    onClick={onEditModalOpen}
                  />
                )}
              </Box>
            </Grid>

            {/* Conteúdo principal da lista */}
            <Grid 
              templateColumns="1fr" 
              gap={{ base: 3, md: 6 }}
              mb={{ base: 4, md: 6 }}
            >
              {/* Detalhes da lista */}
              <GridItem>
                <VStack align="start" spacing={{ base: 2, md: 4 }} h="100%">
                  <Box>
                    <Heading 
                      as="h1" 
                      size={{ base: "sm", md: "lg" }} 
                      color={textColor}
                      lineHeight="shorter"
                      mb={1}
                    >
                      {list?.title}
                    </Heading>
                    {list?.description && (
                      <Text 
                        fontSize={{ base: "xs", md: "md" }} 
                        color={mutedTextColor}
                        whiteSpace="pre-wrap"
                        overflowWrap="break-word"
                        wordBreak="break-word"
                        sx={{
                          hyphens: "auto"
                        }}
                      >
                        {list?.description}
                </Text>
              )}
                  </Box>

                  {/* Tags */}
                  {list?.tags && list.tags.length > 0 && (
                    <HStack spacing={2} flexWrap="wrap">
                      {list.tags.map((tag, index) => (
                  <Tag 
                    key={index} 
                    size="sm" 
                    colorScheme="primary" 
                    borderRadius="full"
                    cursor="pointer"
                    onClick={() => handleTagClick(tag)}
                    _hover={{ 
                      transform: "scale(1.05)", 
                      bg: "primary.600", 
                      color: "white" 
                    }}
                    transition="all 0.2s"
                          px={3}
                          py={1}
                  >
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                ))}
              </HStack>
                  )}

                  {/* Botões de ação */}
                  <HStack 
                    spacing={{ base: 2, md: 4 }} 
                    w="full"
                    flexWrap="wrap"
                  >
                    <Box onClick={(e) => e.stopPropagation()} mr={{ base: 2, md: 4 }}>
            <ReactionButton 
              likes={
                          Array.isArray(list?.reactions) 
                  ? list.reactions
                      .filter(r => r.type === 'like')
                      .map(r => r.userId) 
                  : []
              }
              onReaction={handleLikeToggle}
              tooltipText={isLiked ? "Descurtir" : "Curtir"}
              showCount={true}
              isLoading={isTogglingLike}
              forcedLikeState={isLiked}
              forcedLikesCount={likesCount}
                        size="sm"
                      />
                    </Box>
                    
                    <Button
                      leftIcon={<Icon as={ChatCircle} />}
                      variant="ghost"
                      size="sm"
                      onClick={toggleComments}
                      color={isCommentExpanded ? "primary.400" : mutedTextColor}
                      _hover={{ color: "primary.300" }}
                    >
                      {localCommentsCount !== null ? localCommentsCount : (list?.commentsCount || 0)} comentários
                    </Button>
                    
                    <Button
                      leftIcon={<Icon as={Share} />}
                      variant="ghost"
                      size={{ base: "sm", md: "md" }}
                      onClick={handleShare}
                      color={mutedTextColor}
                      _hover={{ color: "primary.300" }}
                    >
                      Compartilhar
                    </Button>
                  </HStack>
                </VStack>
              </GridItem>

              <Divider color="gray.700" />

              {/* Seção de séries da lista */}
              <Box>
              <Flex
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={6}
                  flexDirection={{ base: "column", md: "row" }}
                  gap={{ base: 4, md: 0 }}
                >
                  
                  {currentUser && list?.userId === currentUser.uid && (
              <Tooltip label="Adicionar séries à lista">
                <Button
                        leftIcon={<Icon as={Plus} />}
                  colorScheme="primary"
                        size={{ base: "sm", md: "md" }}
                  onClick={onSearchModalOpen}
                        w={{ base: "full", md: "auto" }}
                >
                  Adicionar séries
                </Button>
              </Tooltip>
            )}
          </Flex>

                {list?.items.length === 0 ? (
            <Alert status="info" borderRadius="md" bg="gray.700" borderColor="gray.700">
              <AlertIcon />
              <AlertTitle>Esta lista está vazia</AlertTitle>
            </Alert>
          ) : (
                  <SimpleGrid 
                    columns={{ base: 5, sm: 7, md: 8, lg: 10, xl: 10 }} 
                    spacing={{ base: 2, md: 3 }}
                  >
                    {list?.items.map(item => {
                const seriesData = {
                  id: item.seriesId,
                  name: item.name,
                  poster_path: item.poster_path,
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
                        <Box 
                          key={item.seriesId} 
                          position="relative"
                          transform="scale(1)"
                          transition="transform 0.2s ease"
                          _hover={{ transform: "scale(1.02)" }}
                        >
                          <SeriesCard 
                            series={seriesData as any} 
                            size="sm"
                          />
                    {currentUser && list.userId === currentUser.uid && (
                      <Box 
                        position="absolute"
                              bottom={1}
                              right={1}
                        zIndex={10}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconButton
                                icon={<Icon as={Trash} size={10} />}
                          aria-label="Remover série"
                                size="xs"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            confirmRemoveSeries(item.seriesId, item.name);
                          }}
                          isLoading={isRemovingSeries === item.seriesId}
                                opacity={0.9}
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
            </Grid>
        </Box>
      </Box>

        {/* Seção de comentários */}
        <Collapse in={isCommentExpanded} animateOpacity>
          <Box 
            bg={cardBg} 
            borderRadius="xl" 
            overflow="hidden" 
            mb={8}
            boxShadow="lg"
            id="comments"
          >
        <CommentSection
              objectId={list?.id || ""}
          objectType="list"
              commentsCount={list?.commentsCount || 0}
              onCommentsCountChange={handleCommentsCountChange}
        />
      </Box>
        </Collapse>
      </Container>

      {/* Modais e diálogos */}
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
                  <Icon as={MagnifyingGlass} />
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
                        leftIcon={<Icon as={Plus} />}
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
    </Flex>
  );
} 