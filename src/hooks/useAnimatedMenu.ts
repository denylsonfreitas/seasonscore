import { useState, useEffect, useCallback, useRef } from 'react';
import { useDisclosure } from '@chakra-ui/react';

interface UseAnimatedMenuOptions {
  initialDelay?: number;
  closeDuration?: number;
  isControlled?: boolean;
  controlledOpen?: boolean;
  onControlledClose?: () => void;
}

/**
 * Hook personalizado para gerenciar animações de entrada/saída de menus e popovers.
 * 
 * @param options Opções de configuração para as animações
 * @returns Objeto com estados e funções para gerenciar as animações
 */
export function useAnimatedMenu(options: UseAnimatedMenuOptions = {}) {
  const { 
    initialDelay = 10, 
    closeDuration = 350,
    isControlled = false,
    controlledOpen = false,
    onControlledClose
  } = options;
  
  // Usar disclosure interno apenas se não for controlado
  const disclosure = useDisclosure();
  const [isVisible, setIsVisible] = useState(false);
  const [isRippling, setIsRippling] = useState(false);
  
  // Refs para armazenar os timeouts
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determinar estado atual com base em se é controlado ou não
  const isOpen = isControlled ? controlledOpen : disclosure.isOpen;
  
  // Função para criar estilos de animação para itens de menu - memoizar uma vez
  const getItemAnimationStyle = useCallback((index: number, baseDelay = 0.1) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05 + baseDelay}s`,
  }), [isVisible]);
  
  // Efeito para controlar a visibilidade quando o menu abre/fecha em modo não controlado
  useEffect(() => {
    if (!isControlled && disclosure.isOpen) {
      // Limpar timeout anterior se existir
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      
      // Pequeno atraso para permitir que o DOM seja atualizado
      visibilityTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        visibilityTimeoutRef.current = null;
      }, initialDelay);
    } else if (!isControlled) {
      setIsVisible(false);
    }
    
    // Limpar timeouts ao desmontar
    return () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [disclosure.isOpen, initialDelay, isControlled]);
  
  // Função para abrir o menu
  const handleOpen = useCallback(() => {
    if (!isControlled) {
      disclosure.onOpen();
    }
    // Em modo controlado, o componente pai deve lidar com a abertura
  }, [isControlled, disclosure]);
  
  // Função para fechar o menu com animação
  const handleClose = useCallback(() => {
    setIsVisible(false);
    
    // Limpar timeout anterior se existir
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    // Atraso para a animação completar
    closeTimeoutRef.current = setTimeout(() => {
      if (!isControlled) {
        disclosure.onClose();
      } else if (onControlledClose) {
        onControlledClose();
      }
      closeTimeoutRef.current = null;
    }, closeDuration);
  }, [isControlled, disclosure, closeDuration, onControlledClose]);
  
  // Função para criar o efeito de ripple
  const handleRippleEffect = useCallback(() => {
    if (!isRippling) {
      setIsRippling(true);
      
      // Limpar timeout anterior se existir
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
      
      rippleTimeoutRef.current = setTimeout(() => {
        setIsRippling(false);
        rippleTimeoutRef.current = null;
      }, 600);
    }
  }, [isRippling]);
  
  // Limpar todos os timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current);
    };
  }, []);
  
  return {
    isOpen,
    isVisible,
    isRippling,
    setIsVisible, // Exportar para uso em modo controlado
    handleOpen,
    handleClose,
    handleRippleEffect,
    getItemAnimationStyle,
    // Funções originais do useDisclosure para casos de uso mais específicos
    onOpen: disclosure.onOpen,
    onClose: disclosure.onClose,
  };
} 