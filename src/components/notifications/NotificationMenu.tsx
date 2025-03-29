import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Text,
  VStack,
  HStack,
  Spinner,
  useDisclosure,
  Flex,
  Button,
  Tooltip,
  useToast,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Checkbox,
} from '@chakra-ui/react';
import { BellIcon, CheckIcon, CloseIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaUser, FaComment, FaVideo, FaStar, FaThumbsUp } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  Notification,
  NotificationType,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  cleanupNotifications,
  getGroupedNotifications,
  subscribeToNotifications,
  getReviewDetails,
  DEFAULT_NOTIFICATION_LIMIT
} from '../../services/notifications';
import { NotificationItem } from './NotificationItem';
import { useNavigate } from 'react-router-dom';
import { formatNotificationDate } from '../../utils/dateUtils';

// Componente principal do menu de notificações
export function NotificationMenu() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Estados para as notificações
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  
  // Efeito visual para indicar notificações novas
  const [isRippling, setIsRippling] = useState(false);
  
  // Função para carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Passo 1: Limpar notificações duplicadas
      await cleanupNotifications(currentUser.uid);
      
      // Passo 2: Buscar notificações agrupadas
      const groupedNotifications = await getGroupedNotifications(currentUser.uid);
      
      // Passo 3: Atualizar o estado
      setNotifications(groupedNotifications);
      
      // Passo 4: Atualizar contador de não lidas
      setUnreadCount(groupedNotifications.filter(n => !n.read).length);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);
  
  // Efeito para carregar notificações quando o componente montar
  useEffect(() => {
    if (!currentUser) return;
    
    // Carregar inicialmente
    loadNotifications();
    
    // Configurar o listener para atualizações em tempo real
    const unsubscribe = subscribeToNotifications(currentUser.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      
      // Adicionar efeito visual se houver novas notificações
      if (updatedNotifications.length > notifications.length) {
        handleRippleEffect();
      }
    });
    
    // Limpar o listener quando o componente desmontar
    return () => unsubscribe();
  }, [currentUser, loadNotifications]);
  
  // Efeito para recarregar notificações quando o menu for aberto
  useEffect(() => {
    if (isOpen && currentUser) {
      loadNotifications();
    }
  }, [isOpen, currentUser, loadNotifications]);

  // Efeito de ripple para o ícone de notificação
  const handleRippleEffect = () => {
    setIsRippling(true);
    setTimeout(() => {
      setIsRippling(false);
    }, 1000);
  };

  // Função para lidar com clique em uma notificação
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Não processar o clique se estiver no modo de seleção
      if (isSelectionMode) return;
      
      // Marcar como lida
      await markNotificationAsRead(currentUser?.uid || "", notification.id);
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      
      // Atualizar contador de não lidas
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Navegar conforme o tipo da notificação
      switch (notification.type) {
        case NotificationType.NEW_FOLLOWER:
          if (notification.senderId && !notification.isDeleted) {
            navigate(`/u/${notification.senderName}`);
          }
          break;
          
        case NotificationType.NEW_COMMENT:
        case NotificationType.NEW_REACTION:
          if (notification.reviewId) {
            navigate(`/series/${notification.seriesId}`);
          }
          break;
          
        case NotificationType.NEW_EPISODE:
          if (notification.seriesId) {
            navigate(`/series/${notification.seriesId}`);
          }
          break;
          
        case NotificationType.NEW_REVIEW:
          if (notification.seriesId) {
            navigate(`/series/${notification.seriesId}/reviews`);
          }
          break;
          
        default:
          // Fechar o menu para tipos desconhecidos
          onClose();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a notificação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Marcar todas as notificações como lidas
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      
      // Atualizar o estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast({
        title: 'Notificações marcadas como lidas',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Gerenciamento de seleção múltipla de notificações
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications([]);
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Excluir notificações selecionadas
  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Em vez de usar Promise.all, vamos excluir sequencialmente para evitar problemas
      const successfullyDeleted: string[] = [];
      
      for (const notificationId of selectedNotifications) {
        try {
          const success = await deleteNotification(notificationId);
          if (success) {
            successfullyDeleted.push(notificationId);
          }
        } catch (err) {
          // Ignorar erros individuais e continuar com as próximas
        }
      }
      
      // Atualizar o estado local apenas com as notificações excluídas com sucesso
      if (successfullyDeleted.length > 0) {
        setNotifications(prev => prev.filter(n => !successfullyDeleted.includes(n.id)));
        
        // Recalcular o contador de não lidas
        setUnreadCount(prev => 
          prev - successfullyDeleted.filter(id => 
            notifications.find(n => n.id === id && !n.read)
          ).length
        );
        
        // Limpar a seleção e sair do modo de seleção
        setSelectedNotifications([]);
        setIsSelectionMode(false);
        
        toast({
          title: `${successfullyDeleted.length} notificações excluídas`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Não foi possível excluir notificações',
          description: 'Verifique suas permissões ou tente novamente mais tarde',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao excluir notificações',
        description: 'Ocorreu um problema ao processar sua solicitação',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar notificações baseado no tipo selecionado
  const filteredNotifications = useMemo(() => 
    notifications.filter(notification => 
      activeFilter === 'all' || notification.type === activeFilter
    ), 
    [notifications, activeFilter]
  );
  
  // Contar notificações por tipo
  const notificationCounts = useMemo(() => 
    notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
    }, {} as Record<string, number>), 
    [notifications]
  );
  
  // Efeito de animação para itens da lista
  const getItemAnimationStyle = useCallback((index: number) => ({
    opacity: 1,
    transform: 'translateY(0)',
    transition: `all 0.3s ease-out ${0.1 + index * 0.05}s`,
  }), []);
  
  // Renderizar o menu completo
  const renderNotificationMenu = () => (
    <Menu isOpen={isOpen} onClose={onClose}>
      <MenuButton
        as={IconButton}
        aria-label="Notificações"
        icon={
          <Box position="relative">
            <BellIcon boxSize={6} color="white" />
            {unreadCount > 0 && (
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top="-2px"
                right="-2px"
                fontSize="10px"
                minW="18px"
                height="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                border="2px solid"
                borderColor="gray.800"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
            {isRippling && (
              <Box
                position="absolute"
                top="-4px"
                right="-4px"
                bottom="-4px"
                left="-4px"
                borderRadius="full"
                border="2px solid"
                borderColor="primary.500"
                opacity={0}
                animation="ripple 1s ease-out"
                sx={{
                  '@keyframes ripple': {
                    '0%': { transform: 'scale(0.8)', opacity: 1 },
                    '100%': { transform: 'scale(1.2)', opacity: 0 },
                  },
                }}
              />
            )}
          </Box>
        }
        variant="ghost"
        onClick={onOpen}
        _hover={{ bg: "gray.700" }}
      />
      
      <MenuList
        bg="gray.800"
        borderColor="gray.700"
        boxShadow="dark-lg"
        maxH="80vh"
        overflowY="auto"
        minW={{ base: "calc(100vw - 16px)", md: "380px" }}
        maxW={{ base: "calc(100vw - 16px)", md: "380px" }}
        zIndex={1300}
      >
        {/* Cabeçalho do menu */}
        <Box p={3} bg="gray.900">
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight="bold" color="white">
              Notificações
            </Text>
            <HStack spacing={1}>
              {notifications.length > 0 && (
                isSelectionMode ? (
                  <HStack spacing={1}>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="white"
                      onClick={selectAllNotifications}
                    >
                      {selectedNotifications.length === filteredNotifications.length ? "Nenhum" : "Todos"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={toggleSelectionMode}
                    >
                      Cancelar
                    </Button>
                    <IconButton
                      aria-label="Excluir selecionadas"
                      icon={<DeleteIcon />}
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      isDisabled={selectedNotifications.length === 0}
                      onClick={deleteSelectedNotifications}
                    />
                  </HStack>
                ) : (
                  <HStack spacing={1}>
                    {unreadCount > 0 && (
                      <Button
                        size="xs"
                        variant="ghost"
                        color="white"
                        onClick={handleMarkAllAsRead}
                        leftIcon={<CheckIcon />}
                      >
                        Marcar lidas
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="ghost"
                      color="white"
                      onClick={toggleSelectionMode}
                    >
                      Selecionar
                    </Button>
                  </HStack>
                )
              )}
            </HStack>
          </Flex>

          {/* Filtros de tipo */}
          {notifications.length > 0 && (
            <HStack spacing={2} overflowX="auto" pb={1}>
              <Tooltip label="Todas as notificações" placement="top">
                <Button
                  size="xs"
                  variant={activeFilter === 'all' ? "solid" : "ghost"}
                  colorScheme="primary"
                  onClick={() => setActiveFilter('all')}
                >
                  <BellIcon mr={1} />
                  {notifications.length}
                </Button>
              </Tooltip>
              
              {notificationCounts[NotificationType.NEW_FOLLOWER] > 0 && (
                <Tooltip label="Novos seguidores" placement="top">
                  <Button
                    size="xs"
                    variant={activeFilter === NotificationType.NEW_FOLLOWER ? "solid" : "ghost"}
                    colorScheme="blue"
                    onClick={() => setActiveFilter(NotificationType.NEW_FOLLOWER)}
                  >
                    <FaUser style={{ marginRight: '4px' }} />
                    {notificationCounts[NotificationType.NEW_FOLLOWER]}
                  </Button>
                </Tooltip>
              )}
              
              {notificationCounts[NotificationType.NEW_COMMENT] > 0 && (
                <Tooltip label="Comentários" placement="top">
                  <Button
                    size="xs"
                    variant={activeFilter === NotificationType.NEW_COMMENT ? "solid" : "ghost"}
                    colorScheme="green"
                    onClick={() => setActiveFilter(NotificationType.NEW_COMMENT)}
                  >
                    <FaComment style={{ marginRight: '4px' }} />
                    {notificationCounts[NotificationType.NEW_COMMENT]}
                  </Button>
                </Tooltip>
              )}
              
              {notificationCounts[NotificationType.NEW_REACTION] > 0 && (
                <Tooltip label="Reações" placement="top">
                  <Button
                    size="xs"
                    variant={activeFilter === NotificationType.NEW_REACTION ? "solid" : "ghost"}
                    colorScheme="orange"
                    onClick={() => setActiveFilter(NotificationType.NEW_REACTION)}
                  >
                    <FaThumbsUp style={{ marginRight: '4px' }} />
                    {notificationCounts[NotificationType.NEW_REACTION]}
                  </Button>
                </Tooltip>
              )}
              
              {notificationCounts[NotificationType.NEW_REVIEW] > 0 && (
                <Tooltip label="Avaliações" placement="top">
                  <Button
                    size="xs"
                    variant={activeFilter === NotificationType.NEW_REVIEW ? "solid" : "ghost"}
                    colorScheme="yellow"
                    onClick={() => setActiveFilter(NotificationType.NEW_REVIEW)}
                  >
                    <FaStar style={{ marginRight: '4px' }} />
                    {notificationCounts[NotificationType.NEW_REVIEW]}
                  </Button>
                </Tooltip>
              )}
              
              {notificationCounts[NotificationType.NEW_EPISODE] > 0 && (
                <Tooltip label="Novos episódios" placement="top">
                  <Button
                    size="xs"
                    variant={activeFilter === NotificationType.NEW_EPISODE ? "solid" : "ghost"}
                    colorScheme="purple"
                    onClick={() => setActiveFilter(NotificationType.NEW_EPISODE)}
                  >
                    <FaVideo style={{ marginRight: '4px' }} />
                    {notificationCounts[NotificationType.NEW_EPISODE]}
                  </Button>
                </Tooltip>
              )}
            </HStack>
          )}
        </Box>
        
        <Divider borderColor="gray.700" />
        
        {/* Lista de notificações */}
        <Box maxH="60vh" overflowY="auto">
          {isLoading && (
            <Box p={8} textAlign="center">
              <VStack spacing={3}>
                <Spinner color="primary.300" size="md" />
                <Text color="gray.400" fontSize="sm">
                  Atualizando notificações...
                </Text>
              </VStack>
            </Box>
          )}
          
          {!isLoading && filteredNotifications.length === 0 && (
            <Box p={8} textAlign="center">
              <VStack spacing={3}>
                <Box p={3} borderRadius="full" bg="gray.700">
                  <BellIcon color="gray.400" boxSize={6} />
                </Box>
                <Text color="gray.400" fontSize="sm">
                  {notifications.length === 0 
                    ? "Você não tem notificações" 
                    : "Nenhuma notificação nesta categoria"}
                </Text>
              </VStack>
            </Box>
          )}
          
          {!isLoading && filteredNotifications.length > 0 && 
            filteredNotifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedNotifications.includes(notification.id)}
                onSelect={toggleNotificationSelection}
                onClick={handleNotificationClick}
                isSelectionMode={isSelectionMode}
                index={index}
                getItemAnimationStyle={getItemAnimationStyle}
              />
            ))
          }
        </Box>
      </MenuList>
    </Menu>
  );
  
  // Não renderizar se não houver usuário
if (!currentUser) {
  return null;
}

  return renderNotificationMenu();
} 