import { Box, Text, Flex, Button, Portal, Divider, VStack } from "@chakra-ui/react";
import { Gear, SignOut, UserCircle } from "@phosphor-icons/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import type { ExtendedUser } from "../../types/auth";
import { NAV_HEIGHT, NAV_LINKS, isNavLinkActive } from "./Navbar";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ExtendedUser | null;
  onLogout: () => void;
  openSignUpModal: () => void;
  openLoginPopover: () => void;
}

function MenuRow({
  to,
  onClick,
  active,
  icon,
  danger,
  children,
}: {
  to?: string;
  onClick: () => void;
  active?: boolean;
  icon?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  const row = (
    <Flex
      align="center"
      gap={3}
      h="44px"
      px={3}
      borderRadius="md"
      color={danger ? "danger" : active ? "ink.50" : "ink.200"}
      bg={active ? "ink.850" : "transparent"}
      fontWeight={active ? 600 : 500}
      fontSize="md"
      cursor="pointer"
      _hover={{ bg: "ink.850", color: danger ? "danger" : "ink.50" }}
      onClick={onClick}
      position="relative"
      _before={
        active
          ? {
              content: '""',
              position: "absolute",
              left: 0,
              top: "10px",
              bottom: "10px",
              w: "2px",
              bg: "signal.400",
            }
          : undefined
      }
    >
      {icon}
      {children}
    </Flex>
  );
  return to ? (
    <RouterLink to={to} aria-current={active ? "page" : undefined}>
      {row}
    </RouterLink>
  ) : (
    row
  );
}

export function MobileMenu({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  openSignUpModal,
  openLoginPopover,
}: MobileMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(id);
    }
    setIsVisible(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen && !isVisible) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset={0}
        zIndex={1200}
        onClick={onClose}
        bg="blackAlpha.600"
        opacity={isVisible ? 1 : 0}
        transition="opacity 200ms ease"
        pointerEvents={isVisible ? "auto" : "none"}
      />

      <Box
        role="dialog"
        aria-label="Menu"
        position="fixed"
        top={NAV_HEIGHT}
        left={0}
        right={0}
        zIndex={1300}
        bg="ink.900"
        borderBottom="1px solid"
        borderColor="ink.700"
        px={4}
        pt={2}
        pb={4}
        maxH={`calc(100dvh - ${NAV_HEIGHT})`}
        overflowY="auto"
        transform={isVisible ? "translateY(0)" : "translateY(-8px)"}
        opacity={isVisible ? 1 : 0}
        transition="transform 200ms ease-out, opacity 200ms ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {currentUser && (
          <Box px={3} py={3} mb={1}>
            <Text fontWeight={600} color="ink.50" fontSize="sm" noOfLines={1}>
              {currentUser.displayName || currentUser.username || "Usuário"}
            </Text>
            {currentUser.username && (
              <Text color="ink.400" fontSize="xs" fontFamily="mono">
                @{currentUser.username}
              </Text>
            )}
          </Box>
        )}

        <VStack as="nav" aria-label="Seções" align="stretch" spacing={0.5}>
          {NAV_LINKS.map((link) => (
            <MenuRow
              key={link.to}
              to={link.to}
              onClick={onClose}
              active={isNavLinkActive(pathname, link.to)}
            >
              {link.label}
            </MenuRow>
          ))}
        </VStack>

        <Divider borderColor="ink.700" my={3} />

        {currentUser ? (
          <VStack align="stretch" spacing={0.5}>
            <MenuRow to="/profile" onClick={onClose} icon={<UserCircle size={20} />}>
              Meu perfil
            </MenuRow>
            <MenuRow to="/settings" onClick={onClose} icon={<Gear size={20} />}>
              Configurações
            </MenuRow>
            <MenuRow
              danger
              icon={<SignOut size={20} />}
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              Sair
            </MenuRow>
          </VStack>
        ) : (
          <Flex gap={3} pt={1}>
            <Button
              flex={1}
              onClick={() => {
                onClose();
                openSignUpModal();
              }}
            >
              Criar conta
            </Button>
            <Button
              flex={1}
              variant="outline"
              onClick={() => {
                onClose();
                openLoginPopover();
              }}
            >
              Entrar
            </Button>
          </Flex>
        )}
      </Box>
    </Portal>
  );
}
