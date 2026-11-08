import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  InputGroup,
  InputRightElement,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { isUsernameAvailable, deleteCurrentUserAccount } from "../services/users";
import { logError } from "../utils/logger";
import { getErrorMessage } from "../utils/errors";

export function Settings() {
  const { currentUser, resetPassword } = useAuth();
  // Contas criadas só com Google não têm senha para confirmar
  const hasPassword = currentUser?.providers.includes("email") ?? false;

  /** Confirma a senha atual entrando novamente com ela. */
  const verifyPassword = async (password: string) => {
    if (!hasPassword) return;
    if (!currentUser?.email || !password) throw new Error("Informe sua senha atual.");
    const { error } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password,
    });
    if (error) throw new Error("Senha incorreta. Por favor, verifique e tente novamente.");
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [email, setEmail] = useState(currentUser?.email || "");
  const [emailSent, setEmailSent] = useState(false);

  // Estados para alterar email
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Estados para alterar senha
  // Estados para deletar conta
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const [newUsername] = useState("");
  const [, setUsernameError] = useState("");
  const [, setIsCheckingUsername] = useState(false);
  const handleUpdateEmail = async () => {
    if (!currentUser || (hasPassword && !emailCurrentPassword)) return;

    setIsUpdatingEmail(true);
    try {
      await verifyPassword(emailCurrentPassword);

      // O Supabase envia um link de confirmação para o novo endereço
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email de verificação enviado",
        description: "Por favor, verifique sua caixa de entrada e clique no link de confirmação.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setEmailCurrentPassword("");
    } catch (error) {
      toast({
        title: "Erro ao atualizar email",
        description: getErrorMessage(error, "Verifique sua senha e tente novamente."),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      if (!currentUser) {
        throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
      }
      if (hasPassword && !deleteAccountPassword) {
        throw new Error("Por favor, insira sua senha para confirmar a exclusão da conta.");
      }

      await verifyPassword(deleteAccountPassword);
      await deleteCurrentUserAccount(currentUser.uid);

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída e seus dados foram removidos do sistema.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      navigate("/");
    } catch (error) {
      logError("handleDeleteAccount", error);
      toast({
        title: "Erro ao excluir conta",
        description: getErrorMessage(
          error,
          "Ocorreu um erro ao excluir sua conta. Por favor, tente novamente mais tarde."
        ),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingAccount(false);
      onClose();
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteAccountPassword("");
    setShowDeletePassword(false);
    onClose();
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;

    try {
      await resetPassword(currentUser.email);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar email",
        description: getErrorMessage(error, "Não foi possível enviar o email de redefinição."),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const checkUsername = async (username: string) => {
    if (username.length >= 3) {
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
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (newUsername) {
        checkUsername(newUsername);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [newUsername]);

  return (
    <Box>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="h1">
            Configurações
          </Heading>
          <Box bg="gray.800" p={6} borderRadius="lg">
            <VStack spacing={6} align="stretch">
              <Heading as="h2" size="h2">
                Segurança
              </Heading>
              <FormControl>
                <FormLabel htmlFor="email-input">Alterar email</FormLabel>
                <VStack spacing={3} align="stretch">
                  {emailSent && (
                    <Alert
                      status="info"
                      bg="ink.850"
                      color="ink.100"
                      borderLeft="2px solid"
                      borderColor="signal.400"
                      borderRadius="md"
                    >
                      <AlertIcon />
                      Email de verificação enviado. Por favor, verifique sua caixa de entrada.
                    </Alert>
                  )}
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Novo email"
                    type="email"
                    bg="gray.700"

                    border="none"
                    id="email-input"
                  />
                  <InputGroup display={hasPassword ? undefined : "none"}>
                    <Input
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      placeholder="Senha atual"
                      type={showPassword ? "text" : "password"}
                      bg="gray.700"

                      border="none"
                      id="current-password-email"
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
                  <Button variant="outline" onClick={handleUpdateEmail} isLoading={isUpdatingEmail}>
                    {emailSent ? "Reenviar email de verificação" : "Atualizar email"}
                  </Button>
                </VStack>
              </FormControl>

              <Divider borderColor="gray.600" />

              <FormControl>
                <FormLabel htmlFor="reset-password-button">Alterar senha</FormLabel>
                <VStack spacing={3} align="stretch">
                  <Alert
                    status="info"
                    bg="ink.850"
                    color="ink.100"
                    borderLeft="2px solid"
                    borderColor="signal.400"
                    borderRadius="md"
                  >
                    <AlertIcon />
                    Por questões de segurança, você receberá um email para alterar sua senha.
                  </Alert>
                  <Button
                    id="reset-password-button"
                    variant="outline"
                    onClick={handleResetPassword}
                    width="full"
                  >
                    Enviar email para alterar a senha
                  </Button>
                </VStack>
              </FormControl>

              <Divider borderColor="gray.600" />

              <Box>
                <Heading as="h2" size="h2" mb={4}>
                  Encerrar conta
                </Heading>
                <Text color="gray.400" mb={4}>
                  Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.
                </Text>
                <Button
                  variant="outline"
                  color="danger"
                  borderColor="rgba(229,83,75,0.4)"
                  _hover={{ bg: "rgba(229,83,75,0.08)" }}
                  onClick={onOpen}
                >
                  Excluir conta
                </Button>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={handleCloseDeleteModal}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Excluir conta</AlertDialogHeader>

            <AlertDialogBody>
              <Text color="gray.300" mb={4}>
                Tem certeza? Esta ação não pode ser desfeita.
              </Text>
              <FormControl display={hasPassword ? undefined : "none"}>
                <FormLabel htmlFor="delete-account-password" mb={2}>
                  Digite sua senha para confirmar:
                </FormLabel>
                <InputGroup>
                  <Input
                    value={deleteAccountPassword}
                    onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    placeholder="Digite sua senha para confirmar"
                    type={showDeletePassword ? "text" : "password"}
                    bg="gray.700"

                    border="none"
                    id="delete-account-password"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      variant="ghost"
                      color="gray.400"
                    >
                      {showDeletePassword ? "Ocultar" : "Mostrar"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleCloseDeleteModal}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                isLoading={isDeletingAccount}
                ml={3}
              >
                Excluir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
