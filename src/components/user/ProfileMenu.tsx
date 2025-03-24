import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  Avatar,
  IconButton,
  useToast,
  Flex,
  Text,
  Box,
  Button,
  useDisclosure,
  Portal,
  Divider,
} from "@chakra-ui/react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserCircle, Gear, SignOut, BookmarksSimple, Bell } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { UserAvatar } from "../common/UserAvatar";
import { useState, useEffect } from "react";

interface ProfileMenuProps {
  isMobile?: boolean;
  onMobileMenuOpen?: () => void;
  size?: "xs" | "sm" | "md" | "lg";
}

export function ProfileMenu({ isMobile = false, onMobileMenuOpen, size = "sm" }: ProfileMenuProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isVisible, setIsVisible] = useState(false);
  const [isRippling, setIsRippling] = useState(false);

  // Função para ativar o efeito de ripple no avatar
  const handleRippleEffect = () => {
    if (!isRippling) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    }
  };

  // Gerenciar a animação de abertura/fechamento do menu
  useEffect(() => {
    if (isOpen) {
      // Pequeno atraso para permitir que o DOM seja atualizado
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);
  
  const handleMenuOpen = () => {
    onOpen();
  };
  
  const handleMenuClose = () => {
    setIsVisible(false);
    // Atraso para a animação completar
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleLogout = async () => {
    try {
      handleMenuClose();
      await logout();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Estilo CSS para animação dos itens do menu
  const getItemAnimationStyle = (index: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05 + 0.1}s`,
  });

  // Se for mobile, retorna apenas o ícone que abre o menu mobile
  if (isMobile && onMobileMenuOpen) {
    return (
      <IconButton
        aria-label="Menu"
        icon={
          <Box position="relative" overflow="hidden" borderRadius="full">
            <UserAvatar
              size={size}
              userId={currentUser?.uid}
              photoURL={currentUser?.photoURL}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width={isRippling ? "200%" : "0%"}
              height={isRippling ? "200%" : "0%"}
              borderRadius="full"
              bg="whiteAlpha.300"
              opacity={isRippling ? 1 : 0}
              transition="all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)"
              pointerEvents="none"
              zIndex={2}
            />
          </Box>
        }
        variant="unstyled"
        color="white"
        onClick={(e) => {
          handleRippleEffect();
          onMobileMenuOpen();
        }}
        position="relative"
        overflow="hidden"
      />
    );
  }

  return (
    <Box position="relative">
      <IconButton
        aria-label="Opções do usuário"
        icon={
          <Box position="relative" overflow="hidden" borderRadius="full">
            <UserAvatar
              size={size}
              userId={currentUser?.uid}
              photoURL={currentUser?.photoURL}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width={isRippling ? "200%" : "0%"}
              height={isRippling ? "200%" : "0%"}
              borderRadius="full"
              bg="whiteAlpha.300"
              opacity={isRippling ? 1 : 0}
              transition="all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)"
              pointerEvents="none"
              zIndex={2}
            />
          </Box>
        }
        variant="unstyled"
        onClick={(e) => {
          handleRippleEffect();
          isOpen ? handleMenuClose() : handleMenuOpen();
        }}
        position="relative"
        overflow="hidden"
      />

      {isOpen && (
        <Portal>
          {/* Overlay invisível que fecha o menu quando clicado fora */}
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex={1200}
            onClick={handleMenuClose}
            bg="transparent"
            pointerEvents={isVisible ? "auto" : "none"}
          />
          
          <Box 
            bg="gray.800" 
            borderColor="gray.700" 
            boxShadow="dark-lg" 
            p={2}
            borderRadius="md"
            zIndex={1300}
            position="fixed"
            top="60px"
            right="16px"
            borderWidth="1px"
            onClick={(e) => e.stopPropagation()}
            transform={isVisible ? "translateY(0) scale(1)" : "translateY(-25px) scale(0.92)"}
            opacity={isVisible ? 1 : 0}
            transition="transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
            transformOrigin="top right"
            willChange="transform, opacity"
            minWidth="200px"
          >
            {/* Cabeçalho com informações do usuário */}
            <Flex 
              direction="column" 
              p={3} 
              borderBottom="1px solid" 
              borderColor="gray.700" 
              mb={2}
              style={getItemAnimationStyle(0)}
            >
              <Text 
                fontWeight="semibold" 
                color="white" 
                fontSize="sm"
              >
                {currentUser?.displayName || "Usuário"}
              </Text>
              <Text 
                color="gray.400" 
                fontSize="xs"
              >
                {currentUser?.username}
              </Text>
            </Flex>
            
            {/* Itens do menu - substituindo MenuItem por Box+Flex */}
            <Box style={getItemAnimationStyle(1)}>
              <Box
                as={RouterLink}
                to="/profile"
                py={2.5}
                px={2}
                borderRadius="md"
                color="gray.200"
                bg="gray.800"
                _hover={{ bg: "gray.700" }}
                fontSize="sm"
                display="block"
              >
                <Flex align="center">
                  <Box 
                    bg="blue.500" 
                    p={1.5} 
                    borderRadius="md" 
                    mr={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <UserCircle weight="fill" size={16} color="white" />
                  </Box>
                  Meu Perfil
                </Flex>
              </Box>
            </Box>
            
            <Box style={getItemAnimationStyle(2)}>
              <Box
                as={RouterLink}
                to="/settings"
                py={2.5}
                px={2}
                borderRadius="md"
                color="gray.200"
                bg="gray.800"
                _hover={{ bg: "gray.700" }}
                fontSize="sm"
                my={1}
                display="block"
              >
                <Flex align="center">
                  <Box 
                    bg="primary.500" 
                    p={1.5} 
                    borderRadius="md" 
                    mr={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Gear weight="fill" size={16} color="white" />
                  </Box>
                  Configurações
                </Flex>
              </Box>
            </Box>
            
            <Divider borderColor="gray.700" my={2} style={getItemAnimationStyle(3)} />
            
            <Box style={getItemAnimationStyle(4)}>
              <Box
                py={2.5}
                px={2}
                borderRadius="md"
                color="gray.200"
                bg="gray.800"
                _hover={{ bg: "red.900" }}
                fontSize="sm"
                cursor="pointer"
                onClick={handleLogout}
                display="block"
              >
                <Flex align="center">
                  <Box 
                    bg="red.500" 
                    p={1.5} 
                    borderRadius="md" 
                    mr={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <SignOut weight="fill" size={16} color="white" />
                  </Box>
                  Sair da Conta
                </Flex>
              </Box>
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
} 