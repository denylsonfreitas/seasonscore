import { IconButton, useColorModeValue } from "@chakra-ui/react";
import { CaretUp } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const bgColor = useColorModeValue("white", "gray.800");
  const hoverBgColor = useColorModeValue("gray.100", "gray.700");

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <IconButton
      aria-label="Voltar ao topo"
      icon={<CaretUp size={24} weight="bold" />}
      onClick={scrollToTop}
      position="fixed"
      bottom={8}
      right={8}
      zIndex={1000}
      bg={bgColor}
      color="teal.500"
      _hover={{ bg: hoverBgColor }}
      boxShadow="lg"
      borderRadius="full"
      size="lg"
      transition="all 0.2s ease"
      _active={{ transform: "scale(0.95)" }}
    />
  );
} 