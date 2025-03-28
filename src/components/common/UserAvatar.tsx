import { Avatar, Box, AvatarProps } from "@chakra-ui/react";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user data usando callback para evitar recriações
  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await getUserData(userId);
      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário para avatar:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Busca dados do usuário se necessário
  useEffect(() => {
    if (userId && !photoURL && !displayName && !isLoading) {
      fetchUserData();
    }
  }, [userId, photoURL, displayName, fetchUserData, isLoading]);

  // Memoizar a fonte da imagem e o nome para evitar cálculos repetidos
  const { userPhotoURL, userName } = useMemo(() => {
    // Determina a foto de perfil
    const userPhotoURL = photoURL || userData?.photoURL;
    
    // Determina o nome para exibição ou geração de iniciais
    const userName = displayName || 
                    userData?.displayName || 
                    userEmail || 
                    (userData?.email?.split("@")[0]) || 
                    "Usuário";
    
    return { userPhotoURL, userName };
  }, [photoURL, userData, displayName, userEmail]);

  // Memoizar as propriedades do Avatar
  const avatarProps = useMemo(() => {
    return {
      src: userPhotoURL || undefined,
      name: userName,
      bgGradient: !userPhotoURL ? "linear(to-r, primary.600, primary.400)" : undefined,
      color: "white",
      ...props
    };
  }, [userPhotoURL, userName, props]);

  return (
    <Box
      position="relative"
      borderRadius="full"
      overflow="hidden"
    >
      <Avatar {...avatarProps} />
    </Box>
  );
} 