import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Divider,
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
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { getPopularUsers, UserWithStats } from '../services/users';
import { getUserRecentReviews } from '../services/reviews';
import { UserAvatar } from '../components/common/UserAvatar';
import { FollowButton } from '../components/user/FollowButton';
import { Link as RouterLink } from 'react-router-dom';
import { Footer } from '../components/common/Footer';
import { BackToTopButton } from '../components/common/BackToTopButton';
import { Trophy, UsersThree } from '@phosphor-icons/react';
import { RatingStars } from '../components/common/RatingStars';
import { ChevronRightIcon, StarIcon } from '@chakra-ui/icons';
import { FaFilm, FaListUl, FaUserFriends } from 'react-icons/fa';
import { formatDate } from '../utils/dateUtils';
import { UserName } from '../components/common/UserName';

export function Community() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["popularUsers"],
    queryFn: () => getPopularUsers(20),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const featuredUsers = users?.slice(0, 3) || [];
  const remainingUsers = users?.slice(3) || [];
  
  const columns = useBreakpointValue({ base: 1, md: 2, lg: 3 });
  
  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Container maxW="container.lg" py={8} flex="1">
        <Flex 
          align="center" 
          mb={8}
          borderBottom="1px solid"
          borderColor={useColorModeValue('gray.700', 'gray.700')}
          pb={4}
        >
          <Icon as={UsersThree} color="primary.500" boxSize={8} mr={3} />
          <Heading color="white" size="xl">Comunidade</Heading>
        </Flex>

        {isLoading ? (
          <>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={10}>
              {[1, 2, 3].map((i) => (
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
            
            <Skeleton height="40px" width="200px" mb={4} />
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
              {Array(6).fill(0).map((_, i) => (
                <Box key={i} p={4} borderRadius="lg" boxShadow="md" bg="whiteAlpha.100">
                  <Flex alignItems="center">
                    <SkeletonCircle size="50px" mr={4} />
                    <VStack align="start" flex={1}>
                      <SkeletonText noOfLines={1} width="60%" />
                      <SkeletonText noOfLines={1} width="40%" />
                    </VStack>
                    <Skeleton height="30px" width="80px" />
                  </Flex>
                </Box>
              ))}
            </Grid>
          </>
        ) : (
          <>
            {featuredUsers.length > 0 ? (
              <>
                <Grid 
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={6}
                  mb={10}
                  alignItems="stretch"
                >
                  {featuredUsers.map((user) => (
                    <GridItem key={user.id} h="100%">
                      <FeaturedUserCard user={user} />
                    </GridItem>
                  ))}
                </Grid>
                
                <Heading as="h2" size="lg" mb={4}>
                  Usuários Populares
                </Heading>
                
                <Grid 
                  templateColumns={{ 
                    base: "1fr", 
                    md: "repeat(2, 1fr)", 
                    lg: "repeat(3, 1fr)" 
                  }}
                  gap={6}
                  gridAutoRows="1fr"
                >
                  {remainingUsers.map((user) => (
                    <GridItem key={user.id} h="100%">
                      <UserCard user={user} />
                    </GridItem>
                  ))}
                </Grid>
              </>
            ) : (
              <Box textAlign="center" py={10}>
                <Heading as="h3" size="md">
                  Nenhum usuário encontrado
                </Heading>
                <Text mt={2} color="gray.500">
                  Parece que ainda não temos usuários ativos na comunidade.
                </Text>
              </Box>
            )}
          </>
        )}
      </Container>
      
      <BackToTopButton />
      <Footer />
    </Flex>
  );
}

interface FeaturedUserCardProps {
  user: UserWithStats;
}

const FeaturedUserCard: React.FC<FeaturedUserCardProps> = ({ user }) => {
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

interface UserCardProps {
  user: UserWithStats;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <Box 
      p={4} 
      borderRadius="lg" 
      boxShadow="md" 
      bg="whiteAlpha.50"
      transition="transform 0.2s, box-shadow 0.2s"
      _hover={{
        transform: "translateY(-3px)",
        boxShadow: "lg",
        bg: "whiteAlpha.100"
      }}
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex>
        <Box mr={4} position="relative">
          <Link as={RouterLink} to={`/u/${user.username}`}>
            <UserAvatar 
              size="md" 
              photoURL={user.photoURL}
              name={user.displayName || user.username}
              userId={user.id}
            />
          </Link>
          
          <Box position="absolute" bottom="-6px" right="-6px" zIndex={1}>
            <FollowButton userId={user.id} />
          </Box>
        </Box>
        
        <VStack align="start" spacing={0} flex={1}>
          <UserName userId={user.id} />
          
          <HStack spacing={4} mt={2} fontSize="xs" color="gray.500">
            <HStack spacing={1}>
              <Text fontWeight="bold" color="white">{user.reviewCount || 0}</Text>
              <Text>Avaliações</Text>
            </HStack>
            
            <HStack spacing={1}>
              <Text fontWeight="bold" color="white">{user.followerCount || 0}</Text>
              <Text>Seguidores</Text>
            </HStack>
          </HStack>
        </VStack>
      </Flex>
    </Box>
  );
}; 