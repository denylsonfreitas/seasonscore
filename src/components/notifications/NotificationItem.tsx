import React, { memo } from 'react';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  HStack,
  Badge,
  Stack,
  Checkbox,
} from '@chakra-ui/react';
import {
  FaUser, FaComment, FaVideo, FaStar
} from 'react-icons/fa';
import { FaThumbsUp } from 'react-icons/fa';
import { Notification, NotificationType } from '../../services/notifications';
import { UserAvatar } from '../common/UserAvatar';
import { formatNotificationDate } from '../../utils/dateUtils';

// Propriedades para o componente NotificationItem
export interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  index: number;
  getItemAnimationStyle: (index: number) => any;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const NotificationItem = memo(({
  notification,
  onClick,
  index,
  getItemAnimationStyle,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: NotificationItemProps) => {
  // Verificar se o usuário está excluído
  const isUserDeleted = !notification.senderId || 
                        !notification.senderName || 
                        notification.isDeleted || 
                        notification.senderName === 'Usuário excluído';

  // Formatar data de criação
  const formattedDate = formatNotificationDate(notification.createdAt);
  
  // Definir o ícone com base no tipo de notificação
  const getNotificationIcon = () => {
    if (isUserDeleted) {
      return <FaUser />;
    }
    
    switch (notification.type) {
      case NotificationType.NEW_FOLLOWER:
        return <FaUser />;
      case NotificationType.NEW_COMMENT:
        return <FaComment />;
      case NotificationType.NEW_REACTION:
        return <FaThumbsUp />;
      case NotificationType.NEW_EPISODE:
        return <FaVideo />;
      case NotificationType.NEW_REVIEW:
        return <FaStar />;
      default:
        return <FaUser />;
    }
  };
  
  const bgColor = useColorModeValue(
    notification.read ? 'gray.700' : 'gray.750',
    notification.read ? 'gray.750' : 'gray.700'
  );
  
  const hoverBgColor = useColorModeValue('gray.600', 'gray.600');

  // Handler para lidar com o clique no checkbox
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(notification.id);
    }
  };

  // Renderizar o componente
  return (
    <Box
      borderBottomWidth="1px"
      borderBottomColor="gray.700"
      transition="all 0.2s"
      bg={bgColor}
      _hover={{ bg: hoverBgColor }}
      opacity="0"
      transform="translateY(10px)"
      style={getItemAnimationStyle(index)}
      onClick={() => onClick(notification)}
      cursor="pointer"
    >
      <Flex p={3} alignItems="center">
        {isSelectionMode && (
          <Box mr={2} onClick={handleCheckboxClick}>
            <Checkbox 
              isChecked={isSelected}
              colorScheme="primary"
              size="md"
            />
          </Box>
        )}
        
        <Box mr={3}>
          {notification.senderId ? (
            <UserAvatar
              userId={notification.senderId}
              photoURL={isUserDeleted ? null : notification.senderPhoto}
              size="sm"
              isDeleted={isUserDeleted}
              name={notification.senderName}
            />
          ) : (
            <Box
              borderRadius="full"
              bg="gray.600"
              p={2}
              fontSize="sm"
              color="white"
            >
              {getNotificationIcon()}
            </Box>
          )}
        </Box>

        <Stack flex="1" spacing={0.5}>
          <HStack>
            <Text 
              fontSize="sm" 
              fontWeight={notification.read ? "normal" : "bold"}
              color={notification.read ? "gray.300" : "white"}
              noOfLines={2}
            >
              {notification.message}
            </Text>
          </HStack>
          
          <HStack spacing={2}>
            <Text fontSize="xs" color="gray.400">
              {formattedDate}
            </Text>
            
            {!notification.read && (
              <Badge 
                colorScheme="primary" 
                variant="solid" 
                fontSize="9px"
                borderRadius="full"
                px={1.5}
              >
                Novo
              </Badge>
            )}
          </HStack>
        </Stack>
      </Flex>
    </Box>
  );
});

NotificationItem.displayName = 'NotificationItem';