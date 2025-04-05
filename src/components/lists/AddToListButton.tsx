import React, { useState, useEffect } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
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
  VStack,
  Portal,
} from '@chakra-ui/react';
import { 
  FaListUl, 
  FaPlus,
  FaAngleDown, 
  FaCheck 
} from 'react-icons/fa';
import { Series } from '../../services/tmdb';
import { useAuth } from '../../contexts/AuthContext';
import { useLists } from '../../hooks/useLists';

interface AddToListButtonProps {
  series: Series;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  iconOnly?: boolean;
  useButtonElement?: boolean;
}

// Versão do botão específica para uso como MenuItem
export function AddToListMenuItem({ series }: { series: Series }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return (
      <MenuItem 
        icon={<FaListUl color="white" size={14} />}
        onClick={() => toast({
          title: "Faça login para adicionar séries às suas listas",
          status: "warning",
          duration: 3000,
          isClosable: true,
        })}
        bg="gray.900"
        _hover={{ bg: "gray.800" }}
        color="white"
      >
        <Box color="white">
          Adicionar a uma lista
        </Box>
      </MenuItem>
    );
  }
  
  return (
    <>
      <MenuItem 
        icon={<FaListUl color="white" size={14} />}
        onClick={onOpen}
        bg="gray.900"
        _hover={{ bg: "gray.800" }}
        color="white"
      >
        <Box color="white">
          Adicionar a uma lista
        </Box>
      </MenuItem>
      
      <ListSelectorModal 
        isOpen={isOpen} 
        onClose={onClose} 
        series={series} 
      />
    </>
  );
}

