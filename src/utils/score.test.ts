import { describe, expect, it } from "vitest";
import { formatScore, scoreColor, scoreTier, yearOf } from "./score";

describe("score", () => {
  it("classifica as faixas", () => {
    expect(scoreTier(1.5)).toBe("low");
    expect(scoreTier(3)).toBe("mid");
    expect(scoreTier(4.2)).toBe("high");
  });
  it("usa vírgula e uma casa", () => {
    expect(formatScore(4)).toBe("4,0");
    expect(formatScore(3.456)).toBe("3,5");
  });
  it("trata ausência de nota", () => {
    expect(scoreColor(undefined)).toBe("ink.700");
    expect(yearOf("2019-04-01")).toBe("2019");
    expect(yearOf("")).toBe("");
  });
});
