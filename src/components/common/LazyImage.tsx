import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Image, ImageProps, Center, VStack, Icon, Text } from "@chakra-ui/react";
import { TelevisionSimple } from "@phosphor-icons/react";

interface LazyImageProps extends Omit<ImageProps, "fallback"> {
  src: string;
  alt: string;
  fallbackText?: string;
  threshold?: number;
  quality?: number;
  sizes?: string;
  lowQualitySrc?: string;
}

// Função auxiliar para criar URLs otimizadas para TMDB
const getOptimizedImageUrl = (src: string, width: number, quality = 80): string => {
  // Verificar se é uma URL do TMDB
  if (src.includes('image.tmdb.org/t/p/')) {
    // Substituir o tamanho da imagem no caminho TMDB
    const tmdbSizes: Record<number, string> = {
      200: 'w200',
      300: 'w300',
      400: 'w400',
      500: 'w500',
      780: 'w780',
      1280: 'original'
    };
    
    // Encontrar o tamanho mais próximo
    const sizeToUse = Object.entries(tmdbSizes)
      .reduce((prev, [size, path]) => {
        return Math.abs(parseInt(size) - width) < Math.abs(parseInt(prev[0]) - width) 
          ? [size, path] 
          : prev;
      }, ['1280', 'original']);
    
    // Correção: manter o domínio completo na URL e apenas substituir o padrão de tamanho
    return src.replace(/(image\.tmdb\.org\/t\/p\/)([^\/]+)(\/.+)$/, `$1${sizeToUse[1]}$3`);
  }
  
  // Verificar se é uma URL do Cloudinary
  if (src.includes('cloudinary.com')) {
    return src.replace(/\/upload\//, `/upload/q_${quality},w_${width}/`);
  }
  
  // URLs regulares
  return src;
};

export function LazyImage({
  src,
  alt,
  fallbackText = "Imagem não disponível",
  threshold = 0.1,
  quality = 80,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  lowQualitySrc,
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
      { threshold, rootMargin: "200px" }
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

  // Criar srcSet para diferentes tamanhos de tela
  const srcSet = useMemo(() => {
    if (!src) return undefined;
    
    return [300, 500, 800, 1200]
      .map(width => `${getOptimizedImageUrl(src, width, quality)} ${width}w`)
      .join(', ');
  }, [src, quality]);

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

  // Memorizar o componente de imagem com técnica de carregamento progressivo
  const imageComponent = useMemo(() => {
    if (!isVisible || hasError) return null;
    
    return (
      <>
        {lowQualitySrc && !isLoaded && (
          <Image
            src={lowQualitySrc}
            alt={alt}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            objectFit="cover"
            filter="blur(10px)"
            opacity={0.8}
            transition="opacity 0.3s"
          />
        )}
        <Image
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          opacity={isLoaded ? 1 : 0}
          transition="opacity 0.3s"
          width="100%"
          height="100%"
          objectFit="cover"
          loading="lazy"
          decoding="async"
          {...props}
        />
      </>
    );
  }, [isVisible, hasError, src, srcSet, sizes, alt, lowQualitySrc, isLoaded, handleImageLoad, handleImageError, props]);

  return (
    <Box ref={imgRef} height="100%" width="100%" bg="gray.700" position="relative">
      {imageComponent}
      {(!isVisible || hasError) && fallbackComponent}
    </Box>
  );
} 