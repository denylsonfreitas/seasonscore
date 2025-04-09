import { Box, VStack, Text, HStack, Grid, Icon, Badge, Center, LinkBox, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { useState } from "react";
import { getRecentFollowedUsersReviews, PopularReview } from "../../services/reviews";
import { Heart, TelevisionSimple } from "@phosphor-icons/react";
import { RatingStars } from "../common/RatingStars";
import { UserAvatar } from "../common/UserAvatar";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserName } from "../common/UserName";
import { useAuth } from "../../contexts/AuthContext";
import { EnhancedImage } from "../common/EnhancedImage";
import { SectionBase } from "../common/SectionBase";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { carouselStyles, seriesSliderSettings } from "../../styles/carouselStyles";

export function FollowedUsersReviews() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["followedUsersReviews"],
    queryFn: () => getRecentFollowedUsersReviews(12),
    enabled: !!currentUser,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const handleReviewClick = (review: PopularReview) => {
    navigate(`/reviews/${review.id}/${review.seasonNumber}`);
  };

  const handlePosterClick = (e: React.MouseEvent, seriesId: number) => {
    e.stopPropagation();
    navigate(`/series/${seriesId}`);
  };

  // Componente de carregamento elegante como skeleton
  const loadingElement = (
    <Box sx={carouselStyles} pb={8}>
      <Slider {...seriesSliderSettings}>
        {Array(8).fill(0).map((_, i) => (
          <Box key={i} px={2}>
            <Box 
              bg="gray.800" 
              borderRadius="lg" 
              overflow="hidden" 
              position="relative" 
              height="100%"
            >
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
          </Box>
        ))}
      </Slider>
    </Box>
  );

  // Componente para mensagem quando o usuário não está logado
  const emptyElement = !currentUser ? (
    <Box 
      bg="gray.800" 
      p={6} 
      borderRadius="lg" 
      textAlign="center"
    >
      <Text color="gray.400">
        Faça login para ver avaliações de usuários que você segue.
      </Text>
    </Box>
  ) : (
    <Box 
      bg="gray.800" 
      p={6} 
      borderRadius="lg" 
      textAlign="center"
    >
      <Text color="gray.400">
        Você ainda não tem avaliações de usuários seguidos. Comece a seguir usuários para ver suas avaliações aqui.
      </Text>
    </Box>
  );

  // Renderizar o conteúdo
  const renderContent = (limitItems: boolean) => {
    const displayedReviews = limitItems ? reviews.slice(0, 12) : reviews;
    
    return (
      <Box sx={carouselStyles} pb={8}>
        <Slider {...seriesSliderSettings}>
          {displayedReviews.map((review) => (
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
              height="100%"
              position="relative"
            >
              {review.seriesPoster ? (
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
              ) : (
                <Center height="100%" py={4} px={2} bg="gray.700" position="relative">
                  <VStack spacing={2} align="center" justify="center">
                    <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
                    <Text color="white" fontSize="md" fontWeight="bold" textAlign="center" noOfLines={2}>
                      {review.seriesName}
                    </Text>
                  </VStack>
                </Center>
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
          ))}
        </Slider>
      </Box>
    );
  };

  return (
    <SectionBase
      title="Quem você segue avaliou"
      link="/reviews"
      linkText="Ver todas"
      isLoading={isLoading}
      isEmpty={!currentUser || reviews.length === 0}
      emptyElement={emptyElement}
      loadingElement={loadingElement}
      expandable={reviews.length > 6}
      renderContent={renderContent}
    />
  );
} 