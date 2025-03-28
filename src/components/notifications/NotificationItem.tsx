import {
  Box,
  Text,
  HStack,
  VStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { NotificationType } from "../../types/notification";
import { deleteNotification } from "../../services/notifications";
import { useState, useEffect } from "react";
import { getUserData } from "../../services/users";
import { UserAvatar } from "../common/UserAvatar";

interface NotificationItemProps {
  notification: {
    id: string;
    fromUserId: string;
    fromUserEmail: string;
    message: string;
    seriesId: number;
    createdAt: { seconds: number };
    type: NotificationType;
  };
  onNotificationDeleted?: () => void;
}

export function NotificationItem({
  notification,
  onNotificationDeleted,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [userData, setUserData] = useState<{ username?: string | null; displayName?: string | null; photoURL?: string | null } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData(notification.fromUserId);
        setUserData(data);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
  }, [notification.fromUserId]);

  const handleDelete = async () => {
    try {
      await deleteNotification(notification.id);
      onNotificationDeleted?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a notificação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClick = () => {
    navigate(`/series/${notification.seriesId}`);
  };

  const displayName = userData?.username || userData?.displayName || notification.fromUserEmail;

  const formattedMessage = notification.message.replace(
    new RegExp(notification.fromUserEmail, 'g'),
    displayName
  );

  return (
    <Box
      bg="gray.800"
      p={4}
      borderRadius="lg"
      cursor="pointer"
      _hover={{ bg: "gray.700" }}
      onClick={handleClick}
    >
      <HStack spacing={4} align="start">
        <UserAvatar 
          size="sm" 
          userId={notification.fromUserId}
          displayName={displayName}
          photoURL={userData?.photoURL}
        />
        <VStack align="start" flex={1} spacing={1}>
          <Text color="white">
            {formattedMessage}
          </Text>
          <Text color="gray.400" fontSize="sm">
            {new Date(notification.createdAt.seconds * 1000).toLocaleDateString()}
          </Text>
        </VStack>
        <IconButton
          icon={<X size={20} />}
          aria-label="Excluir notificação"
          variant="ghost"
          color="gray.400"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        />
      </HStack>
    </Box>
  );
}