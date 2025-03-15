import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Badge,
  Avatar,
  Divider,
  MenuDivider,
  useColorModeValue,
  VStack,
  HStack,
  Image,
  Checkbox,
  useDisclosure,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import { BellIcon, DeleteIcon } from "@chakra-ui/icons";
import { useAuth } from "../contexts/AuthContext";
import {
  Notification,
  NotificationType,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
  deleteNotification,
  cleanupNotifications,
} from "../services/notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../services/users";

export function NotificationMenu() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Inscrever-se para receber notificações em tempo real
    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setUnreadCount(
          updatedNotifications.filter((notification) => !notification.read).length
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Função para limpar notificações duplicadas e atualizar a lista
  const refreshNotifications = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Limpar notificações duplicadas
      await cleanupNotifications(currentUser.uid);
    } catch (error) {
      console.error("Erro ao atualizar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar notificações quando o menu for aberto
  const handleMenuOpen = async () => {
    onOpen();
    await refreshNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Se estiver no modo de seleção, apenas seleciona/deseleciona a notificação
    if (isSelectionMode) {
      toggleNotificationSelection(notification.id);
      return;
    }
    
    // Marcar notificação como lida
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Fechar o menu
    onClose();

    // Navegar para a página apropriada com base no tipo de notificação
    switch (notification.type) {
      case NotificationType.NEW_FOLLOWER:
        if (notification.senderId) {
          try {
            const userData = await getUserData(notification.senderId);
            if (userData?.username) {
              navigate(`/u/${userData.username}`);
            }
          } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
          }
        }
        break;
      case NotificationType.NEW_COMMENT:
        if (notification.seriesId) {
          navigate(`/series/${notification.seriesId}`);
        }
        break;
      case NotificationType.NEW_EPISODE:
        if (notification.seriesId) {
          navigate(`/series/${notification.seriesId}`);
        }
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser) {
      await markAllNotificationsAsRead(currentUser.uid);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications([]);
  };

  const toggleNotificationSelection = (notificationId: string) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(notification => notification.id));
    }
  };

  const deleteSelectedNotifications = async () => {
    try {
      // Deletar cada notificação selecionada
      await Promise.all(
        selectedNotifications.map(notificationId => 
          deleteNotification(notificationId)
        )
      );
      
      // Limpar seleção e sair do modo de seleção
      setSelectedNotifications([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error("Erro ao excluir notificações:", error);
    }
  };

  // Renderizar ícone de notificação com base no tipo
  const renderNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.NEW_FOLLOWER:
        return (
          <Avatar
            size="sm"
            src={notification.senderPhoto || undefined}
            name={notification.senderName || "Usuário"}
            border="2px solid"
            borderColor="teal.500"
          />
        );
      case NotificationType.NEW_COMMENT:
      case NotificationType.NEW_EPISODE:
        return (
          <Box
            boxSize="36px"
            borderRadius="md"
            overflow="hidden"
            border="2px solid"
            borderColor={notification.type === NotificationType.NEW_COMMENT ? "blue.500" : "purple.500"}
          >
            <Image
              boxSize="100%"
              objectFit="cover"
              src={
                notification.seriesPoster
                  ? `https://image.tmdb.org/t/p/w92${notification.seriesPoster}`
                  : undefined
              }
              fallbackSrc="https://via.placeholder.com/32"
              alt={notification.seriesName || "Série"}
            />
          </Box>
        );
      default:
        return <BellIcon boxSize={5} color="teal.300" />;
    }
  };

  // Formatar data da notificação
  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours} h atrás`;
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    }
  };

  // Filtrar notificações baseado no tipo selecionado
  const filteredNotifications = notifications.filter(notification => 
    activeFilter === 'all' || 
    (activeFilter === NotificationType.NEW_COMMENT && 
      (notification.type === NotificationType.NEW_COMMENT || notification.type === NotificationType.NEW_REACTION)) ||
    notification.type === activeFilter
  );

  // Contar notificações por tipo
  const notificationCounts = notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!currentUser) {
    return null;
  }

  return (
    <Menu closeOnSelect={false} isOpen={isOpen} onOpen={handleMenuOpen} onClose={onClose}>
      <MenuButton
        as={IconButton}
        aria-label="Notificações"
        icon={
          <>
            <BellIcon boxSize={{ base: 5, md: 6 }} color="white" />
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-2px"
                right="-2px"
                fontSize="xs"
                boxSize={{ base: "16px", md: "18px" }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                transform="translate(25%, -25%)"
                border="2px solid"
                borderColor="gray.800"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </>
        }
        variant="ghost"
        colorScheme="whiteAlpha"
        _hover={{ bg: "whiteAlpha.200" }}
        _active={{ bg: "whiteAlpha.300" }}
        size={{ base: "sm", md: "md" }}
      />
      <MenuList
        bg="gray.800"
        borderColor="gray.700"
        boxShadow="xl"
        maxH="500px"
        overflowY="auto"
        minW={{ base: "280px", md: "320px" }}
        width={{ base: "calc(100vw - 40px)", md: "auto" }}
        zIndex={1500}
        p={0}
      >
        {/* Cabeçalho */}
        <Box bg="gray.900" borderTopRadius="md" py={3} px={4}>
          <VStack spacing={3} align="stretch">
            <Flex justify="space-between" align="center">
              <HStack>
                <Text fontWeight="bold" color="white" fontSize="md">
                  Notificações
                </Text>
                {notifications.length > 0 && (
                  <Badge 
                    colorScheme="teal" 
                    borderRadius="full" 
                    px={2} 
                    fontSize="xs"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </HStack>
              {notifications.length > 0 && (
                <HStack spacing={1}>
                  {isSelectionMode ? (
                    <>
                      <Tooltip label="Selecionar todas" placement="top">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          color="white"
                          _hover={{ bg: "blue.700", color: "white" }}
                          onClick={selectAllNotifications}
                          fontWeight="normal"
                        >
                          {selectedNotifications.length === notifications.length ? "Desmarcar" : "Todas"}
                        </Button>
                      </Tooltip>
                      
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        color="white"
                        _hover={{ bg: "whiteAlpha.300", color: "white" }}
                        onClick={toggleSelectionMode}
                        fontWeight="normal"
                      >
                        Cancelar
                      </Button>
                      <Tooltip label="Excluir selecionadas" placement="top">
                        <IconButton
                          aria-label="Excluir selecionadas"
                          icon={<DeleteIcon />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          _hover={{ bg: "red.700", color: "white" }}
                          isDisabled={selectedNotifications.length === 0}
                          onClick={deleteSelectedNotifications}
                        />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="teal"
                        color="white"
                        _hover={{ bg: "teal.700", color: "white" }}
                        onClick={handleMarkAllAsRead}
                        fontWeight="normal"
                      >
                        Marcar lidas
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                        color="white"
                        _hover={{ bg: "blue.700", color: "white" }}
                        onClick={toggleSelectionMode}
                        fontWeight="normal"
                      >
                        Selecionar
                      </Button>
                    </>
                  )}
                </HStack>
              )}
            </Flex>

            {/* Filtros */}
            <HStack spacing={2} overflowX="auto" pb={2} css={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              <Button
                size="xs"
                variant={activeFilter === 'all' ? "solid" : "ghost"}
                colorScheme="gray"
                onClick={() => setActiveFilter('all')}
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                bg={activeFilter === 'all' ? "gray.600" : "transparent"}
              >
                Todas ({notifications.length})
              </Button>
              <Button
                size="xs"
                variant={activeFilter === NotificationType.NEW_FOLLOWER ? "solid" : "ghost"}
                colorScheme="teal"
                onClick={() => setActiveFilter(NotificationType.NEW_FOLLOWER)}
                color="white"
                _hover={{ bg: "teal.700" }}
              >
                Seguidores ({notificationCounts[NotificationType.NEW_FOLLOWER] || 0})
              </Button>
              <Button
                size="xs"
                variant={activeFilter === NotificationType.NEW_COMMENT ? "solid" : "ghost"}
                colorScheme="blue"
                onClick={() => setActiveFilter(NotificationType.NEW_COMMENT)}
                color="white"
                _hover={{ bg: "blue.700" }}
              >
                Avaliações ({(notificationCounts[NotificationType.NEW_COMMENT] || 0) + (notificationCounts[NotificationType.NEW_REACTION] || 0)})
              </Button>
              <Button
                size="xs"
                variant={activeFilter === NotificationType.NEW_EPISODE ? "solid" : "ghost"}
                colorScheme="purple"
                onClick={() => setActiveFilter(NotificationType.NEW_EPISODE)}
                color="white"
                _hover={{ bg: "purple.700" }}
              >
                Episódios ({notificationCounts[NotificationType.NEW_EPISODE] || 0})
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Lista de notificações */}
        <Box maxH="400px" overflowY="auto">
          {isLoading ? (
            <Box p={8} textAlign="center">
              <VStack spacing={3}>
                <Spinner color="teal.300" size="md" />
                <Text color="gray.400" fontSize="sm">
                  Atualizando notificações...
                </Text>
              </VStack>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box p={8} textAlign="center">
              <VStack spacing={3}>
                <Box 
                  p={3} 
                  borderRadius="full" 
                  bg="gray.700" 
                  color="gray.400"
                >
                  <BellIcon boxSize={6} />
                </Box>
                <Text color="gray.400" fontSize="sm">
                  {notifications.length === 0 
                    ? "Você não tem notificações" 
                    : "Nenhuma notificação nesta categoria"}
                </Text>
              </VStack>
            </Box>
          ) : (
            filteredNotifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                bg={notification.read ? "gray.800" : "gray.700"}
                _hover={{ bg: "gray.600" }}
                borderLeft={notification.read ? "none" : "4px solid"}
                borderLeftColor="teal.400"
                px={4}
                py={3}
                role="button"
                aria-label={`Ver detalhes: ${notification.message}`}
                cursor="pointer"
                borderBottom="1px solid"
                borderBottomColor="gray.700"
              >
                <HStack spacing={3} align="flex-start" width="100%">
                  {isSelectionMode && (
                    <Checkbox 
                      isChecked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      colorScheme="teal"
                      onClick={(e) => e.stopPropagation()}
                      mt={1}
                    />
                  )}
                  <Box>
                    {renderNotificationIcon(notification)}
                  </Box>
                  <VStack align="flex-start" spacing={1} flex={1}>
                    <Text 
                      color="white" 
                      fontSize="sm" 
                      fontWeight={notification.read ? "normal" : "bold"}
                      lineHeight="1.4"
                    >
                      {notification.message}
                    </Text>
                    <HStack spacing={2} align="center">
                      <Text 
                        color={
                          notification.createdAt instanceof Date && 
                          (new Date().getTime() - notification.createdAt.getTime()) < 3600000 * 3 // 3 horas
                            ? "teal.300" 
                            : "gray.400"
                        } 
                        fontSize="xs"
                        display="flex"
                        alignItems="center"
                      >
                        {notification.createdAt instanceof Date && 
                         (new Date().getTime() - notification.createdAt.getTime()) < 3600000 * 3 && (
                          <Box 
                            as="span" 
                            w="6px" 
                            h="6px" 
                            borderRadius="full" 
                            bg="teal.300" 
                            mr={1} 
                            display="inline-block"
                          />
                        )}
                        {notification.createdAt instanceof Date
                          ? formatNotificationDate(notification.createdAt)
                          : "Agora"}
                      </Text>
                      {!isSelectionMode && (
                        <Text color="teal.300" fontSize="xs" fontWeight="bold">
                          • Clique para ver
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </MenuItem>
            ))
          )}
        </Box>
      </MenuList>
    </Menu>
  );
} 