import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  InputGroup,
  InputRightElement,
  FormErrorMessage,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "../../contexts/AuthContext";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { isUsernameAvailable } from "../../services/users";
import { logError } from "../../utils/logger";
import { getErrorMessage } from "../../utils/errors";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const { signUp } = useAuth();
  const toast = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setUsernameError("");
    setEmailError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

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
      const { needsEmailConfirmation } = await signUp(email, password, username);

      toast({
        title: "Conta criada com sucesso!",
        description: needsEmailConfirmation
          ? "Enviamos um link de confirmação para o seu email. Confirme para entrar."
          : `Bem-vindo ao SeasonScore, ${username}!`,
        status: "success",
        duration: needsEmailConfirmation ? 8000 : 3000,
        isClosable: true,
      });

      resetForm();
      onClose();
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Não foi possível criar sua conta. Tente novamente."
      );
      if (errorMessage.includes("email")) setEmailError(errorMessage);

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
      logError("checkUsername", error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailError("Digite um email válido");
      return;
    }

    // A disponibilidade do email só é conhecida no cadastro (o email não é público)
    setEmailError(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Digite um email válido");
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

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      isCentered
      motionPreset="slideInBottom"
      scrollBehavior="outside"
    >
      <ModalOverlay />
      <ModalContent
        bg="gray.800"
        color="white"
        borderRadius="md"
        maxW={{ base: "95%", md: "500px" }}
      >
        <ModalHeader>Criar uma conta</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} as="form" onSubmit={handleSubmit}>
            <FormControl isInvalid={!!usernameError}>
              <FormLabel color="white">Nome de usuário</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                bg="gray.700"
                border="none"
                color="white"
                placeholder="Digite um nome de usuário"
                required
                isDisabled={isCheckingUsername}
              />
              {usernameError && <FormErrorMessage>{usernameError}</FormErrorMessage>}
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
                placeholder="Digite seu email"
                required
              />
              {emailError && <FormErrorMessage>{emailError}</FormErrorMessage>}
            </FormControl>

            <FormControl>
              <FormLabel color="white">Senha</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="gray.700"
                  border="none"
                  color="white"
                  placeholder="Digite sua senha"
                  required
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    color="gray.400"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <Text fontSize="xs" color="gray.400" mt={1}>
                A senha deve ter pelo menos 6 caracteres
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel color="white">Confirmar Senha</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  bg="gray.700"
                  border="none"
                  color="white"
                  placeholder="Confirme sua senha"
                  required
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    variant="ghost"
                    color="gray.400"
                  >
                    {showConfirmPassword ? "Ocultar" : "Mostrar"}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <GoogleSignInButton label="Criar conta com Google" mode="signup" />
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="white" mr={3} onClick={onClose} variant="ghost" disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            isDisabled={!!usernameError || !!emailError}
            loadingText="Criando conta"
          >
            Criar Conta
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
