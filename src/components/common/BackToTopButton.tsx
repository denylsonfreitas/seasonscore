import { IconButton, Link } from "@chakra-ui/react";
import { CaretUp } from "@phosphor-icons/react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

// Declaração para TypeScript reconhecer a função global
declare global {
  interface Window {
    scrollToTop: () => void;
  }
}

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Use useCallback para evitar recriação da função em cada renderização
  const checkScrollPosition = useCallback(() => {
    // Evitar múltiplas execuções durante o scroll
    if (!ticking.current) {
      requestAnimationFrame(() => {
        // Tentamos diversas propriedades para garantir compatibilidade entre navegadores
        const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        
        // Atualizar estado apenas se houver mudança significativa (mais de 50px)
        if ((scrollPosition > 300 && !isVisible) || (scrollPosition <= 300 && isVisible)) {
          setIsVisible(scrollPosition > 300);
        }
        
        lastScrollY.current = scrollPosition;
        ticking.current = false;
      });
      
      ticking.current = true;
    }
  }, [isVisible]);

  // Definindo a função de scroll para o topo como useCallback para estabilidade
  const scrollToTop = useCallback(() => {
    // Verificar se a função global existe e usá-la
    if (typeof window.scrollToTop === 'function') {
      window.scrollToTop();
      return;
    }
    
    // Método principal: ScrollTo com comportamento suave
    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (e) {
      // Fallback para navegadores mais antigos que não suportam behavior: smooth
      window.scrollTo(0, 0);
    }
    
    // Método de backup (caso o método acima falhe)
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    // Verificar posição inicial apenas uma vez
    checkScrollPosition();
    
    // Adicionar evento de scroll com throttling
    const handleScroll = () => {
      checkScrollPosition();
    };
    
    // Usamos passive: true para melhorar o desempenho
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [checkScrollPosition]);

  // Memorizamos o botão para evitar re-renderização
  const button = useMemo(() => (
    <IconButton
      aria-label="Voltar ao topo"
      icon={<CaretUp size={24} weight="bold" />}
      position="fixed"
      bottom="24px"
      right="24px"
      zIndex={9999}
      bg="gray.800"
      color="primary.500"
      _hover={{ bg: "gray.700", color: "white" }}
      boxShadow="xl"
      borderRadius="full"
      size="lg"
      opacity={isVisible ? 0.9 : 0}
      visibility={isVisible ? "visible" : "hidden"}
      transform={isVisible ? "scale(1)" : "scale(0.8)"}
      transition="all 0.3s ease"
    />
  ), [isVisible]);

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
      {button}
    </Link>
  );
} 