import { describe, expect, it } from "vitest";
import { buildTmdbUrl } from "../../api/tmdb";

describe("proxy do TMDB", () => {
  it("monta a URL com a chave do servidor e os parâmetros recebidos", () => {
    const url = buildTmdbUrl(
      "https://app.test/api/tmdb?path=/tv/1399&language=pt-BR&api_key=cliente",
      "segredo"
    );
    expect(url?.toString()).toBe(
      "https://api.themoviedb.org/3/tv/1399?language=pt-BR&api_key=segredo"
    );
  });

  it("aceita os caminhos usados pelo app", () => {
    for (const path of [
      "/tv/1/season/2",
      "/tv/1/videos",
      "/tv/top_rated",
      "/search/tv",
      "/discover/tv",
      "/trending/tv/week",
      "/person/10/tv_credits",
    ]) {
      expect(buildTmdbUrl(`https://app.test/api/tmdb?path=${path}`, "k")).not.toBeNull();
    }
  });

  it("recusa caminhos fora da lista", () => {
    for (const path of ["/account", "/movie/1", "//evil.com", "/tv/../authentication", ""]) {
      expect(buildTmdbUrl(`https://app.test/api/tmdb?path=${path}`, "k")).toBeNull();
    }
  });
});
