import { Text, Link, Spinner, Box } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUserData } from "../../services/users";

interface UserNameProps {
  userId: string;
  color?: string;
  showAt?: boolean;
}

export function UserName({ userId, color = "white", showAt = true }: UserNameProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userData = await getUserData(userId);
        if (userData?.username) {
          setUsername(userData.username);
          setDisplayName(userData.username); // Usamos o username como display principal
        } else {
          // Só usamos o displayName se não houver username
          setDisplayName(userData?.displayName || userData?.email?.split("@")[0] || "Usuário");
        }
      } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
        setDisplayName("Usuário");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  if (isLoading) {
    return <Spinner size="sm" color="primary.500" />;
  }

  return (
    <Link
      as={RouterLink}
      to={`/u/${username}`}
      color={color}
      _hover={{ textDecoration: "underline", color: "primary.300" }}
      fontSize={{ base: "sm", md: "md" }}
      fontWeight="medium"
    >
      <Box as="span" display="inline">
        {showAt && username ? "@" : ""}{displayName}
      </Box>
    </Link>
  );
} 