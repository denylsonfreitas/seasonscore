import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Este componente reseta o scroll da página quando navegando entre rotas
export function ResetScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Função para resetar o scroll
    const resetScroll = () => {
      // Tenta diferentes métodos para garantir que funcione em todos os navegadores
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Executa imediatamente
    resetScroll();

    // Tenta novamente com um pequeno delay para garantir
    const timeoutId = setTimeout(resetScroll, 100);

    // Tenta uma última vez com um delay maior para casos de carregamento assíncrono
    const finalTimeoutId = setTimeout(resetScroll, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(finalTimeoutId);
    };
  }, [pathname]);

  return null;
}
