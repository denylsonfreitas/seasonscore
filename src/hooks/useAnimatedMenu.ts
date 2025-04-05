import { useState, useEffect, useCallback, useRef } from 'react';
import { useDisclosure } from '@chakra-ui/react';

interface UseAnimatedMenuOptions {
  initialDelay?: number;
  closeDuration?: number;
  isControlled?: boolean;
  controlledOpen?: boolean;
  onControlledClose?: () => void;
}

export function useAnimatedMenu(options: UseAnimatedMenuOptions = {}) {
  const { 
    initialDelay = 10, 
    closeDuration = 350,
    isControlled = false,
    controlledOpen = false,
    onControlledClose
  } = options;
  
  const disclosure = useDisclosure();
  const [isVisible, setIsVisible] = useState(false);
  const [isRippling, setIsRippling] = useState(false);
  
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isOpen = isControlled ? controlledOpen : disclosure.isOpen;
  
  const getItemAnimationStyle = useCallback((index: number, baseDelay = 0.1) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.05 + baseDelay}s`,
  }), [isVisible]);
  
  useEffect(() => {
    if (!isControlled && disclosure.isOpen) {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      
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
  
  const handleOpen = useCallback(() => {
    if (!isControlled) {
      disclosure.onOpen();
    }
  }, [isControlled, disclosure]);
  
  const handleClose = useCallback(() => {
    setIsVisible(false);
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      if (!isControlled) {
        disclosure.onClose();
      } else if (onControlledClose) {
        onControlledClose();
      }
      closeTimeoutRef.current = null;
    }, closeDuration);
  }, [isControlled, disclosure, closeDuration, onControlledClose]);
  
  const handleRippleEffect = useCallback(() => {
    if (!isRippling) {
      setIsRippling(true);
      
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
      
      rippleTimeoutRef.current = setTimeout(() => {
        setIsRippling(false);
        rippleTimeoutRef.current = null;
      }, 600);
    }
  }, [isRippling]);
  
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
    setIsVisible,
    handleOpen,
    handleClose,
    handleRippleEffect,
    getItemAnimationStyle,
    onOpen: disclosure.onOpen,
    onClose: disclosure.onClose,
  };
} 