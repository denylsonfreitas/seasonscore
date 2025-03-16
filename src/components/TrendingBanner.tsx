import { Box, Heading, Text, VStack, HStack, IconButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getTrendingSeries } from "../services/tmdb";
import { useNavigate } from "react-router-dom";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface TrendingSeries {
  id: number;
  name: string;
  backdrop_path: string | null;
  overview: string;
}

export function TrendingBanner() {
  const [trendingSeries, setTrendingSeries] = useState<TrendingSeries[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingSeries = async () => {
      const series = await getTrendingSeries();
      setTrendingSeries(series.slice(0, 10));
    };

    fetchTrendingSeries();
  }, []);

  useEffect(() => {
    if (trendingSeries.length === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, 10000);

    return () => clearInterval(interval);
  }, [trendingSeries.length]);

  const handlePrevious = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? trendingSeries.length - 1 : prevIndex - 1
    );
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % trendingSeries.length
    );
    setTimeout(() => setIsTransitioning(false), 500);
  };

  if (!trendingSeries.length) return null;

  const currentSeries = trendingSeries[currentIndex];

  return (
    <Box 
      position="relative" 
      mb={12} 
      width="99.5vw" 
      left="50%" 
      right="50%" 
      marginLeft="-50vw" 
      marginRight="-50vw"
      cursor="pointer"
      onClick={() => navigate(`/series/${currentSeries.id}`)}
      transition="transform 0.3s ease"

    >
      <Box
        h={{ base: "300px", md: "500px" }}
        w="100%"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgImage={`url(https://image.tmdb.org/t/p/original${currentSeries.backdrop_path})`}
          bgSize="cover"
          bgPosition="center"
          transition="all 0.5s ease-in-out"
          opacity={isTransitioning ? 0 : 1}
          transform={isTransitioning ? "scale(1.1)" : "scale(1)"}
          _after={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,

            bg: "linear-gradient(to bottom, rgba(23, 25, 35, 0.5), rgba(23, 25, 35, 1))",
          }}
        />
      </Box>

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={{ base: 4, md: 8 }}
        display="flex"
        justifyContent="center"
        transition="opacity 0.5s ease-in-out"
        opacity={isTransitioning ? 0 : 1}
      >
        <Box maxW="1150px" width="100%">
          <VStack align={{ base: "center", md: "start" }} spacing={3} maxW="600px">
            <Heading 
              color="white" 
              size={{ base: "2xl", md: "3xl" }}
              transition="transform 0.3s ease"
              transform={isTransitioning ? "translateY(20px)" : "translateY(0)"}
            >
              {currentSeries.name}
            </Heading>
            <Text 
              color="gray.200" 
              fontSize={{ base: "md", md: "lg" }} 
              noOfLines={2}
              transition="transform 0.3s ease"
              transform={isTransitioning ? "translateY(20px)" : "translateY(0)"}
            >
              {currentSeries.overview}
            </Text>
            <HStack spacing={4} align="center">
              <IconButton
                icon={<CaretLeft size={20} weight="bold" />}
                aria-label="Anterior"
                colorScheme="whiteAlpha"
                variant="ghost"
                onClick={handlePrevious}
                opacity={0.7}
                _hover={{ opacity: 1, bg: "whiteAlpha.300", transform: "translateX(-2px)" }}
                transition="all 0.2s ease"
                size="sm"
                minW="auto"
                p={2}
              />
              <HStack spacing={2}>
                {trendingSeries.map((_, index) => (
                  <Box
                    key={index}
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={index === currentIndex ? "white" : "whiteAlpha.500"}
                    transition="all 0.3s ease"
                    transform={index === currentIndex ? "scale(1.2)" : "scale(1)"}
                  />
                ))}
              </HStack>
              <IconButton
                icon={<CaretRight size={20} weight="bold" />}
                aria-label="Próximo"
                colorScheme="whiteAlpha"
                variant="ghost"
                onClick={handleNext}
                opacity={0.7}
                _hover={{ opacity: 1, bg: "whiteAlpha.300", transform: "translateX(2px)" }}
                transition="all 0.2s ease"
                size="sm"
                minW="auto"
                p={2}
              />
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
} 