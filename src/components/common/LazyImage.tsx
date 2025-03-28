import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Image, ImageProps, Center, VStack, Icon, Text } from "@chakra-ui/react";
import { TelevisionSimple } from "@phosphor-icons/react";

interface LazyImageProps extends Omit<ImageProps, "fallback"> {
  src: string;
  alt: string;
  fallbackText?: string;
  threshold?: number;
}

export function LazyImage({
  src,
  alt,
  fallbackText = "Imagem não disponível",
  threshold = 0.1,
  ...props
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Limpar qualquer observador anterior
    if (observerRef.current && imgRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold]);

  // Reset states quando o src mudar
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    // Se já estiver visível, não precisamos resetar isso
  }, [src]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  // Memorizar o fallback para evitar recriações
  const fallbackComponent = useMemo(() => (
    <Center py={20}>
      <VStack spacing={4}>
        <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
        <Text color="gray.500" fontSize="sm" textAlign="center">
          {fallbackText}
        </Text>
      </VStack>
    </Center>
  ), [fallbackText]);

  // Memorizar o componente de imagem
  const imageComponent = useMemo(() => {
    if (!isVisible || hasError) return null;
    
    return (
      <Image
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        opacity={isLoaded ? 1 : 0}
        transition="opacity 0.3s"
        width="100%"
        height="100%"
        objectFit="cover"
        {...props}
      />
    );
  }, [isVisible, hasError, src, alt, handleImageLoad, handleImageError, isLoaded, props]);

  return (
    <Box ref={imgRef} height="100%" width="100%" bg="gray.700">
      {imageComponent}
      {(!isVisible || hasError) && fallbackComponent}
    </Box>
  );
} 