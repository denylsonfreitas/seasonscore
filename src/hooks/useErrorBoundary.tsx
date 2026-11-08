import { logError } from "../utils/logger";
import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  CloseButton,
} from "@chakra-ui/react";

interface ErrorBoundaryContextProps {
  error: Error | null;
  setError: (error: Error | null) => void;
  resetError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextProps>({
  error: null,
  setError: () => {},
  resetError: () => {},
});

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * Provider para o gerenciamento de erros
 */
export function ErrorBoundaryProvider({
  children,
  fallback: ErrorFallback,
}: ErrorBoundaryProviderProps) {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Erros fora da renderização (promises sem tratamento, callbacks) apenas são
  // registrados: derrubar a tela inteira por uma busca em segundo plano que
  // falhou é pior do que manter o app funcionando. Erros de renderização
  // continuam sendo capturados pelo ErrorBoundary abaixo.
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => logError("window.error", event.error);
    const handleUnhandledRejection = (event: PromiseRejectionEvent) =>
      logError("unhandledrejection", event.reason);

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (error) {
    if (ErrorFallback) {
      return <ErrorFallback error={error} resetError={resetError} />;
    }

    return (
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        minHeight="200px"
        borderRadius="md"
        m={4}
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={2} fontSize="lg">
          Ops! Algo deu errado
        </AlertTitle>
        <AlertDescription maxWidth="sm">{error.message}</AlertDescription>
        <Box mt={4}>
          <Button colorScheme="red" onClick={resetError}>
            Tentar novamente
          </Button>
        </Box>
        <CloseButton position="absolute" right="8px" top="8px" onClick={resetError} />
      </Alert>
    );
  }

  return (
    <ErrorBoundaryContext.Provider value={{ error, setError, resetError }}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

/**
 * Hook para acesso ao contexto de gerenciamento de erros
 */
export function useErrorBoundary() {
  const context = useContext(ErrorBoundaryContext);

  if (!context) {
    throw new Error("useErrorBoundary deve ser usado dentro de um ErrorBoundaryProvider");
  }

  return context;
}

/**
 * Componente ErrorBoundary para envolver partes específicas da aplicação
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: ErrorFallback } = this.props;

      if (ErrorFallback) {
        return <ErrorFallback error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          minHeight="200px"
          borderRadius="md"
          m={4}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={2} fontSize="lg">
            Ops! Algo deu errado
          </AlertTitle>
          <AlertDescription maxWidth="sm">{this.state.error.message}</AlertDescription>
          <Box mt={4}>
            <Button colorScheme="red" onClick={this.resetError}>
              Tentar novamente
            </Button>
          </Box>
          <CloseButton position="absolute" right="8px" top="8px" onClick={this.resetError} />
        </Alert>
      );
    }

    return this.props.children;
  }
}
