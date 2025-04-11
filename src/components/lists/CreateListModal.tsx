import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Box,
  Flex,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  VStack,
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  InputGroup,
  InputRightElement,
  Grid,
  GridItem,
  Image,
  Spinner,
  IconButton
} from '@chakra-ui/react';
import { Globe, Lock, MagnifyingGlass, X, CaretRight, CaretLeft, Plus } from '@phosphor-icons/react';
import { createList } from '../../services/lists';
import { searchSeries } from '../../services/tmdb';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListCreated?: (listId: string) => void;
  initialSeries?: {
    id: number;
    name: string;
    poster_path: string | null;
  };
}

export function CreateListModal({ 
  isOpen, 
  onClose, 
  onListCreated,
  initialSeries 
}: CreateListModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [accessByLink, setAccessByLink] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para busca e seleção de séries
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: number, name: string, poster_path: string | null}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Array<{id: number, name: string, poster_path: string | null}>>(
    initialSeries ? [initialSeries] : []
  );
  const [isCreating, setIsCreating] = useState(false);

  const toast = useToast();

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
  
  const handleSeriesSearch = async () => {
    if (!seriesSearchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchPerformed(true);
    
    try {
      const result = await searchSeries(seriesSearchQuery);
      setSearchResults(result.results.slice(0, 9));
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível buscar séries. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAddSeries = (series: {id: number, name: string, poster_path: string | null}) => {
    if (!selectedSeries.some(s => s.id === series.id)) {
      setSelectedSeries([...selectedSeries, series]);
    } else {
      setSelectedSeries(selectedSeries.filter(s => s.id !== series.id));
    }
  };
  
  const handleRemoveSeries = (seriesId: number) => {
    setSelectedSeries(selectedSeries.filter(s => s.id !== seriesId));
  };

  const handleCreateList = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, forneça um título para a lista',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Preparar itens da lista
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
        initialItems,
        accessByLink
      );
      
      toast({
        title: 'Lista criada',
        description: initialItems.length > 0
          ? `Lista criada com ${initialItems.length} ${initialItems.length === 1 ? 'série' : 'séries'}`
          : 'Lista criada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Limpar o formulário
      resetForm();
      
      // Fechar o modal
      onClose();
      
      // Informar ao componente pai que a lista foi criada
      if (onListCreated) {
        onListCreated(listId);
      }
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a lista. Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setAccessByLink(false);
    setTags([]);
    setTagInput('');
    setSearchResults([]);
    setSeriesSearchQuery('');
    setSelectedSeries(initialSeries ? [initialSeries] : []);
    setActiveTab(0);
    setSearchPerformed(false);
  };

  return (
    <Modal
    isOpen={isOpen}
    onClose={() => {
      onClose();
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
              <FormLabel htmlFor="is-public" mb="0">
                <Flex align="center">
                  <Icon as={isPublic ? Globe : Lock} weight="fill" mr={2} color={isPublic ? "green.400" : "gray.400"} />
                  {isPublic ? "Pública" : "Privada"}
                </Flex>
              </FormLabel>
              <Switch
                id="is-public"
                isChecked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  // Se tornar pública, desativa o acesso por link
                  if (e.target.checked) {
                    setAccessByLink(false);
                  }
                }}
                colorScheme="primary"
              />
            </FormControl>

            {/* Opção de acesso por link - aparece apenas quando a lista é privada */}
            {!isPublic && (
              <FormControl display="flex" alignItems="center" mt={2} pl={6}>
                <FormLabel htmlFor="access-by-link" mb="0" fontSize="sm">
                  <Flex align="center">
                    <Icon as={accessByLink ? Globe : Lock} weight="fill" mr={2} color={accessByLink ? "blue.400" : "gray.400"} size={14} />
                    Permitir acesso por link
                  </Flex>
                </FormLabel>
                <Switch
                  id="access-by-link"
                  isChecked={accessByLink}
                  onChange={(e) => setAccessByLink(e.target.checked)}
                  colorScheme="blue"
                  size="sm"
                />
              </FormControl>
            )}
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
                        <Icon as={MagnifyingGlass} weight="bold" />
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
                                  <Icon as={Plus} size={10} weight="bold" />
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
                            icon={<Icon as={X} />}
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
            rightIcon={<Icon as={CaretRight} weight="bold" />}
          >
            Avançar
          </Button>
        ) : (
          <>
            <Button
              mr={3} 
              onClick={() => setActiveTab(0)} 
              leftIcon={<Icon as={CaretLeft} weight="bold" />}
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
  );
} 