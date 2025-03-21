import {
  VStack,
  Box,
  SimpleGrid,
  Text,
  Avatar,
  Button,
} from "@chakra-ui/react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { useState } from "react";

interface SeriesCastTabProps {
  series: any; // O tipo completo seria melhor
}

export function SeriesCastTab({ series }: SeriesCastTabProps) {
  const [showAllCast, setShowAllCast] = useState(false);

  const cast = series.credits?.cast || [];

  if (!cast || cast.length === 0) {
    return (
      <Text color="gray.400" textAlign="center">
        Não há informações disponíveis sobre o elenco.
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
        {cast
          .slice(0, showAllCast ? undefined : 6)
          .map((actor: any) => (
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
                size="md"
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
          color="teal.400"
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