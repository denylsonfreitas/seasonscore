import { useState, useEffect } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
}

export function useRetryQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: Omit<UseQueryOptions<T> & RetryConfig, 'queryKey'> = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    ...queryOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);

  const query = useQuery<T>({
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  });

  useEffect(() => {
    if (query.isError && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        query.refetch();
        onRetry?.(retryCount + 1);
      }, retryDelay * (retryCount + 1));

      return () => clearTimeout(timer);
    }
  }, [query.isError, retryCount, maxRetries, retryDelay, query.refetch, onRetry]);

  return {
    ...query,
    retryCount,
    isRetrying: query.isError && retryCount < maxRetries,
  };
} 