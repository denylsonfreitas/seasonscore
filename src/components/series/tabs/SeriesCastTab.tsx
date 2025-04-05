import React, { useState } from "react";
import {
  VStack,
  Box,
  SimpleGrid,
  Text,
  Button,
  Avatar,
} from "@chakra-ui/react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
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
  const [showAllCast, setShowAllCast] = useState(false);
  const cast = series.credits?.cast || [];
  const displayedCast = showAllCast ? cast : cast.slice(0, 6);

  if (!cast || cast.length === 0) {
    return (
      <Text color="gray.400" textAlign="center">
        Não há informações disponíveis sobre o elenco.
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={8}>
      <SimpleGrid 
        columns={{ base: 1, sm: 2, md: 3 }} 
        spacing={4}
      >
        {displayedCast.map((actor) => (
          <Box
            key={actor.id}
            bg="gray.800"
            p={4}
            borderRadius="lg"
            display="flex"
            alignItems="center"
            gap={4}
          >
            <Avatar
              size="sm"
              name={actor.name}
              src={
                actor.profile_path
                  ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                  : undefined
              }
            />
            <Box>
              <Text color="white" fontWeight="bold" fontSize="sm">
                {actor.name}
              </Text>
              <Text color="gray.400" fontSize="sm">
                {actor.character}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
      {cast.length > 6 && (
        <Button
          variant="ghost"
          color="primary.500"
          onClick={() => setShowAllCast(!showAllCast)}
          rightIcon={showAllCast ? <CaretUp /> : <CaretDown />}
          alignSelf="center"
        >
          {showAllCast ? "Ver menos" : `Ver mais (${cast.length - 6} atores)`}
        </Button>
      )}
    </VStack>
  );
} 