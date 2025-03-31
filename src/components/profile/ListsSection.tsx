import React, { useEffect, useState } from 'react';
import {
  SimpleGrid,
  Box,
  Text,
  Button,
  Flex,
  useDisclosure,
  Spinner,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Switch,
  FormHelperText,
  useToast,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightElement,
  Image,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { FaPlus, FaSearch, FaTimes, FaAngleRight, FaAngleLeft, } from 'react-icons/fa';
import { ListCard } from '../lists/ListCard';
import { getUserLists, createList } from '../../services/lists';
import { useAuth } from '../../contexts/AuthContext';
import { ListWithUserData } from '../../types/list';
import { useNavigate } from 'react-router-dom';
import { searchSeries } from '../../services/tmdb';

interface ListsSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

// Interface para representar os resultados da busca de séries
interface SeriesSearchResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

export function ListsSection({ userId, isOwnProfile }: ListsSectionProps) {
  const { currentUser } = useAuth();
  const [lists, setLists] = useState<ListWithUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Estados para busca e seleção de séries
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SeriesSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesSearchResult[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const toast = useToast();

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchLists();
  }, [userId]);

  const fetchLists = async () => {
    try {
      setIsLoading(true);
      const userLists = await getUserLists(userId, !isOwnProfile);
      setLists(userLists);
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
      toast({
        title: 'Erro ao carregar listas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!currentUser) return;
    
    // Validar título
    if (title.trim().length < 3) {
      toast({
        title: 'Título muito curto',
        description: 'O título da lista deve ter pelo menos 3 caracteres',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      // Voltar para a primeira aba se o título for inválido
      setActiveTab(0);
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Criar a lista com as séries selecionadas
      const initialItems = selectedSeries.map(series => ({
        seriesId: series.id,
        name: series.name,
        poster_path: series.poster_path,
        addedAt: new Date()
      }));
      
      const listId = await createList(
        title.trim(),
        description.trim(),
        tags,
        isPublic,
        initialItems
      );
      
      toast({
        title: 'Lista criada',
        description: 'Sua lista foi criada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Limpar o formulário
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setTags([]);
      setTagInput('');
      setSelectedSeries([]);
      setSearchResults([]);
      setSeriesSearchQuery('');
      
      // Fechar o modal
      onClose();
      
      // Atualizar a lista de listas
      fetchLists();
      
      // Navegar para a página da lista recém-criada
      navigate(`/lists/${listId}`);
    } catch (error: any) {
      toast({
        title: 'Erro ao criar lista',
        description: error.message || 'Não foi possível criar a lista',
        status: 'error',
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

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Função para buscar séries
  const handleSeriesSearch = async () => {
    if (!seriesSearchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchPerformed(true);
    try {
      const response = await searchSeries(seriesSearchQuery, 1);
      setSearchResults(response.results.slice(0, 10)); // Limitar a 10 resultados
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
  
  // Adicionar uma série à seleção
  const handleAddSeries = (series: SeriesSearchResult) => {
    if (!selectedSeries.some(s => s.id === series.id)) {
      setSelectedSeries([...selectedSeries, series]);
    }
  };
  
  // Remover uma série da seleção
  const handleRemoveSeries = (seriesId: number) => {
    setSelectedSeries(selectedSeries.filter(s => s.id !== seriesId));
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" p={10}>
        <Spinner size="xl" color="primary.500" />
      </Flex>
    );
  }

  return (
    <Box>
      {isOwnProfile && (
        <Flex justifyContent="flex-end" mb={6}>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="primary"
            onClick={onOpen}
          >
            Nova Lista
          </Button>
        </Flex>
      )}

      {lists.length === 0 ? (
        <Box
          textAlign="center"
          p={10}
          bg="gray.800"
          borderRadius="md"
        >
          <Text fontSize="xl" mb={4}>
            {isOwnProfile
              ? 'Você ainda não criou nenhuma lista'
              : 'Este usuário ainda não criou nenhuma lista'}
          </Text>
          {isOwnProfile && (
            <Button
              colorScheme="primary"
              onClick={onOpen}
            >
              Criar sua primeira lista
            </Button>
          )}
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} spacing={6}>
          {lists.map((list) => (
            <ListCard key={list.id} list={list} showUser={false} />
          ))}
        </SimpleGrid>
      )}

      {/* Modal para criar nova lista */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSearchPerformed(false);
          setSeriesSearchQuery('');
          setSearchResults([]);
        }}
        isCentered
        size="xl"
      >
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Criar Nova Lista</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <Tabs variant="enclosed" colorScheme="primary" mb={4} index={activeTab} onChange={(index) => {
              // Validar antes de permitir a navegação para a segunda tab
              if (index === 1) {
                if (title.trim().length < 3) {
                  toast({
                    title: 'Título muito curto',
                    description: 'O título da lista deve ter pelo menos 3 caracteres',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
              }
              setActiveTab(index);
            }}>
              <TabList>
                <Tab>Informações</Tab>
                <Tab>Adicionar Séries</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Título</FormLabel>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título da lista"
                        bg="gray.700"
                        borderColor="gray.600"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Descrição</FormLabel>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descrição opcional"
                        resize="vertical"
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
                        <Button onClick={handleAddTag} colorScheme="primary">Adicionar</Button>
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
                      <FormLabel htmlFor="visibility" mb="0">
                        Privacidade
                      </FormLabel>
                      <Switch
                        id="visibility"
                        isChecked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        colorScheme="primary"
                      />
                      <FormHelperText ml={2} color="gray.400">
                        {isPublic 
                          ? 'Listas públicas são visíveis para todos os usuários'
                          : 'Listas privadas são visíveis apenas para você'}
                      </FormHelperText>
                    </FormControl>
                  </VStack>
                </TabPanel>
                
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Box bg="gray.700" p={3} borderRadius="md" mb={2}>
                      <Text fontSize="sm" color="gray.300">
                        Adicione séries à sua lista (opcional). Você pode adicionar mais séries depois de criar a lista.
                      </Text>
                    </Box>
                    
                    <FormControl>
                      <FormLabel>Buscar Séries</FormLabel>
                      <InputGroup>
                        <Input
                          placeholder="Digite o nome de uma série..."
                          value={seriesSearchQuery}
                          onChange={(e) => setSeriesSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSeriesSearch()}
                          bg="gray.700"
                          borderColor="gray.600"
                        />
                        <InputRightElement width="4.5rem">
                          <Button 
                            h="1.75rem" 
                            size="sm"
                            colorScheme="primary"
                            onClick={handleSeriesSearch}
                            isLoading={isSearching}
                          >
                            <FaSearch />
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    
                    {isSearching ? (
                      <Box textAlign="center" py={4}>
                        <Spinner color="primary.500" />
                        <Text mt={2} fontSize="sm" color="gray.400">Buscando séries...</Text>
                      </Box>
                    ) : (
                      <>
                        {searchResults.length > 0 ? (
                          <Box>
                            <Text fontSize="sm" mb={2} fontWeight="bold">Resultados da busca:</Text>
                            <Grid templateColumns="repeat(3, 1fr)" gap={2} maxH="300px" overflowY="auto">
                              {searchResults.map(series => (
                                <GridItem key={series.id} position="relative">
                                  <Box
                                    position="relative"
                                    borderRadius="md"
                                    overflow="hidden"
                                    cursor="pointer"
                                    onClick={() => handleAddSeries(series)}
                                    _hover={{ opacity: 0.8 }}
                                    transition="all 0.2s"
                                  >
                                    <Image 
                                      src={series.poster_path 
                                        ? `https://image.tmdb.org/t/p/w200${series.poster_path}`
                                        : 'https://placehold.co/200x300/222222/FFFFFF?text=Sem+Imagem'
                                      }
                                      alt={series.name}
                                      h="120px"
                                      w="100%"
                                      objectFit="cover"
                                    />
                                    <Box
                                      position="absolute"
                                      bottom={0}
                                      left={0}
                                      right={0}
                                      bg="blackAlpha.700"
                                      p={1}
                                    >
                                      <Text fontSize="xs" noOfLines={2}>
                                        {series.name}
                                      </Text>
                                    </Box>
                                    <Box
                                      position="absolute"
                                      top={1}
                                      right={1}
                                      bg="primary.500"
                                      borderRadius="full"
                                      p={1}
                                      opacity={selectedSeries.some(s => s.id === series.id) ? 1 : 0}
                                    >
                                      <FaPlus size={10} />
                                    </Box>
                                  </Box>
                                </GridItem>
                              ))}
                            </Grid>
                          </Box>
                        ) : (
                          searchPerformed ? (
                            <Box textAlign="center" py={4} bg="gray.700" borderRadius="md">
                              <Text color="gray.400">Nenhum resultado encontrado. Tente outra busca.</Text>
                            </Box>
                          ) : (
                            <Box textAlign="center" py={4} bg="gray.700" borderRadius="md">
                              <Text color="gray.400">Digite o nome de uma série e clique na lupa para buscar.</Text>
                            </Box>
                          )
                        )}
                      </>
                    )}
                    
                    {selectedSeries.length > 0 && (
                      <Box mt={4}>
                        <Text fontSize="sm" mb={2} fontWeight="bold">Séries selecionadas ({selectedSeries.length}):</Text>
                        <Flex wrap="wrap" gap={2}>
                          {selectedSeries.map(series => (
                            <Box 
                              key={series.id}
                              borderWidth="1px"
                              borderColor="gray.600"
                              borderRadius="md"
                              overflow="hidden"
                              w="80px"
                              position="relative"
                            >
                              <Image 
                                src={series.poster_path 
                                  ? `https://image.tmdb.org/t/p/w200${series.poster_path}`
                                  : 'https://placehold.co/80x120/222222/FFFFFF?text=Sem+Imagem'
                                }
                                alt={series.name}
                                h="120px"
                                w="80px"
                                objectFit="cover"
                              />
                              <IconButton
                                aria-label="Remover série"
                                icon={<FaTimes />}
                                size="xs"
                                colorScheme="red"
                                position="absolute"
                                top={1}
                                right={1}
                                onClick={() => handleRemoveSeries(series.id)}
                              />
                            </Box>
                          ))}
                        </Flex>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Button 
              variant="ghost"
              color="gray.400"
              _hover={{ bg: "gray.700" }}
              mr={3} 
              onClick={() => {
                onClose();
                setSearchPerformed(false);
                setSeriesSearchQuery('');
                setSearchResults([]);
                setActiveTab(0);
              }} 
              isDisabled={isCreating}
            >
              Cancelar
            </Button>
            
            {activeTab === 0 ? (
              <Button 
                colorScheme="primary" 
                onClick={() => {
                  // Validar antes de avançar
                  if (title.trim().length < 3) {
                    toast({
                      title: 'Título muito curto',
                      description: 'O título da lista deve ter pelo menos 3 caracteres',
                      status: 'warning',
                      duration: 3000,
                      isClosable: true,
                    });
                    return;
                  }
                  setActiveTab(1);
                }}
                rightIcon={<FaAngleRight />}
              >
                Avançar
              </Button>
            ) : (
              <>
                <Button
                 mr={3} 
                onClick={() => setActiveTab(0)} 
                leftIcon={<FaAngleLeft />}
                variant="outline"
                color="white"
                borderColor="gray.600"
                _hover={{ bg: "gray.700" }}
                >
                  Voltar
                </Button>
                
                <Button 
                  colorScheme="primary" 
                  onClick={handleCreateList} 
                  isLoading={isCreating}
                  loadingText="Criando..."
                >
                  Criar Lista
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 