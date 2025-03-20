import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const renderFallback = () => (
    <Center py={20}>
      <VStack spacing={4}>
        <Icon as={TelevisionSimple} boxSize={12} color="gray.500" weight="thin" />
        <Text color="gray.500" fontSize="sm" textAlign="center">
          {fallbackText}
        </Text>
      </VStack>
    </Center>
  );

  return (
    <Box ref={imgRef} height="100%" width="100%" bg="gray.700">
      {isVisible && !hasError ? (
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
      ) : null}
      {(!isVisible || hasError) && renderFallback()}
    </Box>
  );
} 