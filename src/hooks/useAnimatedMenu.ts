import { useState, useEffect, useCallback } from 'react';
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
  
  // Determinar estado atual com base em se é controlado ou não
  const isOpen = isControlled ? controlledOpen : disclosure.isOpen;
  
  // Efeito para controlar a visibilidade quando o menu abre/fecha em modo não controlado
  useEffect(() => {
    if (!isControlled && disclosure.isOpen) {
      // Pequeno atraso para permitir que o DOM seja atualizado
      setTimeout(() => {
        setIsVisible(true);
      }, initialDelay);
    } else if (!isControlled) {
      setIsVisible(false);
    }
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
    // Atraso para a animação completar
    setTimeout(() => {
      if (!isControlled) {
        disclosure.onClose();
      } else if (onControlledClose) {
        onControlledClose();
      }
    }, closeDuration);
  }, [isControlled, disclosure, closeDuration, onControlledClose]);
  
  // Função para criar o efeito de ripple
  const handleRippleEffect = useCallback(() => {
    if (!isRippling) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    }
  }, [isRippling]);
  
  // Função para criar estilos de animação para itens de menu
  const getItemAnimationStyle = useCallback((index: number, baseDelay = 0.1) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05 + baseDelay}s`,
  }), [isVisible]);
  
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