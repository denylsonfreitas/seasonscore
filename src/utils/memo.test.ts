import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoizeAsync } from "./memo";

describe("memoizeAsync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("compartilha chamadas simultâneas e respeita o TTL", async () => {
    const fn = vi.fn(async (id: number) => id * 2);
    const memo = memoizeAsync(fn, { ttlMs: 1000 });

    const [a, b] = await Promise.all([memo(2), memo(2)]);
    expect(a).toBe(4);
    expect(b).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1500);
    await memo(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("não guarda erros em cache", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("falha")).mockResolvedValueOnce("ok");
    const memo = memoizeAsync(fn, { ttlMs: 1000 });

    await expect(memo()).rejects.toThrow("falha");
    await expect(memo()).resolves.toBe("ok");
  });

  it("permite invalidar uma entrada", async () => {
    const fn = vi.fn(async (id: string) => id);
    const memo = memoizeAsync(fn, { ttlMs: 60_000 });
    await memo("a");
    memo.invalidate("a");
    await memo("a");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("limita a quantidade de entradas", async () => {
    const fn = vi.fn(async (id: number) => id);
    const memo = memoizeAsync(fn, { ttlMs: 60_000, maxEntries: 2 });
    await memo(1);
    await memo(2);
    await memo(3);
    await memo(1);
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
