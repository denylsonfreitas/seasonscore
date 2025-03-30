import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  useTheme,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { BellIcon, CheckIcon, CloseIcon, DeleteIcon, SettingsIcon } from '@chakra-ui/icons';
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
import { AnimatedMenu } from '../common/AnimatedMenu';
import { RippleEffect } from '../common/RippleEffect';
import { updateUserNotificationSettings, getUserNotificationSettings } from '../../services/users';

export function NotificationMenu() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  
  const [isRippling, setIsRippling] = useState(false);
  
  // Estado para o menu animado
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Estado e configurações para o modal de configurações
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [notificationSettings, setNotificationSettings] = useState({
    newEpisode: true,
    newFollower: true,
    newComment: true,
    newReaction: true,
    newReview: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Definir cores padrão caso o tema não esteja carregado ou não tenha as cores definidas
  const notificationColors = {
    newfollower: theme?.colors?.notifications?.newfollower || "#2B6CB0",
    newcomment: theme?.colors?.notifications?.newcomment || "#2F855A",
    newlike: theme?.colors?.notifications?.newlike || "#C05621",
    newepisode: theme?.colors?.notifications?.newepisode || "#2F855A",
    newreview: theme?.colors?.notifications?.newreview || "#F6AD55"
  };
  
  const onOpen = useCallback(() => {
    setIsOpen(true);
    // Pequeno atraso para permitir animação
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const onClose = useCallback(() => {
    setIsVisible(false);
    // Esperar a animação terminar antes de fechar realmente
    setTimeout(() => setIsOpen(false), 300);
  }, []);
  
  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await cleanupNotifications(currentUser.uid);
      
      const groupedNotifications = await getGroupedNotifications(currentUser.uid);
      
      setNotifications(groupedNotifications);
      
      setUnreadCount(groupedNotifications.filter(n => !n.read).length);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    loadNotifications();
    
    const unsubscribe = subscribeToNotifications(currentUser.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      
      if (updatedNotifications.length > notifications.length) {
        handleRippleEffect();
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, loadNotifications]);
  
  useEffect(() => {
    if (isOpen && currentUser) {
      loadNotifications();
    }
  }, [isOpen, currentUser, loadNotifications]);

  const handleRippleEffect = () => {
    setIsRippling(true);
    setTimeout(() => {
      setIsRippling(false);
    }, 1000);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (isSelectionMode) return;
      
      await markNotificationAsRead(currentUser?.uid || "", notification.id);
      
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
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

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      
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

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      setIsLoading(true);
      
      const successfullyDeleted: string[] = [];
      
      for (const notificationId of selectedNotifications) {
        try {
          const success = await deleteNotification(notificationId);
          if (success) {
            successfullyDeleted.push(notificationId);
          }
        } catch (err) {
        }
      }
      
      if (successfullyDeleted.length > 0) {
        setNotifications(prev => prev.filter(n => !successfullyDeleted.includes(n.id)));
        
        setUnreadCount(prev => 
          prev - successfullyDeleted.filter(id => 
            notifications.find(n => n.id === id && !n.read)
          ).length
        );
        
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

  const filteredNotifications = useMemo(() => 
    notifications.filter(notification => 
      activeFilter === 'all' || notification.type === activeFilter
    ), 
    [notifications, activeFilter]
  );
  
  const notificationCounts = useMemo(() => 
    notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
    }, {} as Record<string, number>), 
    [notifications]
  );
  
  const getItemAnimationStyle = useCallback((index: number) => ({
    opacity: 1,
    transform: 'translateY(0)',
    transition: `all 0.3s ease-out ${0.1 + index * 0.05}s`,
  }), []);
  
  // Trigger para o botão de notificações
  const trigger = useMemo(() => (
    <IconButton
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
          <RippleEffect isRippling={isRippling} />
        </Box>
      }
      variant="ghost"
      _hover={{ bg: "gray.700" }}
    />
  ), [unreadCount, isRippling]);
  
  // Carregar configurações de notificação do usuário atual
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const settings = await getUserNotificationSettings(currentUser.uid);
        if (settings) {
          setNotificationSettings(settings);
        }
      } catch (error) {
        // Silenciar erro
      }
    };
    
    loadNotificationSettings();
  }, [currentUser]);
  
  // Função para atualizar configurações de notificação
  const handleNotificationSettingsChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };
  
  // Função para salvar configurações de notificação
  const saveNotificationSettings = async () => {
    if (!currentUser?.uid) return;
    
    setIsSavingSettings(true);
    try {
      await updateUserNotificationSettings(currentUser.uid, notificationSettings);
      toast({
        title: "Configurações salvas",
        description: "Suas preferências de notificação foram atualizadas.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onSettingsClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas preferências.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <AnimatedMenu
        trigger={trigger}
        isOpen={isOpen}
        isVisible={isVisible}
        onOpen={onOpen}
        onClose={onClose}
        alignWithTrigger={true}
        alignOnlyOnDesktop={true}
        responsivePosition={{
          base: { top: "60px", right: "8px", left: "8px" },
          md: { }
        }}
        transformOrigin="top right"
        width={{ base: "calc(100vw - 16px)", md: "380px" }}
        showOverlay={true}
        overlayBg="blackAlpha.500"
        zIndex={{ overlay: 1200, menu: 1300 }}
        menuStyles={{
          bg: "gray.800",
          borderColor: "gray.700",
          boxShadow: "dark-lg",
          borderRadius: { base: "md", md: "md" },
          borderWidth: "1px",
          maxH: { base: "80vh", md: "80vh" },
          overflow: "hidden"
        }}
      >
        {/* Cabeçalho do menu */}
        <Box p={3} bg="gray.900">
          <Flex justify="space-between" align="center" mb={2}>
            <Flex align="center">
              <Text fontWeight="bold" color="white">
                Notificações
              </Text>
              <Tooltip label="Configurações de notificações" placement="top">
                <IconButton
                  aria-label="Configurações de notificações"
                  icon={<SettingsIcon />}
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  ml={2}
                  onClick={onSettingsOpen}
                />
              </Tooltip>
            </Flex>
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
                    bg={activeFilter === NotificationType.NEW_FOLLOWER ? notificationColors.newfollower : "transparent"}
                    color={activeFilter === NotificationType.NEW_FOLLOWER ? "white" : notificationColors.newfollower}
                    _hover={{ bg: activeFilter === NotificationType.NEW_FOLLOWER ? notificationColors.newfollower : "gray.700" }}
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
                    bg={activeFilter === NotificationType.NEW_COMMENT ? notificationColors.newcomment : "transparent"}
                    color={activeFilter === NotificationType.NEW_COMMENT ? "white" : notificationColors.newcomment}
                    _hover={{ bg: activeFilter === NotificationType.NEW_COMMENT ? notificationColors.newcomment : "gray.700" }}
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
                    bg={activeFilter === NotificationType.NEW_REACTION ? notificationColors.newlike : "transparent"}
                    color={activeFilter === NotificationType.NEW_REACTION ? "white" : notificationColors.newlike}
                    _hover={{ bg: activeFilter === NotificationType.NEW_REACTION ? notificationColors.newlike : "gray.700" }}
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
                    bg={activeFilter === NotificationType.NEW_REVIEW ? notificationColors.newreview : "transparent"}
                    color={activeFilter === NotificationType.NEW_REVIEW ? "white" : notificationColors.newreview}
                    _hover={{ bg: activeFilter === NotificationType.NEW_REVIEW ? notificationColors.newreview : "gray.700" }}
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
                    bg={activeFilter === NotificationType.NEW_EPISODE ? notificationColors.newepisode : "transparent"}
                    color={activeFilter === NotificationType.NEW_EPISODE ? "white" : notificationColors.newepisode}
                    _hover={{ bg: activeFilter === NotificationType.NEW_EPISODE ? notificationColors.newepisode : "gray.700" }}
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
      </AnimatedMenu>

      {/* Modal de Configurações de Notificações */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} isCentered>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="gray.800" color="white" mx={4}>
          <ModalHeader>Configurações de Notificações</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text color="gray.400" fontSize="sm">
                Escolha quais tipos de notificações você deseja receber:
              </Text>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="new-follower-notifications" mb="0" color="white" flex="1">
                  Novos seguidores
                </FormLabel>
                <Switch 
                  id="new-follower-notifications"
                  isChecked={notificationSettings.newFollower}
                  onChange={() => handleNotificationSettingsChange('newFollower')}
                  colorScheme="primary"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="new-comment-notifications" mb="0" color="white" flex="1">
                  Comentários nas suas avaliações
                </FormLabel>
                <Switch 
                  id="new-comment-notifications"
                  isChecked={notificationSettings.newComment}
                  onChange={() => handleNotificationSettingsChange('newComment')}
                  colorScheme="primary"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="new-reaction-notifications" mb="0" color="white" flex="1">
                  Reações nas suas avaliações
                </FormLabel>
                <Switch 
                  id="new-reaction-notifications"
                  isChecked={notificationSettings.newReaction}
                  onChange={() => handleNotificationSettingsChange('newReaction')}
                  colorScheme="primary"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="new-review-notifications" mb="0" color="white" flex="1">
                  Avaliações de pessoas que você segue
                </FormLabel>
                <Switch 
                  id="new-review-notifications"
                  isChecked={notificationSettings.newReview}
                  onChange={() => handleNotificationSettingsChange('newReview')}
                  colorScheme="primary"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="new-episode-notifications" mb="0" color="white" flex="1">
                  Novos episódios das séries que você acompanha
                </FormLabel>
                <Switch 
                  id="new-episode-notifications"
                  isChecked={notificationSettings.newEpisode}
                  onChange={() => handleNotificationSettingsChange('newEpisode')}
                  colorScheme="primary"
                />
              </FormControl>
              
              <Button 
                colorScheme="primary"
                onClick={saveNotificationSettings}
                isLoading={isSavingSettings}
                mt={4}
                w="full"
              >
                Salvar preferências
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
} 