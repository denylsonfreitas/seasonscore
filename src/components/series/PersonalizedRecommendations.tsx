import {
  Box,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  Flex,
  Spinner,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { Lightning, Question } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPersonalizedRecommendations, RecommendedSeries } from "../../services/recommendations";
import { SeriesCard } from "./SeriesCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export function PersonalizedRecommendations() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: recommendations = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ["personalized-recommendations", currentUser?.uid],
    queryFn: () => getPersonalizedRecommendations(currentUser?.uid || ""),
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Forçar recarregamento das recomendações se estiverem vazias
  useEffect(() => {
    if (currentUser && recommendations.length === 0 && !isLoading && !isError) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["personalized-recommendations", currentUser?.uid]
        });
        refetch();
      }, 3000); // Esperar 3 segundos
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, recommendations, isLoading, isError, queryClient, refetch]);

  if (!currentUser) {
    return (
      <Box mb={12}>
        <HStack spacing={2} mb={6}>
          <Heading color="white" size="lg">Recomendações para Você</Heading>
          <Tooltip 
            label="Faça login para ver recomendações personalizadas baseadas nas suas avaliações e watchlist"
            placement="top"
          >
            <Box><Icon as={Question} color="gray.400" boxSize={5} /></Box>
          </Tooltip>
        </HStack>
        <Box 
          bg="gray.800" 
          p={6} 
          borderRadius="lg" 
          textAlign="center"
        >
          <Text color="gray.400">
            Faça login para ver recomendações personalizadas baseadas no seu perfil de preferências.
          </Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box mb={12}>
        <Heading color="white" size="lg" mb={6}>
          Recomendações para Você
        </Heading>
        <Flex justify="center" py={8}>
          <Spinner size="xl" color="primary.500" />
        </Flex>
      </Box>
    );
  }

  if (isError || recommendations.length === 0) {
    return (
      <Box mb={12}>
        <Heading color="white" size="lg" mb={6}>
          Recomendações para Você
        </Heading>
        <Box 
          bg="gray.800" 
          p={6} 
          borderRadius="lg" 
          textAlign="center"
        >
          <Text color="gray.400">
            {isError 
              ? "Ocorreu um erro ao buscar suas recomendações. Tente novamente mais tarde."
              : "Estamos preparando suas recomendações com base nas suas avaliações."}
          </Text>
        </Box>
      </Box>
    );
  }

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 3,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <Box >
      <HStack spacing={2} mb={6}>
        <Heading color="white" size="md">Recomendações para Você</Heading>
        <Tooltip 
          label="Recomendações personalizadas baseadas nas suas avaliações e watchlist"
          placement="top"
        >
          <Box><Icon as={Question} color="gray.400" boxSize={5} /></Box>
        </Tooltip>
      </HStack>

      <Box 
        sx={{
          ".slick-prev, .slick-next": {
            zIndex: 1,
            color: "white",
            "&:before": {
              fontSize: "24px"
            }
          },
          ".slick-prev": {
            left: "-10px"
          },
          ".slick-next": {
            right: "-10px"
          },
          ".slick-track": {
            display: "flex",
            paddingTop: "8px",
            paddingBottom: "8px"
          },
          ".slick-slide": {
            padding: "0 4px",
            "& > div": {
              height: "100%"
            }
          },
          ".slick-list": {
            margin: "0 -4px"
          },
          ".slick-dots": {
            bottom: "-30px",
            "li button:before": {
              color: "gray.600",
            },
            "li.slick-active button:before": {
              color: "primary.500",
            }
          }
        }}
        pb={8}
      >
        <Slider {...sliderSettings}>
          {recommendations.map((series) => (
            <Box key={series.id}>
              <SeriesCard series={series} />
            </Box>
          ))}
        </Slider>
      </Box>
    </Box>
  );
} 