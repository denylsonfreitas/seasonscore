import { User } from "@phosphor-icons/react";
import React from 'react';
import { Avatar, AvatarBadge, AvatarProps, useColorModeValue } from '@chakra-ui/react';

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'name' | 'icon'> {
  userId?: string;
  photoURL?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  showStatus?: boolean;
  isDeleted?: boolean;
  isDeletedExtra?: boolean;
  name?: string;
  onClick?: () => void;
  userEmail?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  photoURL,
  size = 'md',
  isOnline,
  showStatus = false,
  isDeleted = false,
  isDeletedExtra = false,
  name,
  onClick,
  userEmail,
  ...props
}) => {
  const { ...filteredProps } = props as { 
    displayName?: string
  } & AvatarProps;
  
  const userIsDeleted = isDeleted || 
                       !userId || 
                       isDeletedExtra || 
                       !photoURL || 
                       (name && name.toLowerCase().includes('excluído'));
  
  const bg = useColorModeValue('gray.300', 'gray.600');
  const badgeBorderColor = useColorModeValue('white', 'gray.800');
  return (
    <Avatar
      size={size}
      src={userIsDeleted ? undefined : photoURL || undefined}
      name={userIsDeleted ? "Usuário excluído" : name || (userEmail ? userEmail.split('@')[0] : 'Usuário')}
      bg={bg}
      icon={userIsDeleted ? <User weight="fill" /> : undefined}
      onClick={onClick}
      borderWidth={userIsDeleted ? '1px' : 0}
      borderColor="gray.500"
      opacity={userIsDeleted ? 0.7 : 1}
      {...filteredProps}
    >
      {showStatus && (
        <AvatarBadge
          boxSize="1em"
          bg={isOnline ? 'green.400' : 'gray.400'}
          borderWidth="2px"
          borderColor={badgeBorderColor}
        />
      )}
    </Avatar>
  );
}; 