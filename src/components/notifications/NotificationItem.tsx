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
  useTheme,
} from '@chakra-ui/react';
import {
  FaUser, FaComment, FaVideo, FaStar
} from 'react-icons/fa';
import { FaHeart } from 'react-icons/fa';
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
  const theme = useTheme();
  
  // Definir cores padrão para os ícones
  const notificationColors = {
    newfollower: theme?.colors?.notifications?.newfollower || "#2B6CB0",
    newcomment: theme?.colors?.notifications?.newcomment || "#2F855A",
    newlike: theme?.colors?.notifications?.newlike || "#C05621",
    newepisode: theme?.colors?.notifications?.newepisode || "#2F855A",
    newreview: theme?.colors?.notifications?.newreview || "#F6AD55"
  };

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
      return <Box as={FaUser} color="gray.400" />;
    }
    
    switch (notification.type) {
      case NotificationType.NEW_FOLLOWER:
        return <Box as={FaUser} color={notificationColors.newfollower} />;
      case NotificationType.NEW_COMMENT:
      case NotificationType.LIST_COMMENT:
        return <Box as={FaComment} color={notificationColors.newcomment} />;
      case NotificationType.NEW_REACTION:
      case NotificationType.LIST_REACTION:
        return <Box as={FaHeart} color={notificationColors.newlike} />;
      case NotificationType.NEW_EPISODE:
        return <Box as={FaVideo} color={notificationColors.newepisode} />;
      case NotificationType.NEW_REVIEW:
        return <Box as={FaStar} color={notificationColors.newreview} />;
      default:
        return <Box as={FaUser} color={notificationColors.newfollower} />;
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