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
  Icon
} from '@chakra-ui/react';
import { FaPlus, FaSearch, FaTimes, FaAngleRight, FaAngleLeft, } from 'react-icons/fa';
import { Globe, Lock, Plus } from '@phosphor-icons/react';
import { ListCard } from '../lists/ListCard';
import { getUserLists, createList } from '../../services/lists';
import { useAuth } from '../../contexts/AuthContext';
import { ListWithUserData } from '../../types/list';
import { useNavigate } from 'react-router-dom';
import { searchSeries } from '../../services/tmdb';
import { CreateListModal } from '../lists/CreateListModal';

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

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

  const handleListCreated = (listId: string) => {
    // Atualizar a lista de listas
    fetchLists();
    
    // Navegar para a página da lista recém-criada
    navigate(`/list/${listId}`);
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
            leftIcon={<Plus weight="bold" />}
            colorScheme="primary"
            onClick={onOpen}
          >
            Lista
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
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
          {lists.map((list) => (
            <ListCard key={list.id} list={list} showUser={false} />
          ))}
        </Grid>
      )}

      {/* Usando o componente CreateListModal */}
      <CreateListModal 
        isOpen={isOpen} 
        onClose={onClose} 
        onListCreated={handleListCreated}
      />
    </Box>
  );
} 