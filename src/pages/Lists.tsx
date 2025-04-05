import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Button,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Divider,
  useDisclosure,
  Icon,
  Skeleton,
  useToast,
  IconButton
} from '@chakra-ui/react';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { BackToTopButton } from '../components/common/BackToTopButton';
import { getPopularLists, getFollowedUsersLists, getListsByTag, getPopularTags, searchLists } from '../services/lists';
import { ListCard } from '../components/lists/ListCard';
import { CreateListModal } from '../components/lists/CreateListModal';
import { ResetScroll } from '../components/common/ResetScroll';
import { ListWithUserData } from '../types/list';
import { useSearchParams } from 'react-router-dom';

export default function Lists() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ListWithUserData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [popularLists, setPopularLists] = useState<ListWithUserData[]>([]);
  const [followedLists, setFollowedLists] = useState<ListWithUserData[]>([]);
  const [popularTags, setPopularTags] = useState<{tag: string, count: number}[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(searchParams.get('tag'));
  const [taggedLists, setTaggedLists] = useState<ListWithUserData[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingFollowed, setIsLoadingFollowed] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isLoadingTagged, setIsLoadingTagged] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();

  // Verificar se há uma tag nos parâmetros da URL 
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam);
      
      // Verificar a fonte da navegação
      const source = searchParams.get('source');
      
      // Selecionar a aba apropriada com base na fonte
      switch (source) {
        case 'listPage':  // Navegação da página de detalhes de lista
        case 'profile':   // Navegação da página de perfil
          setActiveTabIndex(2); // Selecionar a aba "Tags" (índice 2)
          break;
        case 'listCard':  // Navegação de um card de lista
          // Se vier de um card, manter na aba "Destaques" para mostrar resultados filtrados
          setActiveTabIndex(0);
          break;
        default:
          // Por padrão, mostrar na aba "Destaques"
          setActiveTabIndex(0);
      }
    }
  }, [searchParams]);

  // Carregar listas populares
  useEffect(() => {
    const fetchPopularLists = async () => {
      setIsLoadingPopular(true);
      try {
        const lists = await getPopularLists();
        setPopularLists(lists);
      } catch (error) {
        console.error('Erro ao carregar listas populares:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as listas populares',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingPopular(false);
      }
    };
    
    fetchPopularLists();
  }, [toast]);

  // Carregar listas de usuários seguidos apenas se o usuário estiver logado
  useEffect(() => {
    const fetchFollowedLists = async () => {
      if (!currentUser) {
        setIsLoadingFollowed(false);
        return;
      }
      
      setIsLoadingFollowed(true);
      try {
        const lists = await getFollowedUsersLists();
        setFollowedLists(lists);
      } catch (error) {
        console.error('Erro ao carregar listas de usuários seguidos:', error);
      } finally {
        setIsLoadingFollowed(false);
      }
    };
    
    fetchFollowedLists();
  }, [currentUser]);

  // Carregar tags populares
  useEffect(() => {
    const fetchPopularTags = async () => {
      setIsLoadingTags(true);
      try {
        const tags = await getPopularTags();
        setPopularTags(tags);
      } catch (error) {
        console.error('Erro ao carregar tags populares:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };
    
    fetchPopularTags();
  }, []);

  // Carregar listas por tag quando uma tag é selecionada
  useEffect(() => {
    const fetchListsByTag = async () => {
      if (!selectedTag) {
        setTaggedLists([]);
        return;
      }
      
      setIsLoadingTagged(true);
      try {
        const lists = await getListsByTag(selectedTag);
        setTaggedLists(lists);
      } catch (error) {
        console.error(`Erro ao carregar listas com a tag "${selectedTag}":`, error);
      } finally {
        setIsLoadingTagged(false);
      }
    };
    
    fetchListsByTag();
  }, [selectedTag]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchLists(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
      
      if (results.length === 0) {
        toast({
          title: 'Nenhum resultado encontrado',
          description: `Não foram encontradas listas para "${searchQuery}"`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro na busca',
        description: 'Ocorreu um erro ao buscar listas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (tag === selectedTag) {
      setSelectedTag(null);
      // Remover o parâmetro tag da URL
      searchParams.delete('tag');
      setSearchParams(searchParams);
    } else {
      setSelectedTag(tag);
      // Adicionar o parâmetro tag à URL
      searchParams.set('tag', tag);
      setSearchParams(searchParams);
    }
  };

  const displayedTags = showAllTags ? popularTags : popularTags.slice(0, 10);

  return (
    <>
      <ResetScroll />
      <Container maxW="container.lg" py={8}>
        <Flex 
          direction={{ base: "column", md: "row" }}
          justifyContent="space-between" 
          alignItems={{ base: "flex-start", md: "center" }}
          mb={{ base: 6, md: 8 }}
          gap={{ base: 4, md: 0 }}
        >
          <Heading color="white" size="lg" mb={{ base: 2, md: 0 }}>
            Listas
          </Heading>
          
          <Flex 
            width={{ base: "100%", md: "auto" }}
            direction={{ base: "column", sm: "row" }}
            gap={3}
          >
            <InputGroup maxW={{ base: "100%", md: "300px" }}>
              <Input
                placeholder="Buscar listas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setShowSearchResults(false);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                bg="gray.700"
                borderColor="gray.600"
                pr="16"
              />
              <InputRightElement pr="8">
                {searchQuery ? (
                  <HStack spacing={0}>
                    <IconButton
                      aria-label="Limpar busca"
                      icon={<FaTimes size={12} />}
                      size="sm"
                      variant="ghost"
                      h="8"
                      minW="8"
                      colorScheme="whiteAlpha"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                    />
                    <IconButton
                      aria-label="Buscar"
                      icon={<FaSearch size={12} />}
                      size="sm"
                      variant="ghost"
                      h="8"
                      minW="8"
                      colorScheme="primary"
                      isLoading={isSearching}
                      onClick={handleSearch}
                    />
                  </HStack>
                ) : (
                  <IconButton
                    aria-label="Buscar"
                    icon={<FaSearch size={12} />}
                    size="sm"
                    variant="ghost"
                    h="8"
                    minW="8"
                    colorScheme="primary"
                    isLoading={isSearching}
                    onClick={handleSearch}
                  />
                )}
              </InputRightElement>
            </InputGroup>
            
            <Button
              leftIcon={<FaPlus />}
              colorScheme="primary"
              onClick={onCreateModalOpen}
              width={{ base: "100%", sm: "auto" }}
              size="md"
            >
              Nova Lista
            </Button>
          </Flex>
        </Flex>
        
        <Tabs 
          variant="line" 
          colorScheme="primary" 
          isLazy 
          mb={8}
          index={activeTabIndex}
          onChange={setActiveTabIndex}
        >
          <TabList borderBottomColor="gray.700">
            <Tab color="gray.300" _selected={{ color: "white", borderColor: "primary.500" }}>Destaques</Tab>
            <Tab 
              color="gray.300" 
              _selected={{ color: "white", borderColor: "primary.500" }}
              isDisabled={!currentUser}
              title={!currentUser ? "Faça login para ver listas de usuários que você segue" : ""}
            >
              Seguindo
            </Tab>
            <Tab color="gray.300" _selected={{ color: "white", borderColor: "primary.500" }}>
              Tags
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Painel de Destaques */}
            <TabPanel px={0}>
              {/* Resultados da busca - mostrados acima de tudo quando uma busca for feita */}
              {showSearchResults && (
                <Box mb={8}>
                  <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Heading size="md" color="white">
                      Resultados para "{searchQuery}"
                    </Heading>
                    <Button 
                      variant="link" 
                      colorScheme="primary" 
                      onClick={() => setShowSearchResults(false)}
                    >
                      Limpar busca
                    </Button>
                  </Flex>
                  
                  {searchResults.length === 0 ? (
                    <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                      <Text color="gray.400">
                        Nenhuma lista encontrada para "{searchQuery}".
                      </Text>
                    </Box>
                  ) : (
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                      {searchResults.map((list) => (
                        <ListCard key={list.id} list={list} />
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
              
              {selectedTag ? (
                <Box mb={8}>
                  <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Heading size="md" color="white">
                      Listas com a tag "{selectedTag}"
                    </Heading>
                    <Button 
                      variant="link" 
                      colorScheme="primary" 
                      onClick={() => setSelectedTag(null)}
                    >
                      Limpar filtro
                    </Button>
                  </Flex>
                  
                  {isLoadingTagged ? (
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} height="240px" borderRadius="lg" />
                      ))}
                    </Grid>
                  ) : taggedLists.length === 0 ? (
                    <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                      <Text color="gray.400">
                        Nenhuma lista encontrada com a tag "{selectedTag}".
                      </Text>
                    </Box>
                  ) : (
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                      {taggedLists.map((list) => (
                        <ListCard key={list.id} list={list} />
                      ))}
                    </Grid>
                  )}
                </Box>
              ) : (
                <>
                  <Box mb={8}>
                    <Heading size="md" color="white" mb={4}>
                      Listas Populares
                    </Heading>
                    
                    {isLoadingPopular ? (
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} height="240px" borderRadius="lg" />
                        ))}
                      </Grid>
                    ) : popularLists.length === 0 ? (
                      <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                        <Text color="gray.400">
                          Ainda não há listas populares. Seja o primeiro a criar uma!
                        </Text>
                      </Box>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                        {popularLists.map((list) => (
                          <ListCard key={list.id} list={list} />
                        ))}
                      </Grid>
                    )}
                  </Box>
                  
                  <Divider borderColor="gray.700" my={8} />
                  
                  <Box>
                    <Heading size="md" color="white" mb={4}>
                      Tags Populares
                    </Heading>
                    
                    {isLoadingTags ? (
                      <Wrap spacing={3}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <WrapItem key={i}>
                            <Skeleton height="32px" width="100px" borderRadius="full" />
                          </WrapItem>
                        ))}
                      </Wrap>
                    ) : popularTags.length === 0 ? (
                      <Text color="gray.400">
                        Nenhuma tag encontrada.
                      </Text>
                    ) : (
                      <>
                        <Wrap spacing={3}>
                          {displayedTags.map((tagItem) => (
                            <WrapItem key={tagItem.tag}>
                              <Tag
                                size="lg"
                                colorScheme="primary"
                                variant={selectedTag === tagItem.tag ? "solid" : "subtle"}
                                cursor="pointer"
                                onClick={() => handleTagClick(tagItem.tag)}
                                opacity={selectedTag === tagItem.tag ? 1 : 0.8}
                                transform={selectedTag === tagItem.tag ? "scale(1.05)" : "scale(1)"}
                                transition="all 0.2s"
                                fontWeight={selectedTag === tagItem.tag ? "bold" : "normal"}
                                boxShadow={selectedTag === tagItem.tag ? "0 0 0 1px #805AD5" : "none"}
                              >
                                <TagLabel>{tagItem.tag} ({tagItem.count})</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                        
                        {popularTags.length > 10 && (
                          <Button
                            variant="link"
                            colorScheme="primary"
                            onClick={() => setShowAllTags(!showAllTags)}
                            mt={4}
                            rightIcon={showAllTags ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                          >
                            {showAllTags ? "Ver menos" : `Ver mais (${popularTags.length - 10})`}
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                </>
              )}
            </TabPanel>
            
            {/* Painel de Seguindo */}
            <TabPanel px={0}>
              {!currentUser ? (
                <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                  <Text color="gray.400">
                    Faça login para ver listas de usuários que você segue.
                  </Text>
                </Box>
              ) : isLoadingFollowed ? (
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} height="240px" borderRadius="lg" />
                  ))}
                </Grid>
              ) : followedLists.length === 0 ? (
                <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                  <Text color="gray.400">
                    Você ainda não tem listas de usuários seguidos. Comece a seguir usuários para ver suas listas aqui.
                  </Text>
                </Box>
              ) : (
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                  {followedLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </Grid>
              )}
            </TabPanel>
            
            {/* Painel de Tags */}
            <TabPanel px={0}>
              <Box>
                <Heading size="md" color="white" mb={4}>
                  Todas as Tags
                </Heading>
                
                {isLoadingTags ? (
                  <Wrap spacing={3}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                      <WrapItem key={i}>
                        <Skeleton height="32px" width={`${Math.floor(Math.random() * 50) + 80}px`} borderRadius="full" />
                      </WrapItem>
                    ))}
                  </Wrap>
                ) : popularTags.length === 0 ? (
                  <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                    <Text color="gray.400">
                      Ainda não há tags disponíveis. As tags são criadas quando os usuários adicionam elas às suas listas.
                    </Text>
                  </Box>
                ) : (
                  <Wrap spacing={3}>
                    {popularTags.map((tagItem) => (
                      <WrapItem key={tagItem.tag}>
                        <Tag
                          size="lg"
                          colorScheme="primary"
                          variant="subtle"
                          cursor="pointer"
                          onClick={() => handleTagClick(tagItem.tag)}
                          opacity={selectedTag === tagItem.tag ? 1 : 0.8}
                          transform={selectedTag === tagItem.tag ? "scale(1.05)" : "scale(1)"}
                          transition="all 0.2s"
                        >
                          <TagLabel>{tagItem.tag} ({tagItem.count})</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
                
                {selectedTag && (
                  <Box mt={8}>
                    <Flex justifyContent="space-between" alignItems="center" mb={4}>
                      <Heading size="md" color="white">
                        Listas com a tag "{selectedTag}"
                      </Heading>
                      <Button 
                        variant="link" 
                        colorScheme="primary" 
                        onClick={() => setSelectedTag(null)}
                      >
                        Limpar filtro
                      </Button>
                    </Flex>
                    
                    {isLoadingTagged ? (
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} height="240px" borderRadius="lg" />
                        ))}
                      </Grid>
                    ) : taggedLists.length === 0 ? (
                      <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
                        <Text color="gray.400">
                          Nenhuma lista encontrada com a tag "{selectedTag}".
                        </Text>
                      </Box>
                    ) : (
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
                        {taggedLists.map((list) => (
                          <ListCard key={list.id} list={list} />
                        ))}
                      </Grid>
                    )}
                  </Box>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
      
      {isCreateModalOpen && (
        <CreateListModal 
          isOpen={isCreateModalOpen}
          onClose={onCreateModalClose}
          onListCreated={() => {
            // Recarregar as listas após criação
            // Você precisa implementar esta função
          }}
        />
      )}
      
      <BackToTopButton />
    </>
  );
} 