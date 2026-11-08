import { Box, Button, Flex, Heading, HStack, IconButton, Image, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { getTrendingSeries } from "../../services/tmdb";
import { NAV_HEIGHT } from "../layout/Navbar";
import { yearOf } from "../../utils/score";

interface TrendingSeries {
  id: number;
  name: string;
  backdrop_path: string | null;
  overview: string;
  first_air_date?: string;
  number_of_seasons?: number;
  images?: { logos?: { file_path: string }[] };
}

const ROTATE_MS = 8000;

/** Destaque da home: séries em alta na semana, com fundo, logo e contador. */
export function TrendingBanner() {
  const { data: series = [] } = useQuery({
    queryKey: ["trendingSeries"],
    queryFn: async () =>
      ((await getTrendingSeries(10)) as TrendingSeries[]).filter((s) => s.backdrop_path),
    staleTime: 1000 * 60 * 30,
  });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = series.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (total ? (i + delta + total) % total : 0)),
    [total]
  );

  useEffect(() => {
    if (!total || paused) return;
    const id = setInterval(() => go(1), ROTATE_MS);
    return () => clearInterval(id);
  }, [total, paused, go]);

  if (!total) {
    return <Box h={{ base: "420px", md: "520px" }} mt={`-${NAV_HEIGHT}`} bg="ink.900" />;
  }

  const current = series[index];
  const logo = current.images?.logos?.[0]?.file_path;
  const meta = [
    yearOf(current.first_air_date),
    current.number_of_seasons
      ? `${current.number_of_seasons} ${current.number_of_seasons === 1 ? "temporada" : "temporadas"}`
      : null,
  ].filter(Boolean);

  return (
    <Box
      as="section"
      aria-roledescription="carrossel"
      aria-label="Em alta na semana"
      position="relative"
      mt={`-${NAV_HEIGHT}`}
      h={{ base: "460px", md: "540px" }}
      overflow="hidden"
      bg="ink.950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {series.map((s, i) => (
        <Box
          key={s.id}
          position="absolute"
          inset={0}
          bgImage={`url(https://image.tmdb.org/t/p/w1280${s.backdrop_path})`}
          bgSize="cover"
          bgPosition="center 25%"
          opacity={i === index ? 1 : 0}
          transition="opacity 300ms ease"
          aria-hidden="true"
        />
      ))}
      {/* véu: de baixo e da esquerda, para o texto ficar legível */}
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(to top, #0F0F0E 0%, rgba(15,15,14,0.6) 40%, rgba(15,15,14,0.15) 75%, rgba(15,15,14,0.55) 100%), linear-gradient(to right, rgba(15,15,14,0.85) 0%, rgba(15,15,14,0) 65%)"
      />

      <Flex
        position="relative"
        h="100%"
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 6, lg: 8 }}
        pb={{ base: 8, md: 12 }}
        direction="column"
        justify="flex-end"
      >
        <Text textStyle="label" color="signal.300" mb={3}>
          Em alta na semana · {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </Text>

        <Box maxW="560px" key={current.id}>
          {logo ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${logo}`}
              alt={current.name}
              maxH={{ base: "88px", md: "120px" }}
              maxW={{ base: "260px", md: "360px" }}
              objectFit="contain"
              objectPosition="left bottom"
            />
          ) : (
            <Heading as="h2" size="display">
              {current.name}
            </Heading>
          )}

          {meta.length > 0 && (
            <Text mt={4} fontFamily="mono" fontSize="sm" color="ink.200">
              {meta.join(" · ")}
            </Text>
          )}
          <Text
            mt={2}
            color="ink.200"
            fontSize={{ base: "sm", md: "md" }}
            noOfLines={{ base: 2, md: 3 }}
          >
            {current.overview}
          </Text>
        </Box>

        <Flex mt={6} align="center" justify="space-between" gap={4}>
          <Button as={RouterLink} to={`/series/${current.id}`} size="md">
            Ver série
          </Button>
          <HStack spacing={1}>
            <IconButton
              aria-label="Série anterior"
              icon={<CaretLeft size={18} />}
              variant="ghost"
              size="sm"
              color="ink.200"
              onClick={() => go(-1)}
            />
            <IconButton
              aria-label="Próxima série"
              icon={<CaretRight size={18} />}
              variant="ghost"
              size="sm"
              color="ink.200"
              onClick={() => go(1)}
            />
          </HStack>
        </Flex>

        {/* barra de progresso entre os destaques */}
        <HStack mt={5} spacing={1.5} aria-hidden="true">
          {series.map((s, i) => (
            <Box
              key={s.id}
              h="2px"
              flex={1}
              maxW="40px"
              bg={i === index ? "signal.400" : "whiteAlpha.300"}
              transition="background 200ms ease"
            />
          ))}
        </HStack>
      </Flex>
    </Box>
  );
}
