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
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const [selectedReview, setSelectedReview] = useState<ReviewDetails | null>(null);
  const toast = useToast();
  
  // Novo estado para controlar a visibilidade da animação
  const [isVisible, setIsVisible] = useState(false);

  // Estado para controlar o efeito de ripple
  const [isRippling, setIsRippling] = useState(false);

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
  const handleMenuOpen = async () => {
    onMenuOpen();
    // Pequeno atraso antes de mostrar para permitir que o DOM seja atualizado
    setTimeout(() => {
      setIsVisible(true); // Mostrar com animação
    }, 10);
    await refreshNotifications();
  };
  
  // Fechar o menu com animação
  const handleMenuClose = () => {
    setIsVisible(false);
    // Atraso para a animação de fechamento completar
    setTimeout(() => {
      onMenuClose();
    }, 350); // Aumentado para 350ms para permitir que a animação complete
  };

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

  // Função para ativar o efeito de ripple
  const handleRippleEffect = () => {
    if (!isRippling) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    }
  };

  // Estilo CSS para animação dos itens
  const getItemAnimationStyle = (index: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 0.3s ease-out ${index * 0.05}s, transform 0.3s ease-out ${index * 0.05}s`,
  });

  // Estilo CSS para animação dos botões de filtro
  const getFilterButtonStyle = (index: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `all 0.3s ease-out ${0.1 + index * 0.05}s`,
  });

  if (!currentUser) {
    return null;
  }

  return (
    <>
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
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width={isRippling ? "200%" : "0%"}
              height={isRippling ? "200%" : "0%"}
              borderRadius="full"
              bg="whiteAlpha.300"
              opacity={isRippling ? 1 : 0}
              transition="all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)"
              pointerEvents="none"
            />
          </>
        }
        variant="ghost"
        colorScheme="whiteAlpha"
        _hover={{ bg: "gray.700" }}
        _active={{ bg: "whiteAlpha.300" }}
        size="md"
        onClick={(e) => {
          handleRippleEffect();
          isMenuOpen ? handleMenuClose() : handleMenuOpen();
        }}
        position="relative"
        overflow="hidden"
      />
      
      {/* Versão com animação do menu */}
      {isMenuOpen && (
        <Portal>
          {/* Overlay invisível que fecha o menu quando clicado */}
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex={1200}
            onClick={handleMenuClose}
            bg="blackAlpha.500"
            opacity={isVisible ? 1 : 0}
            transition="opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
            pointerEvents={isVisible ? "auto" : "none"}
          />
          
          <Box 
            bg="gray.800" 
            borderColor="gray.700" 
            boxShadow="dark-lg" 
            maxH="500px"
            overflowY="auto"
            borderRadius="md"
            minW={{ base: "280px", md: "320px" }}
            width={{ base: "calc(100vw - 40px)", md: "auto" }}
            zIndex={1300}
            position="fixed"
            top="60px"
            right="16px"
            borderWidth="1px"
            p={0}
            onClick={(e) => e.stopPropagation()} // Evita que cliques no menu fechem ele
            transform={isVisible ? "translateY(0) scale(1)" : "translateY(-25px) scale(0.92)"}
            opacity={isVisible ? 1 : 0}
            transition="transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
            transformOrigin="top right"
            willChange="transform, opacity"
            css={{
              '&': {
                overflow: 'hidden',
                animation: isVisible ? 'notificationAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
              },
              '@keyframes notificationAppear': {
                '0%': { 
                  transform: 'translateY(-25px) scale(0.92)', 
                  opacity: 0 
                },
                '100%': { 
                  transform: 'translateY(0) scale(1)', 
                  opacity: 1 
                }
              }
            }}
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
                            colorScheme="primary"
                            color="white"
                            _hover={{ bg: "primary.700", color: "white" }}
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
                  <VStack spacing={3} style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.3s ease-out 0.1s",
                  }}>
                    <Spinner color="primary.300" size="md" />
                    <Text color="gray.400" fontSize="sm">
                      Atualizando notificações...
                    </Text>
                  </VStack>
                </Box>
              ) : filteredNotifications.length === 0 ? (
                <Box p={8} textAlign="center">
                  <VStack spacing={3} style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.3s ease-out 0.1s",
                  }}>
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
                    px={4}
                    py={3}
                    role="button"
                    aria-label={`Ver detalhes: ${notification.message}`}
                    cursor="pointer"
                    borderBottom="1px solid"
                    borderBottomColor="gray.700"
                    style={getItemAnimationStyle(index)}
                  >
                    <HStack spacing={3} align="flex-start" width="100%">
                      {isSelectionMode && (
                        <Checkbox 
                          isChecked={selectedNotifications.includes(notification.id)}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          colorScheme="primary"
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
                                ? "primary.300" 
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
                            <Text color="primary.300" fontSize="xs" fontWeight="bold">
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
          </Box>
        </Portal>
      )}

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