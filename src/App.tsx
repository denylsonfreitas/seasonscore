import { ChakraProvider } from "@chakra-ui/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routes } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import theme from "./styles/theme";

// Importando o tema personalizado de ./styles/theme.ts

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
