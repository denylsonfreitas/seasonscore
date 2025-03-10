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
  useToast,
  MenuDivider,
  MenuGroup,
  Flex,
  Divider,
} from "@chakra-ui/react";
import {
  TelevisionSimple,
  ClockCounterClockwise,
  TrendUp,
  SignOut,
  List,
  Gear,
  UserCircle,
  CaretDown,
  Star,
} from "@phosphor-icons/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { ExtendedUser } from "../types/auth";

export function Navbar() {
  const { currentUser, logout } = useAuth() as { currentUser: ExtendedUser | null, logout: () => Promise<void> };
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = async () => {
    try {
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/series?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      navigate(`/series?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
      <Container maxW="1200px" py={4}>
        <HStack justify="space-between">
          <HStack spacing={8}>
            <Link
              as={RouterLink}
              to="/"
              fontSize="xl"
              fontWeight="bold"
              color="white"
              _hover={{ textDecoration: "none", color: "teal.300" }}
            >
              SeasonScore
            </Link>

            {/* Menu Desktop */}
            <HStack spacing={6} display={{ base: "none", md: "flex" }}>
              <Link
                as={RouterLink}
                to="/series"
                color="gray.300"
                _hover={{ color: "teal.300" }}
              >
                Séries
              </Link>
              <Link
                as={RouterLink}
                to="/series/popular"
                color="gray.300"
                _hover={{ color: "teal.300" }}
              >
                Populares
              </Link>
              <Link
                as={RouterLink}
                to="/series/recent"
                color="gray.300"
                _hover={{ color: "teal.300" }}
              >
                Recentes
              </Link>
              <Link
                as={RouterLink}
                to="/series/top10"
                color="gray.300"
                _hover={{ color: "teal.300" }}
              >
                Top 10
              </Link>
            </HStack>
          </HStack>

          {/* Menu Usuário Desktop */}
          <HStack spacing={4} display={{ base: "none", md: "flex" }}>
            {currentUser ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "gray.700" }}
                  _active={{ bg: "gray.700" }}
                  rightIcon={<CaretDown weight="bold" />}
                >
                  <HStack spacing={3}>
                    <Avatar
                      size="sm"
                      src={currentUser.photoURL || undefined}
                      name={currentUser.displayName || undefined}
                    />
                    <Box textAlign="left">
                      <Text fontSize="sm" fontWeight="medium">
                        {currentUser.displayName || currentUser.email?.split("@")[0]}
                      </Text>
                    </Box>
                  </HStack>
                </MenuButton>
                <MenuList bg="gray.700" borderColor="gray.600" p={2}>
                  <MenuGroup title="Conta" color="gray.400" ml={3} mb={1}>
                    <MenuItem
                      as={RouterLink}
                      to="/profile"
                      icon={<UserCircle weight="fill" />}
                      bg="gray.700"
                      color="white"
                      _hover={{ bg: "gray.600" }}
                      borderRadius="md"
                      px={3}
                    >
                      Meu Perfil
                    </MenuItem>
                    <MenuItem
                      as={RouterLink}
                      to="/settings"
                      icon={<Gear weight="fill" />}
                      bg="gray.700"
                      color="white"
                      _hover={{ bg: "gray.600" }}
                      borderRadius="md"
                      px={3}
                    >
                      Configurações
                    </MenuItem>
                  </MenuGroup>
                  <MenuDivider borderColor="gray.600" />
                  <MenuItem
                    onClick={handleLogout}
                    icon={<SignOut weight="fill" />}
                    bg="gray.700"
                    color="red.300"
                    _hover={{ bg: "gray.600" }}
                    borderRadius="md"
                    px={3}
                  >
                    Sair da Conta
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <HStack spacing={4}>
                <Button
                  as={RouterLink}
                  to="/signup"
                  colorScheme="teal"
                  variant="ghost"
                >
                  Criar Conta
                </Button>
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme="teal"
                  variant="solid"
                >
                  Entrar
                </Button>
              </HStack>
            )}
          </HStack>

          {/* Menu Mobile */}
          <IconButton
            aria-label="Menu"
            icon={<List weight="bold" />}
            variant="ghost"
            color="white"
            display={{ base: "flex", md: "none" }}
            onClick={onOpen}
          />
        </HStack>
      </Container>

      {/* Drawer Mobile */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.800">
          <DrawerCloseButton color="white" />
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.700">
            {currentUser ? (
              <Flex direction="column" gap={2}>
                <Avatar
                  size="md"
                  src={currentUser.photoURL || undefined}
                  name={currentUser.displayName || undefined}
                />
                <Box>
                  <Text color="white" fontWeight="medium">
                    {currentUser.displayName || currentUser.email?.split("@")[0]}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {currentUser.email}
                  </Text>
                </Box>
              </Flex>
            ) : (
              <Text color="white">Menu</Text>
            )}
          </DrawerHeader>

          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Link
                as={RouterLink}
                to="/series"
                color="gray.300"
                _hover={{ color: "teal.300" }}
                onClick={onClose}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <TelevisionSimple weight="fill" />
                Séries
              </Link>
              <Link
                as={RouterLink}
                to="/series/popular"
                color="gray.300"
                _hover={{ color: "teal.300" }}
                onClick={onClose}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <TrendUp weight="fill" />
                Populares
              </Link>
              <Link
                as={RouterLink}
                to="/series/recent"
                color="gray.300"
                _hover={{ color: "teal.300" }}
                onClick={onClose}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <ClockCounterClockwise weight="fill" />
                Recentes
              </Link>
              <Link
                as={RouterLink}
                to="/series/top10"
                color="gray.300"
                _hover={{ color: "teal.300" }}
                onClick={onClose}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Star weight="fill" />
                Top 10
              </Link>

              {currentUser ? (
                <>
                  <Divider borderColor="gray.600" />
                  <Link
                    as={RouterLink}
                    to="/profile"
                    color="gray.300"
                    _hover={{ color: "teal.300" }}
                    onClick={onClose}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <UserCircle weight="fill" />
                    Meu Perfil
                  </Link>
                  <Link
                    as={RouterLink}
                    to="/settings"
                    color="gray.300"
                    _hover={{ color: "teal.300" }}
                    onClick={onClose}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Gear weight="fill" />
                    Configurações
                  </Link>
                  <Divider borderColor="gray.600" />
                  <Button
                    onClick={() => {
                      handleLogout();
                      onClose();
                    }}
                    variant="ghost"
                    color="red.300"
                    justifyContent="flex-start"
                    leftIcon={<SignOut weight="fill" />}
                    _hover={{ bg: "gray.700" }}
                    p={0}
                  >
                    Sair da Conta
                  </Button>
                </>
              ) : (
                <VStack align="stretch" spacing={4}>
                  <Button
                    as={RouterLink}
                    to="/signup"
                    colorScheme="teal"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Criar Conta
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme="teal"
                    variant="solid"
                    onClick={onClose}
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
