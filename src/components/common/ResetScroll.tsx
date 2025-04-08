import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Este componente reseta o scroll da página quando navegando entre rotas
export function ResetScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Implementação simples e direta
    const resetScroll = () => {
      // Usar método direto para evitar problemas com a função global
      window.scrollTo(0, 0);
    };
    
    // Executar imediatamente
    resetScroll();
    
    // Retry com um pequeno delay
    const timeoutId = setTimeout(resetScroll, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
} 