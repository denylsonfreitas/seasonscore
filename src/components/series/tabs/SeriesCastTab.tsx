import React from "react";
import {
  VStack,
  Box,
  Text,
  Avatar,
  Flex,
  Heading,
  Image,
  useColorModeValue,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { castCarouselStyles, castSliderSettings } from "../../../styles/carouselStyles";
import { Link as RouterLink } from "react-router-dom";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
}

interface SeriesCastTabProps {
  series: {
    credits?: {
      cast?: CastMember[];
    };
    [key: string]: any;
  };
}

export function SeriesCastTab({ series }: SeriesCastTabProps) {
  // Verificar se credits e cast existem para evitar erros
  const cast = series?.credits?.cast || [];
  const highlightBg = useColorModeValue("primary.500", "primary.400");

  if (!cast || cast.length === 0) {
    return (
      <Text color="gray.400" textAlign="center">
        Não há informações disponíveis sobre o elenco.
      </Text>
    );
  }

  // Ordenar o elenco por order (se disponível) ou manter a ordem original
  const sortedCast = [...cast].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Heading size="md" color="white" mb={4}>
          Elenco
        </Heading>
        <Box sx={castCarouselStyles} pb={4}>
          <Slider {...castSliderSettings}>
            {sortedCast.map((actor) => (
              <Box key={actor.id} p={1}>
                <Flex
                  as={LinkBox}
                  direction="column"
                  bg="gray.800"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="sm"
                  height="100%"
                  transition="transform 0.2s, box-shadow 0.2s"
                  _hover={{ 
                    transform: "translateY(-4px)", 
                    boxShadow: "lg",
                    bg: "gray.750" 
                  }}
                  cursor="pointer"
                >
                  <Box position="relative" width="100%" paddingTop="100%">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${actor.profile_path}`}
                        alt={actor.name}
                        position="absolute"
                        top={0}
                        left={0}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                        fallbackSrc="https://placehold.co/300x300/222222/FFFFFF?text=Sem+Imagem"
                      />
                    ) : (
                      <Flex 
                        position="absolute"
                        top={0}
                        left={0}
                        width="100%"
                        height="100%"
                        bg="gray.700" 
                        align="center" 
                        justify="center"
                      >
                        <Avatar size="xl" name={actor.name} />
                      </Flex>
                    )}
                  </Box>
                  <Box p={2}>
                    <LinkOverlay as={RouterLink} to={`/actor/${actor.id}`}>
                      <Text fontWeight="bold" color="white" fontSize="sm" noOfLines={1}>
                        {actor.name}
                      </Text>
                    </LinkOverlay>
                    <Text color="gray.400" fontSize="xs" noOfLines={1}>
                      {actor.character || "Papel não informado"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ))}
          </Slider>
        </Box>
      </Box>
    </VStack>
  );
} 