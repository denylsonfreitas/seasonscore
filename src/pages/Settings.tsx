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
  Icon,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  updateEmail, 
  updatePassword, 
  deleteUser, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  linkWithPopup,
  unlink,
  OAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ExtendedUser } from "../types/auth";
import { auth } from "../config/firebase";
import { FcGoogle } from "react-icons/fc";
import { isUsernameAvailable, updateUsername } from "../services/users";

export function Settings() {
  const { currentUser, logout } = useAuth() as { currentUser: ExtendedUser | null, logout: () => Promise<void> };
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [email, setEmail] = useState(currentUser?.email || "");
  const [emailSent, setEmailSent] = useState(false);
  
  // Estados para alterar email
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  
  // Estados para alterar senha
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Estados para deletar conta
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const isGoogleAccount = auth.currentUser?.providerData[0]?.providerId === "google.com";
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);

  const isGoogleLinked = auth.currentUser?.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateEmail = async () => {
    if (!auth.currentUser || !emailCurrentPassword) return;

    setIsUpdatingEmail(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        emailCurrentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Enviar email de verificação para o novo endereço
      await verifyBeforeUpdateEmail(auth.currentUser, email);
      
      setEmailSent(true);
      toast({
        title: "Email de verificação enviado",
        description: "Por favor, verifique sua caixa de entrada e clique no link de confirmação.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Limpar campo de senha
      setEmailCurrentPassword("");
    } catch (error) {
      console.error("Erro ao atualizar email:", error);
      toast({
        title: "Erro ao atualizar email",
        description: "Verifique sua senha e tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth.currentUser || !passwordCurrentPassword || newPassword !== confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "Verifique se as senhas coincidem.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        passwordCurrentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Limpar campos
      setPasswordCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      toast({
        title: "Erro ao atualizar senha",
        description: "Verifique sua senha atual e tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !deleteAccountPassword) return;

    setIsDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        deleteAccountPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser);

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída permanentemente.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      navigate("/");
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        title: "Erro ao excluir conta",
        description: "Verifique sua senha e tente novamente.",
        status: "error",
        duration: 3000,
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
    if (!auth.currentUser?.email) return;

    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao enviar email de redefinição:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de redefinição de senha.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;

    setIsLinkingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      
      toast({
        title: "Conta vinculada",
        description: "Sua conta foi vinculada ao Google com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Erro ao vincular conta:", error);
      let errorMessage = "Não foi possível vincular sua conta ao Google. Tente novamente.";
      
      if (error.code === 'auth/credential-already-in-use') {
        errorMessage = "Esta conta do Google já está vinculada a outro usuário.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "O processo foi cancelado. Tente novamente quando quiser.";
      }
      
      toast({
        title: "Erro ao vincular conta",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!auth.currentUser) return;

    setIsUnlinkingGoogle(true);
    try {
      await unlink(auth.currentUser, "google.com");
      
      toast({
        title: "Conta desvinculada",
        description: "Sua conta foi desvinculada do Google com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao desvincular conta:", error);
      toast({
        title: "Erro ao desvincular conta",
        description: "Não foi possível desvincular sua conta do Google. Tente novamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUnlinkingGoogle(false);
    }
  };

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUsernameError("");

    try {
      if (!passwordCurrentPassword) {
        throw new Error("A senha atual é necessária para alterar o nome de usuário");
      }

      if (newUsername.length < 3) {
        throw new Error("O nome de usuário deve ter pelo menos 3 caracteres");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        throw new Error("O nome de usuário pode conter apenas letras, números e underscore");
      }

      // Verificar se o username está disponível
      const isAvailable = await isUsernameAvailable(newUsername.toLowerCase());
      if (!isAvailable) {
        throw new Error("Este nome de usuário já está em uso");
      }

      // Reautenticar usuário
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          passwordCurrentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Atualizar username
      if (currentUser) {
        await updateUsername(currentUser.uid, newUsername.toLowerCase());
        toast({
          title: "Nome de usuário atualizado",
          description: "Seu nome de usuário foi alterado com sucesso.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setNewUsername("");
        setPasswordCurrentPassword("");
      }
    } catch (error: any) {
      setUsernameError(error.message || "Erro ao atualizar nome de usuário");
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nome de usuário",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
        console.error("Erro ao verificar username:", error);
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
    <Box bg="gray.900" minH="100vh" pt="80px">
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading color="white">Configurações</Heading>

          <Box bg="gray.800" p={6} borderRadius="lg">
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="white">Segurança</Heading>

              <FormControl>
                <FormLabel color="white">Alterar Email</FormLabel>
                <VStack spacing={3} align="stretch">
                  {emailSent && (
                    <Alert status="info" bg="blue.800" color="white">
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
                    color="white"
                    border="none"
                    id="email-input"
                  />
                  <InputGroup>
                    <Input
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      placeholder="Senha atual"
                      type={showPassword ? "text" : "password"}
                      bg="gray.700"
                      color="white"
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
                  <Button
                    colorScheme="teal"
                    onClick={handleUpdateEmail}
                    isLoading={isUpdatingEmail}
                  >
                    {emailSent ? "Reenviar Email de Verificação" : "Atualizar Email"}
                  </Button>
                </VStack>
              </FormControl>

              <Divider borderColor="gray.600" />

              <FormControl>
                <FormLabel color="white">
                  {isGoogleAccount ? "Definir Senha" : "Alterar Senha"}
                </FormLabel>
                {isGoogleAccount ? (
                  <VStack spacing={3} align="stretch">
                    <Alert status="info" bg="blue.800" color="white">
                      <AlertIcon />
                      Sua conta foi criada com o Google. Você pode definir uma senha para acessar sua conta diretamente.
                    </Alert>
                    <Button
                      colorScheme="teal"
                      onClick={handleResetPassword}
                    >
                      Enviar Email para Definir Senha
                    </Button>
                  </VStack>
                ) : (
                  <VStack spacing={3} align="stretch">
                    <InputGroup>
                      <Input
                        value={passwordCurrentPassword}
                        onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                        placeholder="Senha atual"
                        type={showCurrentPassword ? "text" : "password"}
                        bg="gray.700"
                        color="white"
                        border="none"
                        id="current-password-change"
                      />
                      <InputRightElement width="4.5rem">
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          variant="ghost"
                          color="gray.400"
                        >
                          {showCurrentPassword ? "Ocultar" : "Mostrar"}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <InputGroup>
                      <Input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nova senha"
                        type={showNewPassword ? "text" : "password"}
                        bg="gray.700"
                        color="white"
                        border="none"
                        id="new-password"
                      />
                      <InputRightElement width="4.5rem">
                        <Button
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          variant="ghost"
                          color="gray.400"
                        >
                          {showNewPassword ? "Ocultar" : "Mostrar"}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <InputGroup>
                      <Input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar nova senha"
                        type={showConfirmPassword ? "text" : "password"}
                        bg="gray.700"
                        color="white"
                        border="none"
                        id="confirm-password"
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
                    <Button
                      colorScheme="teal"
                      onClick={handleUpdatePassword}
                      isLoading={isUpdatingPassword}
                    >
                      Atualizar Senha
                    </Button>
                  </VStack>
                )}
              </FormControl>

              <Divider borderColor="gray.600" />

              <FormControl>
                <FormLabel color="white">Conta Google</FormLabel>
                <VStack spacing={3} align="stretch">
                  {isGoogleLinked ? (
                    <>
                      <Alert status="info" bg="blue.800" color="white">
                        <AlertIcon />
                        Sua conta está vinculada ao Google
                      </Alert>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        onClick={handleUnlinkGoogle}
                        isLoading={isUnlinkingGoogle}
                      >
                        Desvincular do Google
                      </Button>
                    </>
                  ) : (
                    <>
                      <Alert status="info" bg="blue.800" color="white">
                        <AlertIcon />
                        Vincule sua conta ao Google para fazer login mais facilmente
                      </Alert>
                      <Button
                        leftIcon={<Icon as={FcGoogle} />}
                        onClick={handleLinkGoogle}
                        isLoading={isLinkingGoogle}
                        colorScheme="red"
                      >
                        Vincular ao Google
                      </Button>
                    </>
                  )}
                </VStack>
              </FormControl>

              <Divider borderColor="gray.600" />

              <Box>
                <Heading size="md" color="white" mb={4}>Encerrar Conta</Heading>
                <Text color="gray.400" mb={4}>
                  Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.
                </Text>
                <Button
                  colorScheme="red"
                  onClick={onOpen}
                >
                  Excluir Conta
                </Button>
              </Box>
            </VStack>
          </Box>

          <Box bg="gray.800" p={6} borderRadius="lg">
            <VStack spacing={4} as="form" onSubmit={handleUsernameChange}>
              <Heading size="md" color="white">Alterar nome de usuário</Heading>
              <FormControl isInvalid={!!usernameError}>
                <FormLabel color="white">Novo nome de usuário</FormLabel>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Novo nome de usuário"
                  bg="gray.700"
                  color="white"
                  _placeholder={{ color: "gray.400" }}
                />
                <FormErrorMessage>{usernameError}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Senha atual</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordCurrentPassword}
                    onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    bg="gray.700"
                    color="white"
                    _placeholder={{ color: "gray.400" }}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      bg="gray.600"
                      _hover={{ bg: "gray.500" }}
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading || isCheckingUsername}
                loadingText="Alterando..."
                w="100%"
              >
                Alterar nome de usuário
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleCloseDeleteModal}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800">
            <AlertDialogHeader color="white">
              Excluir Conta
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text color="gray.300" mb={4}>
                Tem certeza? Esta ação não pode ser desfeita.
              </Text>
              <InputGroup>
                <Input
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  placeholder="Digite sua senha para confirmar"
                  type={showDeletePassword ? "text" : "password"}
                  bg="gray.700"
                  color="white"
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
