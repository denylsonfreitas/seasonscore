import { afterEach, describe, expect, it, vi } from "vitest";
import { getSeriesDetails, searchSeries, TmdbError } from "./tmdb";

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("cliente TMDB", () => {
  it("usa o proxy e envia idioma e parâmetros na URL", async () => {
    const fetchMock = mockFetch({ page: 1, results: [], total_pages: 0, total_results: 0 });
    await searchSeries("the office", 2);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/tmdb");
    expect(url.searchParams.get("path")).toBe("/search/tv");
    expect(url.searchParams.get("api_key")).toBeNull();
    expect(url.searchParams.get("language")).toBe("pt-BR");
    expect(url.searchParams.get("query")).toBe("the office");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("include_adult")).toBe("false");
  });

  it("omite parâmetros vazios", async () => {
    const fetchMock = mockFetch({ id: 1, name: "Série" });
    await getSeriesDetails(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("append_to_response")).toBe("images,credits,watch/providers");
    expect([...url.searchParams.keys()]).not.toContain("undefined");
  });

  it("lança TmdbError em respostas com erro", async () => {
    mockFetch({ status_message: "not found" }, 404);
    await expect(getSeriesDetails(999)).rejects.toBeInstanceOf(TmdbError);
  });
});
