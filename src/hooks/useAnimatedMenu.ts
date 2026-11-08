import { useState, useEffect, useCallback, useRef } from "react";
import { useDisclosure } from "@chakra-ui/react";

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
    onControlledClose,
  } = options;

  const disclosure = useDisclosure();
  const [isVisible, setIsVisible] = useState(false);

  const visibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = isControlled ? controlledOpen : disclosure.isOpen;

  const getItemAnimationStyle = useCallback(
    (index: number, baseDelay = 0.1) => ({
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0)" : "translateY(4px)",
      transition: `opacity 200ms ease-out ${index * 0.03 + baseDelay / 2}s, transform 200ms ease-out ${index * 0.03 + baseDelay / 2}s`,
    }),
    [isVisible]
  );

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

  useEffect(() => {
    return () => {
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return {
    isOpen,
    isVisible,
    setIsVisible,
    handleOpen,
    handleClose,
    getItemAnimationStyle,
    onOpen: disclosure.onOpen,
    onClose: disclosure.onClose,
  };
}
