import { useEffect, useRef, useMemo, useCallback } from "react";
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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);

  // Atualizar refs quando as props mudarem
  useEffect(() => {
    isLoadingRef.current = isLoading;
    hasMoreRef.current = hasMore;
  }, [isLoading, hasMore]);

  // Memo para loadMore para evitar recreation excessiva do observer
  const memoizedLoadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    // Limpar observer anterior
    if (observerRef.current && loaderRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          memoizedLoadMore();
        }
      },
      { threshold }
    );

    const currentRef = loaderRef.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, memoizedLoadMore]);

  // Memorizar o componente de loading e mensagem de fim da lista
  const loaderComponent = useMemo(() => {
    if (isLoading) {
      return (
        <Center>
          <Spinner size="md" color="primary.500" thickness="3px" />
        </Center>
      );
    }
    
    if (!hasMore) {
      return (
        <Text color="gray.500" fontSize="sm">
          Não há mais conteúdo para exibir
        </Text>
      );
    }
    
    return null;
  }, [isLoading, hasMore]);

  return (
    <>
      {children}
      <Box ref={loaderRef} py={4} textAlign="center">
        {loaderComponent}
      </Box>
    </>
  );
} 