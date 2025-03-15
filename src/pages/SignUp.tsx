import { useState, useEffect } from "react";
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
  FormErrorMessage,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogo, Eye, EyeSlash } from "@phosphor-icons/react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { isUsernameAvailable, createOrUpdateUser, isEmailAvailable } from "../services/users";

export function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const { signUp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro na senha",
        description: "As senhas não coincidem.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!username) {
      toast({
        title: "Nome de usuário obrigatório",
        description: "Por favor, escolha um nome de usuário.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (usernameError || emailError) {
      toast({
        title: "Erro na validação",
        description: "Por favor, corrija os erros antes de continuar.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, username);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao SeasonScore!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      let errorMessage = "Não foi possível criar sua conta. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este email já está em uso. Se você já tem uma conta com este email, faça login.";
        setEmailError(errorMessage);
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email inválido. Verifique o formato do email.";
        setEmailError(errorMessage);
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Senha muito fraca. Use uma senha mais forte.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error.message) {
        // Usar a mensagem de erro personalizada
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
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
      await loginWithGoogle();
      navigate("/");
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      let errorMessage = "Ocorreu um erro ao criar conta com o Google. Tente novamente.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "O popup de login foi fechado. Tente novamente.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "A solicitação de login foi cancelada. Tente novamente.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "O popup de login foi bloqueado pelo navegador. Verifique suas configurações.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Já existe uma conta com este email usando outro método de login. Tente entrar com email e senha.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameError("O nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("O nome de usuário pode conter apenas letras, números e underscore");
      return;
    }

    setIsCheckingUsername(true);
    try {
      const isAvailable = await isUsernameAvailable(username.toLowerCase());
      if (!isAvailable) {
        setUsernameError("Este nome de usuário já está em uso");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Erro ao verificar username:", error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailError("Digite um email válido");
      return;
    }

    setIsCheckingEmail(true);
    try {
      const isAvailable = await isEmailAvailable(email.toLowerCase());
      if (!isAvailable) {
        setEmailError("Este email já está em uso");
      } else {
        setEmailError("");
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (username) {
        checkUsername(username);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [username]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (email) {
        checkEmail(email);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [email]);

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
          bgImage="url(https://image.tmdb.org/t/p/original/9GvhICFMiRQA82vS6ydkXxeEkrd.jpg)"
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
          bgImage="url(https://image.tmdb.org/t/p/original/9GvhICFMiRQA82vS6ydkXxeEkrd.jpg)"
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
                Continuar com Google
              </Button>

              <HStack w="100%">
                <Divider borderColor="gray.600" />
                <Text color="gray.400" px={4} fontSize="sm">ou</Text>
                <Divider borderColor="gray.600" />
              </HStack>

              <VStack as="form" spacing={4} w="100%" onSubmit={handleSubmit}>
                <FormControl isInvalid={!!usernameError}>
                  <FormLabel color="white">Nome de usuário</FormLabel>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    bg="gray.700"
                    border="none"
                    color="white"
                    size={{ base: "md", lg: "lg" }}
                    required
                    isDisabled={isCheckingUsername}
                  />
                  <FormErrorMessage>{usernameError}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!emailError}>
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
                    isDisabled={isCheckingEmail}
                  />
                  <FormErrorMessage>{emailError}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel color="white">Senha</FormLabel>
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

                <FormControl>
                  <FormLabel color="white">Confirmar Senha</FormLabel>
                  <InputGroup size={{ base: "md", lg: "lg" }}>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        color="gray.400"
                        _hover={{ color: "white" }}
                      >
                        {showConfirmPassword ? "Ocultar" : "Mostrar"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  size={{ base: "md", lg: "lg" }}
                  w="100%"
                  isLoading={isLoading || isCheckingUsername}
                >
                  Criar Conta
                </Button>
              </VStack>

              <Text 
                color="gray.300" 
                textAlign="center"
                fontSize={{ base: "sm", lg: "md" }}
              >
                Já tem uma conta?{" "}
                <Link
                  as={RouterLink}
                  to="/login"
                  color="teal.300"
                  _hover={{ textDecoration: "underline" }}
                >
                  Entrar
                </Link>
              </Text>
            </VStack>
          </VStack>
        </Container>
      </Box>
    </HStack>
  );
}
