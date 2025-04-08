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
  useDisclosure,
  Skeleton,
  useToast,
  SkeletonCircle,
} from '@chakra-ui/react';
import { MagnifyingGlass, Heart, TelevisionSimple } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { getPopularReviews, getRecentFollowedUsersReviews, getSeriesReviews, PopularReview } from '../services/reviews';
import { EnhancedImage } from '../components/common/EnhancedImage';
import { RatingStars } from '../components/common/RatingStars';
import { UserAvatar } from '../components/common/UserAvatar';
import { UserName } from '../components/common/UserName';
import { ReviewDetailsModal } from '../components/reviews/ReviewDetailsModal';
import { getSeriesDetails } from '../services/tmdb';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Footer } from '../components/common/Footer';

export function Reviews() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<PopularReview | null>(null);

  // Buscar avaliações populares
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

  // Buscar detalhes da série selecionada
  const { data: selectedSeries } = useQuery({
    queryKey: ["series", selectedReview?.seriesId],
    queryFn: () => getSeriesDetails(selectedReview?.seriesId || 0),
    enabled: !!selectedReview?.seriesId
  });

  // Buscar avaliações da série selecionada
  const { data: seriesReviews = [] } = useQuery({
    queryKey: ["reviews", selectedReview?.seriesId],
    queryFn: () => getSeriesReviews(selectedReview?.seriesId || 0),
    enabled: !!selectedReview?.seriesId,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Preparar dados para o modal de detalhes
  const currentReview = selectedReview && seriesReviews.length > 0
    ? seriesReviews.find(r => r.id === selectedReview.id)
    : null;

  const seasonReview = currentReview?.seasonReviews.find(
    sr => sr.seasonNumber === selectedReview?.seasonNumber
  );

  // Filtrar avaliações com base na busca
  const filteredPopularReviews = popularReviews.filter(review => 
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
    setSelectedReview(review);
    onOpen();
  };

  const handlePosterClick = (e: React.MouseEvent, seriesId: number) => {
    e.stopPropagation();
    navigate(`/series/${seriesId}`);
  };

  const handleReviewUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: ["reviews", selectedReview?.seriesId],
    });
    
    queryClient.invalidateQueries({
      queryKey: ["allPopularReviews"],
    });

    queryClient.invalidateQueries({
      queryKey: ["allFollowedReviews"],
    });
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

  // Renderizar o esqueleto de carregamento
  const renderLoadingSkeletons = () => (
    <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <Box key={i} bg="gray.800" borderRadius="lg" overflow="hidden" position="relative" h="225px">
          <Skeleton 
            height="100%" 
            width="100%" 
            startColor="gray.700" 
            endColor="gray.600" 
            speed={1.2}
          />
          
          {/* Simular o rodapé com informações */}
          <Box position="absolute" bottom={0} left={0} right={0} height="60px" zIndex={2}>
            <Skeleton 
              height="100%" 
              startColor="blackAlpha.700" 
              endColor="blackAlpha.600" 
              speed={1.2}
            />
          </Box>
          
          {/* Simular avatar e nome do usuário */}
          <HStack position="absolute" bottom={4} left={3} zIndex={3} spacing={2}>
            <SkeletonCircle size="6" startColor="gray.600" endColor="gray.500" />
            <Skeleton height="10px" width="80px" startColor="gray.600" endColor="gray.500" />
          </HStack>
          
          {/* Simular badge de temporada */}
          <Box position="absolute" top={3} right={3} zIndex={3}>
            <Skeleton height="20px" width="30px" borderRadius="md" startColor="purple.300" endColor="purple.200" />
          </Box>
        </Box>
      ))}
    </Grid>
  );

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        <Container maxW="container.lg" py={8} pb={16}>
          <Heading color="white" size="2xl" mb={6}>
            Avaliações
          </Heading>
          
          {/* Barra de busca */}
          <InputGroup mb={8} size="lg">
            <Input 
              placeholder="Buscar por série ou usuário"
              bg="gray.800"
              border="none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            <InputRightElement>
              <Icon as={MagnifyingGlass} color="gray.400" weight="bold" />
            </InputRightElement>
          </InputGroup>
          
          {/* Tabs para diferentes categorias de avaliações */}
          <Tabs 
            variant="line" 
            colorScheme="primary" 
            index={activeTabIndex} 
            onChange={handleTabChange}
            mb={8}
          >
            <TabList borderBottomColor="gray.700">
              <Tab color="gray.400" _selected={{ color: "primary.500", borderColor: "primary.500" }}>
                Mais curtidas
              </Tab>
              {currentUser && (
                <Tab color="gray.400" _selected={{ color: "primary.500", borderColor: "primary.500" }}>
                  De quem você segue
                </Tab>
              )}
            </TabList>
            
            <TabPanels>
              {/* Tab de avaliações populares */}
              <TabPanel p={0} pt={6}>
                {isLoadingPopular ? (
                  renderLoadingSkeletons()
                ) : filteredPopularReviews.length === 0 ? (
                  <Box 
                    bg="gray.800" 
                    p={8} 
                    borderRadius="lg" 
                    textAlign="center"
                  >
                    {searchQuery ? (
                      <Text color="gray.400">
                        Nenhuma avaliação encontrada para "{searchQuery}".
                      </Text>
                    ) : (
                      <Text color="gray.400">
                        Nenhuma avaliação popular esta semana. Seja o primeiro a avaliar uma série!
                      </Text>
                    )}
                  </Box>
                ) : (
                  <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
                    {filteredPopularReviews.map(review => renderReviewCard(review))}
                  </Grid>
                )}
              </TabPanel>
              
              {/* Tab de avaliações de usuários seguidos */}
              {currentUser && (
                <TabPanel p={0} pt={6}>
                  {isLoadingFollowed ? (
                    renderLoadingSkeletons()
                  ) : filteredFollowedReviews.length === 0 ? (
                    <Box 
                      bg="gray.800" 
                      p={8} 
                      borderRadius="lg" 
                      textAlign="center"
                    >
                      {searchQuery ? (
                        <Text color="gray.400">
                          Nenhuma avaliação encontrada para "{searchQuery}".
                        </Text>
                      ) : (
                        <Text color="gray.400">
                          Você ainda não tem avaliações de usuários seguidos. Comece a seguir usuários para ver suas avaliações aqui.
                        </Text>
                      )}
                    </Box>
                  ) : (
                    <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(6, 1fr)" }} gap={4}>
                      {filteredFollowedReviews.map(review => renderReviewCard(review))}
                    </Grid>
                  )}
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
      
      <Footer />
      
      {/* Modal de detalhes da avaliação */}
      {selectedReview && selectedSeries && (
        <ReviewDetailsModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedReview(null);
          }}
          review={{
            id: selectedReview.id,
            seriesId: selectedReview.seriesId.toString(),
            userId: selectedReview.userId,
            userEmail: selectedReview.userName,
            seriesName: selectedSeries.name,
            seriesPoster: selectedSeries.poster_path || "",
            seasonNumber: selectedReview.seasonNumber,
            rating: seasonReview?.rating || selectedReview.rating,
            comment: seasonReview?.comment || selectedReview.comment,
            comments: seasonReview?.comments || [],
            reactions: { 
              likes: [],
            },
            createdAt: seasonReview?.createdAt || selectedReview.createdAt
          }}
          onReviewUpdated={handleReviewUpdated}
        />
      )}
    </Flex>
  );
} 