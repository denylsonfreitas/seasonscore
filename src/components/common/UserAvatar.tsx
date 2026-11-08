import { User } from "@phosphor-icons/react";
import type React from "react";
import { Avatar, AvatarBadge, type AvatarProps } from "@chakra-ui/react";

interface UserAvatarProps extends Omit<AvatarProps, "src" | "name" | "icon"> {
  userId?: string;
  photoURL?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  isOnline?: boolean;
  showStatus?: boolean;
  isDeleted?: boolean;
  isDeletedExtra?: boolean;
  /** Nome exibido; usado para as iniciais quando não há foto. */
  name?: string;
  onClick?: () => void;
  /** Nome de usuário (campo mantido com este nome por compatibilidade). */
  userEmail?: string;
}

/** Avatar circular: foto, iniciais sobre ink.800 ou ícone para conta excluída. */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  photoURL,
  size = "md",
  isOnline,
  showStatus = false,
  isDeleted = false,
  isDeletedExtra = false,
  name,
  onClick,
  userEmail,
  userId: _userId,
  ...props
}) => {
  const deleted =
    isDeleted || isDeletedExtra || (name ? name.toLowerCase().includes("excluído") : false);
  const label = name || (userEmail ? userEmail.split("@")[0] : undefined);

  return (
    <Avatar
      size={size}
      src={deleted ? undefined : photoURL || undefined}
      name={deleted ? undefined : label}
      bg="ink.800"
      color="ink.200"
      fontFamily="mono"
      icon={<User />}
      onClick={onClick}
      opacity={deleted ? 0.6 : 1}
      aria-label={deleted ? "Usuário excluído" : label}
      {...props}
    >
      {showStatus && (
        <AvatarBadge
          boxSize="1em"
          bg={isOnline ? "signal.400" : "ink.400"}
          borderWidth="2px"
          borderColor="ink.950"
        />
      )}
    </Avatar>
  );
};
