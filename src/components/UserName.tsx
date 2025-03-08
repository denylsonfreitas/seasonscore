import { Text, Link, Spinner } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUserData } from "../services/users";

interface UserNameProps {
  userId: string;
  color?: string;
}

export function UserName({ userId, color = "white" }: UserNameProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userData = await getUserData(userId);
        setUserName(userData?.displayName || userData?.email?.split("@")[0] || "Usuário");
      } catch (error) {
        console.error("Erro ao buscar nome do usuário:", error);
        setUserName("Usuário");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, [userId]);

  if (isLoading) {
    return <Spinner size="sm" color="teal.500" />;
  }

  return (
    <Link
      as={RouterLink}
      to={`/profile/${userId}`}
      color={color}
      _hover={{ textDecoration: "underline", color: "teal.300" }}
    >
      <Text display="inline">{userName}</Text>
    </Link>
  );
} 