import React from 'react';
import { 
  Alert, 
  AlertIcon, 
  AlertDescription, 
  Button, 
  Flex, 
  HStack, 
  CloseButton,
  useDisclosure,
  Box,
  Collapse
} from '@chakra-ui/react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineBannerProps {
  /**
   * Mostrar mesmo que o usuário tenha fechado o banner
   */
  forceShow?: boolean;
  
  /**
   * Callback acionado quando o usuário tenta reconectar
   */
  onReconnect?: () => void;
  
  /**
   * Texto personalizado para o banner
   */
  message?: string;
}

/**
 * Banner que mostra quando o usuário está offline.
 * Usa o hook useOnlineStatus para detectar o status da conexão.
 */
export function OfflineBanner({
  forceShow = false,
  onReconnect,
  message = 'Você está offline. Alguns recursos podem não estar disponíveis.'
}: OfflineBannerProps) {
  const { online, checkNow } = useOnlineStatus();
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  
  if ((online && !forceShow) || (!isOpen && !forceShow)) {
    return null;
  }
  
  const handleReconnect = () => {
    checkNow();
    
    if (onReconnect) {
      onReconnect();
    }
  };
  
  return (
    <Collapse in={true} animateOpacity style={{ width: '100%' }}>
      <Box
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="banner"
        width="100%"
        px={4}
        py={2}
      >
        <Alert
          status="warning"
          variant="solid"
          borderRadius="md"
          bg="yellow.500"
          color="gray.900"
        >
          <Flex w="100%" alignItems="center" justifyContent="space-between">
            <HStack spacing={3}>
              <AlertIcon color="gray.900" />
              <AlertDescription>{message}</AlertDescription>
            </HStack>
            
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="blackAlpha"
                onClick={handleReconnect}
                aria-label="Tentar reconectar"
              >
                Reconectar
              </Button>
              
              {!forceShow && (
                <CloseButton
                  onClick={onClose}
                  aria-label="Fechar aviso"
                  size="sm"
                />
              )}
            </HStack>
          </Flex>
        </Alert>
      </Box>
    </Collapse>
  );
}

/**
 * Componente que monitora o status de conexão e mostra o banner quando offline
 */
export function OfflineMonitor() {
  return <OfflineBanner />;
} 