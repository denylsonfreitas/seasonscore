import { useState } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  useToast,
  Spinner,
  Heading,
  Badge,
} from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";
import { cleanupNotifications } from "../services/notifications";
import { auth } from "../config/firebase";

export function NotificationManager() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);
  const toast = useToast();

  const handleCleanupNotifications = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para limpar notificações",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (currentUser.uid !== auth.currentUser?.uid) {
      toast({
        title: "Erro",
        description: "Você só pode limpar suas próprias notificações",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setCleanupResult(null);

    try {
      const removedCount = await cleanupNotifications(currentUser.uid);
      
      setCleanupResult({
        success: true,
        message: removedCount > 0 
          ? "Notificações duplicadas foram removidas com sucesso!" 
          : "Não foram encontradas notificações duplicadas.",
        count: removedCount
      });
      
      toast({
        title: "Sucesso",
        description: removedCount > 0 
          ? `${removedCount} notificações duplicadas foram removidas com sucesso!` 
          : "Não foram encontradas notificações duplicadas.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      const isPermissionError = errorMessage.includes("permission") || errorMessage.includes("permissão");
      
      setCleanupResult({
        success: false,
        message: isPermissionError 
          ? "Você não tem permissão para limpar estas notificações" 
          : "Ocorreu um erro ao limpar as notificações",
      });
      
      toast({
        title: "Erro",
        description: isPermissionError 
          ? "Você não tem permissão para limpar estas notificações" 
          : "Ocorreu um erro ao limpar as notificações",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Gerenciador de Notificações</Heading>
        
        <Text>
          Use esta ferramenta para limpar notificações duplicadas e melhorar sua experiência.
        </Text>
        
        <HStack>
          <Button
            colorScheme="teal"
            onClick={handleCleanupNotifications}
            isLoading={isLoading}
            loadingText="Limpando..."
            isDisabled={!currentUser}
          >
            Limpar Notificações Duplicadas
          </Button>
        </HStack>
        
        {cleanupResult && (
          <Box 
            p={3} 
            borderRadius="md" 
            bg={cleanupResult.success ? "green.50" : "red.50"}
            borderWidth="1px"
            borderColor={cleanupResult.success ? "green.200" : "red.200"}
          >
            <HStack>
              <Badge colorScheme={cleanupResult.success ? "green" : "red"}>
                {cleanupResult.success ? "Sucesso" : "Erro"}
              </Badge>
              <Text>{cleanupResult.message}</Text>
              {cleanupResult.count !== undefined && (
                <Badge colorScheme="blue">{cleanupResult.count} removidas</Badge>
              )}
            </HStack>
          </Box>
        )}
        
        {isLoading && (
          <HStack justify="center" p={4}>
            <Spinner size="sm" />
            <Text>Limpando notificações duplicadas...</Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
} 