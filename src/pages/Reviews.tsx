import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  HStack,
  Icon,
  Badge,
  Center,
  LinkBox,
  Skeleton,
  useToast,
  SkeletonCircle,
} from '@chakra-ui/react';
import { MagnifyingGlass, Heart, TelevisionSimple } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { getPopularReviews, getRecentFollowedUsersReviews, getSeriesReviews, PopularReview, getAllReviews } from '../services/reviews';
import { EnhancedImage } from '../components/common/EnhancedImage';
import { RatingStars } from '../components/common/RatingStars';
import { UserAvatar } from '../components/common/UserAvatar';
import { UserName } from '../components/common/UserName';
import { getSeriesDetails } from '../services/tmdb';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Footer } from '../components/common/Footer';
import { PageHeader } from '../components/common/PageHeader';

export function Reviews() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar avaliações populares (com pelo menos 1 curtida)
  const { 
    data: popularReviews = [], 
    isLoading: isLoadingPopular 
  } = useQuery({
    queryKey: ["allPopularReviews"],
    queryFn: getPopularReviews,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Buscar todas as avaliações
  const {
    data: allReviews = [],
    isLoading: isLoadingAll
  } = useQuery({
    queryKey: ["allReviews"],
    queryFn: () => getAllReviews(),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Buscar avaliações de usuários seguidos
  const { 
    data: followedReviews = [], 
    isLoading: isLoadingFollowed 
  } = useQuery({
    queryKey: ["allFollowedReviews"],
    queryFn: () => getRecentFollowedUsersReviews(30),
    enabled: !!currentUser,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Filtrar avaliações com base na busca
  const filteredPopularReviews = popularReviews.filter(review => 
    searchQuery === '' || 
    review.seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllReviews = allReviews.filter((review: PopularReview) => 
    searchQuery === '' || 
    review.seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowedReviews = followedReviews.filter(review => 
    searchQuery === '' || 
    review.seriesName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manipuladores de eventos
  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Poderia adicionar lógica adicional aqui se necessário
    }
  };

  const handleReviewClick = (review: PopularReview) => {
    navigate(`/reviews/${review.id}/${review.seasonNumber}`);
  };

  const handlePosterClick = (e: React.MouseEvent, seriesId: number) => {
    e.stopPropagation();
    navigate(`/series/${seriesId}`);
  };

  // Renderizar um card de avaliação
  const renderReviewCard = (review: PopularReview) => (
    <Box
      key={review.id}
      as={LinkBox}
      bg="gray.800"
      borderRadius="lg"
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{ transform: "translateY(-4px)" }}
      cursor="pointer"
      onClick={() => handleReviewClick(review)}
      h="225px"
      position="relative"
    >
      {review.seriesPoster && (
        <EnhancedImage
          src={`https://image.tmdb.org/t/p/w500${review.seriesPoster}`}
          alt={review.seriesName}
          height="100%"
          width="100%"
          objectFit="cover"
          fallbackText="Imagem não disponível"
          tmdbWidth="w500"
          onClick={(e) => handlePosterClick(e, review.seriesId)}
        />
      )}

      {/* Overlay na parte inferior do card */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="rgba(0, 0, 0, 0.7)"
        p={3}
        borderBottomRadius="lg"
      >
        <VStack align="start" spacing={1}>
          <HStack justify="space-between" width="100%">
            <HStack spacing={2} align="center">
              <UserAvatar
                size="xs"
                photoURL={review.userAvatar}
                name={review.userName}
                userId={review.userId}
              />
              <UserName userId={review.userId} />
            </HStack>
            <HStack spacing={1}>
              <Icon as={Heart} weight="fill" color="red.500" />
              <Text color="white" fontSize="xs">{review.likes}</Text>
            </HStack>
          </HStack>
          
          <HStack justify="space-between" width="100%">
            <RatingStars rating={review.rating} size={16} showNumber={false} />
          </HStack>
        </VStack>
      </Box>
      
      {/* Badge para mostrar a temporada */}
      <Badge
        position="absolute"
        top={3}
        right={3}
        colorScheme="purple"
        borderRadius="md"
      >
        T{review.seasonNumber}
      </Badge>
    </Box>
  );

  // Renderizar o grid de skeleton cards para o estado de carregamento
  const renderSkeletonGrid = () => (
    <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
      {Array(6).fill(0).map((_, i) => (
        <Box key={i} bg="gray.800" borderRadius="lg" h="225px" position="relative">
          <Skeleton h="100%" />
          <Box position="absolute" bottom={0} left={0} right={0} p={3}>
            <HStack>
              <SkeletonCircle size="8" />
              <Skeleton height="20px" width="100px" />
            </HStack>
          </Box>
        </Box>
      ))}
    </Grid>
  );

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <PageHeader
        title="Avaliações"
        subtitle="Descubra o que a comunidade está assistindo e avaliando"
        tabs={[
          {
            label: "Populares",
            isSelected: activeTabIndex === 0,
            onClick: () => handleTabChange(0)
          },
          {
            label: "Seguindo",
            isSelected: activeTabIndex === 1,
            onClick: () => handleTabChange(1)
          },
          {
            label: "Todas",
            isSelected: activeTabIndex === 2,
            onClick: () => handleTabChange(2)
          }
        ]}
        showSearch={true}
        searchPlaceholder="Buscar por série ou usuário..."
        onSearch={setSearchQuery}
        onSearchSubmit={handleSearch}
        searchValue={searchQuery}
      />

      <Container maxW="container.lg" flex="1" py={8}>
        {activeTabIndex === 0 ? (
          isLoadingPopular ? (
            renderSkeletonGrid()
          ) : filteredPopularReviews.length > 0 ? (
            <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
              {filteredPopularReviews.map(renderReviewCard)}
            </Grid>
          ) : (
            <Center py={10}>
              <VStack spacing={4}>
                <Icon as={TelevisionSimple} boxSize={12} color="gray.500" />
                <Text color="gray.500">Nenhuma avaliação com curtidas encontrada</Text>
              </VStack>
            </Center>
          )
        ) : activeTabIndex === 1 ? (
          // Conteúdo da aba "Seguindo"
          !currentUser ? (
            <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
              <Text color="gray.400">
                Faça login para ver avaliações de usuários que você segue
              </Text>
            </Box>
          ) : isLoadingFollowed ? (
            renderSkeletonGrid()
          ) : filteredFollowedReviews.length > 0 ? (
            <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
              {filteredFollowedReviews.map(renderReviewCard)}
            </Grid>
          ) : (
            <Box bg="gray.800" p={6} borderRadius="lg" textAlign="center">
              <Text color="gray.400">
                Você ainda não tem avaliações de usuários seguidos
              </Text>
            </Box>
          )
        ) : (
          // Conteúdo da aba "Todas"
          isLoadingAll ? (
            renderSkeletonGrid()
          ) : filteredAllReviews.length > 0 ? (
            <Grid templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
              {filteredAllReviews.map(renderReviewCard)}
            </Grid>
          ) : (
            <Center py={10}>
              <VStack spacing={4}>
                <Icon as={TelevisionSimple} boxSize={12} color="gray.500" />
                <Text color="gray.500">Nenhuma avaliação encontrada</Text>
              </VStack>
            </Center>
          )
        )}
      </Container>

      <Footer />
    </Flex>
  );
} 