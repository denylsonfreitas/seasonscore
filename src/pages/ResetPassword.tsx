import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../utils/errors";

/**
 * Destino do link "esqueci minha senha": o Supabase abre uma sessão de recuperação
 * e aqui o usuário define a nova senha.
 */
export function ResetPassword() {
  const { currentUser, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const mismatch = confirmation.length > 0 && password !== confirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6 || mismatch) return;
    setIsSaving(true);
    try {
      await updatePassword(password);
      toast({ title: "Senha alterada com sucesso", status: "success", duration: 3000 });
      navigate("/");
    } catch (error) {
      toast({
        title: "Não foi possível alterar a senha",
        description: getErrorMessage(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box bg="gray.900" minH="100vh" pt="100px">
      <Container maxW="sm">
        <VStack as="form" onSubmit={handleSubmit} spacing={5} align="stretch">
          <Heading size="lg" color="white">
            Definir nova senha
          </Heading>
          {!currentUser ? (
            <Text color="gray.400">
              Abra esta página pelo link enviado ao seu email. Se o link expirou, peça um novo em
              &ldquo;Esqueci minha senha&rdquo;.
            </Text>
          ) : (
            <>
              <FormControl isInvalid={password.length > 0 && password.length < 6}>
                <FormLabel color="white">Nova senha</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="gray.700"
                  border="none"
                  color="white"
                  autoComplete="new-password"
                />
                <FormErrorMessage>A senha deve ter pelo menos 6 caracteres.</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={mismatch}>
                <FormLabel color="white">Confirme a nova senha</FormLabel>
                <Input
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  bg="gray.700"
                  border="none"
                  color="white"
                  autoComplete="new-password"
                />
                <FormErrorMessage>As senhas não coincidem.</FormErrorMessage>
              </FormControl>
              <Button
                type="submit"
                colorScheme="primary"
                isLoading={isSaving}
                isDisabled={password.length < 6 || password !== confirmation}
              >
                Salvar nova senha
              </Button>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
