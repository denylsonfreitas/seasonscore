import React, { useState, useEffect } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  ButtonGroup,
  IconButton,
  Tooltip,
  Spinner,
  Box,
  Text,
  useToast,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { 
  FaListUl, 
  FaPlus, 
  FaBookmark,
  FaRegBookmark, 
  FaAngleDown, 
  FaCheck 
} from 'react-icons/fa';
import { Series } from '../../services/tmdb';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUserLists, 
  addSeriesToList, 
  createList,
  getListsContainingSeries
} from '../../services/lists';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../services/watchlist';

interface AddToListButtonProps {
  series: Series;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  iconOnly?: boolean;
  useButtonElement?: boolean;
}

export function AddToListButton({ 
  series, 
  size = 'md', 
  variant = 'solid',
  iconOnly = false,
  useButtonElement = true 
}: AddToListButtonProps) {
  const { currentUser } = useAuth();
  const [userLists, setUserLists] = useState<any[]>([]);
  const [listsWithSeries, setListsWithSeries] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isInWatchlistFlag, setIsInWatchlistFlag] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState<string | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isCreateModalOpen, 
    onOpen: onCreateModalOpen, 
    onClose: onCreateModalClose 
  } = useDisclosure();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      checkWatchlist();
    }
  }, [currentUser, series.id]);

  const checkWatchlist = async () => {
    if (!currentUser) return;
    
    setIsWatchlistLoading(true);
    try {
      const result = await isInWatchlist(currentUser.uid, series.id);
      setIsInWatchlistFlag(result);
    } catch (error) {
      console.error("Erro ao verificar watchlist:", error);
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const loadUserLists = async () => {
    if (!currentUser) return;
    
    setIsLoadingLists(true);
    try {
      // Buscar listas do usuário
      const lists = await getUserLists(currentUser.uid);
      setUserLists(lists);
      
      // Verificar quais listas já contêm esta série
      const listsWithThisSeries = await getListsContainingSeries(currentUser.uid, series.id);
      setListsWithSeries(listsWithThisSeries.map(list => list.id));
    } catch (error) {
      console.error("Erro ao carregar listas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas listas",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleMenuOpen = () => {
    loadUserLists();
    onOpen();
  };

  const handleAddToList = async (listId: string) => {
    if (!currentUser) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para adicionar séries a listas",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsAddingToList(listId);
    try {
      await addSeriesToList(listId, {
        id: series.id,
        name: series.name,
        poster_path: series.poster_path
      });
      
      // Atualizar a lista de listas que contêm esta série
      setListsWithSeries(prev => {
        if (!prev.includes(listId)) {
          return [...prev, listId];
        }
        return prev;
      });
      
      toast({
        title: "Série adicionada",
        description: "Série adicionada à lista com sucesso",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a série à lista",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingToList(null);
    }
  };

  const handleCreateNewList = async () => {
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, forneça um título para a lista",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsCreating(true);
    try {
      // Criar a lista com a série já incluída
      const listId = await createList(
        title.trim(),
        description.trim(),
        tags,
        isPublic,
        [{
          seriesId: series.id,
          name: series.name,
          poster_path: series.poster_path,
          addedAt: new Date()
        }]
      );
      
      // Atualizar as listas do usuário
      await loadUserLists();
      
      // Limpar formulário
      setTitle('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setIsPublic(true);
      
      // Fechar modal de criação
      onCreateModalClose();
      
      toast({
        title: "Lista criada",
        description: "Lista criada com sucesso com a série adicionada",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a lista",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!currentUser) {
      toast({
        title: "Autenticação necessária",
        description: "Você precisa estar logado para gerenciar sua watchlist",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsWatchlistLoading(true);
    try {
      if (isInWatchlistFlag) {
        await removeFromWatchlist(currentUser.uid, series.id);
        setIsInWatchlistFlag(false);
        toast({
          title: "Removida da Watchlist",
          description: `${series.name} foi removida da sua watchlist`,
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      } else {
        await addToWatchlist(currentUser.uid, {
          id: series.id,
          name: series.name,
          poster_path: series.poster_path,
          first_air_date: series.first_air_date,
        });
        setIsInWatchlistFlag(true);
        toast({
          title: "Adicionada à Watchlist",
          description: `${series.name} foi adicionada à sua watchlist`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar sua watchlist",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const isInList = (listId: string): boolean => {
    return listsWithSeries.includes(listId);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (tags.length >= 10) {
        toast({
          title: 'Limite de tags',
          description: 'Você pode adicionar no máximo 10 tags',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      {iconOnly ? (
        <Tooltip label="Listas">
          <IconButton
            aria-label="Adicionar a uma lista"
            icon={<FaListUl />}
            size={size}
            variant={variant}
            onClick={handleMenuOpen}
            colorScheme="primary"
            color="white"
            bg="blackAlpha.600"
            _hover={{ bg: "blackAlpha.700" }}
          />
        </Tooltip>
      ) : (
        <Menu isOpen={isOpen} onClose={onClose}>
          {useButtonElement ? (
            <MenuButton
              as={Button}
              rightIcon={<FaAngleDown />}
              leftIcon={<FaListUl />}
              onClick={handleMenuOpen}
              size={size}
              variant={variant}
              colorScheme="primary"
              color="white"
              bg="blackAlpha.600"
              _hover={{ bg: "blackAlpha.700" }}
            >
              Listas
            </MenuButton>
          ) : (
            <MenuButton
              as={Box}
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              p={2}

              onClick={handleMenuOpen}
              fontSize={size === 'sm' ? 'sm' : 'md'}
              color="white"
              bg="gray.800"
              _hover={{ bg: "gray.700" }}
            >
              <Flex alignItems="center">
                <Box ml={1} mr={4}><FaListUl size={14} /></Box>
                <Text>Listas</Text>
                <Box ml={2}><FaAngleDown /></Box>
              </Flex>
            </MenuButton>
          )}
          <MenuList bg="gray.900" borderColor="gray.700" color="white">
            {isLoadingLists ? (
              <Box textAlign="center" p={3}>
                <Spinner size="sm" color="white" />
                <Text color="white" mt={2}>Carregando suas listas...</Text>
              </Box>
            ) : userLists.length === 0 ? (
              <MenuItem
                icon={<FaPlus color="white" size={14} />}
                onClick={onCreateModalOpen}
                _hover={{ bg: "gray.600" }}
                color="white"
                bg="gray.800"
              >
                <Text color="white">Criar nova lista</Text>
              </MenuItem>
            ) : (
              <>
                <MenuItem
                  icon={<FaPlus color="white" size={14} />}
                  onClick={onCreateModalOpen}
                  _hover={{ bg: "gray.600" }}
                  color="white"
                  bg="gray.800"
                >
                  <Text color="white">Criar nova lista</Text>
                </MenuItem>
                <MenuDivider borderColor="gray.700" />
                {userLists.map((list) => (
                  <MenuItem
                    key={list.id}
                    icon={isInList(list.id) ? <FaCheck color="white" size={14} /> : <FaPlus color="white" size={14} />}
                    onClick={() => handleAddToList(list.id)}
                    isDisabled={isAddingToList === list.id || isInList(list.id)}
                    _hover={{ bg: "gray.600" }}
                    color="white"
                    bg="gray.800"
                    _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                  >
                    {isAddingToList === list.id ? (
                      <Flex align="center">
                        <Spinner size="xs" mr={2} color="white" />
                        <Text color="white">Adicionando...</Text>
                      </Flex>
                    ) : (
                      <Text color="white">{list.title}</Text>
                    )}
                  </MenuItem>
                ))}
              </>
            )}
          </MenuList>
        </Menu>
      )}

      {/* Modal para criar nova lista */}
      <Modal isOpen={isCreateModalOpen} onClose={onCreateModalClose}>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Criar Nova Lista</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired mb={4}>
              <FormLabel>Título</FormLabel>
              <Input
                placeholder="Nome da lista"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                placeholder="Descrição opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Tags</FormLabel>
              <Flex mb={2}>
                <Input
                  placeholder="Adicione tags e pressione Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  mr={2}
                  bg="gray.700"
                  borderColor="gray.600"
                />
                <Button 
                  onClick={handleAddTag}
                  colorScheme="primary"
                >
                  Adicionar
                </Button>
              </Flex>
              <Flex wrap="wrap" gap={2} mt={2}>
                {tags.map(tag => (
                  <Tag key={tag} colorScheme="primary" size="md">
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                  </Tag>
                ))}
              </Flex>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="is-public" mb="0">
                Privacidade
              </FormLabel>
              <Switch
                id="is-public"
                isChecked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                colorScheme="primary"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateModalClose} color="white">
              Cancelar
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleCreateNewList}
              isLoading={isCreating}
              loadingText="Criando..."
            >
              Criar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 