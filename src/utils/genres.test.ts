import { describe, expect, it } from "vitest";
import { genreName, translateGenres } from "./genres";

describe("genres", () => {
  it("traduz pelo id e mantém desconhecidos", () => {
    expect(genreName({ id: 10765, name: "Sci-Fi & Fantasy" })).toBe("Ficção científica e fantasia");
    expect(genreName({ id: 1, name: "Outro" })).toBe("Outro");
    expect(translateGenres([{ id: 18, name: "Drama" }])[0].name).toBe("Drama");
  });
});
