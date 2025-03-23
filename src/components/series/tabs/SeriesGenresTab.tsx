import React from 'react';
import {
  VStack,
  Box,
  Heading,
  Text,
  Wrap,
  WrapItem,
  Badge,
  Card,
  CardBody,
  HStack,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

interface Genre {
  id: number;
  name: string;
}

interface SeriesGenresTabProps {
  series: {
    genres?: Genre[];
    [key: string]: any;
  };
}

export function SeriesGenresTab({ series }: SeriesGenresTabProps) {
  const navigate = useNavigate();
  
  const handleGenreClick = (genreId: number, genreName: string) => {
    navigate(`/series?genre=${genreId}&name=${encodeURIComponent(genreName)}`);
  };

  if (!series.genres || series.genres.length === 0) {
    return (
      <Box py={4}>
        <Text color="gray.400" textAlign="center">
          Não há informações sobre gêneros para esta série.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="md" color="white" mb={4}>
          Gêneros
        </Heading>
        
        <Wrap spacing={4}>
          {series.genres.map((genre: Genre) => (
            <WrapItem key={genre.id}>
              <Card 
                bg="gray.800" 
                variant="filled" 
                borderRadius="md"
                _hover={{ 
                  transform: "translateY(-4px)", 
                  transition: "all 0.3s ease",
                  bg: "gray.700",
                  cursor: "pointer",
                }}
                onClick={() => handleGenreClick(genre.id, genre.name)}
              >
                <CardBody>
                  <VStack spacing={2} align="center">
                    <Badge colorScheme="primary" fontSize="md" p={2}>
                      {genre.name}
                    </Badge>
                    <Divider borderColor="gray.600" />
                    <Text color="primary.300" fontSize="xs">
                      Ver todas as séries
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    </VStack>
  );
} 