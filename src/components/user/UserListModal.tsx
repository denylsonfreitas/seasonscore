import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  Box,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getUserData, UserData } from "../../services/users";
import { Link as RouterLink } from "react-router-dom";
import { FollowButton } from "./FollowButton";
import { useAuth } from "../../contexts/AuthContext";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  userIds: string[];
  type: "followers" | "following";
}

export function UserListModal({ isOpen, onClose, title, userIds, type }: UserListModalProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersData = await Promise.all(
          userIds.map(async (userId) => {
            const userData = await getUserData(userId);
            return userData;
          })
        );
        setUsers(usersData.filter((user): user is UserData => user !== null));
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [userIds, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader color="white">{title}</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          {isLoading ? (
            <Box textAlign="center" py={4}>
              <Spinner color="primary.500" />
            </Box>
          ) : users.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {users.map((user) => (
                <HStack key={user.id} spacing={4} p={2} borderRadius="md" bg="gray.700">
                  <RouterLink to={`/profile/${user.id}`}>
                    <Avatar
                      size="md"
                      src={user.photoURL ?? undefined}
                      name={user.displayName || user.email?.split("@")[0]}
                    />
                  </RouterLink>
                  <Box flex="1">
                    <RouterLink to={`/profile/${user.id}`}>
                      <Text color="white" fontWeight="bold" _hover={{ color: "primary.300" }}>
                        {user.displayName || user.email?.split("@")[0]}
                      </Text>
                    </RouterLink>
                  </Box>
                  {currentUser?.uid !== user.id && (
                    <FollowButton userId={user.id} />
                  )}
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text color="gray.400" textAlign="center">
              Nenhum usuário encontrado.
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 