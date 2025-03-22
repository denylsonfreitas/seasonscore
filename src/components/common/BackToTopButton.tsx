import { IconButton, Link } from "@chakra-ui/react";
import { CaretUp } from "@phosphor-icons/react";
import { useEffect, useState, useCallback } from "react";

// Declaração para TypeScript reconhecer a função global
declare global {
  interface Window {
    scrollToTop: () => void;
  }
}

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Use useCallback para evitar recriação da função em cada renderização
  const checkScrollPosition = useCallback(() => {
    // Tentamos diversas propriedades para garantir compatibilidade entre navegadores
    const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Reduzindo logs para apenas quando houver mudança
    if ((scrollPosition > 300 && !isVisible) || (scrollPosition <= 300 && isVisible)) {
    }
    
    // Atualizar estado apenas se houver mudança
    if (scrollPosition > 300 && !isVisible) {
      setIsVisible(true);
    } else if (scrollPosition <= 300 && isVisible) {
      setIsVisible(false);
    }
  }, [isVisible]);

  // Definindo a função de scroll para o topo como useCallback para estabilidade
  const scrollToTop = useCallback(() => {
    
    // Verificar se a função global existe e usá-la
    if (typeof window.scrollToTop === 'function') {
      window.scrollToTop();
      return;
    }
    
    // Fallback para o método local
    
    // Método 1: ScrollTo com comportamento suave
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    
    // Método 2: ScrollTo direto (caso o método acima falhe)
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    // Método 3: Definir scrollTop diretamente (compatibilidade máxima)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    // Verificar posição inicial
    checkScrollPosition();
    
    // Adicionamos tanto 'scroll' quanto 'touchmove' para suporte a dispositivos móveis
    window.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("touchmove", checkScrollPosition);
    
    // Verificar a cada segundo, mesmo sem evento de scroll (para garantir)
    const intervalId = setInterval(checkScrollPosition, 1000);
    
    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("touchmove", checkScrollPosition);
      clearInterval(intervalId);
    };
  }, [checkScrollPosition]);

  // Sempre renderizar o botão, mas controlar sua visibilidade com CSS
  return (
    <Link 
      href="#top" 
      id="back-to-top-anchor"
      onClick={(e) => {
        e.preventDefault();
        scrollToTop();
      }}
    >
      <IconButton
        aria-label="Voltar ao topo"
        icon={<CaretUp size={24} weight="bold" />}
        onClick={scrollToTop}
        position="fixed"
        bottom="24px"
        right="24px"
        zIndex={9999}
        bg="gray.800"
        color="teal.500"
        _hover={{ bg: "gray.700", color: "white" }}
        boxShadow="xl"
        borderRadius="full"
        size="lg"
        opacity={isVisible ? 0.9 : 0}
        visibility={isVisible ? "visible" : "hidden"}
        transform={isVisible ? "scale(1)" : "scale(0.8)"}
        transition="all 0.3s ease"
      />
    </Link>
  );
} 