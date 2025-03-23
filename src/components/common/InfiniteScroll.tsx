import { useEffect, useRef } from "react";
import { Box, Spinner, Center, Text, Flex } from "@chakra-ui/react";

interface InfiniteScrollProps {
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  children: React.ReactNode;
}

export function InfiniteScroll({
  loadMore,
  hasMore,
  isLoading,
  threshold = 0.8,
  children,
}: InfiniteScrollProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold }
    );

    const currentRef = loaderRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore, hasMore, isLoading, threshold]);

  return (
    <>
      {children}
      <Box ref={loaderRef} py={4} textAlign="center">
        {isLoading && (
          <Center>
            <Spinner size="md" color="primary.500" thickness="3px" />
          </Center>
        )}
        {!hasMore && !isLoading && (
          <Text color="gray.500" fontSize="sm">
            Não há mais conteúdo para exibir
          </Text>
        )}
      </Box>
    </>
  );
} 