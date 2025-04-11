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
  IconButton,
  Center
} from '@chakra-ui/react';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import { CaretDown, CaretUp, Plus, TagSimple, X, User } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { getPopularLists, getFollowedUsersLists, getListsByTag, getPopularTags, searchLists, getAllLists } from '../services/lists';
import { ListCard } from '../components/lists/ListCard';
import { CreateListModal } from '../components/lists/CreateListModal';
import { ResetScroll } from '../components/common/ResetScroll';
import { ListWithUserData } from '../types/list';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { Link as RouterLink } from 'react-router-dom';

export default function Lists() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ListWithUserData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [popularLists, setPopularLists] = useState<ListWithUserData[]>([]);
  const [allLists, setAllLists] = useState<ListWithUserData[]>([]);
  const [followedLists, setFollowedLists] = useState<ListWithUserData[]>([]);
  const [popularTags, setPopularTags] = useState<{tag: string, count: number}[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [taggedLists, setTaggedLists] = useState<ListWithUserData[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [isLoadingFollowed, setIsLoadingFollowed] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isLoadingTagged, setIsLoadingTagged] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();

  // Verificar se há uma tag ou tab nos parâmetros da URL 
  useEffect(() => {
    // Verificar se há um parâmetro 'tab' na URL
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        setActiveTabIndex(tabIndex);
      }
    }
    
    // Verificar se há um parâmetro 'tag' na URL
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam);
      
      // Se não houver um parâmetro 'tab', definir a aba para Tags
      if (!tabParam) {
        setActiveTabIndex(2); // Selecionar a aba "Tags" (agora é o índice 2)
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

  // Carregar todas as listas em ordem aleatória
  useEffect(() => {
    const fetchAllLists = async () => {
      setIsLoadingAll(true);
      try {
        const lists = await getAllLists();
        setAllLists(lists);
      } catch (error) {
        console.error('Erro ao carregar todas as listas:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar todas as listas',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingAll(false);
      }
    };
    
    fetchAllLists();
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
    // Se clicar na tag já selecionada, remove a seleção
    if (tag === selectedTag) {
      setSelectedTag(null);
      // Remover o parâmetro tag da URL
      searchParams.delete('tag');
      setSearchParams(searchParams);
    } else {
      // Seleciona a nova tag
      setSelectedTag(tag);
      // Adicionar o parâmetro tag à URL
      searchParams.set('tag', tag);
      setSearchParams(searchParams);
      
      // Se não estiver na aba Tags, muda para ela
      if (activeTabIndex !== 2) {
        setActiveTabIndex(2);
      } else {
        // Se já estiver na aba Tags, força uma atualização das listas filtradas
        // reconsultando as listas com a tag selecionada
        const fetchListsByTag = async () => {
          setIsLoadingTagged(true);
          try {
            const lists = await getListsByTag(tag);
            setTaggedLists(lists);
          } catch (error) {
            console.error(`Erro ao carregar listas com a tag "${tag}":`, error);
          } finally {
            setIsLoadingTagged(false);
          }
        };
        
        fetchListsByTag();
      }
    }
  };

  const displayedTags = showAllTags ? popularTags : popularTags.slice(0, 10);

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    setShowSearchResults(false);
    
    // Atualizar o parâmetro tab na URL
    searchParams.set('tab', index.toString());
    
    // Se não estiver na aba Tags (índice 2), remover o parâmetro tag
    if (index !== 2) {
      searchParams.delete('tag');
    }
    
    setSearchParams(searchParams);
  };

  // Renderizar o conteúdo da aba de tags
  const renderTagsContent = () => {
    return (
      <Box>
        <Box mb={isLoadingTags ? 0 : 6}>
          {isLoadingTags ? (
            <Skeleton height="60px" width="100%" />
          ) : (
            <Wrap spacing={2} mb={4}>
              {displayedTags.map(({ tag, count }) => (
                <WrapItem key={tag}>
                  <Tag
                    size="md"
                    variant={selectedTag === tag ? "solid" : "subtle"}
                    colorScheme="primary"
                    cursor="pointer"
                    onClick={() => handleTagClick(tag)}
                  >
                    <TagLabel>{tag} ({count})</TagLabel>
                    {selectedTag === tag && (
                      <IconButton
                        aria-label="Remover tag"
                        icon={<X size={12} weight="bold" />}
                        size="xs"
                        colorScheme="primary"
                        variant="ghost"
                        ml={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTagClick(tag);
                        }}
                      />
                    )}
                  </Tag>
                </WrapItem>
              ))}
              {popularTags.length > 10 && (
                <WrapItem>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="primary"
                    rightIcon={
                      <Icon
                        as={showAllTags ? CaretUp : CaretDown}
                        weight="bold"
                      />
                    }
                    onClick={() => setShowAllTags(!showAllTags)}
                  >
                    {showAllTags ? "Mostrar menos" : "Ver mais"}
                  </Button>
                </WrapItem>
              )}
            </Wrap>
          )}
        </Box>

        {selectedTag ? (
          isLoadingTagged ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="300px" borderRadius="lg" />
              ))}
            </Grid>
          ) : taggedLists.length > 0 ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {taggedLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : (
            <Center py={8}>
              <VStack spacing={4}>
                <Icon as={TagSimple} boxSize={12} color="gray.500" weight="thin" />
                <Text color="gray.400">Nenhuma lista encontrada com a tag "{selectedTag}"</Text>
              </VStack>
            </Center>
          )
        ) : (
          <Center py={8}>
            <Text color="gray.400">Selecione uma tag para ver as listas</Text>
          </Center>
        )}
      </Box>
    );
  };

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <PageHeader
        title="Listas"
        subtitle="Navegue pelas listas da comunidade ou crie a sua própria"
        showSearch={true}
        searchPlaceholder="Buscar listas..."
        onSearch={setSearchQuery}
        onSearchSubmit={(e) => {
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
        searchValue={searchQuery}
        tabs={[
          { label: "Populares", isSelected: activeTabIndex === 0, onClick: () => handleTabChange(0) },
          { label: "Seguindo", isSelected: activeTabIndex === 1, onClick: () => handleTabChange(1) },
          { label: "Tags", isSelected: activeTabIndex === 2, onClick: () => handleTabChange(2) },
          { label: "Todas", isSelected: activeTabIndex === 3, onClick: () => handleTabChange(3) }
        ]}
        actionButton={
          <Button
            leftIcon={<Icon as={Plus} weight="bold" />}
            colorScheme="primary"
            onClick={onCreateModalOpen}
            size="md"
          >
            Lista
          </Button>
        }
      />

      <Container maxW="container.lg" flex="1" py={8}>
        {activeTabIndex === 0 ? (
          showSearchResults ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {searchResults.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : isLoadingPopular ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="300px" borderRadius="lg" />
              ))}
            </Grid>
          ) : popularLists.length > 0 ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {popularLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : (
            <Center py={8}>
              <VStack spacing={4}>
                <Icon as={TagSimple} boxSize={12} color="gray.500" weight="thin" />
                <Text color="gray.400">Nenhuma lista popular encontrada</Text>
              </VStack>
            </Center>
          )
        ) : activeTabIndex === 1 ? (
          showSearchResults ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {searchResults.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : !currentUser ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Icon as={User} boxSize={12} color="gray.500" weight="thin" />
                <Text color="gray.400">Faça login para ver listas de usuários que você segue</Text>
              </VStack>
            </Center>
          ) : isLoadingFollowed ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="300px" borderRadius="lg" />
              ))}
            </Grid>
          ) : followedLists.length > 0 ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {followedLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : (
            <Center py={8}>
              <VStack spacing={4}>
                <Icon as={User} boxSize={12} color="gray.500" weight="thin" />
                <Text color="gray.400">Você ainda não segue nenhum usuário com listas públicas</Text>
                <Button
                  as={RouterLink}
                  to="/community"
                  size="sm"
                  colorScheme="primary"
                  variant="outline"
                >
                  Explorar Usuários
                </Button>
              </VStack>
            </Center>
          )
        ) : activeTabIndex === 2 ? (
          renderTagsContent()
        ) : (
          // Conteúdo da aba "Todas"
          showSearchResults ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {searchResults.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : isLoadingAll ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="300px" borderRadius="lg" />
              ))}
            </Grid>
          ) : allLists.length > 0 ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              {allLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </Grid>
          ) : (
            <Center py={8}>
              <VStack spacing={4}>
                <Icon as={TagSimple} boxSize={12} color="gray.500" weight="thin" />
                <Text color="gray.400">Nenhuma lista encontrada</Text>
              </VStack>
            </Center>
          )
        )}
      </Container>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
      />

      <ResetScroll />
    </Flex>
  );
} 