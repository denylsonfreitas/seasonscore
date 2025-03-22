import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Criando um tema personalizado
const theme = extendTheme({
  styles: {
    global: {
      // Estilos globais para todo o app
      "html, body": {
        padding: 0,
        margin: 0,
        background: "gray.900",
        color: "white",
        overflowX: "hidden",
        width: "100%",
        height: "100%",
        position: "relative",
      },
      // Quando um modal está aberto
      "body.chakra-modal-open": {
        overflow: "hidden",
        paddingRight: "0 !important", // Impede o padding que o Chakra adiciona
      },
      "body.chakra-ui-light": {
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "::-webkit-scrollbar": {
          display: "none",
        },
      },
    },
  },
  components: {
    Modal: {
      // Configuração para evitar o deslocamento quando modais são abertos
      baseStyle: {
        overlay: {
          backdropFilter: "blur(5px)",
          bg: "blackAlpha.700",
        },
        dialog: {
          my: "auto",
          mx: "auto",
          boxShadow: "xl",
        },
        dialogContainer: {
          // Isso ajuda a centralizar sem deslocar o conteúdo
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    Drawer: {
      // Configuração para drawers
      baseStyle: {
        overlay: {
          backdropFilter: "blur(5px)",
        },
      },
    },
    Popover: {
      // Configuração para popovers
      baseStyle: {
        popper: {
          zIndex: 1500,
          width: "auto",
          maxWidth: "100vw"
        },
        content: {
          boxShadow: "lg",
          _focus: { boxShadow: "lg", outline: "none" },
          '& > .chakra-popover__close-btn': {
            display: 'none !important',
          }
        },
        body: {
          padding: "0",
        },
        arrow: {
          boxShadow: "none",
        },
        closeButton: {
          display: "none !important",
          visibility: "hidden",
          opacity: 0,
          position: "absolute",
          pointerEvents: "none"
        }
      }
    },
  },
});

const queryClient = new QueryClient();

function App() {
  const router = createBrowserRouter(routes);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
