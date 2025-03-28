import {
  Box,
  Container,
  HStack,
  Link,
  Button,
  IconButton,
  useDisclosure,
  Text,
  Flex,
  Divider,
  useToken,
} from "@chakra-ui/react";
import {
  List,
  SignIn,
} from "@phosphor-icons/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ExtendedUser } from "../../types/auth";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { QuickAddButton } from "../common/QuickAddButton";
import { ProfileMenu } from "../user/ProfileMenu";
import { LoginForm } from "../auth/LoginForm";
import { SignUpModal } from "../auth/SignUpModal";
import { useAuthUIStore } from "../../services/uiState";
import { MobileMenu } from "./MobileMenu";
import { useRef, useEffect } from "react";
import { AnimatedMenu } from "../common/AnimatedMenu";
import { useAnimatedMenu } from "../../hooks/useAnimatedMenu";
import { RippleEffect } from "../common/RippleEffect";

// Função global para abrir o popover de login
// Será inicializada pelas funções do Navbar quando ele for montado
let globalOpenLoginPopover: (() => void) | null = null;

export function getGlobalLoginPopover() {
  return globalOpenLoginPopover;
}

export function Navbar() {
  const { currentUser, logout } = useAuth() as {
    currentUser: ExtendedUser | null;
    logout: () => Promise<void>;
  };
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Obtém o estado da UI de autenticação do store
  const { 
    isSignUpModalOpen, 
    openSignUpModal, 
    closeSignUpModal, 
    openSignUpFromLogin
  } = useAuthUIStore();
  
  // Estados e funções para o menu animado de login desktop
  const { 
    isOpen: isDesktopLoginOpen, 
    isVisible: isDesktopLoginVisible, 
    isRippling: isDesktopRippling,
    handleOpen: handleDesktopLoginOpen, 
    handleClose: handleDesktopLoginClose, 
    handleRippleEffect: handleDesktopRippleEffect,
    getItemAnimationStyle: getDesktopItemAnimationStyle
  } = useAnimatedMenu();
  
  // Estados e funções para o menu animado de login mobile
  const { 
    isOpen: isMobileLoginOpen, 
    isVisible: isMobileLoginVisible, 
    isRippling: isMobileRippling,
    handleOpen: handleMobileLoginOpen, 
    handleClose: handleMobileLoginClose, 
    handleRippleEffect: handleMobileRippleEffect,
    getItemAnimationStyle: getMobileItemAnimationStyle
  } = useAnimatedMenu();

  // Adicionar uso do useToken para obter as cores do tema
  const [seriesColor, popularColor, recentColor, top10Color] = useToken(
    'colors',
    ['linkhome.series', 'linkhome.popular', 'linkhome.recent', 'linkhome.top10']
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Trigger para o login desktop
  const desktopLoginTrigger = (
    <Button 
      onClick={() => {
        handleDesktopRippleEffect();
        handleDesktopLoginOpen();
      }}
      variant="outline" 
      size="sm" 
      colorScheme="primary"
      position="relative"
      overflow="hidden"
    >
      Entrar
      <RippleEffect isRippling={isDesktopRippling} />
    </Button>
  );
  
  // Trigger para o login mobile
  const mobileLoginTrigger = (
    <IconButton
      aria-label="Entrar"
      icon={
        <Box position="relative" overflow="hidden" borderRadius="md">
          <SignIn weight="bold" size={18} />
          <RippleEffect isRippling={isMobileRippling} />
        </Box>
      }
      variant="ghost"
      colorScheme="primary"
      color="primary.300"
      _hover={{ bg: "gray.700" }}
      size="sm"
      onClick={() => {
        handleMobileRippleEffect();
        handleMobileLoginOpen();
      }}
      position="relative"
      overflow="hidden"
    />
  );

  // Registrar as funções de abertura do login globalmente
  useEffect(() => {
    // Na versão mobile, usamos o handleMobileLoginOpen
    // Na versão desktop, usamos o handleDesktopLoginOpen
    // Para detectar qual usar, vamos verificar a largura da janela
    const isMobile = window.innerWidth < 768;
    globalOpenLoginPopover = isMobile ? handleMobileLoginOpen : handleDesktopLoginOpen;
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      globalOpenLoginPopover = isMobile ? handleMobileLoginOpen : handleDesktopLoginOpen;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // Limpar a referência quando o componente for desmontado
      globalOpenLoginPopover = null;
    };
  }, [handleMobileLoginOpen, handleDesktopLoginOpen]);

  return (
    <>
      <Box
        as="nav"
        bg="gray.800"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        borderBottom="1px solid"
        borderColor="gray.700"
        height="60px"
        display="flex"
        alignItems="center"
      >
        <Container maxW="1200px">
          <HStack justify="space-between" align="center" height="100%">
            {/* Logo e Menu de Navegação à esquerda */}
            <HStack spacing={6}>
              <Link
                as={RouterLink}
                to="/"
                color="white"
                _hover={{ textDecoration: "none", color: "primary.300" }}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Text 
                  fontFamily="logo" 
                  fontSize="2xl" 
                  letterSpacing="wide"
                  fontWeight="bold"
                  lineHeight="1"
                >
                  SeasonScore
                </Text>
              </Link>
              <Divider borderColor="gray.600" orientation="vertical" height="20px" display={{ base: "none", md: "flex" }} />

              {/* Menu de Navegação */}
              <HStack spacing={5} display={{ base: "none", md: "flex" }} pt={1}>
                <Link
                  as={RouterLink}
                  to="/series"
                  color="gray.300"
                  _hover={{ color: "linkhome.series" }}
                  fontSize="sm"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Séries
                </Link>
                <Link
                  as={RouterLink}
                  to="/series/popular"
                  color="gray.300"
                  _hover={{ color: "linkhome.popular" }}
                  fontSize="sm"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Populares
                </Link>
                <Link
                  as={RouterLink}
                  to="/series/recent"
                  color="gray.300"
                  _hover={{ color: "linkhome.recent" }}
                  fontSize="sm"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Novidades
                </Link>
                <Link
                  as={RouterLink}
                  to="/series/top10"
                  color="gray.300"
                  _hover={{ color: "linkhome.top10" }}
                  fontSize="sm"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Top 10
                </Link>
              </HStack>
            </HStack>

            {/* Menu Usuário */}
            <HStack spacing={3}>
              {currentUser ? (
                <>
                  <HStack spacing={2} display={{ base: "none", md: "flex" }}>
                    <QuickAddButton size="30px" />
                    <NotificationMenu />
                    <ProfileMenu />
                  </HStack>
                  
                  {/* Menu Mobile para usuários logados - apenas perfil com menu acionado pelo avatar */}
                  <HStack spacing={3} display={{ base: "flex", md: "none" }}>
                    <QuickAddButton size="26px" />
                    <NotificationMenu />
                    <ProfileMenu isMobile onMobileMenuOpen={onOpen} />
                  </HStack>
                </>
              ) : (
                <>
                  {/* Botões Desktop */}
                  <HStack spacing={3} display={{ base: "none", md: "flex" }}>
                    <Button onClick={openSignUpModal} variant="solid" size="sm">
                      Criar Conta
                    </Button>
                    
                    <AnimatedMenu
                      trigger={desktopLoginTrigger}
                      isOpen={isDesktopLoginOpen}
                      isVisible={isDesktopLoginVisible}
                      onOpen={handleDesktopLoginOpen}
                      onClose={handleDesktopLoginClose}
                      alignWithTrigger={true}
                      alignOnlyOnDesktop={true}
                      responsivePosition={{
                        base: { top: "60px", right: "16px" },
                        md: { } // Vazio para permitir alinhamento com trigger no desktop
                      }}
                      transformOrigin="top right"
                      width={{ base: "calc(100vw - 32px)", md: "300px" }}
                      showOverlay={true}
                      overlayBg="blackAlpha.500"
                      zIndex={{ overlay: 1200, menu: 1300 }}
                      menuStyles={{
                        bg: "gray.800",
                        borderColor: "gray.700",
                        boxShadow: "dark-lg",
                        p: 0,
                        borderRadius: { base: "md", md: "md" },
                        borderWidth: "1px",
                        maxW: "350px"
                      }}
                    >
                      <Box style={getDesktopItemAnimationStyle(0)}>
                        <LoginForm 
                          onSignUpClick={() => {
                            handleDesktopLoginClose();
                            setTimeout(openSignUpFromLogin, 350);
                          }} 
                          onClose={handleDesktopLoginClose} 
                        />
                      </Box>
                    </AnimatedMenu>
                  </HStack>
                  
                  {/* Menu Mobile para usuários não logados */}
                  <HStack spacing={2} display={{ base: "flex", md: "none" }}>
                    <AnimatedMenu
                      trigger={mobileLoginTrigger}
                      isOpen={isMobileLoginOpen}
                      isVisible={isMobileLoginVisible}
                      onOpen={handleMobileLoginOpen}
                      onClose={handleMobileLoginClose}
                      alignWithTrigger={false}
                      responsivePosition={{
                        base: { top: "60px", right: "8px", left: "8px" },
                      }}
                      transformOrigin="top right"
                      width={{ base: "calc(100vw - 16px)", md: "300px" }}
                      showOverlay={true}
                      overlayBg="blackAlpha.500"
                      zIndex={{ overlay: 1200, menu: 1300 }}
                      menuStyles={{
                        bg: "gray.800",
                        borderColor: "gray.700",
                        boxShadow: "dark-lg",
                        p: 0,
                        borderRadius: { base: "md", md: "md" },
                        borderWidth: "1px",
                        maxW: "350px"
                      }}
                    >
                      <Box style={getMobileItemAnimationStyle(0)}>
                        <LoginForm 
                          onSignUpClick={() => {
                            handleMobileLoginClose();
                            setTimeout(openSignUpFromLogin, 350);
                          }} 
                          onClose={handleMobileLoginClose} 
                        />
                      </Box>
                    </AnimatedMenu>
                    
                    <IconButton
                      aria-label="Menu"
                      icon={<List weight="bold" size={18} />}
                      variant="ghost"
                      color="white"
                      size="sm"
                      onClick={onOpen}
                    />
                  </HStack>
                </>
              )}
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Espaçador para compensar a navbar fixa */}
      <Box height="60px" />

      {/* Modal de Cadastro */}
      <SignUpModal isOpen={isSignUpModalOpen} onClose={closeSignUpModal} />

      {/* Menu Mobile para todos os usuários */}
      <MobileMenu
        isOpen={isOpen}
        onClose={onClose}
        currentUser={currentUser}
        onLogout={handleLogout}
        seriesColor={seriesColor}
        popularColor={popularColor}
        recentColor={recentColor}
        top10Color={top10Color}
        openSignUpModal={openSignUpModal}
        openLoginPopover={handleMobileLoginOpen}
      />
    </>
  );
}
