import { Button, useToast } from "@chakra-ui/react";
import { GoogleLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errors";

/** Botão de login com Google (redireciona para o Google e volta ao app). */
export function GoogleSignInButton({ label = "Entrar com Google" }: { label?: string }) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      toast({
        title: "Não foi possível entrar com o Google",
        description: getErrorMessage(error),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      w="100%"
      variant="outline"
      colorScheme="whiteAlpha"
      color="white"
      leftIcon={<GoogleLogo weight="bold" />}
      onClick={handleClick}
      isLoading={isLoading}
    >
      {label}
    </Button>
  );
}
