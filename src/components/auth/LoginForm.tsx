import { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
  Box,
  Flex,
  Text,
  Link,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { X } from "@phosphor-icons/react";

interface LoginFormProps {
  onSignUpClick: () => void;
  onClose?: () => void;
}

export function LoginForm({ onSignUpClick, onClose }: LoginFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(usernameOrEmail, password);
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      let errorMessage = "Email/nome de usuário ou senha incorretos.";
      
      if (error.code === 'auth/user-not-found' || error.message.includes("Usuário não encontrado")) {
        errorMessage = "Usuário não encontrado. Verifique seu nome de usuário ou email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Senha incorreta. Tente novamente.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Credenciais inválidas. Verifique seu nome de usuário ou email e senha.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <Input
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Email ou nome de usuário"
            bg="gray.700"
            border="none"
            color="white"
            size="md"
            required
          />
        </FormControl>

        <FormControl>
          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              bg="gray.700"
              border="none"
              color="white"
              size="md"
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
          colorScheme="primary"
          size="md"
          w="100%"
          isLoading={isLoading}
        >
          Entrar
        </Button>

        <Flex justify="center">
          <Text color="gray.400" fontSize="sm">
            Não tem uma conta?{" "}
            <Link
              color="primary.300"
              onClick={onSignUpClick}
              _hover={{ textDecoration: "underline" }}
              cursor="pointer"
            >
              Cadastre-se
            </Link>
          </Text>
        </Flex>
      </VStack>
    </Box>
  );
} 