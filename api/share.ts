/**
 * Prévia de links (Open Graph) para robôs de redes sociais e mensageiros.
 *
 * O site é uma SPA: quem compartilha um link de série recebia a mesma prévia genérica.
 * O vercel.json desvia para cá só os robôs de prévia (pelo User-Agent), nas rotas de
 * série, perfil, lista e avaliação. A resposta é o mesmo index.html do site, com o bloco
 * de meta tags trocado pelo da página. Pessoas continuam recebendo o site estático.
 *
 * Uso: GET /api/share?type=series&id=1399
 *      GET /api/share?type=user&id=nome_de_usuario
 *      GET /api/share?type=list&id=<uuid>
 *      GET /api/share?type=review&id=<uuid>&season=2
 */

const SITE_URL = "https://seasonscore.vercel.app";
const SITE_NAME = "SeasonScore";
const DEFAULT_DESCRIPTION =
  "Avalie séries temporada por temporada e veja onde cada uma cresceu ou caiu.";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;
const TMDB_IMAGE = "https://image.tmdb.org/t/p";

export interface ShareMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  /** Imagem larga (capa/fundo) ou quadrada/retrato (avatar, pôster). */
  imageKind: "wide" | "square";
  type: "website" | "article" | "profile";
}

export const DEFAULT_META: ShareMeta = {
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  url: SITE_URL,
  image: DEFAULT_IMAGE,
  imageKind: "wide",
  type: "website",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Corta no limite de palavras, sem quebrar no meio, com reticências. */
export function truncate(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?-]+$/, "")}…`;
}

export function formatScore(score: number): string {
  return score.toFixed(1).replace(".", ",");
}

/** Bloco de meta tags que substitui o do index.html. */
export function renderMetaBlock(meta: ShareMeta): string {
  const e = escapeHtml;
  const lines = [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    `<link rel="canonical" href="${e(meta.url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:url" content="${e(meta.url)}" />`,
    `<meta property="og:image" content="${e(meta.image)}" />`,
    `<meta name="twitter:card" content="${meta.imageKind === "wide" ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(meta.image)}" />`,
  ];
  if (meta.image === DEFAULT_IMAGE) {
    lines.push(
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`
    );
  }
  return lines.join("\n    ");
}

const BLOCK = /<!-- share:start[\s\S]*?<!-- share:end -->/;

/** Troca o bloco marcado do index.html; sem os marcadores, insere antes de </head>. */
export function injectMeta(html: string, meta: ShareMeta): string {
  const block = `<!-- share:start -->\n    ${renderMetaBlock(meta)}\n    <!-- share:end -->`;
  if (BLOCK.test(html)) return html.replace(BLOCK, block);
  return html.replace("</head>", `    ${block}\n  </head>`);
}

// ---------------------------------------------------------------------------
// Dados de cada tipo de página. Cada função devolve null quando não encontra nada,
// e a página sai com a prévia padrão (nunca com erro para o robô).

