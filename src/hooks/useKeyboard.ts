import { useEffect, useCallback, useRef } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;

interface KeyboardOptions {
  /**
   * Se verdadeiro, previne o comportamento padrão do navegador para as teclas mapeadas
   */
  preventDefault?: boolean;
  
  /**
   * Se verdadeiro, impede a propagação do evento para outros handlers
   */
  stopPropagation?: boolean;
  
  /**
   * Se verdadeiro, o hook ficará ativo apenas quando o elemento estiver focado
   */
  enableOnlyWhenFocused?: boolean;
  
  /**
   * Elemento de referência que deve estar focado para que o hook funcione
   * Usado apenas quando enableOnlyWhenFocused é true
   */
  focusRef?: React.RefObject<HTMLElement>;
  
  /**
   * Se verdadeiro, o hook será ativado. Útil para desativar temporariamente.
   */
  enabled?: boolean;
}

/**
 * Hook personalizado para lidar com eventos de teclado globais ou específicos de um elemento.
 */
export function useKeyboard(
  keyMap: KeyMap,
  options: KeyboardOptions = {}
) {
  const {
    preventDefault = true,
    stopPropagation = false,
    enableOnlyWhenFocused = false,
    focusRef,
    enabled = true
  } = options;

  const keyMapRef = useRef(keyMap);

  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    if (enableOnlyWhenFocused && focusRef) {
      const activeElement = document.activeElement;
      if (activeElement !== focusRef.current) {
        return;
      }
    }

    const handler = keyMapRef.current[event.key];
    if (handler) {
      if (preventDefault) {
        event.preventDefault();
      }
      
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      handler(event);
    }
  }, [preventDefault, stopPropagation, enableOnlyWhenFocused, focusRef, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook simplificado para lidar com uma única tecla
 */
export function useKey(
  key: string,
  handler: KeyHandler,
  options: KeyboardOptions = {}
) {
  const keyMap = { [key]: handler };
  return useKeyboard(keyMap, options);
}

/**
 * Hook para detectar a tecla Escape
 */
export function useEscapeKey(
  handler: KeyHandler,
  options: KeyboardOptions = {}
) {
  return useKey('Escape', handler, options);
}

/**
 * Hook para detectar a tecla Enter
 */
export function useEnterKey(
  handler: KeyHandler,
  options: KeyboardOptions = {}
) {
  return useKey('Enter', handler, options);
}

/**
 * Hook para navegação com setinhas
 */
export function useArrowNavigation({
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight
}: {
  onArrowUp?: KeyHandler;
  onArrowDown?: KeyHandler;
  onArrowLeft?: KeyHandler;
  onArrowRight?: KeyHandler;
}, options: KeyboardOptions = {}) {
  
  const keyMap: KeyMap = {};
  
  if (onArrowUp) keyMap['ArrowUp'] = onArrowUp;
  if (onArrowDown) keyMap['ArrowDown'] = onArrowDown; 
  if (onArrowLeft) keyMap['ArrowLeft'] = onArrowLeft;
  if (onArrowRight) keyMap['ArrowRight'] = onArrowRight;
  
  return useKeyboard(keyMap, options);
} 