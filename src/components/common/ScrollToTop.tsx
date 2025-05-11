import { useEffect } from "react";
import { IconButton, Box, useMediaQuery, Tooltip } from "@chakra-ui/react";
import { ChevronUpIcon } from "@chakra-ui/icons";

export function ScrollToTop() {
  const [isMobile] = useMediaQuery("(max-width: 768px)");

  // Função para rolar suavemente para o topo
  const scrollToTop = () => {
    try {
      // Tenta ir para o elemento com ID 'top'
      const topElement = document.getElementById("top");
      if (topElement) {
        topElement.scrollIntoView({ behavior: "smooth" });
      } else {
        // Caso o elemento não seja encontrado, usa métodos alternativos
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      console.error("Erro ao tentar rolar para o topo:", error);
      // Fallback para abordagem direta se houver erro
      window.scrollTo(0, 0);
    }
  };

  // Suporte para atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quando pressionar "Home" ou "Ctrl+ArrowUp"
      if (e.key === "Home" || (e.ctrlKey && e.key === "ArrowUp")) {
        scrollToTop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const button = (
    <IconButton
      onClick={scrollToTop}
      icon={<ChevronUpIcon boxSize="1.8em" />}
      aria-label="Voltar ao topo"
      title="Voltar ao topo da página"
      size={{ base: "md", md: "md" }}
      bg="#04a777"
      color="white"
      _hover={{
        bg: "#039b6d",
      }}
      _active={{
        bg: "#028a60",
      }}
      rounded="full"
    />
  );

  return (
    <Box
      position="fixed"
      bottom={{ base: "24px", md: "30px" }}
      right={{ base: "24px", md: "30px" }}
      zIndex={9999}
      role="region"
      aria-live="polite"
    >
      {isMobile ? (
        button
      ) : (
        <Tooltip
          label="Voltar ao topo"
          placement="left"
          hasArrow
          bg="gray.700"
          color="white"
        >
          {button}
        </Tooltip>
      )}
    </Box>
  );
}
