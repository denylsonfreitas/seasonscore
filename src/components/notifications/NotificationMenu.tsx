import { useEffect, useState, useCallback, useMemo } from "react";
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
  useToast,
  Portal,
} from "@chakra-ui/react";
import { BellIcon, DeleteIcon } from "@chakra-ui/icons";
import { useAuth } from "../../contexts/AuthContext";
import {
  Notification,
  NotificationType,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  getUserNotifications,
  deleteNotification,
  subscribeToNotifications,
  cleanupNotifications,
  getGroupedNotifications,
  getReviewDetails,
} from "../../services/notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../../services/users";
import { NotificationItem } from "./NotificationItem";
import { UserAvatar } from "../common/UserAvatar";
import { ReviewDetailsModal } from "../reviews/ReviewDetailsModal";
import { useAnimatedMenu } from "../../hooks/useAnimatedMenu";
import { RippleEffect } from "../common/RippleEffect";
import { AnimatedMenu } from "../common/AnimatedMenu";

interface ReviewDetails {
  id: string;
  seriesId: string;
  userId: string;
  userEmail: string;
  seriesName: string;
  seriesPoster: string;
  seasonNumber: number;
  rating: number;
  comment: string;
  comments: Array<{
    id: string;
    userId: string;
    userEmail: string;
    content: string;
    createdAt: Date;
    reactions: {
      likes: string[];
      dislikes: string[];
    };
  }>;
  reactions: {
    likes: string[];
    dislikes: string[];
  };
  createdAt: Date | { seconds: number };
}

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
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const [selectedReview, setSelectedReview] = useState<ReviewDetails | null>(null);
  const toast = useToast();
  
  // Usar o hook customizado para gerenciar as animações
  const { 
    isVisible, 
    isRippling, 
    handleOpen, 
    handleClose, 
    handleRippleEffect,
    getItemAnimationStyle,
    onOpen: menuOpen,
    onClose: menuClose 
  } = useAnimatedMenu();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Inscrever-se para receber notificações em tempo real
    const unsubscribe = subscribeToNotifications(
      currentUser.uid,
      (updatedNotifications: Notification[]) => {
        // Agrupar as notificações para mostrar apenas as únicas
        const notificationGroups: Record<string, Notification> = {};
        
        updatedNotifications.forEach(notification => {
          let key = '';
          
          switch (notification.type) {
            case NotificationType.NEW_REACTION:
              if (notification.reviewId) {
                key = `reaction_review_${notification.reviewId}`;
              } else {
                key = `reaction_sender_${notification.senderId || 'unknown'}`;
              }
              break;
            case NotificationType.NEW_COMMENT:
              if (notification.seriesId) {
                key = `comment_series_${notification.seriesId}`;
              } else {
                key = `comment_sender_${notification.senderId || 'unknown'}`;
              }
              break;
            case NotificationType.NEW_FOLLOWER:
              key = `follower_${notification.senderId || 'unknown'}`;
              break;
            case NotificationType.NEW_EPISODE:
              key = `episode_${notification.seriesId || 'unknown'}`;
              break;
            case NotificationType.NEW_REVIEW:
              key = `review_${notification.seriesId || 'unknown'}_${notification.senderId || 'unknown'}`;
              break;
            default:
              key = `${String(notification.type)}_${notification.senderId || 'unknown'}`;
          }
          
          if (!notificationGroups[key] || 
              (notification.createdAt > notificationGroups[key].createdAt)) {
            notificationGroups[key] = notification;
          }
        });
        
        // Obter a lista final de notificações agrupadas
        const groupedNotifications = Object.values(notificationGroups).sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return dateB - dateA;
        });
        
        setNotifications(groupedNotifications);
        
        // Contar apenas as notificações únicas e não lidas
        const uniqueUnreadCount = groupedNotifications.filter(notification => !notification.read).length;
        
        setUnreadCount(uniqueUnreadCount);
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
      
      // Buscar notificações atualizadas após a limpeza
      const updatedNotifications = await getGroupedNotifications(currentUser.uid);
      setNotifications(updatedNotifications);
      
      // Atualizar contador de não lidas após a limpeza
      const uniqueUnreadCount = updatedNotifications.filter(notification => !notification.read).length;
      setUnreadCount(uniqueUnreadCount);
    } catch (error) {
      console.error("Erro ao atualizar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar notificações quando o menu for aberto
  const handleMenuOpen = useCallback(async () => {
    if (!isOpen) {
      onOpen();
      handleOpen();
      await refreshNotifications();
    }
  }, [onOpen, handleOpen, refreshNotifications, isOpen]);
  
  // Fechar o menu com animação
  const handleMenuClose = useCallback(() => {
    handleClose();
    setTimeout(() => {
      onClose();
    }, 350);
  }, [handleClose, onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!currentUser) return;

    try {
      // Marcar como lida
      await markNotificationAsRead(notification.id);
      
      // Atualizar o estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );

      // Recalcular o contador de notificações não lidas
      const notificationGroups = notifications.reduce((acc, n) => {
        if (!n.read) {
          const key = `${n.type}_${n.senderId}_${n.seriesId}_${n.reviewId}`;
          if (!acc[key]) {
            acc[key] = n;
          }
        }
        return acc;
      }, {} as Record<string, Notification>);

      setUnreadCount(Object.values(notificationGroups).length);

      // Se for uma notificação de reação ou comentário, abrir o modal de detalhes
      if (notification.type === NotificationType.NEW_REACTION || 
          notification.type === NotificationType.NEW_COMMENT) {
        // Buscar os detalhes da avaliação
        const reviewDetails = await getReviewDetails(notification.reviewId!);
        if (reviewDetails) {
          setSelectedReview(reviewDetails);
          onModalOpen();
        }
      }

      // Fechar o menu de notificações
      handleMenuClose();
    } catch (error) {
      console.error("Erro ao processar notificação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a notificação",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser) {
      await markAllNotificationsAsRead(currentUser.uid);
      
      // Atualizar localmente o estado das notificações
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      
      // Atualizar o contador de notificações não lidas para zero
      setUnreadCount(0);
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
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      for (const notificationId of selectedNotifications) {
        await deleteNotification(notificationId);
      }
      
      // Atualizar a lista de notificações
      setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      setIsSelectionMode(false);
      
      toast({
        title: "Sucesso",
        description: "Notificações excluídas com sucesso",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Erro ao excluir notificações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir as notificações",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Renderizar ícone de notificação com base no tipo
  const renderNotificationIcon = (notification: Notification) => {
    const defaultIcon = <Box w="36px" h="36px" bg="blue.500" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
      <BellIcon color="white" boxSize={4} />
    </Box>;
    
    switch (notification.type) {
      case NotificationType.NEW_FOLLOWER:
        return <UserAvatar 
          userId={notification.senderId || ""} 
          size="36px" 
          photoURL={notification.senderPhoto || ""}
        />;
      default:
        return defaultIcon;
    }
  };

  // Formatar data da notificação
  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return "Agora";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} h atrás`;
    } else {
      return format(date, "dd MMM", { locale: ptBR });
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

  // Estilo CSS para animação dos botões de filtro
  const getFilterButtonStyle = (index: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `all 0.3s ease-out ${0.1 + index * 0.05}s`,
  });

  // Trigger do menu de notificações
  const notificationTrigger = useMemo(() => (
    <IconButton
      aria-label="Notificações"
      icon={
        <>
          <BellIcon boxSize={6} color="white" />
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
          <RippleEffect isRippling={isRippling} />
        </>
      }
      variant="ghost"
      colorScheme="whiteAlpha"
      _hover={{ bg: "gray.700" }}
      _active={{ bg: "whiteAlpha.300" }}
      size="md"
      onClick={() => {
        handleRippleEffect();
        if (isOpen) {
          handleMenuClose();
        } else {
          handleMenuOpen();
        }
      }}
      position="relative"
      overflow="hidden"
    />
  ), [isOpen, unreadCount, isRippling, handleRippleEffect, handleMenuOpen, handleMenuClose]);

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <AnimatedMenu
        trigger={notificationTrigger}
        isOpen={isOpen}
        isVisible={isVisible}
        onOpen={() => menuOpen()}
        onClose={handleMenuClose}
        alignWithTrigger={true}
        alignOnlyOnDesktop={true}
        responsivePosition={{
          base: { top: "60px", right: "8px", left: "8px" },
          md: { } // Vazio para permitir alinhamento com trigger no desktop
        }}
        transformOrigin="top right"
        width={{ base: "calc(100vw - 16px)", md: "320px" }}
        zIndex={{ overlay: 1200, menu: 1300 }}
        overlayBg="blackAlpha.500"
        menuStyles={{
          bg: "gray.800",
          borderColor: "gray.700",
          boxShadow: "dark-lg",
          p: 0,
          borderRadius: { base: "md", md: "md" },
          borderWidth: "1px",
          maxH: { base: "80vh", md: "500px" },
          overflowY: "auto"
        }}
      >
        {/* Cabeçalho */}
        <Box bg="gray.900" borderTopRadius="md" py={3} px={{ base: 3, md: 4 }}>
          <VStack spacing={{ base: 2, md: 3 }} align="stretch">
            <Flex justify="space-between" align="center">
              <HStack>
                <Text fontWeight="bold" color="white" fontSize={{ base: "sm", md: "md" }}>
                  Notificações
                </Text>
                {notifications.length > 0 && (
                  <Badge 
                    colorScheme="primary" 
                    borderRadius="full" 
                    px={2} 
                    fontSize="xs"
                  >
                    {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : notifications.length}
                  </Badge>
                )}
              </HStack>
              {notifications.length > 0 && (
                <HStack spacing={{ base: 0.5, md: 1 }}>
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
                          px={{ base: 1.5, md: 2 }}
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
                        px={{ base: 1.5, md: 2 }}
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
                        colorScheme="primary"
                        color="white"
                        _hover={{ bg: "primary.700", color: "white" }}
                        onClick={handleMarkAllAsRead}
                        fontWeight="normal"
                        px={{ base: 1.5, md: 2 }}
                        fontSize={{ base: "2xs", md: "xs" }}
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
                        px={{ base: 1.5, md: 2 }}
                        fontSize={{ base: "2xs", md: "xs" }}
                      >
                        Selecionar
                      </Button>
                    </>
                  )}
                </HStack>
              )}
            </Flex>

            {/* Filtros */}
            <HStack 
              spacing={2} 
              overflowX="auto" 
              pb={2} 
              px={{ base: 1, md: 0 }}
              css={{ 
                scrollbarWidth: 'none', 
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none'
              }}
            >
              <Button
                size="xs"
                variant={activeFilter === 'all' ? "solid" : "ghost"}
                colorScheme="gray"
                onClick={() => setActiveFilter('all')}
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                bg={activeFilter === 'all' ? "gray.600" : "transparent"}
                style={getFilterButtonStyle(0)}
              >
                Todas ({notifications.length})
              </Button>
              <Button
                size="xs"
                variant={activeFilter === NotificationType.NEW_FOLLOWER ? "solid" : "ghost"}
                colorScheme="primary"
                onClick={() => setActiveFilter(NotificationType.NEW_FOLLOWER)}
                color="white"
                _hover={{ bg: "primary.700" }}
                style={getFilterButtonStyle(1)}
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
                style={getFilterButtonStyle(2)}
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
                style={getFilterButtonStyle(3)}
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
              <VStack spacing={3} style={getItemAnimationStyle(0)}>
                <Spinner color="primary.300" size="md" />
                <Text color="gray.400" fontSize="sm">
                  Atualizando notificações...
                </Text>
              </VStack>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box p={{ base: 6, md: 8 }} textAlign="center">
              <VStack spacing={3} style={getItemAnimationStyle(0)}>
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
            filteredNotifications.map((notification, index) => (
              <Box
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                bg={notification.read ? "gray.800" : "gray.700"}
                _hover={{ bg: "gray.600" }}
                borderLeft={notification.read ? "none" : "4px solid"}
                borderLeftColor="primary.400"
                px={{ base: 3, md: 4 }}
                py={{ base: 2.5, md: 3 }}
                role="button"
                aria-label={`Ver detalhes: ${notification.message}`}
                cursor="pointer"
                borderBottom="1px solid"
                borderBottomColor="gray.700"
                style={getItemAnimationStyle(index + 1)}
              >
                <HStack spacing={3} align="flex-start" width="100%">
                  {isSelectionMode && (
                    <Checkbox 
                      isChecked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleNotificationSelection(notification.id)}
                      colorScheme="primary"
                      onClick={(e) => e.stopPropagation()}
                      mt={1}
                      size={{ base: "sm", md: "md" }}
                    />
                  )}
                  <Box>
                    {renderNotificationIcon(notification)}
                  </Box>
                  <VStack align="flex-start" spacing={{ base: 0.5, md: 1 }} flex={1}>
                    <Text 
                      color="white" 
                      fontSize={{ base: "xs", md: "sm" }}
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
                            ? "primary.300" 
                            : "gray.400"
                        } 
                        fontSize={{ base: "2xs", md: "xs" }}
                        display="flex"
                        alignItems="center"
                      >
                        {notification.createdAt instanceof Date && 
                          (new Date().getTime() - notification.createdAt.getTime()) < 3600000 * 3 && (
                          <Box 
                            as="span" 
                            w={{ base: "4px", md: "6px" }}
                            h={{ base: "4px", md: "6px" }}
                            borderRadius="full" 
                            bg="primary.300" 
                            mr={1} 
                            display="inline-block"
                          />
                        )}
                        {notification.createdAt instanceof Date
                          ? formatNotificationDate(notification.createdAt)
                          : "Agora"}
                      </Text>
                      {!isSelectionMode && (
                        <Text 
                          color="primary.300" 
                          fontSize={{ base: "2xs", md: "xs" }}
                          fontWeight="bold"
                          display={{ base: "none", md: "block" }}
                        >
                          Clique para ver
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))
          )}
        </Box>
      </AnimatedMenu>

      {/* Modal de Detalhes da Avaliação */}
      {selectedReview && (
        <ReviewDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            onModalClose();
            setSelectedReview(null);
          }}
          review={selectedReview}
          onReviewUpdated={refreshNotifications}
        />
      )}
    </>
  );
} 