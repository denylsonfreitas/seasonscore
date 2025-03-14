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
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogo, Eye, EyeSlash } from "@phosphor-icons/react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { createOrUpdateUser, isUsernameAvailable } from "../services/users";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Digite seu email",
        description: "Digite seu email para receber o link de recuperação de senha.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao enviar email de recuperação:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de recuperação. Verifique se o email está correto.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsResettingPassword(false);
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

        // Gerar username base do displayName ou email
        const baseUsername = (result.user.displayName || result.user.email?.split("@")[0] || "user").toLowerCase()
          .replace(/[^a-z0-9]/g, ""); // Remove caracteres especiais

        // Tentar encontrar um username único
        let username = baseUsername;
        let counter = 1;
        while (!(await isUsernameAvailable(username))) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Criar ou atualizar usuário com o username gerado
        await createOrUpdateUser(result.user, {
          username: username,
          displayName: result.user.displayName || result.user.email?.split("@")[0],
        });
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
        minH="100vh"
        h="100%"
        position="fixed"
        left={0}
        top={0}
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
        minH="100vh"
        bg="gray.900"
        position="relative"
        ml={{ base: 0, lg: "50%" }}
      >
        {/* Background Image para telas menores */}
        <Box
          display={{ base: "block", lg: "none" }}
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="30vh"
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
            bg: "linear-gradient(180deg, rgba(23, 25, 35, 0.5) 0%, rgba(23, 25, 35, 1) 100%)",
          }}
        />

        {/* Conteúdo do Formulário */}
        <Container 
          maxW="400px" 
          py={{ base: "20vh", lg: 8 }}
          px={{ base: 4, lg: 8 }}
          position="relative"
          display="flex"
          flexDir="column"
          justifyContent="center"
          minH="100vh"
        >
          <VStack spacing={{ base: 6, lg: 8 }} align="stretch">
            <VStack spacing={2} align="center">
              <Heading
                as={RouterLink}
                to="/"
                color="white"
                size={{ base: "xl", lg: "2xl" }}
                _hover={{ color: "teal.300" }}
                textAlign="center"
              >
                SeasonScore
              </Heading>
              <Text 
                color="gray.400" 
                textAlign="center"
                fontSize={{ base: "sm", lg: "md" }}
              >
                Avalie suas séries favoritas
              </Text>
            </VStack>

            <VStack 
              spacing={6} 
              bg="gray.800" 
              p={{ base: 6, lg: 8 }} 
              borderRadius="lg" 
              boxShadow="xl"
            >
              <Button
                leftIcon={<Icon as={GoogleLogo} weight="bold" />}
                onClick={handleGoogleLogin}
                isLoading={isLoading}
                w="100%"
                size={{ base: "md", lg: "lg" }}
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
                    size={{ base: "md", lg: "lg" }}
                    _placeholder={{ color: "gray.400" }}
                    required
                  />
                </FormControl>

                <FormControl>
                  <HStack justify="space-between" w="100%" mb={1}>
                    <FormLabel color="white" mb={0}>Senha</FormLabel>
                    <Button
                      variant="link"
                      color="teal.300"
                      size="sm"
                      onClick={handleForgotPassword}
                      isLoading={isResettingPassword}
                      fontSize="sm"
                      fontWeight="normal"
                      height="auto"
                      p={0}
                    >
                      Esqueceu sua senha?
                    </Button>
                  </HStack>
                  <InputGroup size={{ base: "md", lg: "lg" }}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      bg="gray.700"
                      border="none"
                      color="white"
                      _placeholder={{ color: "gray.400" }}
                      required
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        color="gray.400"
                        _hover={{ color: "white" }}
                      >
                        {showPassword ? "Ocultar" : "Mostrar"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  size={{ base: "md", lg: "lg" }}
                  w="100%"
                  isLoading={isLoading}
                >
                  Entrar
                </Button>
              </VStack>

              <VStack spacing={4} w="100%">
                <Text 
                  color="gray.300" 
                  textAlign="center"
                  fontSize={{ base: "sm", lg: "md" }}
                >
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
          </VStack>
        </Container>
      </Box>
    </HStack>
  );
}
