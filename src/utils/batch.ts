/**
 * Agrupa chamadas feitas no mesmo ciclo do event loop em uma única execução
 * (no estilo DataLoader). Útil para trocar N consultas por poucas consultas "in".
 */
export function createBatcher<K, V>(
  loadMany: (keys: K[]) => Promise<Map<K, V>>,
  { maxBatchSize = 30 }: { maxBatchSize?: number } = {}
): (key: K) => Promise<V | undefined> {
  let queue: { key: K; resolve: (v: V | undefined) => void; reject: (e: unknown) => void }[] = [];
  let scheduled = false;

  const flush = async () => {
    const pending = queue;
    queue = [];
    scheduled = false;

    for (let i = 0; i < pending.length; i += maxBatchSize) {
      const chunk = pending.slice(i, i + maxBatchSize);
      const keys = [...new Set(chunk.map((p) => p.key))];
      try {
        const result = await loadMany(keys);
        chunk.forEach((p) => p.resolve(result.get(p.key)));
      } catch (error) {
        chunk.forEach((p) => p.reject(error));
      }
    }
  };

  return (key: K) =>
    new Promise<V | undefined>((resolve, reject) => {
      queue.push({ key, resolve, reject });
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(flush);
      }
    });
}
