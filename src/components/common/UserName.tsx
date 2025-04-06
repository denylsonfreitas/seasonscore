import { Text, Link, Spinner, Box } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUserData, ExtendedUserData } from "../../hooks/useUserData";

interface UserNameProps {
  userId: string;
  color?: string;
  showAt?: boolean;
}

export function UserName({ userId, color = "white", showAt = true }: UserNameProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const { userData, isLoading, error } = useUserData(userId);

  useEffect(() => {
    // Se o hook indica que o usuário foi excluído, mostrar "Usuário excluído"
    if (userData?.isDeleted) {
      setDisplayName("Usuário excluído");
      setUsername(null);
      return;
    }

    // Se temos dados do usuário, processar normalmente
    if (userData) {
      if (userData.username) {
        setUsername(userData.username);
        setDisplayName(userData.username); // Usamos o username como display principal
      } else {
        // Só usamos o displayName se não houver username
        setDisplayName(userData.displayName || userData.email?.split("@")[0] || "Usuário");
      }
    } else {
      // Se não temos dados, mostrar "Usuário excluído"
      setDisplayName("Usuário excluído");
      setUsername(null);
    }
  }, [userData]);

  if (isLoading) {
    return <Spinner size="sm" color="primary.500" />;
  }

  // Se o usuário foi excluído ou não encontrado, mostrar texto simples em vez de link
  if (userData?.isDeleted || !userData) {
    return (
      <Text
        color="gray.400"
        fontSize={{ base: "sm", md: "md" }}
        fontStyle="italic"
      >
        Usuário excluído
      </Text>
    );
  }

  return (
    <Link
      as={RouterLink}
      to={`/u/${username}`}
      color={color}
      _hover={{ color: "primary.300" }}
      fontSize={{ base: "sm", md: "xs" }}
      fontWeight="bold"
    >
      <Box as="span" display="inline">
        {showAt && username ? "@" : ""}{displayName}
      </Box>
    </Link>
  );
} 