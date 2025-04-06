import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { useEffect, useState, useMemo } from "react";
import { getUserData, UserData } from "../../services/users";
import { Link as RouterLink } from "react-router-dom";
import { FollowButton } from "./FollowButton";
import { useAuth } from "../../contexts/AuthContext";
import { UserName } from "../common/UserName";
import { UserAvatar } from "../common/UserAvatar";
import { MagnifyingGlass } from "@phosphor-icons/react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser } = useAuth();
  const [lastFetchedIds, setLastFetchedIds] = useState<string[]>([]);

  // Efeito para gerenciar o carregamento de dados quando o modal é aberto
  useEffect(() => {
    if (!isOpen) {
      return; // Não faz nada se o modal estiver fechado
    }

    // Função para buscar os dados dos usuários
    const fetchUsers = async () => {
      // Se não houver IDs, definimos arrays vazios e terminamos
      if (userIds.length === 0) {
        setUsers([]);
        setLastFetchedIds([]);
        setIsLoading(false);
        return;
      }

      // Verificamos se os IDs são os mesmos da última busca
      const idsChanged = JSON.stringify(userIds) !== JSON.stringify(lastFetchedIds);
      
      // Se os IDs não mudaram e já buscamos anteriormente, não precisamos buscar novamente
      if (!idsChanged && lastFetchedIds.length > 0) {
        setIsLoading(false);
        return;
      }

      // Se chegamos aqui, precisamos buscar os dados
      setIsLoading(true);
      
      try {
        const usersData = await Promise.all(
          userIds.map(async (userId) => {
            const userData = await getUserData(userId);
            return userData;
          })
        );
        setUsers(usersData.filter((user): user is UserData => user !== null));
        setLastFetchedIds(userIds);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [isOpen, userIds]); // Removemos lastFetchedIds das dependências para evitar o loop

  // Resetar busca quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filtrar usuários com base na consulta de busca
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user => 
      (user.displayName?.toLowerCase().includes(query)) || 
      (user.username?.toLowerCase().includes(query)) || 
      (user.email?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

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
              {/* Campo de busca */}
              <InputGroup size="sm" mb={2}>
                <InputLeftElement pointerEvents="none">
                  <MagnifyingGlass size={16} color="#CBD5E0" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar por nome ou username"
                  bg="gray.700"
                  border="none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  _focus={{ borderColor: "primary.400", boxShadow: "0 0 0 1px var(--chakra-colors-primary-400)" }}
                />
              </InputGroup>
              
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <HStack key={user.id} spacing={4} p={2} borderRadius="md" bg="gray.700">
                    <RouterLink to={`/u/${user.username || user.id}`}>
                      <UserAvatar
                        size="md"
                        userId={user.id}
                        photoURL={user.photoURL}
                        name={user.displayName || user.email?.split("@")[0]}
                      />
                    </RouterLink>
                    <Box flex="1">
                      <UserName userId={user.id} />
                    </Box>
                    {currentUser?.uid !== user.id && (
                      <FollowButton userId={user.id} />
                    )}
                  </HStack>
                ))
              ) : (
                <Text color="gray.400" textAlign="center" py={4}>
                  {searchQuery 
                    ? `Nenhum resultado encontrado para "${searchQuery}".`
                    : "Nenhum usuário encontrado."}
                </Text>
              )}
            </VStack>
          ) : (
            <Text color="gray.400" textAlign="center">
              {type === "followers" 
                ? "Este usuário ainda não tem seguidores." 
                : "Este usuário ainda não segue ninguém."}
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
} 