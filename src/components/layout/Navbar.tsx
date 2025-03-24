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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
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
    isLoginPopoverOpen, 
    openSignUpModal, 
    closeSignUpModal, 
    openLoginPopover, 
    closeLoginPopover, 
    openSignUpFromLogin
  } = useAuthUIStore();

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
        height="60px" // Altura fixa para a Navbar
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
                    <Popover
                      isOpen={isLoginPopoverOpen}
                      onClose={closeLoginPopover}
                      placement="bottom"
                      gutter={4}
                      closeOnBlur={true}
                      closeOnEsc={true}
                      returnFocusOnClose={false}
                      autoFocus={false}
                      strategy="fixed"
                    >
                      <PopoverTrigger>
                        <Button 
                          onClick={openLoginPopover}
                          variant="outline" 
                          size="sm" 
                          colorScheme="primary"
                        >
                          Entrar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        bg="gray.800" 
                        borderColor="gray.700" 
                        width="300px"
                        position="relative"
                        boxShadow="xl"
                      >
                        <PopoverArrow bg="gray.800" />
                        <PopoverBody p={0}>
                          <LoginForm onSignUpClick={openSignUpFromLogin} onClose={closeLoginPopover} />
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  </HStack>
                  
                  {/* Menu Mobile para usuários não logados */}
                  <HStack spacing={2} display={{ base: "flex", md: "none" }}>
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
        openLoginPopover={openLoginPopover}
      />
    </>
  );
}
