import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Image, ImageProps, Center, VStack, Icon, Text, Spinner } from "@chakra-ui/react";
import { TelevisionSimple } from "@phosphor-icons/react";

interface EnhancedImageProps extends Omit<ImageProps, "fallback" | "src"> {
  src: string;
  alt: string;
  fallbackText?: string;
  threshold?: number;
  quality?: number;
  sizes?: string;
  lowQualitySrc?: string;
  priority?: boolean;
  blurhash?: string;
}

const getOptimizedImageUrl = (src: string, width: number, quality = 80): string => {
  if (!src) return '';
  
  if (src.includes('image.tmdb.org/t/p/')) {
    const tmdbSizes: Record<number, string> = {
      200: 'w200',
      300: 'w300',
      400: 'w400',
      500: 'w500',
      780: 'w780',
      1280: 'original'
    };
    
    const sizeToUse = Object.entries(tmdbSizes)
      .reduce((prev, [size, path]) => {
        return Math.abs(parseInt(size) - width) < Math.abs(parseInt(prev[0]) - width) 
          ? [size, path] 
          : prev;
      }, ['1280', 'original']);
    
    return src.replace(/(image\.tmdb\.org\/t\/p\/)([^\/]+)(\/.+)$/, `$1${sizeToUse[1]}$3`);
  }
  
  if (src.includes('cloudinary.com')) {
    if (src.includes('/upload/q_')) {
      return src;
    }
    return src.replace(/\/upload\//, `/upload/q_${quality},w_${width},f_auto/`);
  }
  
  return src;
};

/**
 * EnhancedImage - Componente de imagem otimizado com carregamento progressivo,
 * lazy loading, e otimização automática para diferentes serviços.
 */
export function EnhancedImage({
  src,
  alt,
  fallbackText = "Imagem não disponível",
  threshold = 0.1,
  quality = 80,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  lowQualitySrc,
  priority = false,
  blurhash,
  ...props
}: EnhancedImageProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority) {
      setIsVisible(true);
      return;
    }
    
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
      { 
        threshold, 
        rootMargin: "200px" 
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, priority]);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  const srcSet = useMemo(() => {
    if (!src) return undefined;
    
    return [300, 500, 800, 1200]
      .map(width => `${getOptimizedImageUrl(src, width, quality)} ${width}w`)
      .join(', ');
  }, [src, quality]);

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

  const loadingComponent = useMemo(() => (
    <Center w="100%" h="100%" bg="gray.700">
      <Spinner size="sm" color="gray.500" />
    </Center>
  ), []);

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
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          {...props}
        />
      </>
    );
  }, [
    isVisible, 
    hasError, 
    src, 
    srcSet, 
    sizes, 
    alt, 
    lowQualitySrc, 
    isLoaded, 
    handleImageLoad, 
    handleImageError, 
    priority,
    props
  ]);

  return (
    <Box 
      ref={imgRef} 
      height="100%" 
      width="100%" 
      bg="gray.700" 
      position="relative"
      overflow="hidden"
    >
      {imageComponent}
      {!isVisible && !priority && loadingComponent}
      {isVisible && !isLoaded && !lowQualitySrc && loadingComponent}
      {hasError && fallbackComponent}
    </Box>
  );
}