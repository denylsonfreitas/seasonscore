/**
 * Tipos relacionados a séries de TV
 */

/**
 * Interface para representar os resultados da busca de séries
 */
export interface SeriesSearchResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
} 