import { describe, expect, it } from "vitest";
import {
  DEFAULT_META,
  escapeHtml,
  injectMeta,
  resolveMeta,
  truncate,
  type ShareMeta,
} from "../../api/share";

const INDEX = `<html><head>
    <meta charset="UTF-8" />
    <!-- share:start (comentário) -->
    <title>SeasonScore</title>
    <meta property="og:title" content="SeasonScore" />
    <!-- share:end -->
    <link rel="manifest" href="/manifest.json" />
  </head><body><div id="root"></div></body></html>`;

const env = { tmdbKey: "k", supabaseUrl: "https://db.test", supabaseKey: "pk" };

/** fetch falso: responde conforme o trecho da URL. */
function fakeFetch(routes: Record<string, unknown>) {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return new Response("not found", { status: 404 });
    return Response.json(routes[key]);
  }) as typeof fetch;
}

describe("prévia de links", () => {
  it("escapa HTML nos valores", () => {
    expect(escapeHtml(`a"<b>&'`)).toBe("a&quot;&lt;b&gt;&amp;&#39;");
  });

  it("corta descrições longas sem quebrar palavra", () => {
    const text = "palavra ".repeat(60);
    const out = truncate(text, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/ …$/);
  });

  it("troca só o bloco marcado e mantém o resto da página", () => {
    const meta: ShareMeta = { ...DEFAULT_META, title: `Série "X" <script>`, url: "https://s/x" };
    const html = injectMeta(INDEX, meta);
    expect(html).toContain("<title>Série &quot;X&quot; &lt;script&gt;</title>");
    expect(html).not.toContain('<meta property="og:title" content="SeasonScore" />');
    expect(html).toContain('<link rel="manifest" href="/manifest.json" />');
    expect(html).toContain('<div id="root"></div>');
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it("monta a prévia da série com a média da comunidade", async () => {
    const meta = await resolveMeta(
      new URLSearchParams("type=series&id=1399"),
      env,
      fakeFetch({
        "/tv/1399": {
          name: "Game of Thrones",
          overview: "Nobres famílias lutam pelo trono.",
          first_air_date: "2011-04-17",
          number_of_seasons: 8,
          backdrop_path: "/fundo.jpg",
          poster_path: "/poster.jpg",
        },
        series_ratings: [{ average_rating: 4.25, ratings_count: 12 }],
      })
    );
    expect(meta.title).toBe("Game of Thrones (2011) · SeasonScore");
    expect(meta.description).toBe(
      "Média 4,3 na comunidade (12 notas) · 8 temporadas. Nobres famílias lutam pelo trono."
    );
    expect(meta.image).toBe("https://image.tmdb.org/t/p/w1280/fundo.jpg");
    expect(meta.url).toBe("https://seasonscore.vercel.app/series/1399");
  });

  it("nunca coloca texto com spoiler na prévia", async () => {
    const id = "7a8122e7-9a08-43df-9b00-1f808de712cc";
    const meta = await resolveMeta(
      new URLSearchParams(`type=review&id=${id}&season=2`),
      env,
      fakeFetch({
        season_review_feed: [
          {
            series_name: "Dark",
            series_poster: "/p.jpg",
            rating: 4.5,
            comment: "O vilão era ele mesmo",
            has_spoiler: true,
            username: "ana",
            display_name: "Ana",
          },
        ],
      })
    );
    expect(meta.title).toBe("Ana avaliou Dark, temporada 2 · 4,5/5");
    expect(meta.description).toBe("O texto contém spoiler.");
    expect(meta.description).not.toContain("vilão");
  });

  it("usa a prévia padrão para ids inválidos ou páginas inexistentes", async () => {
    const fetcher = fakeFetch({});
    for (const query of [
      "type=series&id=abc",
      "type=series&id=999",
      "type=user&id=../admin",
      "type=list&id=nao-e-uuid",
      "type=review&id=7a8122e7-9a08-43df-9b00-1f808de712cc&season=x",
      "type=outra&id=1",
    ]) {
      expect(await resolveMeta(new URLSearchParams(query), env, fetcher)).toEqual(DEFAULT_META);
    }
  });

  it("não quebra quando a busca de dados falha", async () => {
    const failing = (async () => {
      throw new Error("rede fora");
    }) as typeof fetch;
    expect(await resolveMeta(new URLSearchParams("type=series&id=1"), env, failing)).toEqual(
      DEFAULT_META
    );
  });
});
