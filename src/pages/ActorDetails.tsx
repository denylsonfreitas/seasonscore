import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Spinner,
  Divider,
  Badge,
  useColorModeValue,
  Button,
  Icon,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPersonDetails, getPersonCredits } from '../services/tmdb';
import { SeriesCard } from '../components/series/SeriesCard';
import { Footer } from '../components/common/Footer';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from '@phosphor-icons/react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { carouselStyles, seriesSliderSettings } from "../styles/carouselStyles";
import { EnhancedImage } from '../components/common/EnhancedImage';

export function ActorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actorId = parseInt(id || '0');
  
  const { data: actor, isLoading: isLoadingActor, error: actorError } = useQuery({
    queryKey: ['actor', actorId],
    queryFn: () => getPersonDetails(actorId),
    enabled: !!actorId,
  });
  
  const { data: credits, isLoading: isLoadingCredits, error: creditsError } = useQuery({
    queryKey: ['actor-credits', actorId],
    queryFn: () => getPersonCredits(actorId),
    enabled: !!actorId,
  });
  
  const isLoading = isLoadingActor || isLoadingCredits;
  const error = actorError || creditsError;
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <Flex direction="column" minH="100vh" bg="gray.900">
        <Container maxW="container.lg" py={8} flex="1">
          <Flex justify="center" align="center" height="50vh">
            <Spinner size="xl" color="primary.500" thickness="4px" />
          </Flex>
        </Container>
        <Footer />
      </Flex>
    );
  }
  
  if (error || !actor) {
    return (
      <Flex direction="column" minH="100vh" bg="gray.900">
        <Container maxW="container.lg" py={8} flex="1">
          <Box textAlign="center" py={10} px={6}>
            <Heading as="h2" size="xl" color="red.500" mb={4}>
              Erro
            </Heading>
            <Text color="white" fontSize="lg">
              Não foi possível carregar os detalhes do ator.
            </Text>
            <Button
              mt={8}
              colorScheme="primary"
              leftIcon={<Icon as={ArrowLeft} weight="bold" />}
              onClick={handleGoBack}
            >
              Voltar
            </Button>
          </Box>
        </Container>
        <Footer />
      </Flex>
    );
  }
  
  // Ordenar créditos por popularidade e limitar a 20
  const sortedCredits = credits?.cast
    ? [...credits.cast]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20)
    : [];
  
  // Formatação de data de nascimento
  const formattedBirthday = actor.birthday
    ? format(parseISO(actor.birthday), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Não informado';
  
  // Formatação de idade
  const age = actor.birthday
    ? new Date().getFullYear() - parseISO(actor.birthday).getFullYear()
    : null;
  
  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Container maxW="container.lg" py={8} flex="1">
        <Button
          leftIcon={<Icon as={ArrowLeft} weight="bold" />}
          variant="ghost"
          colorScheme="whiteAlpha"
          mb={6}
          onClick={handleGoBack}
        >
          Voltar
        </Button>
        
        <Flex
          direction={{ base: 'column', md: 'row' }}
          mb={12}
          gap={8}
        >
          {/* Foto do ator */}
          <Box
            width={{ base: '100%', md: '300px' }}
            flexShrink={0}
          >
            <Box
              borderRadius="lg"
              overflow="hidden"
              boxShadow="lg"
              bg="gray.800"
              mb={4}
              height={{ base: '450px', md: 'auto' }}
            >
              {actor.profile_path ? (
                <EnhancedImage
                  src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`}
                  alt={actor.name}
                  height="100%"
                  width="100%"
                  objectFit="cover"
                  tmdbWidth="w500"
                  priority
                />
              ) : (
                <Flex
                  height="100%"
                  bg="gray.700"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="gray.400" textAlign="center">
                    Imagem não disponível
                  </Text>
                </Flex>
              )}
            </Box>
            
            <VStack align="start" spacing={3} bg="gray.800" p={4} borderRadius="lg">
              <Box>
                <Text fontSize="sm" color="gray.400">
                  Nascimento
                </Text>
                <Text color="white">
                  {formattedBirthday}
                  {age && ` (${age} anos)`}
                </Text>
              </Box>
              
              {actor.place_of_birth && (
                <Box>
                  <Text fontSize="sm" color="gray.400">
                    Local de nascimento
                  </Text>
                  <Text color="white">{actor.place_of_birth}</Text>
                </Box>
              )}
              
              <Box>
                <Text fontSize="sm" color="gray.400">
                  Conhecido por
                </Text>
                <Badge colorScheme="primary" mt={1}>
                  {actor.known_for_department}
                </Badge>
              </Box>
            </VStack>
          </Box>
          
          {/* Informações do ator */}
          <Box flex="1">
            <Heading as="h1" size="2xl" color="white" mb={4}>
              {actor.name}
            </Heading>
            
            {actor.also_known_as && actor.also_known_as.length > 0 && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.400">
                  Também conhecido como
                </Text>
                <Text color="gray.300">
                  {actor.also_known_as.join(', ')}
                </Text>
              </Box>
            )}
            
            <Divider my={6} borderColor="gray.700" />
            
            <Heading as="h3" size="md" color="white" mb={4}>
              Biografia
            </Heading>
            
            {actor.biography ? (
              <Text color="gray.300" whiteSpace="pre-line">
                {actor.biography}
              </Text>
            ) : (
              <Text color="gray.400" fontStyle="italic">
                Não há biografia disponível para este ator.
              </Text>
            )}
          </Box>
        </Flex>
        
        {/* Séries em que participou */}
        <Box mt={12} mb={8}>
          <Heading as="h2" size="xl" color="white" mb={8}>
            Séries em que participou
          </Heading>
          
          {sortedCredits.length > 0 ? (
            <Box sx={carouselStyles} pb={4}>
              <Slider {...seriesSliderSettings}>
                {sortedCredits.map((series) => (
                  <Box key={`${series.id}-${series.character}`} px={2}>
                    <Box 
                      bg="gray.800" 
                      borderRadius="lg" 
                      overflow="hidden"
                      height="100%"
                      transition="transform 0.2s"
                      _hover={{ transform: "translateY(-4px)" }}
                    >
                      <SeriesCard 
                        key={series.id} 
                        series={{
                          ...series,
                          backdrop_path: null
                        }} 
                        showCharacter={series.character} 
                      />
                    </Box>
                  </Box>
                ))}
              </Slider>
            </Box>
          ) : (
            <Text color="gray.400" textAlign="center">
              Nenhuma série encontrada para este ator.
            </Text>
          )}
        </Box>
      </Container>
      
      <Footer />
    </Flex>
  );
} 