import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  HStack,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Gear, SignOut } from "@phosphor-icons/react";

export function UserMenu() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Menu>
      <MenuButton>
        <Avatar
          size="sm"
          src={currentUser?.photoURL || undefined}
          name={currentUser?.displayName || undefined}
        />
      </MenuButton>
      <MenuList bg="gray.800" borderColor="gray.700">
        <Text color="gray.400" fontSize="sm" px={3} py={2}>
          {currentUser?.displayName || "Usuário"}
        </Text>
        <Divider borderColor="gray.700" />
        <MenuItem
          onClick={() => {
            if (currentUser?.username) {
              navigate(`/u/${currentUser.username}`);
            } else {
              navigate("/settings");
              toast({
                title: "Nome de usuário não definido",
                description: "Por favor, defina seu nome de usuário nas configurações.",
                status: "warning",
                duration: 3000,
                isClosable: true,
              });
            }
          }}
          bg="gray.800"
          _hover={{ bg: "gray.700" }}
          color="white"
          icon={<User weight="bold" />}
        >
          Perfil
        </MenuItem>
        <MenuItem
          onClick={() => navigate("/settings")}
          bg="gray.800"
          _hover={{ bg: "gray.700" }}
          color="white"
          icon={<Gear weight="bold" />}
        >
          Configurações
        </MenuItem>
        <Divider borderColor="gray.700" />
        <MenuItem
          onClick={handleSignOut}
          bg="gray.800"
          _hover={{ bg: "gray.700" }}
          color="red.400"
          icon={<SignOut weight="bold" />}
        >
          Sair
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
