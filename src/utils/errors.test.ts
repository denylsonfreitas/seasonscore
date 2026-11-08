import { describe, expect, it } from "vitest";
import { getErrorCode, getErrorMessage } from "./errors";

describe("getErrorCode", () => {
  it("lê o código de erros do Firebase", () => {
    expect(getErrorCode({ code: "auth/wrong-password" })).toBe("auth/wrong-password");
  });

  it("retorna undefined quando não há código", () => {
    expect(getErrorCode(new Error("x"))).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
    expect(getErrorCode("texto")).toBeUndefined();
  });
});

describe("getErrorMessage", () => {
  it("usa a mensagem do Error", () => {
    expect(getErrorMessage(new Error("falhou"))).toBe("falhou");
  });

  it("aceita strings e usa o fallback nos demais casos", () => {
    expect(getErrorMessage("texto")).toBe("texto");
    expect(getErrorMessage(42, "padrão")).toBe("padrão");
  });
});
