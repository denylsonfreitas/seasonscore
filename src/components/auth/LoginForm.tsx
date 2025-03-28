import { useState, useEffect, useRef, useCallback } from "react";
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
  Collapse,
  FocusLock,
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
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Referência para o primeiro input
  const initialFocusRef = useRef<HTMLInputElement>(null);
  
  // Focalizar o primeiro input quando o componente montar
  useEffect(() => {
    setTimeout(() => {
      if (initialFocusRef.current) {
        initialFocusRef.current.focus();
      }
    }, 100);
  }, []);

  // Função para criar estilos de animação para itens do formulário
  const getItemAnimationStyle = useCallback((index: number) => ({
    opacity: 1,
    transform: "translateY(0)",
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05 + 0.1}s`,
  }), []);

  // Manipulador de cliques globais para fechar o popover
  useEffect(() => {
    // Função para detectar cliques fora do popover
    const handleGlobalClick = (e: MouseEvent) => {
      // Se houver um clique fora do formulário e onClose for fornecido
      if (onClose && e.target instanceof Node) {
        // Verifica se o clique foi fora do modal
        const loginFormElement = document.querySelector('.login-form-container');
        if (loginFormElement && !loginFormElement.contains(e.target)) {
          // Se o elemento clicado não estiver dentro do container do login form
          onClose();
        }
      }
    };

    // Adiciona o listener depois de um pequeno delay para evitar que
    // o click que abriu o popover o feche imediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 100);

    // Remove o listener ao desmontar o componente
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verificar se o formulário é válido
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      // Se o formulário não for válido, mostrar mensagem e parar
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos corretamente.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
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

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira seu email.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Erro ao enviar email de redefinição:", error);
      let errorMessage = "Não foi possível enviar o email de redefinição.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Email não encontrado.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Endereço de email inválido.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <FocusLock initialFocusRef={initialFocusRef}>
      <Box as="form" onSubmit={handleSubmit} p={4} className="login-form-container">
        <VStack spacing={4} align="stretch">
          <FormControl style={getItemAnimationStyle(0)}>
            <Input
              type="text"
              name="usernameOrEmail"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Email ou nome de usuário"
              bg="gray.700"
              border="none"
              color="white"
              size="md"
              required
              ref={initialFocusRef}
            />
          </FormControl>

          <FormControl style={getItemAnimationStyle(1)}>
            <InputGroup>
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
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
            style={getItemAnimationStyle(2)}
          >
            Entrar
          </Button>

          <Flex justify="center" style={getItemAnimationStyle(3)}>
            <Text color="gray.400" fontSize="sm">
              Não tem uma conta?{" "}
              <Link
                color="primary.300"
                onClick={onSignUpClick}
                _hover={{ textDecoration: "underline" }}
                cursor="pointer"
              >
                Crie uma conta
              </Link>
            </Text>
          </Flex>
          <Flex justify="center" style={getItemAnimationStyle(4)}>
            <Link
              color="primary.300"
              fontSize="sm"
              onClick={() => setShowResetForm(!showResetForm)}
              _hover={{ textDecoration: "underline" }}
              cursor="pointer"
            >
              Esqueci minha senha
            </Link>
          </Flex>

          <Collapse in={showResetForm} animateOpacity>
            <Box mt={2} p={3} bg="gray.700" borderRadius="md" style={getItemAnimationStyle(5)}>
              <VStack spacing={3} align="stretch">
                <Text color="white" fontSize="sm" fontWeight="medium">
                  Redefinir senha
                </Text>
                <FormControl>
                  <Input
                    type="email"
                    name="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Seu email"
                    bg="gray.600"
                    border="none"
                    color="white"
                    size="sm"
                  />
                </FormControl>
                <Button
                  onClick={handleResetPassword}
                  colorScheme="primary"
                  size="sm"
                  isLoading={isResetting}
                >
                  Enviar link de redefinição
                </Button>
              </VStack>
            </Box>
          </Collapse>
        </VStack>
      </Box>
    </FocusLock>
  );
} 