import { Avatar, Box, AvatarProps } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getUserData } from "../../services/users";

interface UserAvatarProps extends Omit<AvatarProps, "src" | "name"> {
  userId?: string;
  userEmail?: string;
  photoURL?: string | null;
  displayName?: string;
}

/**
 * Componente padronizado para Avatar de usuários
 * Aceita todas as props do Avatar do Chakra UI, exceto src e name que são gerenciados internamente
 */
export function UserAvatar({ 
  userId, 
  userEmail, 
  photoURL,
  displayName, 
  ...props 
}: UserAvatarProps) {
  const [userData, setUserData] = useState<{
    photoURL?: string | null;
    displayName?: string;
    email?: string;
  } | null>(null);

  // Busca dados do usuário se necessário
  useEffect(() => {
    if (userId && !photoURL && !displayName) {
      const fetchUserData = async () => {
        try {
          const data = await getUserData(userId);
          if (data) {
            setUserData(data);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário para avatar:", error);
        }
      };
      fetchUserData();
    }
  }, [userId, photoURL, displayName]);

  // Determina a foto de perfil
  const userPhotoURL = photoURL || userData?.photoURL;
  
  // Determina o nome para exibição ou geração de iniciais
  const userName = displayName || userData?.displayName || userEmail || userData?.email?.split("@")[0] || "Usuário";

  return (
    <Box
      position="relative"
      borderRadius="full"
      overflow="hidden"
    >
      <Avatar
        src={userPhotoURL || undefined}
        name={userName}
        bgGradient={!userPhotoURL ? "linear(to-r, primary.600, primary.400)" : undefined}
        color="white"
        {...props}
      />
    </Box>
  );
} 