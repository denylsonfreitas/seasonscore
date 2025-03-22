import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ResetScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Usar a função global se disponível
    if (typeof window.scrollToTop === 'function') {
      window.scrollToTop();
      return;
    }
    
    // Fallback para métodos diretos
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Segundo tentativa após pequeno delay
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
} 