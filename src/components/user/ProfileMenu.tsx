import {
  IconButton,
  useToast,
  Flex,
  Text,
  Box,
  Divider,
} from "@chakra-ui/react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserCircle, Gear, SignOut } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { UserAvatar } from "../common/UserAvatar";
import { useCallback, useMemo } from "react";
import { useAnimatedMenu } from "../../hooks/useAnimatedMenu";
import { RippleEffect } from "../common/RippleEffect";
import { AnimatedMenu } from "../common/AnimatedMenu";

interface ProfileMenuProps {
  isMobile?: boolean;
  onMobileMenuOpen?: () => void;
  size?: "xs" | "sm" | "md" | "lg";
}

export function ProfileMenu({ isMobile = false, onMobileMenuOpen, size = "sm" }: ProfileMenuProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const {
    isOpen,
    isVisible,
    isRippling,
    handleOpen,
    handleClose,
    handleRippleEffect,
    getItemAnimationStyle,
    onOpen,
    onClose
  } = useAnimatedMenu();

  const handleLogout = useCallback(async () => {
    try {
      handleClose();
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
  }, [handleClose, logout, navigate, toast]);

  // Handler para abrir/fechar o menu
  const toggleMenu = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleRippleEffect();
      onOpen();
    }
  }, [isOpen, handleClose, handleRippleEffect, onOpen]);

  // Se for mobile, retorna apenas o ícone que abre o menu mobile
  if (isMobile && onMobileMenuOpen) {
    const mobileIcon = useMemo(() => (
      <IconButton
        aria-label="Menu"
        icon={
          <Box position="relative" overflow="hidden" borderRadius="full">
            <UserAvatar
              size={size}
              userId={currentUser?.uid}
              photoURL={currentUser?.photoURL}
            />
            <RippleEffect isRippling={isRippling} />
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
    ), [size, currentUser, isRippling, handleRippleEffect, onMobileMenuOpen]);
    
    return mobileIcon;
  }

  // Avatar que serve como trigger para o menu
  const trigger = useMemo(() => (
    <IconButton
      aria-label="Opções do usuário"
      icon={
        <Box position="relative" overflow="hidden" borderRadius="full">
          <UserAvatar
            size={size}
            userId={currentUser?.uid}
            photoURL={currentUser?.photoURL}
          />
          <RippleEffect isRippling={isRippling} />
        </Box>
      }
      variant="unstyled"
      onClick={toggleMenu}
      position="relative"
      overflow="hidden"
    />
  ), [size, currentUser, isRippling, toggleMenu]);

  return (
    <AnimatedMenu
      trigger={trigger}
      isOpen={isOpen}
      isVisible={isVisible}
      onOpen={onOpen}
      onClose={onClose}
      alignWithTrigger={true}
      alignOnlyOnDesktop={true}
      responsivePosition={{
        base: { top: "60px", right: "8px", left: "8px" },
        md: { } // Vazio para permitir alinhamento com trigger no desktop
      }}
      transformOrigin="top right"
      width={{ base: "calc(100vw - 16px)", md: "200px" }}
      showOverlay={true}
      overlayBg="blackAlpha.500"
      zIndex={{ overlay: 1200, menu: 1300 }}
      menuStyles={{
        bg: "gray.800",
        borderColor: "gray.700",
        boxShadow: "dark-lg",
        p: 2,
        borderRadius: { base: "md", md: "md" },
        borderWidth: "1px",
        maxH: { base: "80vh", md: "auto" }
      }}
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
          fontSize={{ base: "sm", md: "sm" }}
        >
          {currentUser?.displayName || "Usuário"}
        </Text>
        <Text 
          color="gray.400" 
          fontSize={{ base: "2xs", md: "xs" }}
        >
          {currentUser?.username}
        </Text>
      </Flex>
      
      {/* Itens do menu */}
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
          fontSize={{ base: "xs", md: "sm" }}
          display="block"
          onClick={handleClose}
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
          fontSize={{ base: "xs", md: "sm" }}
          my={1}
          display="block"
          onClick={handleClose}
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
          fontSize={{ base: "xs", md: "sm" }}
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
    </AnimatedMenu>
  );
} 