import { Box, HStack, Link, Button, IconButton, useDisclosure } from "@chakra-ui/react";
import { List, MagnifyingGlass } from "@phosphor-icons/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { QuickAddButton } from "../common/QuickAddButton";
import { ProfileMenu } from "../user/ProfileMenu";
import { LoginForm } from "../auth/LoginForm";
import { SignUpModal } from "../auth/SignUpModal";
import { useAuthUIStore } from "../../services/uiState";
import { MobileMenu } from "./MobileMenu";
import { SearchModal } from "./SearchModal";
import { AnimatedMenu } from "../common/AnimatedMenu";
import { useAnimatedMenu } from "../../hooks/useAnimatedMenu";
import { Logo } from "../common/Logo";
import { logError } from "../../utils/logger";

export const NAV_HEIGHT = "60px";

export const NAV_LINKS = [
  { to: "/series", label: "Séries" },
  { to: "/series/top10", label: "Top 10" },
  { to: "/reviews", label: "Avaliações" },
  { to: "/lists", label: "Listas" },
  { to: "/community", label: "Comunidade" },
];

/** Retorna se o link corresponde à página atual (o mais específico vence). */
export function isNavLinkActive(pathname: string, to: string) {
  if (to === "/series") {
    return pathname === "/series" || /^\/series\/\d+/.test(pathname);
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

let globalOpenLoginPopover: (() => void) | null = null;

export function getGlobalLoginPopover() {
  return globalOpenLoginPopover;
}

const loginMenuStyles = {
  bg: "ink.900",
  borderColor: "ink.700",
  boxShadow: "dark-lg",
  p: 0,
  borderRadius: "lg",
  borderWidth: "1px",
  maxW: "360px",
};

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const search = useDisclosure();
  const { isSignUpModalOpen, openSignUpModal, closeSignUpModal, openSignUpFromLogin } =
    useAuthUIStore();

  const desktopLogin = useAnimatedMenu();
  const mobileLogin = useAnimatedMenu();
  const openDesktopLogin = desktopLogin.handleOpen;
  const openMobileLogin = mobileLogin.handleOpen;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      logError("handleLogout", error);
    }
  };

  useEffect(() => {
    const update = () => {
      globalOpenLoginPopover = window.innerWidth < 768 ? openMobileLogin : openDesktopLogin;
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      globalOpenLoginPopover = null;
    };
  }, [openMobileLogin, openDesktopLogin]);

  const loginForm = (close: () => void) => (
    <LoginForm
      onSignUpClick={() => {
        close();
        setTimeout(openSignUpFromLogin, 350);
      }}
      onClose={close}
    />
  );

  return (
    <>
      <Box
        as="header"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        h={NAV_HEIGHT}
        bg="rgba(15, 15, 14, 0.85)"
        backdropFilter="saturate(140%) blur(12px)"
        borderBottom="1px solid"
        borderColor="ink.800"
      >
        <HStack
          as="nav"
          aria-label="Principal"
          maxW="1200px"
          mx="auto"
          h="100%"
          px={{ base: 4, md: 6, lg: 8 }}
          justify="space-between"
          spacing={6}
        >
          <HStack spacing={8} h="100%">
            <Link
              as={RouterLink}
              to="/"
              aria-label="SeasonScore, página inicial"
              _hover={{ textDecoration: "none", opacity: 0.85 }}
            >
              <Logo />
            </Link>

            <HStack
              as="ul"
              listStyleType="none"
              spacing={1}
              h="100%"
              display={{ base: "none", lg: "flex" }}
            >
              {NAV_LINKS.map((link) => {
                const active = isNavLinkActive(pathname, link.to);
                return (
                  <Box as="li" key={link.to} h="100%">
                    <Link
                      as={RouterLink}
                      to={link.to}
                      aria-current={active ? "page" : undefined}
                      display="flex"
                      alignItems="center"
                      h="100%"
                      px={3}
                      fontSize="sm"
                      fontWeight={500}
                      color={active ? "ink.50" : "ink.300"}
                      position="relative"
                      transition="color 120ms ease"
                      _hover={{ color: "ink.50", textDecoration: "none" }}
                      _after={{
                        content: '""',
                        position: "absolute",
                        left: 3,
                        right: 3,
                        bottom: 0,
                        h: "2px",
                        bg: active ? "signal.400" : "transparent",
                      }}
                    >
                      {link.label}
                    </Link>
                  </Box>
                );
              })}
            </HStack>
          </HStack>

          <HStack spacing={2}>
            <IconButton
              aria-label="Buscar séries"
              title="Buscar séries"
              icon={<MagnifyingGlass size={20} />}
              variant="ghost"
              size="sm"
              color="ink.200"
              onClick={search.onOpen}
            />
            {currentUser ? (
              <>
                <QuickAddButton size="32px" />
                <NotificationMenu />
                <Box display={{ base: "none", lg: "block" }}>
                  <ProfileMenu />
                </Box>
                <Box display={{ base: "block", lg: "none" }}>
                  <ProfileMenu isMobile onMobileMenuOpen={onOpen} />
                </Box>
              </>
            ) : (
              <>
                <Box display={{ base: "none", md: "block" }}>
                  <AnimatedMenu
                    trigger={
                      <Button variant="ghost" size="sm" onClick={openDesktopLogin}>
                        Entrar
                      </Button>
                    }
                    isOpen={desktopLogin.isOpen}
                    isVisible={desktopLogin.isVisible}
                    onOpen={openDesktopLogin}
                    onClose={desktopLogin.handleClose}
                    alignWithTrigger
                    alignOnlyOnDesktop
                    responsivePosition={{ base: { top: NAV_HEIGHT, right: "16px" }, md: {} }}
                    transformOrigin="top right"
                    width={{ base: "calc(100vw - 32px)", md: "320px" }}
                    showOverlay
                    overlayBg="blackAlpha.500"
                    zIndex={{ overlay: 1200, menu: 1300 }}
                    menuStyles={loginMenuStyles}
                  >
                    <Box style={desktopLogin.getItemAnimationStyle(0)}>
                      {loginForm(desktopLogin.handleClose)}
                    </Box>
                  </AnimatedMenu>
                </Box>

                <Box display={{ base: "block", md: "none" }}>
                  <AnimatedMenu
                    trigger={
                      <Button variant="ghost" size="sm" onClick={openMobileLogin}>
                        Entrar
                      </Button>
                    }
                    isOpen={mobileLogin.isOpen}
                    isVisible={mobileLogin.isVisible}
                    onOpen={openMobileLogin}
                    onClose={mobileLogin.handleClose}
                    alignWithTrigger={false}
                    responsivePosition={{ base: { top: NAV_HEIGHT, right: "8px", left: "8px" } }}
                    transformOrigin="top right"
                    width={{ base: "calc(100vw - 16px)", md: "320px" }}
                    showOverlay
                    overlayBg="blackAlpha.500"
                    zIndex={{ overlay: 1200, menu: 1300 }}
                    menuStyles={loginMenuStyles}
                  >
                    <Box style={mobileLogin.getItemAnimationStyle(0)}>
                      {loginForm(mobileLogin.handleClose)}
                    </Box>
                  </AnimatedMenu>
                </Box>

                <Button
                  size="sm"
                  onClick={openSignUpModal}
                  display={{ base: "none", sm: "inline-flex" }}
                >
                  Criar conta
                </Button>

                <IconButton
                  aria-label="Abrir menu"
                  icon={<List size={20} />}
                  variant="ghost"
                  size="sm"
                  onClick={onOpen}
                  display={{ base: "inline-flex", lg: "none" }}
                />
              </>
            )}
          </HStack>
        </HStack>
      </Box>

      <Box h={NAV_HEIGHT} />

      <SearchModal
        isOpen={search.isOpen}
        onClose={search.onClose}
        onSelect={(seriesId) => {
          search.onClose();
          navigate(`/series/${seriesId}`);
        }}
        title="Buscar séries"
        subtitle="Digite o nome da série"
      />

      <SignUpModal isOpen={isSignUpModalOpen} onClose={closeSignUpModal} />

      <MobileMenu
        isOpen={isOpen}
        onClose={onClose}
        currentUser={currentUser}
        onLogout={handleLogout}
        openSignUpModal={openSignUpModal}
        openLoginPopover={openMobileLogin}
      />
    </>
  );
}
