/** Nomes dos gêneros de séries do TMDB em português (o TMDB devolve vários em inglês). */
export const TV_GENRES_PT: Record<number, string> = {
  10759: "Ação e aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  10762: "Infantil",
  9648: "Mistério",
  10763: "Notícias",
  10764: "Reality",
  10765: "Ficção científica e fantasia",
  10766: "Novela",
  10767: "Talk show",
  10768: "Guerra e política",
  37: "Faroeste",
};

export function genreName(genre: { id: number; name: string }): string {
  return TV_GENRES_PT[genre.id] ?? genre.name;
}

export function translateGenres<T extends { id: number; name: string }>(genres: T[] = []): T[] {
  return genres.map((g) => ({ ...g, name: genreName(g) }));
}
