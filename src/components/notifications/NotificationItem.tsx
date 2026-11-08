import { ChatCircle, Heart, Star, User, VideoCamera } from "@phosphor-icons/react";
import React, { memo } from "react";
import { Box, Flex, Text, HStack, Stack, Checkbox } from "@chakra-ui/react";
import { Notification, NotificationType } from "../../services/notifications";
import { UserAvatar } from "../common/UserAvatar";
import { formatNotificationDate } from "../../utils/dateUtils";

export interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  index: number;
  getItemAnimationStyle: (index: number) => React.CSSProperties;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const NotificationItem = memo(
  ({
    notification,
    onClick,
    index,
    getItemAnimationStyle,
    isSelectionMode = false,
    isSelected = false,
    onSelect,
  }: NotificationItemProps) => {
    const isUserDeleted =
      !notification.senderId ||
      !notification.senderName ||
      notification.isDeleted ||
      notification.senderName === "Usuário excluído";

    const formattedDate = formatNotificationDate(notification.createdAt);

    const getNotificationIcon = () => {
      if (isUserDeleted) {
        return <Box as={User} />;
      }

      switch (notification.type) {
        case NotificationType.NEW_FOLLOWER:
          return <Box as={User} />;
        case NotificationType.NEW_COMMENT:
        case NotificationType.LIST_COMMENT:
          return <Box as={ChatCircle} />;
        case NotificationType.NEW_REACTION:
        case NotificationType.LIST_REACTION:
          return <Box as={Heart} />;
        case NotificationType.NEW_EPISODE:
          return <Box as={VideoCamera} />;
        case NotificationType.NEW_REVIEW:
          return <Box as={Star} />;
        default:
          return <Box as={User} />;
      }
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(notification.id);
      }
    };

    return (
      <Box
        borderBottomWidth="1px"
        borderBottomColor="ink.800"
        transition="background 120ms ease"
        bg={notification.read ? "transparent" : "ink.850"}
        _hover={{ bg: "ink.800" }}
        position="relative"
        _before={
          notification.read
            ? undefined
            : {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                w: "2px",
                bg: "signal.400",
              }
        }
        opacity="0"
        transform="translateY(10px)"
        style={getItemAnimationStyle(index)}
        onClick={() => onClick(notification)}
        cursor="pointer"
      >
        <Flex p={3} alignItems="center">
          {isSelectionMode && (
            <Box mr={2} onClick={handleCheckboxClick}>
              <Checkbox isChecked={isSelected} colorScheme="primary" size="md" />
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
              <Flex
                w="32px"
                h="32px"
                borderRadius="full"
                bg="ink.800"
                color="ink.200"
                align="center"
                justify="center"
              >
                {getNotificationIcon()}
              </Flex>
            )}
          </Box>

          <Stack flex="1" spacing={0.5}>
            <HStack>
              <Text
                fontSize="sm"
                fontWeight={notification.read ? 400 : 500}
                color={notification.read ? "ink.300" : "ink.50"}
                noOfLines={2}
              >
                {notification.message}
              </Text>
            </HStack>

            <HStack spacing={2}>
              <Text fontSize="xs" color="ink.400" fontFamily="mono">
                {formattedDate}
              </Text>
            </HStack>
          </Stack>
        </Flex>
      </Box>
    );
  }
);

NotificationItem.displayName = "NotificationItem";
