interface Entry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

export interface MemoizedFn<A extends unknown[], T> {
  (...args: A): Promise<T>;
  /** Remove do cache a entrada dos argumentos informados (ou tudo, sem argumentos). */
  invalidate: (...args: A | []) => void;
}

/**
 * Memoiza uma função assíncrona por um tempo limitado.
 * Chamadas simultâneas com os mesmos argumentos compartilham a mesma Promise,
 * e erros não ficam em cache.
 */
export function memoizeAsync<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  {
    ttlMs,
    maxEntries = 500,
    key = (...args: A) => JSON.stringify(args),
  }: {
    ttlMs: number;
    maxEntries?: number;
    key?: (...args: A) => string;
  }
): MemoizedFn<A, T> {
  const cache = new Map<string, Entry<T>>();

  const memoized = ((...args: A) => {
    const k = key(...args);
    const now = Date.now();
    const hit = cache.get(k);
    if (hit && hit.expiresAt > now) return hit.promise;

    const promise = fn(...args).catch((error) => {
      cache.delete(k);
      throw error;
    });
    cache.set(k, { promise, expiresAt: now + ttlMs });

    if (cache.size > maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    return promise;
  }) as MemoizedFn<A, T>;

  memoized.invalidate = (...args: A | []) => {
    if (args.length === 0) cache.clear();
    else cache.delete(key(...(args as A)));
  };

  return memoized;
}
