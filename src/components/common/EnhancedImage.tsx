import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Image, ImageProps, Center, VStack, Icon, Text, Spinner } from "@chakra-ui/react";
import { TelevisionSimple } from "@phosphor-icons/react";

/**
 * Componente unificado de otimização de imagem que combina as melhores 
 * funcionalidades de LazyImage, ImageOptimizer e EnhancedImage anteriores.
 */
interface EnhancedImageProps extends Omit<ImageProps, "fallback" | "src"> {
  /** URL da imagem */
  src: string;
  /** Texto alternativo para a imagem */
  alt: string;
  /** Texto a ser exibido se a imagem não carregar */
  fallbackText?: string;
  /** Limiar de observação para lazy loading (0-1) */
  threshold?: number;
  /** Qualidade da imagem para otimização (0-100) */
  quality?: number;
  /** Define atributo sizes para srcset responsivo */
  sizes?: string;
  /** URL de imagem de baixa qualidade para mostrar enquanto carrega */
  lowQualitySrc?: string;
  /** Se a imagem deve ser carregada prioritariamente */
  priority?: boolean;
  /** Largura padrão para imagens TMDB (w200, w300, w400, w500, w780, original) */
  tmdbWidth?: string;
  /** Placeholder customizado */
  placeholder?: React.ReactNode;
}

/**
 * Função utilitária para otimizar URLs de imagem baseado no serviço (TMDB, Cloudinary, etc)
 */
const getOptimizedImageUrl = (src: string, width: number, quality = 80, tmdbWidth?: string): string => {
  if (!src) return '';
  
  // Otimização para imagens do TMDB
  if (src.includes('image.tmdb.org/t/p/')) {
    // Se um tamanho tmdb específico foi fornecido, usá-lo
    if (tmdbWidth) {
      return src.replace(/(image\.tmdb\.org\/t\/p\/)([^\/]+)(\/.+)$/, `$1${tmdbWidth}$3`);
    }
    
    // Caso contrário, escolher o tamanho mais próximo da largura fornecida
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
  
  // Otimização para Cloudinary
  if (src.includes('cloudinary.com')) {
    // Evitar aplicar otimização se já tiver parâmetros de otimização
    if (src.includes('/upload/q_')) {
      return src;
    }
    return src.replace(/\/upload\//, `/upload/q_${quality},w_${width},f_auto/`);
  }
  
  // Outras imagens retornam sem alteração
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
  tmdbWidth,
  placeholder,
  ...props
}: EnhancedImageProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [finalSrc, setFinalSrc] = useState<string>(src);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Preparar a URL otimizada da imagem
  useEffect(() => {
    if (!src) {
      setFinalSrc('');
      return;
    }

    // Para TMDB ou Cloudinary, otimizar diretamente
    if (src.includes('image.tmdb.org/t/p/') || src.includes('cloudinary.com')) {
      const optimizedWidth = 500; // Largura média para o src principal
      setFinalSrc(getOptimizedImageUrl(src, optimizedWidth, quality, tmdbWidth));
    } else {
      setFinalSrc(src);
    }
  }, [src, quality, tmdbWidth]);

  // Configurar observador de interseção para lazy loading
  useEffect(() => {
    // Se for prioritário, não precisa de lazy loading
    if (priority) {
      setIsVisible(true);
      return;
    }
    
    // Limpar observador anterior se existir
    if (observerRef.current && imgRef.current) {
      observerRef.current.disconnect();
    }
    
    // Configurar novo observador
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

    // Observar o elemento se existir
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, priority]);

  // Resetar estados quando a fonte mudar
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Handlers de eventos da imagem
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  // Criar conjunto de sources para diferentes resoluções (srcSet)
  const srcSet = useMemo(() => {
    if (!src) return undefined;
    
    return [300, 500, 800, 1200]
      .map(width => `${getOptimizedImageUrl(src, width, quality, tmdbWidth)} ${width}w`)
      .join(', ');
  }, [src, quality, tmdbWidth]);

  // Componente de fallback para erros de carregamento
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

  // Componente de loading
  const loadingComponent = useMemo(() => 
    placeholder || (
      <Center w="100%" h="100%" bg="gray.700">
        <Spinner size="sm" color="gray.500" />
      </Center>
    )
  , [placeholder]);

  // Componente de imagem com potencial blur de carregamento
  const imageComponent = useMemo(() => {
    if (!isVisible || hasError) return null;
    
    return (
      <>
        {/* Imagem de baixa qualidade como placeholder durante carregamento */}
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
        
        {/* Imagem principal */}
        <Image
          src={finalSrc}
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
          {...props}
        />
      </>
    );
  }, [
    isVisible, 
    hasError, 
    finalSrc, 
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