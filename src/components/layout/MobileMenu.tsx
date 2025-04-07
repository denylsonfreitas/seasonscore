import {
  Box,
  Text,
  Flex,
  Button,
  Portal,
  Divider,
  useToast,
} from "@chakra-ui/react";
import {
  TelevisionSimple,
  Confetti,
  TrendUp,
  SignOut,
  Gear,
  UserCircle,
  Star,
  Note,
  UsersThree,
} from "@phosphor-icons/react";
import { TbRosetteNumber1 } from "react-icons/tb";
import { Link as RouterLink } from "react-router-dom";
import { ExtendedUser } from "../../types/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ExtendedUser | null;
  onLogout: () => void;
  seriesColor: string;
  recentColor: string;
  top10Color: string;
  reviewsColor: string;
  listsColor: string;
  communityColor: string;
  openSignUpModal: () => void;
  openLoginPopover: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  seriesColor,
  recentColor,
  top10Color,
  reviewsColor,
  listsColor,
  communityColor,
  openSignUpModal,
  openLoginPopover,
}: MobileMenuProps) {
  // Usar estado local para gerenciar a animação em vez do hook completo
  const [isVisible, setIsVisible] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Função para criar estilos de animação para itens de menu
  const getItemAnimationStyle = (index: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(10px)",
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${
      index * 0.04 + 0.15
    }s`,
  });

  // Ajustar visibilidade baseado na prop isOpen
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <Portal>
      {/* Overlay invisível que fecha o menu quando clicado */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex={1200}
        onClick={onClose}
        bg="blackAlpha.500"
        opacity={isVisible ? 1 : 0}
        transition="opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
        pointerEvents={isVisible ? "auto" : "none"}
      />

      <Box
        bg="gray.800"
        borderColor="gray.700"
        boxShadow="dark-lg"
        p={2}
        borderRadius="md"
        minWidth="260px"
        zIndex={1300}
        position="fixed"
        top="60px"
        right="16px"
        borderWidth="1px"
        onClick={(e) => e.stopPropagation()} // Evita que cliques no menu fechem ele
        transform={
          isVisible ? "translateY(0) scale(1)" : "translateY(-25px) scale(0.92)"
        }
        opacity={isVisible ? 1 : 0}
        transition="transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
        transformOrigin="top right"
        willChange="transform, opacity"
      >
        {/* Cabeçalho - apenas para usuários logados */}
        {currentUser && (
          <>
            <Flex
              direction="column"
              p={3}
              borderBottom="1px solid"
              borderColor="gray.700"
              mb={2}
              style={getItemAnimationStyle(0)}
            >
              <Text fontWeight="semibold" color="white" fontSize="sm">
                {currentUser?.displayName || "Usuário"}
              </Text>
              <Text color="gray.400" fontSize="xs">
                {currentUser?.username}
              </Text>
            </Flex>
          </>
        )}

        {/* Itens de Menu */}
        <Box style={getItemAnimationStyle(1)}>
          <RouterLink to="/series">
            <Flex
              align="center"
              py={2.5}
              px={3}
              borderRadius="md"
              _hover={{ bg: "gray.700" }}
              onClick={onClose}
            >
              <Box
                p={2}
                borderRadius="md"
                mr={3}
                bg="gray.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <TelevisionSimple weight="fill" size={18} color={seriesColor} />
              </Box>
              <Text color="gray.100" fontWeight="medium">
                Séries
              </Text>
            </Flex>
          </RouterLink>
        </Box>

        <Box style={getItemAnimationStyle(3)}>
          <RouterLink to="/series/recent">
            <Flex
              align="center"
              py={2.5}
              px={3}
              borderRadius="md"
              _hover={{ bg: "gray.700" }}
              onClick={onClose}
            >
              <Box
                p={2}
                borderRadius="md"
                mr={3}
                bg="gray.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <TrendUp weight="fill" size={18} color={recentColor} />
              </Box>
              <Text color="gray.100" fontWeight="medium">
                Novidades
              </Text>
            </Flex>
          </RouterLink>
        </Box>

        <Box style={getItemAnimationStyle(4)}>
          <RouterLink to="/series/top10">
            <Flex
              align="center"
              py={2.5}
              px={3}
              borderRadius="md"
              _hover={{ bg: "gray.700" }}
              onClick={onClose}
            >
              <Box
                p={2}
                borderRadius="md"
                mr={3}
                bg="gray.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <TbRosetteNumber1 height="fill" size={18} color={top10Color} />
              </Box>
              <Text color="gray.100" fontWeight="medium">
                Top 10
              </Text>
            </Flex>
          </RouterLink>
        </Box>

        <Box style={getItemAnimationStyle(5)}>
          <RouterLink to="/reviews">
            <Flex
              align="center"
              py={2.5}
              px={3}
              borderRadius="md"
              _hover={{ bg: "gray.700" }}
              onClick={onClose}
            >
              <Box
                p={2}
                borderRadius="md"
                mr={3}
                bg="gray.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Star weight="fill" size={18} color={reviewsColor} />
              </Box>
              <Text color="gray.100" fontWeight="medium">
                Avaliações
              </Text>
            </Flex>
          </RouterLink>
        </Box>

        <Box style={getItemAnimationStyle(6)}>
          <RouterLink to="/lists">
            <Flex
              align="center"
              py={2.5}
              px={3}
              borderRadius="md"
              _hover={{ bg: "gray.700" }}
              onClick={onClose}
            >
              <Box
                p={2}
                borderRadius="md"
                mr={3}
                bg="gray.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Note weight="fill" size={18} color={listsColor} />
              </Box>
              <Text color="gray.100" fontWeight="medium">
                Listas
              </Text>
            </Flex>
          </RouterLink>
        </Box>

        <Box style={getItemAnimationStyle(7)}>
          <RouterLink to="/community">
            <Flex
              align="center"
              py={2.5}
              px={3}
              borderRadius="md"
              _hover={{ bg: "gray.700" }}
              onClick={onClose}
            >
              <Box
                p={2}
                borderRadius="md"
                mr={3}
                bg="gray.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <UsersThree weight="fill" size={18} color={communityColor} />
              </Box>
              <Text color="gray.100" fontWeight="medium">
                Comunidade
              </Text>
            </Flex>
          </RouterLink>
        </Box>

        <Divider
          borderColor="gray.700"
          my={3}
          style={getItemAnimationStyle(7)}
        />

        {/* Ações do usuário na parte inferior */}
        {currentUser ? (
          <>
            <Box style={getItemAnimationStyle(8)}>
              <RouterLink to="/profile" onClick={onClose}>
                <Flex
                  align="center"
                  py={2.5}
                  px={3}
                  borderRadius="md"
                  _hover={{ bg: "gray.700" }}
                >
                  <Box
                    p={2}
                    borderRadius="md"
                    mr={3}
                    bg="blue.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <UserCircle weight="fill" size={18} color="white" />
                  </Box>
                  <Text color="gray.100" fontWeight="medium">
                    Meu Perfil
                  </Text>
                </Flex>
              </RouterLink>
            </Box>

            <Box style={getItemAnimationStyle(9)}>
              <RouterLink to="/settings">
                <Flex
                  align="center"
                  py={2.5}
                  px={3}
                  borderRadius="md"
                  _hover={{ bg: "gray.700" }}
                  onClick={onClose}
                >
                  <Box
                    p={2}
                    borderRadius="md"
                    mr={3}
                    bg="primary.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Gear weight="fill" size={18} color="white" />
                  </Box>
                  <Text color="gray.100" fontWeight="medium">
                    Configurações
                  </Text>
                </Flex>
              </RouterLink>
            </Box>

            <Box style={getItemAnimationStyle(10)}>
              <Flex
                align="center"
                py={2.5}
                px={3}
                borderRadius="md"
                _hover={{ bg: "red.900" }}
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                cursor="pointer"
              >
                <Box
                  p={2}
                  borderRadius="md"
                  mr={3}
                  bg="red.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <SignOut weight="fill" size={18} color="white" />
                </Box>
                <Text color="gray.100" fontWeight="medium">
                  Sair da Conta
                </Text>
              </Flex>
            </Box>
          </>
        ) : (
          <Box style={getItemAnimationStyle(8)}>
            <Flex direction="column" p={3} gap={3}>
              <Button
                colorScheme="primary"
                size="md"
                borderRadius="md"
                fontWeight="semibold"
                onClick={() => {
                  onClose();
                  openSignUpModal();
                }}
                _hover={{ bg: "primary.600" }}
                _active={{ bg: "primary.700" }}
              >
                Criar conta
              </Button>
              <Button
                variant="outline"
                colorScheme="whiteAlpha"
                borderColor="gray.600"
                color="white"
                borderRadius="md"
                _hover={{ bg: "whiteAlpha.100" }}
                _active={{ bg: "whiteAlpha.200" }}
                onClick={() => {
                  onClose();
                  openLoginPopover();
                }}
              >
                Entrar
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </Portal>
  );
}
