import { describe, expect, it } from "vitest";
import { createNonce } from "./googleIdentity";

describe("createNonce", () => {
  it("devolve o hash SHA-256 em hexadecimal do valor original", async () => {
    const { raw, hashed } = await createNonce();
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    const expected = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hashed).toBe(expected);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gera valores diferentes a cada chamada", async () => {
    const [a, b] = await Promise.all([createNonce(), createNonce()]);
    expect(a.raw).not.toBe(b.raw);
  });
});