interface Env {
  tmdbKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

type Fetch = typeof fetch;

async function tmdb<T>(path: string, env: Env, fetcher: Fetch): Promise<T | null> {
  if (!env.tmdbKey) return null;
  const url = `https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}language=pt-BR&api_key=${env.tmdbKey}`;
  const res = await fetcher(url);
  return res.ok ? ((await res.json()) as T) : null;
}

async function supabaseRows<T>(query: string, env: Env, fetcher: Fetch): Promise<T[]> {
  if (!env.supabaseUrl || !env.supabaseKey) return [];
  const res = await fetcher(`${env.supabaseUrl}/rest/v1/${query}`, {
    headers: { apikey: env.supabaseKey, Accept: "application/json" },
  });
  return res.ok ? ((await res.json()) as T[]) : [];
}

interface TmdbSeries {
  name: string;
  overview: string;
  first_air_date?: string;
  number_of_seasons?: number;
  backdrop_path: string | null;
  poster_path: string | null;
}

export async function seriesMeta(id: string, env: Env, fetcher: Fetch): Promise<ShareMeta | null> {
  if (!/^\d+$/.test(id)) return null;
  const [series, ratings] = await Promise.all([
    tmdb<TmdbSeries>(`/tv/${id}`, env, fetcher),
    supabaseRows<{ average_rating: number | null; ratings_count: number | null }>(
      `series_ratings?series_id=eq.${id}&select=average_rating,ratings_count`,
      env,
      fetcher
    ),
  ]);
  if (!series) return null;

  const year = series.first_air_date?.slice(0, 4);
  const facts: string[] = [];
  const rating = ratings[0];
  if (rating?.average_rating && rating.ratings_count) {
    facts.push(
      `Média ${formatScore(rating.average_rating)} na comunidade (${rating.ratings_count} ${rating.ratings_count === 1 ? "nota" : "notas"})`
    );
  }
  if (series.number_of_seasons) {
    facts.push(
      `${series.number_of_seasons} ${series.number_of_seasons === 1 ? "temporada" : "temporadas"}`
    );
  }
  const lead = facts.length ? `${facts.join(" · ")}. ` : "";

  return {
    title: `${series.name}${year ? ` (${year})` : ""} · ${SITE_NAME}`,
    description: truncate(`${lead}${series.overview || "Veja a nota de cada temporada."}`),
    url: `${SITE_URL}/series/${id}`,
    image: series.backdrop_path
      ? `${TMDB_IMAGE}/w1280${series.backdrop_path}`
      : series.poster_path
        ? `${TMDB_IMAGE}/w500${series.poster_path}`
        : DEFAULT_IMAGE,
    imageKind: series.backdrop_path || !series.poster_path ? "wide" : "square",
    type: "article",
  };
}

interface ProfileRow {
  username: string;
  display_name: string | null;
  description: string | null;
  photo_url: string | null;
  cover_url: string | null;
  reviews_count: number | null;
  followers_count: number | null;
}

export async function userMeta(
  username: string,
  env: Env,
  fetcher: Fetch
): Promise<ShareMeta | null> {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(username)) return null;
  const [profile] = await supabaseRows<ProfileRow>(
    `profile_stats?username=eq.${username.toLowerCase()}&select=username,display_name,description,photo_url,cover_url,reviews_count,followers_count`,
    env,
    fetcher
  );
  if (!profile) return null;

  const name = profile.display_name || profile.username;
  const counts = [
    profile.reviews_count
      ? `${profile.reviews_count} ${profile.reviews_count === 1 ? "série avaliada" : "séries avaliadas"}`
      : null,
    profile.followers_count
      ? `${profile.followers_count} ${profile.followers_count === 1 ? "seguidor" : "seguidores"}`
      : null,
  ].filter(Boolean);
  const bio = profile.description?.trim();

