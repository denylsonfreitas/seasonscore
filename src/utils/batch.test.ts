import { describe, expect, it, vi } from "vitest";
import { createBatcher } from "./batch";

describe("createBatcher", () => {
  it("agrupa chamadas do mesmo ciclo em uma única carga", async () => {
    const loadMany = vi.fn(async (keys: number[]) => new Map(keys.map((k) => [k, k * 10])));
    const load = createBatcher(loadMany);

    const results = await Promise.all([load(1), load(2), load(1), load(3)]);

    expect(results).toEqual([10, 20, 10, 30]);
    expect(loadMany).toHaveBeenCalledTimes(1);
    expect(loadMany).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("respeita o tamanho máximo do lote", async () => {
    const loadMany = vi.fn(async (keys: number[]) => new Map(keys.map((k) => [k, k])));
    const load = createBatcher(loadMany, { maxBatchSize: 2 });

    await Promise.all([load(1), load(2), load(3)]);
    expect(loadMany).toHaveBeenCalledTimes(2);
  });

  it("retorna undefined para chaves sem resultado e propaga erros", async () => {
    const load = createBatcher(async () => new Map<number, number>());
    await expect(load(1)).resolves.toBeUndefined();

    const failing = createBatcher<number, number>(async () => {
      throw new Error("falha");
    });
    await expect(failing(1)).rejects.toThrow("falha");
  });
});
