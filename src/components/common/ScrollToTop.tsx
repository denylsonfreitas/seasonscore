import { ArrowUp } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { IconButton } from "@chakra-ui/react";

/** Botão discreto que aparece depois de rolar bastante a página. */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 1200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <IconButton
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      icon={<ArrowUp size={18} />}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      position="fixed"
      bottom={{ base: 4, md: 6 }}
      right={{ base: 4, md: 6 }}
      zIndex={900}
      size="md"
      variant="outline"
      bg="ink.900"
      borderColor="ink.700"
      color="ink.200"
      _hover={{ bg: "ink.850", color: "ink.50" }}
      opacity={visible ? 1 : 0}
      pointerEvents={visible ? "auto" : "none"}
      transform={visible ? "none" : "translateY(8px)"}
      transition="opacity 200ms ease, transform 200ms ease"
      tabIndex={visible ? 0 : -1}
    />
  );
}
