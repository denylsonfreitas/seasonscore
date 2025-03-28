import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, useBreakpointValue, PositionProps } from "@chakra-ui/react";
import { createPortal } from "react-dom";

// Hook para gerenciar estado do menu animado
export function useAnimatedMenu(options = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    // Pequeno atraso para permitir animação
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Esperar a animação terminar antes de fechar realmente
    setTimeout(() => setIsOpen(false), 300);
  }, []);

  return {
    isOpen,
    isVisible,
    handleOpen,
    handleClose,
  };
}

type Position = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

interface AnimatedMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  isVisible?: boolean;
  onOpen: () => void;
  onClose: () => void;
  menuStyles?: Record<string, any>;
  /** Posição fixa do menu (será sobrescrita se alignWithTrigger=true) */
  position?: Position;
  /** Posição responsiva do menu - sobrescreve position */
  responsivePosition?: Record<string, Position>;
  /** Width of the menu */
  width?: string | Record<string, string>;
  /** Z-index for the menu and overlay */
  zIndex?: { overlay: number; menu: number };
  /** Whether to show a backdrop overlay */
  showOverlay?: boolean;
  /** Background color for the overlay */
  overlayBg?: string;
  /** Se o menu deve ficar alinhado com o trigger */
  alignWithTrigger?: boolean;
  /** Alinhamento apenas em telas maiores */
  alignOnlyOnDesktop?: boolean;
  /** Origem da transformação */
  transformOrigin?: string;
}

/**
 * Componente reutilizável para criar menus animados em toda a aplicação
 */
export function AnimatedMenu({
  trigger,
  children,
  isOpen,
  onOpen,
  onClose,
  isVisible,
  menuStyles = {},
  position = { top: "60px", right: "16px" },
  responsivePosition,
  width = { base: "260px", md: "300px" },
  zIndex = { overlay: 1200, menu: 1300 },
  showOverlay = true,
  overlayBg = "transparent",
  alignWithTrigger = false,
  alignOnlyOnDesktop = false,
  transformOrigin = "top right",
}: AnimatedMenuProps) {
  
  // Handler para impedir propagação de cliques
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  // React Hooks para breakpoints - todos no início do componente
  const isMobile = useBreakpointValue({ base: true, md: false });
  const responsivePositionValue = useBreakpointValue(responsivePosition || {});
  const responsiveWidthValue = useBreakpointValue(typeof width === 'object' ? width : {});
  
  // Variáveis derivadas - não são hooks
  const currentPosition = responsivePositionValue || position;
  const widthStyle = typeof width === 'string' ? width : responsiveWidthValue || '260px';
  const visibilityState = isVisible !== undefined ? isVisible : isOpen;
  
  // Refs e state
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<Position>(currentPosition);
  const [positionCalculated, setPositionCalculated] = useState(false);
  
  // Calcular a posição do menu apenas quando necessário
  const calculateMenuPosition = useCallback(() => {
    if (alignWithTrigger && triggerRef.current && isOpen && !positionCalculated) {
      // Se for mobile e alignOnlyOnDesktop for true, não alinhar com o trigger
      if (isMobile && alignOnlyOnDesktop) {
        setMenuPosition(currentPosition);
      } else {
        const rect = triggerRef.current.getBoundingClientRect();
        
        setMenuPosition({
          top: `${rect.bottom + 8}px`, // 8px de espaço abaixo do trigger
          right: window.innerWidth - rect.right + 'px', // Alinhado com a direita do trigger
        });
      }
      setPositionCalculated(true);
    } else if (!alignWithTrigger && !positionCalculated) {
      setMenuPosition(currentPosition);
      setPositionCalculated(true);
    }
  }, [alignWithTrigger, isOpen, currentPosition, positionCalculated, isMobile, alignOnlyOnDesktop]);
  
  // Configurando um handler para fechar o menu ao clicar fora
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        // Se o clique não foi no menu nem no trigger, fechar
        if (
          menuRef.current && 
          !menuRef.current.contains(e.target as Node) && 
          triggerRef.current && 
          !triggerRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      };
      
      // Adicionar handler depois de um pequeno delay
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);
  
  // Atualizar posição do menu apenas quando necessário
  useEffect(() => {
    if (isOpen) {
      calculateMenuPosition();
      
      // Adicionar observador de redimensionamento apenas quando alinhado ao trigger
      if (alignWithTrigger) {
        const handleResize = () => {
          setPositionCalculated(false);
          calculateMenuPosition();
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }
    } else {
      setPositionCalculated(false);
    }
  }, [isOpen, calculateMenuPosition, alignWithTrigger]);
  
  // Memoize overlay para evitar recriações em cada render
  const overlay = useMemo(() => {
    if (!showOverlay || !isOpen) return null;
    
    return createPortal(
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex={zIndex?.overlay}
        onClick={onClose}
        bg={overlayBg}
        pointerEvents={visibilityState ? "auto" : "none"}
        opacity={visibilityState && overlayBg !== "transparent" ? 1 : 0}
        transition={overlayBg !== "transparent" ? "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)" : undefined}
        data-testid="animated-menu-overlay"
      />,
      document.body
    );
  }, [showOverlay, isOpen, zIndex?.overlay, onClose, overlayBg, visibilityState]);
  
  return (
    <>
      {/* O trigger do menu */}
      <Box ref={triggerRef} display="inline-block" onClick={onOpen}>
        {trigger}
      </Box>
      
      {/* Overlay - renderizado apenas quando necessário */}
      {overlay}
      
      {/* Menu - renderizado via Portal para evitar problemas de z-index */}
      {isOpen && createPortal(
        <Box
          ref={menuRef}
          onClick={stopPropagation}
          position="fixed"
          {...menuPosition}
          width={widthStyle}
          zIndex={zIndex?.menu}
          transform={visibilityState 
            ? "translateY(0) scale(1)" 
            : "translateY(-15px) scale(0.95)"}
          opacity={visibilityState ? 1 : 0}
          transition="transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s"
          transformOrigin={transformOrigin}
          willChange="transform, opacity"
          {...menuStyles}
          data-testid="animated-menu"
        >
          {children}
        </Box>,
        document.body
      )}
    </>
  );
}

/**
 * Hook e componente combinados para facilitar o uso
 */
export function useAnimatedMenuComponent(options = {}) {
  const menuHook = useAnimatedMenu(options);
  
  const AnimatedMenuComponent = useCallback(
    ({ trigger, children, ...props }: Omit<AnimatedMenuProps, 'isOpen' | 'onOpen' | 'onClose' | 'isVisible'>) => (
      <AnimatedMenu
        trigger={trigger}
        isOpen={menuHook.isOpen}
        onOpen={menuHook.handleOpen}
        onClose={menuHook.handleClose}
        isVisible={menuHook.isVisible}
        {...props}
      >
        {children}
      </AnimatedMenu>
    ),
    [menuHook.isOpen, menuHook.handleOpen, menuHook.handleClose, menuHook.isVisible]
  );
  
  return {
    ...menuHook,
    AnimatedMenuComponent,
  };
} 