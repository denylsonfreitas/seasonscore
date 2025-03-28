import React, { useState, useEffect, useCallback } from 'react';
import { Box, Image, ImageProps, Spinner, Center } from '@chakra-ui/react';

interface ImageOptimizerProps extends Omit<ImageProps, 'src'> {
  src: string;
  sizes?: string;
  lowQualitySrc?: string;
  placeholder?: React.ReactNode;
  priority?: boolean;
  tmdbBaseWidth?: string;
}

/**
 * Componente otimizado para carregamento eficiente de imagens
 * com suporte a carregamento prioritário e técnicas de otimização
 */
export function ImageOptimizer({
  src,
  sizes = '100vw',
  lowQualitySrc,
  placeholder,
  priority = false,
  tmdbBaseWidth = 'w500',
  alt = '',
  ...rest
}: ImageOptimizerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [finalSrc, setFinalSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Preparar a URL da imagem com base na origem
  useEffect(() => {
    if (!src) {
      setFinalSrc(null);
      return;
    }

    // Se a imagem for do TMDB, otimizar com o tamanho apropriado
    if (src.includes('image.tmdb.org/t/p/')) {
      // Correção: manter o domínio completo na URL e apenas substituir o padrão de tamanho
      const optimizedSrc = src.replace(/(image\.tmdb\.org\/t\/p\/)([^\/]+)(\/.+)$/, `$1${tmdbBaseWidth}$3`);
      setFinalSrc(optimizedSrc);
    }
    // Se for do Cloudinary, podemos definir otimizações
    else if (src.includes('cloudinary.com') && !src.includes('/upload/q_')) {
      const optimizedSrc = src.replace(/\/upload\//, '/upload/q_auto,f_auto,w_auto/');
      setFinalSrc(optimizedSrc);
    }
    // Para outras imagens, usar o src original
    else {
      setFinalSrc(src);
    }
  }, [src, tmdbBaseWidth]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setIsLoaded(true);
  }, []);

  // Se não tiver src, mostrar apenas o placeholder
  if (!finalSrc) {
    return (
      <Box
        overflow="hidden"
        position="relative"
        {...rest}
        as="span"
        display="block"
      >
        {placeholder || (
          <Center w="100%" h="100%" bg="gray.700">
            <Spinner size="sm" color="gray.500" />
          </Center>
        )}
      </Box>
    );
  }

  return (
    <Box
      overflow="hidden"
      position="relative"
      {...rest}
      as="span" 
      display="block"
    >
      {/* Low quality placeholder */}
      {!isLoaded && lowQualitySrc && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          objectFit="cover"
          filter="blur(15px)"
          opacity={0.7}
          transition="opacity 0.2s"
          zIndex={1}
        />
      )}

      {/* Placeholder enquanto carrega */}
      {!isLoaded && !lowQualitySrc && placeholder}

      {/* Spinner como placeholder padrão se não tiver outro placeholder */}
      {!isLoaded && !lowQualitySrc && !placeholder && (
        <Center 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          bottom="0" 
          bg="gray.700"
          zIndex={1}
        >
          <Spinner size="sm" color="gray.500" />
        </Center>
      )}

      {/* Imagem real */}
      <Image
        src={finalSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        opacity={isLoaded ? 1 : 0}
        transition="opacity 0.3s"
        position="relative"
        zIndex={2}
        width="100%"
        height="100%"
        objectFit="cover"
        loading={priority ? "eager" : "lazy"}
        {...rest}
      />

      {/* Fallback para erro de carregamento */}
      {error && (
        <Center 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          bottom="0" 
          bg="gray.700"
          zIndex={3}
        >
          {placeholder || <Box opacity={0.6}>❌</Box>}
        </Center>
      )}
    </Box>
  );
} 