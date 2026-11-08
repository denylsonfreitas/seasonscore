import React from "react";
import { VStack, Box, Text, Avatar, Flex, Image, LinkBox, LinkOverlay } from "@chakra-ui/react";
import { Carousel } from "../../common/Carousel";
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
  };
}

export function SeriesCastTab({ series }: SeriesCastTabProps) {
  // Verificar se credits e cast existem para evitar erros
  const cast = series?.credits?.cast || [];
  if (!cast || cast.length === 0) {
    return (
      <Text color="ink.400" textAlign="center">
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
        <Box pb={4}>
          <Carousel preset="cast" gap={4} label="Elenco">
            {sortedCast.map((actor) => (
              <Box key={actor.id}>
                <Flex as={LinkBox} direction="column" height="100%" role="group" cursor="pointer">
                  <Box
                    position="relative"
                    width="100%"
                    paddingTop="125%"
                    borderRadius="md"
                    overflow="hidden"
                    bg="ink.850"
                    transition="box-shadow 120ms ease"
                    _groupHover={{ boxShadow: "0 0 0 1px var(--chakra-colors-signal-400)" }}
                  >
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        position="absolute"
                        top={0}
                        left={0}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                      />
                    ) : (
                      <Flex
                        position="absolute"
                        top={0}
                        left={0}
                        width="100%"
                        height="100%"
                        bg="ink.850"
                        align="center"
                        justify="center"
                      >
                        <Avatar size="xl" name={actor.name} />
                      </Flex>
                    )}
                  </Box>
                  <Box pt={2}>
                    <LinkOverlay as={RouterLink} to={`/actor/${actor.id}`}>
                      <Text fontWeight={500} color="ink.100" fontSize="sm" noOfLines={1}>
                        {actor.name}
                      </Text>
                    </LinkOverlay>
                    <Text color="ink.400" fontSize="xs" noOfLines={1}>
                      {actor.character || "Papel não informado"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ))}
          </Carousel>
        </Box>
      </Box>
    </VStack>
  );
}
