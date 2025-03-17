import {
  Box,
  Container,
  HStack,
  Link,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  Avatar,
  Text,
  Flex,
  Divider,
  Image,
} from "@chakra-ui/react";
import {
  TelevisionSimple,
  Confetti,
  TrendUp,
  SignOut,
  List,
  Gear,
  UserCircle,
  Star,
} from "@phosphor-icons/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ExtendedUser } from "../../types/auth";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { QuickAddButton } from "../common/QuickAddButton";
import { ProfileMenu } from "../user/ProfileMenu";

export function Navbar() {
  const { currentUser } = useAuth() as {
    currentUser: ExtendedUser | null;
  };
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
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
    >
      <Container maxW="1200px" py={2}>
        <HStack justify="space-between" align="center">
          {/* Logo e Menu de Navegação à esquerda */}
          <HStack spacing={6}>
            <Link
              as={RouterLink}
              to="/"
              fontSize="lg"
              fontWeight="bold"
              color="white"
              _hover={{ textDecoration: "none", color: "teal.300" }}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Image src="/icon.svg" alt="SeasonScore Logo" boxSize="24px" />
              SeasonScore
            </Link>

            {/* Menu de Navegação */}
            <HStack spacing={5} display={{ base: "none", md: "flex" }}>
              <Link
                as={RouterLink}
                to="/series"
                color="gray.300"
                _hover={{ color: "brand.200" }}
                fontSize="sm"
              >
                Séries
              </Link>
              <Link
                as={RouterLink}
                to="/series/popular"
                color="gray.300"
                _hover={{ color: "brand.200" }}
                fontSize="sm"
              >
                Populares
              </Link>
              <Link
                as={RouterLink}
                to="/series/recent"
                color="gray.300"
                _hover={{ color: "brand.200" }}
                fontSize="sm"
              >
                Novidades
              </Link>
              <Link
                as={RouterLink}
                to="/series/top10"
                color="gray.300"
                _hover={{ color: "brand.200" }}
                fontSize="sm"
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
                
                {/* Menu Mobile */}
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
                  <Button as={RouterLink} to="/signup" variant="solid" size="sm">
                    Criar Conta
                  </Button>
                  <Button as={RouterLink} to="/login" variant="solid" size="sm">
                    Entrar
                  </Button>
                </HStack>
                
                {/* Botões Mobile */}
                <HStack spacing={3} display={{ base: "flex", md: "none" }}>
                  <Button 
                    as={RouterLink} 
                    to="/login" 
                    variant="outline" 
                    size="sm" 
                    colorScheme="teal"
                  >
                    Entrar
                  </Button>
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

      {/* Drawer Mobile */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.800">
          <DrawerCloseButton color="gray.300" />
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.600" pb={4}>
            {currentUser ? (
              <Flex direction="row" gap={3} align="center">
                <Avatar
                  size="md"
                  src={currentUser.photoURL || undefined}
                  name={currentUser.displayName || undefined}
                />
                <Text fontWeight="medium" color="gray.300">
                  {currentUser.displayName || currentUser.email}
                </Text>
              </Flex>
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
                _hover={{ color: "brand.200" }}
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
                  <TelevisionSimple weight="fill" size={18} color="#38B2AC" />
                </Box>
                Séries
              </Link>
              <Link
                as={RouterLink}
                to="/series/popular"
                color="gray.300"
                _hover={{ color: "brand.200" }}
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
                  <TrendUp weight="fill" size={18} color="#4299E1" />
                </Box>
                Populares
              </Link>
              <Link
                as={RouterLink}
                to="/series/recent"
                color="gray.300"
                _hover={{ color: "brand.200" }}
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
                  <Confetti weight="fill" size={18} color="#9F7AEA" />
                </Box>
                Novidades
              </Link>
              <Link
                as={RouterLink}
                to="/series/top10"
                color="gray.300"
                _hover={{ color: "brand.200" }}
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
                  <Star weight="fill" size={18} color="#F6AD55" />
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
                    _hover={{ color: "brand.200" }}
                    onClick={onClose}
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
                    _hover={{ color: "brand.200" }}
                    onClick={onClose}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    py={2}
                  >
                    <Box 
                      bg="teal.500" 
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
                  <Button
                    onClick={() => {
                      onClose();
                      navigate("/login");
                    }}
                    variant="ghost"
                    color="red.400"
                    justifyContent="flex-start"
                    leftIcon={
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
                    }
                    _hover={{ bg: "red.900", color: "white" }}
                    py={2}
                    pl={0}
                    gap={3}
                  >
                    Sair da Conta
                  </Button>
                </>
              ) : (
                <VStack align="stretch" spacing={3} mt={2}>
                  <Button
                    as={RouterLink}
                    to="/signup"
                    variant="solid"
                    onClick={onClose}
                    colorScheme="teal"
                    leftIcon={
                      <Box 
                        bg="teal.600" 
                        p={1.5} 
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <UserCircle weight="fill" size={18} color="white" />
                      </Box>
                    }
                    justifyContent="flex-start"
                    height="44px"
                  >
                    Criar Conta
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="outline"
                    colorScheme="blue"
                    onClick={onClose}
                    leftIcon={
                      <Box 
                        bg="blue.600" 
                        p={1.5} 
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <SignOut weight="fill" size={18} color="white" transform="rotate(180deg)" />
                      </Box>
                    }
                    justifyContent="flex-start"
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
    </Box>
  );
}
