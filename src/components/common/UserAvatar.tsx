import React from 'react';
import { Avatar, AvatarBadge, AvatarProps, Box, useColorModeValue } from '@chakra-ui/react';
import { FaUser } from 'react-icons/fa';

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
  const { displayName, ...filteredProps } = props as { 
    displayName?: string
  } & AvatarProps;
  
  const userIsDeleted = isDeleted || 
                       !userId || 
                       isDeletedExtra || 
                       !photoURL || 
                       (name && name.toLowerCase().includes('excluído'));
  
  const bg = useColorModeValue('gray.300', 'gray.600');
  const iconColor = useColorModeValue('gray.600', 'gray.300');
  
  const FallbackAvatar = () => (
    <Box
      width="100%"
      height="100%"
      borderRadius="full"
      bg={bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <FaUser color={iconColor} size={size === 'xs' ? '10px' : size === 'sm' ? '14px' : '18px'} />
    </Box>
  );
  
  return (
    <Avatar
      size={size}
      src={userIsDeleted ? undefined : photoURL || undefined}
      name={userIsDeleted ? "Usuário excluído" : name || (userEmail ? userEmail.split('@')[0] : 'Usuário')}
      bg={bg}
      icon={userIsDeleted ? <FaUser /> : undefined}
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
          borderColor={useColorModeValue('white', 'gray.800')}
        />
      )}
    </Avatar>
  );
}; 