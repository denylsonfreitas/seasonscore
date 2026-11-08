/**
 * Proxy para a API do TMDB (função serverless da Vercel).
 *
 * Mantém a chave do TMDB no servidor e permite cache na CDN.
 * Uso: GET /api/tmdb?path=/tv/1399&append_to_response=credits
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Apenas os endpoints usados pelo app, para o proxy não virar um acesso aberto.
const ALLOWED_PATH = /^\/(tv|search\/tv|discover\/tv|trending\/tv|person|genre\/tv)(\/[\w/-]*)?$/;

export function buildTmdbUrl(requestUrl: string, apiKey: string): URL | null {
  const incoming = new URL(requestUrl);
  const path = incoming.searchParams.get("path") ?? "";
  if (!ALLOWED_PATH.test(path)) return null;

  const target = new URL(TMDB_BASE_URL + path);
  incoming.searchParams.forEach((value, key) => {
    if (key !== "path" && key !== "api_key") target.searchParams.set(key, value);
  });
  target.searchParams.set("api_key", apiKey);
  return target;
}

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.TMDB_API_KEY ?? process.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "TMDB_API_KEY não configurada" }, { status: 500 });
  }

  const target = buildTmdbUrl(request.url, apiKey);
  if (!target) {
    return Response.json({ error: "Caminho não permitido" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target);
  } catch {
    return Response.json({ error: "TMDB indisponível" }, { status: 502 });
  }
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Cache na CDN da Vercel: 10 min, servindo versão antiga por até 1 dia enquanto revalida.
      "Cache-Control": upstream.ok
        ? "public, s-maxage=600, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
