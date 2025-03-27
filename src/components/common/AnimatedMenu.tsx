import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Box, Portal, useBreakpointValue } from "@chakra-ui/react";
import { useAnimatedMenu } from "../../hooks/useAnimatedMenu";

interface Position {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

interface AnimatedMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isVisible: boolean;
  menuStyles?: Record<string, any>;
  /** Posição fixa do menu (será sobrescrita se alignWithTrigger=true) */
  position?: Position;
  /** Posição responsiva do menu - sobrescreve position */
  responsivePosition?: {
    base?: Position;
    sm?: Position;
    md?: Position;
    lg?: Position;
    xl?: Position;
  };
  /** Width of the menu */
  width?: string | Record<string, string>;
  /** Z-index for the menu and overlay */
  zIndex?: {
    overlay?: number;
    menu?: number;
  };
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
  
  // Determinar se estamos em uma tela mobile ou desktop
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Obter a posição com base no breakpoint atual
  const currentPosition = useBreakpointValue(responsivePosition || {}) || position;
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(currentPosition);
  const [positionCalculated, setPositionCalculated] = useState(false);
  
  // Atualizar posição do menu com base no trigger quando solicitado
  useEffect(() => {
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

  // Resetar o estado de cálculo de posição quando o menu fecha
  useEffect(() => {
    if (!isOpen) {
      setPositionCalculated(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Elemento trigger que aciona o menu */}
      <Box onClick={onOpen} ref={triggerRef}>
        {trigger}
      </Box>

      {/* Menu e Overlay */}
      {isOpen && (
        <Portal>
          {/* Overlay invisível que fecha o menu quando clicado */}
          {showOverlay && (
            <Box
              position="fixed"
              top="0"
              left="0"
              right="0"
              bottom="0"
              zIndex={zIndex.overlay}
              onClick={onClose}
              bg={overlayBg}
              pointerEvents={isVisible ? "auto" : "none"}
              opacity={isVisible && overlayBg !== "transparent" ? 1 : 0}
              transition={overlayBg !== "transparent" ? "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)" : undefined}
            />
          )}
          
          {/* Conteúdo do menu */}
          <Box 
            bg="gray.800" 
            borderColor="gray.700" 
            boxShadow="dark-lg" 
            p={2}
            borderRadius="md"
            minWidth={width}
            zIndex={zIndex.menu}
            position="fixed"
            {...menuPosition}
            borderWidth="1px"
            onClick={stopPropagation}
            transform={isVisible ? "translateY(0) scale(1)" : "translateY(-25px) scale(0.92)"}
            opacity={isVisible ? 1 : 0}
            transition="transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
            transformOrigin={transformOrigin}
            willChange="transform, opacity"
            {...menuStyles}
          >
            {children}
          </Box>
        </Portal>
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