// Componente para o modal de seleção de listas
function ListSelectorModal({ 
  isOpen, 
  onClose, 
  series 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  series: Series 
}) {
  const { userLists, isLoading, loadUserLists, addToList, isInList, createUserList } = useLists();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const toast = useToast();
  
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadUserLists(series.id)
        .then(() => setHasLoaded(true))
        .catch(() => setHasLoaded(true));
    }
  }, [isOpen, series.id, loadUserLists, hasLoaded]);
  
  const handleAddToList = async (listId: string) => {
    setIsAddingToList(listId);
    try {
      await addToList(listId, series);
      onClose();
    } finally {
      setIsAddingToList(null);
    }
  };
  
  const handleCreateList = async () => {
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
      const listId = await createUserList(
        title,
        description,
        tags,
        isPublic,
        series
      );
      
      if (listId) {
        setTitle('');
        setDescription('');
        setTags([]);
        setTagInput('');
        setIsPublic(true);
        setShowCreateForm(false);
        onClose();
      }
    } finally {
      setIsCreating(false);
    }
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
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Adicionar à Lista</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          {showCreateForm ? (
            <>
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
            </>
          ) : (
            <>
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="primary" 
                variant="outline" 
                w="100%" 
                mb={4}
                onClick={() => setShowCreateForm(true)}
              >
                Criar nova lista
              </Button>
              
              {isLoading ? (
                <Box textAlign="center" p={4}>
                  <Spinner size="md" color="white" />
                  <Text mt={2} color="white">Carregando suas listas...</Text>
                </Box>
              ) : userLists.length === 0 ? (
                <Text color="gray.400" textAlign="center">
                  Você ainda não tem listas. Crie uma nova!
                </Text>
              ) : (
                <VStack spacing={2} align="stretch">
                  {userLists.map((list) => (
                    <Button
                      key={list.id}
                      variant="ghost"
                      justifyContent="flex-start"
                      leftIcon={isInList(list.id) ? <FaCheck color="white" size={14} /> : <FaPlus color="white" size={14} />}
                      onClick={() => handleAddToList(list.id)}
                      isDisabled={isAddingToList === list.id || isInList(list.id)}
                      bg="gray.700"
                      _hover={{ bg: "gray.600" }}
                      color="white"
                    >
                      {isAddingToList === list.id ? (
                        <Flex align="center">
                          <Spinner size="xs" mr={2} color="white" />
                          <Text color="white">Adicionando...</Text>
                        </Flex>
                      ) : (
                        <Text color="white" isTruncated>{list.title}</Text>
                      )}
                    </Button>
                  ))}
                </VStack>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          {showCreateForm ? (
            <>
              <Button variant="ghost" mr={3} onClick={() => setShowCreateForm(false)} color="gray.400" _hover={{ bg: "gray.700" }}>
                Voltar
              </Button>
              <Button
                colorScheme="primary"
                onClick={handleCreateList}
                isLoading={isCreating}
                loadingText="Criando..."
              >
                Criar
              </Button>
            </>
          ) : (
            <Button colorScheme="gray" onClick={onClose}>
              Fechar
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Componente para renderizar os itens do menu de listas
function ListMenuItems({ 
  series,
  onCreateModalOpen,
}: { 
  series: Series,
  onCreateModalOpen: () => void,
}) {
  const { userLists, isLoading, loadUserLists, addToList, isInList } = useLists();
  const [isAddingToList, setIsAddingToList] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    // Carregar listas do usuário quando o componente montar, apenas uma vez por série
    if (!hasLoaded) {
      loadUserLists(series.id)
        .then(() => setHasLoaded(true))
        .catch(() => setHasLoaded(true)); // Marcar como carregado mesmo em caso de erro
    }
  }, [series.id, loadUserLists, hasLoaded]);

  const handleAddToList = async (listId: string) => {
    setIsAddingToList(listId);
    try {
      await addToList(listId, series);
    } finally {
      setIsAddingToList(null);
    }
  };

  if (isLoading && !hasLoaded) {
    return (
      <Box textAlign="center" p={3}>
        <Spinner size="sm" color="white" />
        <Text color="white" mt={2}>Carregando suas listas...</Text>
      </Box>
    );
  }

  if (userLists.length === 0) {
    return (
      <MenuItem
        icon={<FaPlus color="white" size={14} />}
        onClick={onCreateModalOpen}
        _hover={{ bg: "gray.800" }}
        color="white"
        bg="gray.900"
      >
        <Text color="white">Criar nova lista</Text>
      </MenuItem>
    );
  }

  return (
    <>
      <MenuItem
        icon={<FaPlus color="white" size={14} />}
        onClick={onCreateModalOpen}
        _hover={{ bg: "gray.800" }}
        color="white"
        bg="gray.900"
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
          _hover={{ bg: "gray.800" }}
          color="white"
          bg="gray.900"
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
  );
}

export function AddToListButton({ 
  series, 
  size = 'md', 
  variant = 'solid',
  iconOnly = false,
  useButtonElement = true 
}: AddToListButtonProps) {
  const { currentUser } = useAuth();
  const { createUserList } = useLists();
  
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

  const handleMenuOpen = () => {
    onOpen();
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
      const listId = await createUserList(
        title,
        description,
        tags,
        isPublic,
        series
      );
      
      if (listId) {
        // Limpar formulário e fechar modal
        setTitle('');
        setDescription('');
        setTags([]);
        setTagInput('');
        setIsPublic(true);
        onCreateModalClose();
        
        // Fechar também o menu principal se estiver aberto
        onClose();
        
        toast({
          title: "Lista criada",
          description: `Série adicionada à nova lista "${title}"`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Erro ao criar lista:", error);
      toast({
        title: "Erro ao criar lista",
        description: "Não foi possível criar a lista. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
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
              bg="gray.900"
              _hover={{ bg: "gray.800" }}
            >
              <Flex alignItems="center">
                <Box ml={1} mr={4}><FaListUl size={14} /></Box>
                <Text>Listas</Text>
                <Box ml={2}><FaAngleDown /></Box>
              </Flex>
            </MenuButton>
          )}
          <Portal>
            <MenuList bg="gray.900" borderColor="gray.700" color="white">
              <ListMenuItems 
                series={series}
                onCreateModalOpen={onCreateModalOpen}
              />
            </MenuList>
          </Portal>
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
            <Button variant="ghost" mr={3} onClick={onCreateModalClose} color="gray.400" _hover={{ bg: "gray.700" }} >
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