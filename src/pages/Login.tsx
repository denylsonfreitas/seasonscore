import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
  Link,
  Divider,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogo } from "@phosphor-icons/react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Email ou senha incorretos.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      const result = await signInWithPopup(auth, provider);

      // Garantir que temos as informações do usuário
      if (result.user) {
        // Se não tiver nome, usar email
        if (!result.user.displayName) {
          await updateProfile(result.user, {
            displayName: result.user.email?.split("@")[0],
          });
        }
      }

      navigate("/");
    } catch (error) {
      console.error("Erro no login com Google:", error);
      toast({
        title: "Erro ao fazer login",
        description:
          "Ocorreu um erro ao fazer login com o Google. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HStack spacing={0} minH="100vh">
      {/* Banner Lateral */}
      <Box
        w="50%"
        h="100vh"
        position="relative"
        display={{ base: "none", lg: "block" }}
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgImage="url(https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg)"
          bgSize="cover"
          bgPosition="center"
          _after={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: "linear-gradient(90deg, rgba(23, 25, 35, 0) 0%, rgba(23, 25, 35, 1) 100%)",
          }}
        />
      </Box>

      {/* Área do Formulário */}
      <Box
        w={{ base: "100%", lg: "50%" }}
        h="100vh"
        bg="gray.900"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="400px">
          <VStack spacing={8} align="stretch">
            <VStack spacing={2} align="center">
              <Heading
                as={RouterLink}
                to="/"
                color="white"
                size="2xl"
                _hover={{ color: "teal.300" }}
                textAlign="center"
              >
                SeasonScore
              </Heading>
              <Text color="gray.400" textAlign="center">
                Avalie suas séries favoritas
              </Text>
            </VStack>

            <VStack spacing={6} bg="gray.800" p={8} borderRadius="lg" boxShadow="xl">
              <Button
                leftIcon={<Icon as={GoogleLogo} weight="bold" />}
                onClick={handleGoogleLogin}
                isLoading={isLoading}
                w="100%"
                size="lg"
                colorScheme="red"
              >
                Entrar com Google
              </Button>

              <HStack w="100%">
                <Divider borderColor="gray.600" />
                <Text color="gray.400" px={4} fontSize="sm">ou</Text>
                <Divider borderColor="gray.600" />
              </HStack>

              <VStack as="form" spacing={4} w="100%" onSubmit={handleSubmit}>
                <FormControl>
                  <FormLabel color="white">Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="gray.700"
                    border="none"
                    color="white"
                    _placeholder={{ color: "gray.400" }}
                    required
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white">Senha</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="gray.700"
                    border="none"
                    color="white"
                    _placeholder={{ color: "gray.400" }}
                    required
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  size="lg"
                  w="100%"
                  isLoading={isLoading}
                  mt={4}
                >
                  Entrar
                </Button>
              </VStack>

              <Text color="gray.300" textAlign="center">
                Não tem uma conta?{" "}
                <Link
                  as={RouterLink}
                  to="/signup"
                  color="teal.300"
                  _hover={{ textDecoration: "underline" }}
                >
                  Criar conta
                </Link>
              </Text>
            </VStack>
          </VStack>
        </Container>
      </Box>
    </HStack>
  );
}
