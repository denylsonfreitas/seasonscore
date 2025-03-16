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
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import { ExtendedUser } from "../../types/auth";
import { NotificationMenu } from "../notifications/NotificationMenu";
import { UserMenu } from "../user/UserMenu";
import { SearchModal } from "./SearchModal";
import { QuickAddButton } from "../common/QuickAddButton";

export function Navbar() {
  const { currentUser, logout } = useAuth() as {
    currentUser: ExtendedUser | null;
    logout: () => Promise<void>;
  };
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();

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

  const handleSeriesSelect = (seriesId: number) => {
    onSearchClose();
    navigate(`/series/${seriesId}`);
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
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Image src="/icon.svg" alt="SeasonScore Logo" boxSize="30px" />
              SeasonScore
            </Link>

            {/* Menu Desktop */}
            <HStack spacing={6} display={{ base: "none", md: "flex" }}>
              <Link
                as={RouterLink}
                to="/series"
                color="gray.300"
                _hover={{ color: "brand.200" }}
              >
                Séries
              </Link>
              <Link
                as={RouterLink}
                to="/series/popular"
                color="gray.300"
                _hover={{ color: "brand.200" }}
              >
                Populares
              </Link>
              <Link
                as={RouterLink}
                to="/series/recent"
                color="gray.300"
                _hover={{ color: "brand.200" }}
              >
                Novidades
              </Link>
              <Link
                as={RouterLink}
                to="/series/top10"
                color="gray.300"
                _hover={{ color: "brand.200" }}
              >
                Top 10
              </Link>
            </HStack>
          </HStack>

          {/* Menu Usuário Desktop */}
          <HStack spacing={3} display={{ base: "none", md: "flex" }}>
            <IconButton
              aria-label="Buscar séries"
              icon={<MagnifyingGlass size={24} weight="bold" />}
              variant="ghost"
              color="white"
              onClick={onSearchOpen}
              _hover={{ bg: "gray.700" }}
            />
            {currentUser ? (
              <>
                <NotificationMenu />
                <Menu>
                  <MenuButton
                    as={IconButton}
                    variant="unstyled"
                    aria-label="Opções do usuário"
                    icon={
                      <Avatar
                        size="sm"
                        src={currentUser.photoURL || undefined}
                      />
                    }
                  />
                  <MenuList bg="gray.800" borderColor="gray.600">
                    <MenuGroup title={currentUser.displayName || "Usuário"} ml={3} mb={1} color="gray.300">
                      <MenuItem
                        as={RouterLink}
                        to="/profile"
                        icon={<UserCircle weight="fill" color="currentColor" />}
                        color="gray.300"
                        bg="gray.800"
                        _hover={{ bg: "gray.600" }}
                      >
                        Meu Perfil
                      </MenuItem>
                      <MenuItem
                        as={RouterLink}
                        to="/settings"
                        icon={<Gear weight="fill" color="currentColor" />}
                        color="gray.300"
                        bg="gray.800"
                        _hover={{ bg: "gray.600" }}
                      >
                        Configurações
                      </MenuItem>
                    </MenuGroup>
                    <MenuDivider borderColor="gray.600" />
                    <MenuItem
                      onClick={handleLogout}
                      icon={<SignOut weight="fill" color="currentColor" />}
                      color="red.400"
                      bg="gray.800"
                      _hover={{ bg: "gray.600" }}
                    >
                      Sair da Conta
                    </MenuItem>
                  </MenuList>
                </Menu>
                <QuickAddButton />
              </>
            ) : (
              <HStack spacing={4}>
                <Button as={RouterLink} to="/signup" variant="solid">
                  Criar Conta
                </Button>
                <Button as={RouterLink} to="/login" variant="solid">
                  Entrar
                </Button>
              </HStack>
            )}
          </HStack>

          {/* Menu Mobile */}
          <HStack spacing={3} display={{ base: "flex", md: "none" }}>
            <IconButton
              aria-label="Buscar séries"
              icon={<MagnifyingGlass size={24} weight="bold" />}
              variant="ghost"
              color="white"
              onClick={onSearchOpen}
              _hover={{ bg: "gray.700" }}
            />
            {currentUser && (
              <>
                <NotificationMenu />
                <IconButton
                  aria-label="Menu"
                  icon={
                    <Avatar
                      size="sm"
                      src={currentUser.photoURL || undefined}
                    />
                  }
                  variant="unstyled"
                  color="white"
                  onClick={onOpen}
                />
                <QuickAddButton />
              </>
            )}
            {!currentUser && (
              <IconButton
                aria-label="Menu"
                icon={<List weight="bold" />}
                variant="ghost"
                color="white"
                onClick={onOpen}
              />
            )}
          </HStack>
        </HStack>
      </Container>

      {/* Modal de Busca */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={onSearchClose} 
        onSelect={handleSeriesSelect}
      />

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
            <VStack spacing={4} align="stretch">
              <Link
                as={RouterLink}
                to="/series"
                color="gray.300"
                _hover={{ color: "brand.200" }}
                onClick={onClose}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <TelevisionSimple weight="fill" color="currentColor" />
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
                gap={2}
              >
                <TrendUp weight="fill" color="currentColor" />
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
                gap={2}
              >
                <Confetti weight="fill" color="currentColor" />
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
                gap={2}
              >
                <Star weight="fill" color="currentColor" />
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
                    gap={2}
                  >
                    <UserCircle weight="fill" color="currentColor" />
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
                    gap={2}
                  >
                    <Gear weight="fill" color="currentColor" />
                    Configurações
                  </Link>
                  <Divider borderColor="gray.600" />
                  <Button
                    onClick={() => {
                      handleLogout();
                      onClose();
                    }}
                    variant="ghost"
                    color="red.400"
                    justifyContent="flex-start"
                    leftIcon={<SignOut weight="fill" color="currentColor" />}
                    _hover={{ bg: "whiteAlpha.200" }}
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
                    variant="solid"
                    onClick={onClose}
                  >
                    Criar Conta
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/login"
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