  return {
    title: `${name} (@${profile.username}) · ${SITE_NAME}`,
    description: truncate(
      [bio, counts.length ? counts.join(" · ") : null].filter(Boolean).join(" — ") ||
        `Veja as avaliações de ${name} no ${SITE_NAME}.`
    ),
    url: `${SITE_URL}/u/${profile.username}`,
    image: profile.cover_url || profile.photo_url || DEFAULT_IMAGE,
    imageKind: profile.cover_url || !profile.photo_url ? "wide" : "square",
    type: "profile",
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ListRow {
  id: string;
  title: string;
  description: string | null;
  username: string | null;
  display_name: string | null;
  items_count: number | null;
}

export async function listMeta(id: string, env: Env, fetcher: Fetch): Promise<ShareMeta | null> {
  if (!UUID.test(id)) return null;
  // A RLS só devolve listas públicas (ou com acesso por link) para visitantes.
  const [[list], items] = await Promise.all([
    supabaseRows<ListRow>(
      `list_summaries?id=eq.${id}&select=id,title,description,username,display_name,items_count`,
      env,
      fetcher
    ),
    supabaseRows<{ poster_path: string | null; name: string }>(
      `list_items?list_id=eq.${id}&select=poster_path,name&order=added_at.asc&limit=3`,
      env,
      fetcher
    ),
  ]);
  if (!list) return null;

  const author = list.display_name || list.username;
  const count = list.items_count ?? 0;
  const names = items.map((i) => i.name).join(", ");
  const poster = items.find((i) => i.poster_path)?.poster_path;

  return {
    title: `${list.title} · lista de ${author ?? "um usuário"} · ${SITE_NAME}`,
    description: truncate(
      [
        list.description?.trim(),
        `${count} ${count === 1 ? "série" : "séries"}${names ? `: ${names}${count > items.length ? " e mais" : ""}` : ""}.`,
      ]
        .filter(Boolean)
        .join(" ")
    ),
    url: `${SITE_URL}/list/${id}`,
    image: poster ? `${TMDB_IMAGE}/w500${poster}` : DEFAULT_IMAGE,
    imageKind: poster ? "square" : "wide",
    type: "article",
  };
}

interface FeedRow {
  series_name: string | null;
  series_poster: string | null;
  rating: number | null;
  comment: string | null;
  has_spoiler: boolean | null;
  username: string | null;
  display_name: string | null;
}

export async function reviewMeta(
  id: string,
  season: string,
  env: Env,
  fetcher: Fetch
): Promise<ShareMeta | null> {
  if (!UUID.test(id) || !/^\d+$/.test(season)) return null;
  const [review] = await supabaseRows<FeedRow>(
    `season_review_feed?review_id=eq.${id}&season_number=eq.${season}&select=series_name,series_poster,rating,comment,has_spoiler,username,display_name`,
    env,
    fetcher
  );
  if (!review?.series_name) return null;

  const author = review.display_name || review.username || "Alguém";
  const score = review.rating ? `${formatScore(review.rating)}/5` : null;
  // Spoiler nunca vai para a prévia
  const text = review.comment?.trim()
    ? review.has_spoiler
      ? "O texto contém spoiler."
      : `“${review.comment.trim()}”`
    : null;

  return {
    title: `${author} avaliou ${review.series_name}, temporada ${season}${score ? ` · ${score}` : ""}`,
    description: truncate(text ?? `Veja a avaliação no ${SITE_NAME}.`),
    url: `${SITE_URL}/reviews/${id}/${season}`,
    image: review.series_poster ? `${TMDB_IMAGE}/w500${review.series_poster}` : DEFAULT_IMAGE,
    imageKind: review.series_poster ? "square" : "wide",
    type: "article",
  };
}

export async function resolveMeta(
  params: URLSearchParams,
  env: Env,
  fetcher: Fetch
): Promise<ShareMeta> {
  const type = params.get("type");
  const id = params.get("id") ?? "";
  try {
    const meta =
      type === "series"
        ? await seriesMeta(id, env, fetcher)
        : type === "user"
          ? await userMeta(id, env, fetcher)
          : type === "list"
            ? await listMeta(id, env, fetcher)
            : type === "review"
              ? await reviewMeta(id, params.get("season") ?? "", env, fetcher)
              : null;
    return meta ?? DEFAULT_META;
  } catch {
    return DEFAULT_META;
  }
}

// ---------------------------------------------------------------------------

/** Página mínima usada quando o index.html do site não está disponível. */
export const FALLBACK_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- share:start -->
    <!-- share:end -->
  </head>
  <body></body>
</html>`;

/** Só aceita o index.html do SeasonScore (com o bloco marcado), nunca outra página. */
export function isSiteIndex(html: string | null | undefined): html is string {
  return !!html && BLOCK.test(html) && html.includes('id="root"');
}

let cachedIndex: string | null = null;

/**
 * O index.html vai empacotado com a função (vercel.json → functions.includeFiles).
 * Ler do disco evita uma requisição extra e não depende de o site estar público
 * (deploys de prévia exigem login da Vercel).
 */
async function loadIndexHtml(): Promise<string> {
  if (cachedIndex) return cachedIndex;
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const html = await readFile(join(process.cwd(), "dist", "index.html"), "utf8");
    if (isSiteIndex(html)) {
      cachedIndex = html;
      return html;
    }
  } catch {
    // segue para a página mínima
  }
  return FALLBACK_HTML;
}

export async function GET(request: Request): Promise<Response> {
  const env: Env = {
    tmdbKey: process.env.TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  const url = new URL(request.url);
  const [meta, indexHtml] = await Promise.all([
    resolveMeta(url.searchParams, env, fetch),
    loadIndexHtml(),
  ]);

  return new Response(injectMeta(indexHtml, meta), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // A prévia muda pouco: 1 h na CDN, servindo a versão anterior por até 1 dia enquanto atualiza
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noarchive",
    },
  });
}
