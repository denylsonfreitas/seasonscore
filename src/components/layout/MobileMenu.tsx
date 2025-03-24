import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  Link,
  Box,
  Avatar,
  Text,
  Flex,
  Divider,
  Button,
} from "@chakra-ui/react";
import {
  TelevisionSimple,
  Confetti,
  TrendUp,
  SignOut,
  Gear,
  UserCircle,
  Star,
} from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";
import { ExtendedUser } from "../../types/auth";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ExtendedUser | null;
  onLogout: () => void;
  seriesColor: string;
  popularColor: string;
  recentColor: string;
  top10Color: string;
  openSignUpModal: () => void;
  openLoginPopover: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  seriesColor,
  popularColor,
  recentColor,
  top10Color,
  openSignUpModal,
  openLoginPopover,
}: MobileMenuProps) {
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg="gray.800">
        <DrawerCloseButton color="gray.300" />
        <DrawerHeader borderBottomWidth="1px" borderColor="gray.600" pb={4}>
          {currentUser ? (
            <Link as={RouterLink} to="/profile" _hover={{ textDecoration: "none" }} onClick={() => onClose()}>
              <Flex direction="row" gap={3} align="center">
                <Avatar
                  size="md"
                  src={currentUser.photoURL || undefined}
                  name={currentUser.displayName || undefined}
                />
                <Text fontWeight="bold" color="gray.300">
                  {currentUser.username}
                </Text>
              </Flex>
            </Link>
          ) : (
            <Text color="gray.300">Menu</Text>
          )}
        </DrawerHeader>

        <DrawerBody bg="gray.800">
          <VStack spacing={3} align="stretch" pt={2}>
            <Link
              as={RouterLink}
              to="/series"
              color="gray.300"
              _hover={{ color: "linkhome.series" }}
              onClick={onClose}
              display="flex"
              alignItems="center"
              gap={3}
              py={2}
            >
              <Box 
                bg="gray.700" 
                p={2} 
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <TelevisionSimple weight="fill" size={18} color={seriesColor} />
              </Box>
              Séries
            </Link>
            <Link
              as={RouterLink}
              to="/series/popular"
              color="gray.300"
              _hover={{ color: "linkhome.popular" }}
              onClick={onClose}
              display="flex"
              alignItems="center"
              gap={3}
              py={2}
            >
              <Box 
                bg="gray.700" 
                p={2} 
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <TrendUp weight="fill" size={18} color={popularColor} />
              </Box>
              Populares
            </Link>
            <Link
              as={RouterLink}
              to="/series/recent"
              color="gray.300"
              _hover={{ color: "linkhome.recent" }}
              onClick={onClose}
              display="flex"
              alignItems="center"
              gap={3}
              py={2}
            >
              <Box 
                bg="gray.700" 
                p={2} 
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Confetti weight="fill" size={18} color={recentColor} />
              </Box>
              Novidades
            </Link>
            <Link
              as={RouterLink}
              to="/series/top10"
              color="gray.300"
              _hover={{ color: "linkhome.top10" }}
              onClick={onClose}
              display="flex"
              alignItems="center"
              gap={3}
              py={2}
            >
              <Box 
                bg="gray.700" 
                p={2} 
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Star weight="fill" size={18} color={top10Color} />
              </Box>
              Top 10
            </Link>

            {currentUser ? (
              <>
                <Divider borderColor="gray.600" />
                <Link
                  as={RouterLink}
                  to="/profile"
                  color="gray.300"
                  _hover={{ color: "primary.200" }}
                  onClick={() => onClose()}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  py={2}
                >
                  <Box 
                    bg="blue.500" 
                    p={2} 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <UserCircle weight="fill" size={18} color="white" />
                  </Box>
                  Meu Perfil
                </Link>
                <Link
                  as={RouterLink}
                  to="/settings"
                  color="gray.300"
                  _hover={{ color: "primary.200" }}
                  onClick={onClose}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  py={2}
                >
                  <Box 
                    bg="primary.500" 
                    p={2} 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Gear weight="fill" size={18} color="white" />
                  </Box>
                  Configurações
                </Link>
                <Divider borderColor="gray.600" />
                <Link
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  color="gray.300"
                  _hover={{ color: "primary.200" }}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  py={2}
                >
                  <Box 
                    bg="red.500" 
                    p={2} 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <SignOut weight="fill" size={18} color="white" />
                  </Box>
                  Sair da Conta
                </Link>
              </>
            ) : (
              <VStack align="stretch" spacing={3} mt={2}>
                <Button
                  onClick={() => {
                    onClose();
                    openSignUpModal();
                  }}
                  variant="solid"
                  colorScheme="primary"
                  justifyContent="center"
                  height="44px"
                >
                  Criar Conta
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    openLoginPopover();
                  }}
                  variant="outline"
                  colorScheme="blue"
                  justifyContent="center"
                  height="44px"
                  borderColor="blue.600"
                >
                  Entrar
                </Button>
              </VStack>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
} 