import { Box, Button, Spinner, useToast } from "@chakra-ui/react";
import { GoogleLogo } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errors";
import { createNonce, loadGoogleIdentity } from "../../utils/googleIdentity";
import { logError } from "../../utils/logger";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface GoogleSignInButtonProps {
  label?: string;
  /** "signup" mostra "Inscrever-se com o Google" no botão oficial. */
  mode?: "signin" | "signup";
}

/**
 * Login com Google. Com VITE_GOOGLE_CLIENT_ID configurada, usa o botão oficial
 * do Google na própria página (a tela do Google mostra o domínio do site).
 * Sem ela, cai no fluxo de redirecionamento pelo Supabase.
 */
export function GoogleSignInButton({
  label = "Entrar com Google",
  mode = "signin",
}: GoogleSignInButtonProps) {
  if (GOOGLE_CLIENT_ID) {
    return <GoogleIdentityButton clientId={GOOGLE_CLIENT_ID} mode={mode} />;
  }
  return <GoogleRedirectButton label={label} />;
}

function GoogleIdentityButton({ clientId, mode }: { clientId: string; mode: "signin" | "signup" }) {
  const { loginWithGoogleIdToken } = useAuth();
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Guardados em ref para o botão não ser recriado a cada render do AuthProvider
  const handlersRef = useRef({ loginWithGoogleIdToken, toast });
  useEffect(() => {
    handlersRef.current = { loginWithGoogleIdToken, toast };
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [googleId, nonce] = await Promise.all([loadGoogleIdentity(), createNonce()]);
        if (cancelled || !containerRef.current) return;

        googleId.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          itp_support: true,
          callback: async ({ credential }) => {
            const { loginWithGoogleIdToken: login, toast: notify } = handlersRef.current;
            try {
              await login(credential, nonce.raw);
            } catch (error) {
              notify({
                title: "Não foi possível entrar com o Google",
                description: getErrorMessage(error),
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            }
          },
        });

        const width = Math.min(Math.max(containerRef.current.offsetWidth, 200), 400);
        googleId.renderButton(containerRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: mode === "signup" ? "signup_with" : "signin_with",
          logo_alignment: "center",
          locale: "pt-BR",
          width,
        });
        setIsReady(true);
      } catch (error) {
        logError("GoogleIdentityButton", error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  // Se o script do Google não carregar (bloqueador, rede), usa o redirecionamento
  if (failed) return <GoogleRedirectButton label="Entrar com Google" />;

  return (
    <Box position="relative" w="100%" minH="44px" display="flex" justifyContent="center">
      {!isReady && <Spinner size="sm" color="gray.400" position="absolute" top="12px" />}
      <Box ref={containerRef} w="100%" display="flex" justifyContent="center" />
    </Box>
  );
}

function GoogleRedirectButton({ label }: { label: string }) {
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
