import { useState, useEffect } from 'react';

/**
 * Hook para criar um valor com debounce
 * @param value Valor a ser controlado
 * @param delay Atraso em milissegundos
 * @returns Array com o valor com debounce
 */
export function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return [debouncedValue];
} 