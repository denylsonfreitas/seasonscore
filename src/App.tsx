import { ChakraProvider } from "@chakra-ui/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import theme from "./styles/theme";
import { useEffect } from "react";
import { useAuthUIStore } from "./services/uiState";
import { ErrorBoundaryProvider } from "./hooks/useErrorBoundary";
import { OfflineMonitor } from "./components/common/OfflineBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
    },
  },
});

function GlobalEventHandler() {
  const { closeAllAuth } = useAuthUIStore();
  
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const isModalContent = 
        target.closest('.chakra-modal__content') ||
        target.closest('[data-ignore-outside-click]');
      
      if (!isModalContent) {
        closeAllAuth();
      }
    };
    
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
    <ErrorBoundaryProvider>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <GlobalEventHandler />
            <RouterProvider router={router} />
            <OfflineMonitor />
          </AuthProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundaryProvider>
  );
}

export default App;
