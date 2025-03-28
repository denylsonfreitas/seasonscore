import { ChakraProvider } from "@chakra-ui/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import theme from "./styles/theme";
import { useEffect } from "react";
import { useAuthUIStore } from "./services/uiState";

// Importando o tema personalizado de ./styles/theme.ts

// Configuração otimizada do QueryClient com caches mais inteligentes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de tempo de staleness padrão
      gcTime: 1000 * 60 * 30, // 30 minutos de tempo de garbage collection padrão
      refetchOnWindowFocus: false, // Desabilitar refetch automático ao focar a janela
      retry: 1, // Limitar o número de retentativas para evitar muitas solicitações
      refetchOnMount: 'always',
      refetchOnReconnect: true,
    },
  },
});

// Componente para gerenciar eventos globais
function GlobalEventHandler() {
  const { closeAllAuth } = useAuthUIStore();
  
  useEffect(() => {
    // Handler para fechar modais quando clicar fora
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Verificar se o clique foi fora de um modal
      const isModalContent = 
        target.closest('.chakra-modal__content') ||
        target.closest('[data-ignore-outside-click]');
      
      // Se não for dentro de um modal, feche todos
      if (!isModalContent) {
        closeAllAuth();
      }
    };
    
    // Adicionar o evento com um pequeno delay
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick);
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [closeAllAuth]);
  
  return null;
}

function App() {
  const router = createBrowserRouter(routes);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <GlobalEventHandler />
          <RouterProvider router={router} />
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
