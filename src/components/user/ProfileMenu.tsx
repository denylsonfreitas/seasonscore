import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  Avatar,
  IconButton,
  useToast,
  Flex,
  Text,
  Box,
} from "@chakra-ui/react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserCircle, Gear, SignOut } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";

interface ProfileMenuProps {
  isMobile?: boolean;
  onMobileMenuOpen?: () => void;
  size?: "xs" | "sm" | "md" | "lg";
}

export function ProfileMenu({ isMobile = false, onMobileMenuOpen, size = "sm" }: ProfileMenuProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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

  // Se for mobile, retorna apenas o ícone que abre o menu mobile
  if (isMobile && onMobileMenuOpen) {
    return (
      <IconButton
        aria-label="Menu"
        icon={
          <Avatar
            size={size}
            src={currentUser?.photoURL || undefined}
          />
        }
        variant="unstyled"
        color="white"
        onClick={onMobileMenuOpen}
      />
    );
  }

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        variant="unstyled"
        aria-label="Opções do usuário"
        icon={
          <Avatar
            size={size}
            src={currentUser?.photoURL || undefined}
          />
        }
      />
      <MenuList 
        bg="gray.800" 
        borderColor="gray.700" 
        boxShadow="dark-lg" 
        p={2}
        borderRadius="md"
      >
        {/* Cabeçalho com informações do usuário */}
        <Flex 
          direction="column" 
          p={3} 
          borderBottom="1px solid" 
          borderColor="gray.700" 
          mb={2}
        >
          <Text 
            fontWeight="semibold" 
            color="white" 
            fontSize="sm"
          >
            {currentUser?.displayName || "Usuário"}
          </Text>
          <Text 
            color="gray.400" 
            fontSize="xs"
          >
            {currentUser?.username}
          </Text>
        </Flex>
        
        {/* Itens do menu */}
        <MenuItem
          as={RouterLink}
          to="/profile"
          py={2.5}
          borderRadius="md"
          color="gray.200"
          bg="gray.800"
          _hover={{ bg: "gray.700" }}
          fontSize="sm"
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
        </MenuItem>
        
        <MenuItem
          as={RouterLink}
          to="/settings"
          py={2.5}
          borderRadius="md"
          color="gray.200"
          bg="gray.800"
          _hover={{ bg: "gray.700" }}
          fontSize="sm"
          my={1}
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
        </MenuItem>
        
        <MenuDivider borderColor="gray.700" my={2} />
        
        <MenuItem
          onClick={handleLogout}
          py={2.5}
          borderRadius="md"
          color="gray.200"
          bg="gray.800"
          _hover={{ bg: "red.900" }}
          fontSize="sm"
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
        </MenuItem>
      </MenuList>
    </Menu>
  );
} 