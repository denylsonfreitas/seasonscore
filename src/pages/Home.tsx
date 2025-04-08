import { HomeSeriesSection } from "../components/series/HomeSeriesSection";
import { Box, Container, VStack, Flex, Heading, Text, Button, HStack, Icon, Image, SimpleGrid, useColorModeValue } from "@chakra-ui/react";
import {
  getAiringTodaySeries,
  getTopRatedSeries,
  getPopularSeries
} from "../services/tmdb";
import { Footer } from "../components/common/Footer";
import { TrendingBanner } from "../components/series/TrendingBanner";
import { PopularReviews } from "../components/reviews/PopularReviews";
import { PopularLists } from "../components/lists/PopularLists";
import { PersonalizedRecommendations } from "../components/series/PersonalizedRecommendations";
import { FollowedUsersReviews } from "../components/reviews/FollowedUsersReviews";
import { FollowedUsersLists } from "../components/lists/FollowedUsersLists";
import { useAuth } from "../contexts/AuthContext";
import { useAuthUIStore } from "../services/uiState";
import { ClipboardText, Star, TelevisionSimple, UserCirclePlus } from "@phosphor-icons/react";
import { getGlobalLoginPopover } from "../components/layout/Navbar";

export function Home() {
  const { currentUser } = useAuth();
  const { openRegister } = useAuthUIStore();
  
  const isLoggedIn = !!currentUser;

  // Obter a função global para abrir o popover de login
  const globalOpenLoginPopover = getGlobalLoginPopover();

  return (
    <Flex direction="column" minH="100vh" bg="gray.900">
      <Box flex="1">
        <TrendingBanner />
        
        <Container maxW="container.lg" py={8} pb={16}>
          {isLoggedIn ? (
            // Layout para usuários logados
            <>
          <PersonalizedRecommendations />

          <FollowedUsersReviews />

          <PopularReviews />
          
          <FollowedUsersLists />

          <PopularLists />
            </>
          ) : (
            // Layout para usuários não logados
            <>
              {/* Seção de boas-vindas */}
              <Box 
                bg="gray.800" 
                p={8} 
                borderRadius="lg" 
                mb={12} 
                position="relative"
                overflow="hidden"
                boxShadow="xl"
              >
                <Flex 
                  direction={{ base: "column", md: "row" }} 
                  align={{ base: "center", md: "flex-start" }}
                  justify="space-between"
                  gap={6}
                >
                  <Box maxW={{ base: "100%", md: "60%" }} zIndex={2}>
                    <Heading color="white" size="xl" mb={4}>
                      Acompanhe, avalie e descubra novas séries
                    </Heading>
                    <Text color="gray.300" fontSize="lg" mb={6}>
                      Registre seu progresso, compartilhe suas opiniões e conecte-se com outros fãs de séries.
                    </Text>
                    <HStack spacing={4}>
                      <Button 
                        colorScheme="primary" 
                        size="lg"
                        onClick={openRegister}
                        leftIcon={<Icon as={UserCirclePlus} weight="bold" />}
                      >
                        Criar conta
                      </Button>
                      <Button 
                        variant="outline" 
                        colorScheme="whiteAlpha" 
                        size="lg"
                        onClick={() => {
                          if (globalOpenLoginPopover) {
                            globalOpenLoginPopover();
                          }
                        }}
                      >
                        Entrar
                      </Button>
                    </HStack>
                  </Box>
                  
                  <Box 
                    position={{ base: "relative", md: "absolute" }} 
                    right={{ base: 0, md: "-50px" }} 
                    top={{ base: 0, md: "-30px" }}
                    opacity={{ base: 0.3, md: 0.15 }}
                    transform={{ base: "scale(0.8)", md: "scale(1.2)" }}
                    zIndex={1}
                  >
                    <Icon as={TelevisionSimple} boxSize={64} color="primary.500" weight="duotone" />
                  </Box>
                </Flex>
              </Box>
              
              {/* Recursos principais */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={16}>
                <Box 
                  bg="gray.800" 
                  p={6} 
                  borderRadius="lg" 
                  textAlign="center"
                  _hover={{ transform: "translateY(-5px)" }}
                  transition="all 0.3s"
                >
                  <Icon as={Star} boxSize={12} color="yellow.400" weight="fill" mb={4} />
                  <Heading size="md" color="white" mb={3}>Avalie Séries</Heading>
                  <Text color="gray.400">
                    Dê notas às suas séries favoritas e compartilhe sua opinião com a comunidade.
                  </Text>
                </Box>
                
                <Box 
                  bg="gray.800" 
                  p={6} 
                  borderRadius="lg" 
                  textAlign="center"
                  _hover={{ transform: "translateY(-5px)" }}
                  transition="all 0.3s"
                >
                  <Icon as={ClipboardText} boxSize={12} color="blue.400" weight="fill" mb={4} />
                  <Heading size="md" color="white" mb={3}>Crie Listas</Heading>
                  <Text color="gray.400">
                    Organize suas séries em listas personalizadas e compartilhe com outros usuários.
                  </Text>
                </Box>
                
                <Box 
                  bg="gray.800" 
                  p={6} 
                  borderRadius="lg" 
                  textAlign="center"
                  _hover={{ transform: "translateY(-5px)" }}
                  transition="all 0.3s"
                >
                  <Icon as={UserCirclePlus} boxSize={12} color="green.400" weight="fill" mb={4} />
                  <Heading size="md" color="white" mb={3}>Conecte-se</Heading>
                  <Text color="gray.400">
                    Siga outros usuários e descubra novas séries baseadas em seus gostos.
                  </Text>
                </Box>
              </SimpleGrid>

              <PopularReviews />
              
              <PopularLists />
              
              {/* CTA para registro */}
              <Box 
                bg="primary.900" 
                p={8} 
                borderRadius="lg" 
                mb={12} 
                mt={16}
                position="relative"
                overflow="hidden"
                boxShadow="lg"
                bgGradient="linear(to-r, primary.900, purple.900)"
              >
                <Flex 
                  direction={{ base: "column", md: "row" }} 
                  align="center"
                  justify="space-between"
                  gap={6}
                >
                  <Box maxW={{ base: "100%", md: "70%" }}>
                    <Heading color="white" size="lg" mb={4}>
                      Pronto para melhorar sua experiência?
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="md" mb={6}>
                      Crie uma conta para acessar todos os recursos, receber recomendações personalizadas e conectar-se com outros fãs de séries.
                    </Text>
                  </Box>
                  
                  <Button 
                    colorScheme="whiteAlpha" 
                    size="lg"
                    onClick={openRegister}
                    _hover={{ bg: "white", color: "primary.700" }}
                  >
                    Criar conta grátis
                  </Button>
                </Flex>
              </Box>
            </>
          )}
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}
