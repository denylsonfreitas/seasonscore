import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Button,
  Badge,
  useBreakpointValue,
  useColorModeValue,
  Spinner,
  Icon,
  Avatar,
  Grid,
  GridItem,
  Link,
  Card,
  CardBody,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Image as ChakraImage,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Center,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { getPopularUsers, UserWithStats, searchUsers } from '../services/users';
import { getUserRecentReviews } from '../services/reviews';
import { UserAvatar } from '../components/common/UserAvatar';
import { FollowButton } from '../components/user/FollowButton';
import { Link as RouterLink } from 'react-router-dom';
import { Footer } from '../components/common/Footer';
import { UserName } from '../components/common/UserName';
import { PageHeader } from '../components/common/PageHeader';
import { useDebounce } from '../hooks/useDebounce';
import { Users, UserPlus, MagnifyingGlass, Shuffle } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';

export function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [tabIndex, setTabIndex] = useState(0);
  const { currentUser } = useAuth();

  // Query para usuários populares
  const { data: popularUsers, isLoading: isLoadingPopular } = useQuery({
    queryKey: ["popularUsers", debouncedSearch, "popular"],
    queryFn: () => debouncedSearch 
      ? searchUsers(debouncedSearch, 20, "popular")
      : getPopularUsers(20, "popular"),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: tabIndex === 0 || debouncedSearch !== ""
  });

  // Query para usuários novos (ordenados por data de criação)
  const { data: newUsers, isLoading: isLoadingNew } = useQuery({
    queryKey: ["newUsers", debouncedSearch, "new"],
    queryFn: () => debouncedSearch 
      ? searchUsers(debouncedSearch, 20, "newest")
      : getPopularUsers(20, "newest"),
    staleTime: 5 * 60 * 1000,
    enabled: tabIndex === 1 || debouncedSearch !== ""
  });

  // Query para todos os usuários
  const { data: allUsers, isLoading: isLoadingAll } = useQuery({
    queryKey: ["allUsers", debouncedSearch, "all"],
    queryFn: () => debouncedSearch 
      ? searchUsers(debouncedSearch, 50, "all")
      : getPopularUsers(50, "all"),
    staleTime: 5 * 60 * 1000,
    enabled: tabIndex === 2 || debouncedSearch !== ""
  });

  // Determinar quais usuários mostrar com base na aba selecionada
  const getActiveUsers = () => {
    let activeUsers: UserWithStats[] = [];
    
    if (debouncedSearch) {
      activeUsers = popularUsers || [];
    } else {
      switch (tabIndex) {
        case 0: activeUsers = popularUsers || []; break;
        case 1: activeUsers = newUsers || []; break;
        case 2: activeUsers = allUsers || []; break;
        default: activeUsers = popularUsers || [];
      }
    }
    
    // Filtrar o usuário logado, EXCETO se estiver na aba "Todos" e buscando por si mesmo
    if (currentUser && 
        !(tabIndex === 2 && 
          debouncedSearch && 
          (currentUser.displayName?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
           currentUser.email?.toLowerCase().includes(debouncedSearch.toLowerCase())))) {
      return activeUsers.filter(user => user.id !== currentUser.uid);
    }
    
    return activeUsers;
  };

  const isLoading = debouncedSearch 
    ? isLoadingPopular 
    : (tabIndex === 0 ? isLoadingPopular : tabIndex === 1 ? isLoadingNew : isLoadingAll);

  const users = getActiveUsers();
  
  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };
  
  // Função para renderizar a mensagem de estado vazio com base na aba atual
  const renderEmptyMessage = () => {
    if (debouncedSearch) {
      return `Não encontramos usuários correspondentes a "${debouncedSearch}".`;
    }
    
    switch (tabIndex) {
      case 0:
        return "Não encontramos usuários com seguidores. Seja o primeiro a seguir alguém!";
      case 1:
        return "Não há novos usuários nos últimos 3 dias.";
      case 2:
        return "Parece que ainda não temos usuários ativos na comunidade.";
      default:
        return "Nenhum usuário encontrado.";
    }
  };

  // Função para renderizar o ícone adequado ao estado vazio
  const renderEmptyIcon = () => {
    if (debouncedSearch) {
      return MagnifyingGlass;
    }
    
    switch (tabIndex) {
      case 0:
        return Users;
      case 1:
        return UserPlus;
      case 2:
        return Shuffle;
      default:
        return Users;
    }
  };
  
  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <PageHeader
        title="Comunidade"
        subtitle="Descubra e conecte-se com outros usuários"
        showSearch
        searchPlaceholder="Buscar usuários..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        tabs={[
          { label: "Populares", isSelected: tabIndex === 0, onClick: () => handleTabChange(0) },
          { label: "Novatos", isSelected: tabIndex === 1, onClick: () => handleTabChange(1) },
          { label: "Todos", isSelected: tabIndex === 2, onClick: () => handleTabChange(2) }
        ]}
      />

      <Container maxW="container.lg" py={8} flex="1">
        {isLoading ? (
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
            {Array(9).fill(0).map((_, i) => (
              <Box key={i} p={6} borderRadius="lg" boxShadow="lg" bg="whiteAlpha.100">
                <VStack align="center" spacing={4}>
                  <SkeletonCircle size="120px" />
                  <SkeletonText mt="4" noOfLines={2} spacing="4" width="60%" />
                  <SkeletonText mt="2" noOfLines={3} spacing="4" width="100%" />
                  <Skeleton height="30px" width="120px" />
                </VStack>
              </Box>
            ))}
          </Grid>
        ) : (
          <>
            {users.length > 0 ? (
              <Grid 
                templateColumns={{ 
                  base: "1fr", 
                  md: users.length > 1 ? "repeat(2, 1fr)" : "1fr", 
                  lg: users.length > 2 ? "repeat(3, 1fr)" : (users.length > 1 ? "repeat(2, 1fr)" : "1fr")
                }}
                gap={6}
                gridAutoRows="1fr"
              >
                {users.map((user) => (
                  <GridItem key={user.id} h="100%">
                    <UserCard user={user} />
                  </GridItem>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={10} bg="gray.800" borderRadius="lg" p={6}>
                <VStack spacing={4}>
                  <Icon as={renderEmptyIcon()} weight="thin" boxSize={14} color="gray.500" />
                  <Heading as="h3" size="md">
                    Nenhum usuário encontrado
                  </Heading>
                  <Text color="gray.400">
                    {renderEmptyMessage()}
                  </Text>
                </VStack>
              </Box>
            )}
          </>
        )}
      </Container>
      
      <Footer />
    </Flex>
  );
}

interface UserCardProps {
  user: UserWithStats;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { data: recentReviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["userRecentReviews", user.id],
    queryFn: () => getUserRecentReviews(user.id, 4),
    enabled: !!user.id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Box 
      p={4} 
      borderRadius="lg" 
      boxShadow="lg" 
      bg="whiteAlpha.100"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{
        transform: "translateY(-5px)",
        boxShadow: "xl",
      }}
      maxW="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex w="100%" mb={2} gap={4} alignItems="flex-start">
        <Box>
          <Box position="relative" mb={2}>
            <Link as={RouterLink} to={`/u/${user.username}`}>
              <UserAvatar 
                size="xl"
                photoURL={user.photoURL}
                name={user.displayName || user.username}
                userId={user.id}
                border="3px solid"
                borderColor="primary.500"
              />
            </Link>
            
            <Box position="absolute" bottom="-4px" right="-4px" zIndex={1}>
              <FollowButton userId={user.id} />
            </Box>
          </Box>
          
          <Box textAlign="center">
            <UserName userId={user.id} />
          </Box>
        </Box>
        
        <Box flex="1" width="calc(100% - 120px)">
          {isLoadingReviews ? (
            <HStack 
              w="100%" 
              spacing={1} 
              justifyContent="space-between"
              sx={{
                "&::-webkit-scrollbar": { height: "4px" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "4px" }
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <Box 
                  key={i} 
                  flexShrink={0}
                  flexBasis={{ base: "calc(25% - 3px)", md: "calc(25% - 3px)" }}
                >
                  <Skeleton width="100%" height={{ base: "85px", md: "100px" }} borderRadius="md" />
                </Box>
              ))}
            </HStack>
          ) : recentReviews && recentReviews.length > 0 ? (
            <HStack 
              w="100%" 
              spacing={1} 
              justifyContent="space-between"
              sx={{
                "&::-webkit-scrollbar": { height: "4px" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "4px" }
              }}
            >
              {recentReviews.map((review) => (
                <Link 
                  key={review.id} 
                  as={RouterLink}
                  to={`/series/${review.seriesId}`}
                  _hover={{ textDecoration: "none" }}
                  flexShrink={0}
                  flexBasis={{ base: "calc(25% - 3px)", md: "calc(25% - 3px)" }}
                >
                  <Box
                    position="relative"
                    width="100%"
                    height={{ base: "85px", md: "100px" }}
                    borderRadius="md"
                    overflow="hidden"
                    bg="gray.700"
                  >
                    {review.seriesPoster ? (
                      <ChakraImage
                        src={`https://image.tmdb.org/t/p/w200${review.seriesPoster}`}
                        alt={review.seriesName}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex 
                        height="100%" 
                        align="center" 
                        justify="center"
                        flexDirection="column"
                        p={1}
                      >
                        <Text 
                          color="gray.200" 
                          fontSize="xs" 
                          textAlign="center"
                          noOfLines={2}
                        >
                          {review.seriesName}
                        </Text>
                      </Flex>
                    )}
                  </Box>
                </Link>
              ))}
            </HStack>
          ) : (
            <Flex 
              w="100%" 
              h="100px" 
              align="center" 
              justify="center" 
              bg="whiteAlpha.50" 
              borderRadius="md"
            >
              <Text color="gray.400" fontSize="sm">Sem avaliações recentes</Text>
            </Flex>
          )}
        </Box>
      </Flex>
      
      <Box>
        <Divider my={2} />
        
        <Flex justifyContent="space-around" textAlign="center" mt={2}>
          <VStack spacing={0}>
            <Text fontWeight="bold" color="white" fontSize="lg">{user.reviewCount || 0}</Text>
            <Text color="gray.400" fontSize="sm">Avaliações</Text>
          </VStack>
          
          <VStack spacing={0}>
            <Text fontWeight="bold" color="white" fontSize="lg">{user.followerCount || 0}</Text>
            <Text color="gray.400" fontSize="sm">Seguidores</Text>
          </VStack>
        </Flex>
      </Box>
    </Box>
  );
}; 