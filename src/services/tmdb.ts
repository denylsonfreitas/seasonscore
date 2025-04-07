import axios from "axios";

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY,
    language: "pt-BR",
  },
});

// Interface para séries na listagem
export interface SeriesListItem {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
}

// Interface para detalhes completos da série
export interface Series extends SeriesListItem {
  number_of_seasons: number;
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string }[];
  status: string;
  type: string;
  original_language: string;
  origin_country: string[];
  created_by: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
  }[];
  images?: {
    logos?: Array<{
      file_path: string;
      aspect_ratio: number;
      height: number;
      width: number;
      iso_639_1: string;
    }>;
  };
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
  "watch/providers"?: {
    results: {
      BR?: {
        link: string;
        flatrate?: {
          provider_id: number;
          provider_name: string;
          logo_path: string;
        }[];
        rent?: {
          provider_id: number;
          provider_name: string;
          logo_path: string;
        }[];
        buy?: {
          provider_id: number;
          provider_name: string;
          logo_path: string;
        }[];
      };
    };
  };
}

export interface SeriesResponse {
  page: number;
  results: SeriesListItem[];
  total_pages: number;
  total_results: number;
}

export interface SeriesFilters {
  genre?: string;
  minVotes?: number;
  minRating?: number;
  fromDate?: string;
}

const defaultParams = {
  include_adult: false,
};

const detailsParams = {
  ...defaultParams,
  append_to_response: "images,credits,watch/providers",
  include_image_language: "pt,en,null",
};

// Função auxiliar para obter a data de 2 anos atrás
function getTwoYearsAgo() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 2);
  return date.toISOString().split("T")[0];
}

// Função auxiliar para obter a data atual
function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

export async function getPopularSeries(page = 1) {
  const response = await api.get<SeriesResponse>("/discover/tv", {
    params: {
      ...defaultParams,
      page,
      sort_by: "popularity.desc",
      "first_air_date.gte": getTwoYearsAgo(),
      "vote_count.gte": 50,
      "vote_average.gte": 6,
      without_genres: "10767,10764",
    },
  });
  return response.data;
}

export async function getTopRatedSeries(page = 1) {
  const response = await api.get<SeriesResponse>("/tv/top_rated", {
    params: { ...defaultParams, page },
  });
  return response.data;
}

export async function getAiringTodaySeries(page = 1) {
  const response = await api.get<SeriesResponse>("/discover/tv", {
    params: {
      ...defaultParams,
      page,
      sort_by: "first_air_date.desc",
      "first_air_date.lte": getCurrentDate(),
      "first_air_date.gte": new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      "vote_count.gte": 5,
    },
  });
  return response.data;
}

export async function getNetworkSeries(networkId: number, page = 1) {
  const response = await api.get<SeriesResponse>("/discover/tv", {
    params: {
      ...defaultParams,
      page,
      with_networks: networkId,
      sort_by: "popularity.desc",
    },
  });
  return response.data;
}

export async function getSeriesDetails(id: number) {
  const response = await api.get<Series>(`/tv/${id}`, {
    params: detailsParams,
  });
  return response.data;
}

export async function searchSeries(query: string, page = 1) {
  const response = await api.get<SeriesResponse>("/search/tv", {
    params: { ...defaultParams, query, page },
  });
  return response.data;
}

export async function getFilteredSeries(filters: SeriesFilters = {}, page = 1) {
  const response = await api.get<SeriesResponse>("/discover/tv", {
    params: {
      ...defaultParams,
      page,
      sort_by: "popularity.desc",
      with_genres: filters.genre,
      "vote_count.gte": filters.minVotes || 10,
      "vote_average.gte": filters.minRating || 0,
      "first_air_date.gte": filters.fromDate,
    },
  });
  return response.data;
}

export async function getRelatedSeries(id: number) {
  const seriesDetails = await getSeriesDetails(id);
  
  const response = await api.get<SeriesResponse>("/discover/tv", {
    params: {
      ...defaultParams,
      with_original_language: seriesDetails.original_language,
      with_genres: seriesDetails.genres.map(g => g.id).join('|'),
      without_genres: "10767,10764",
      "vote_count.gte": 50,
      "vote_average.gte": 6,
      sort_by: "popularity.desc",
      page: 1,
      without_series: id
    },
  });

  if (response.data.results.length < 6) {
    const fallbackResponse = await api.get<SeriesResponse>(`/tv/${id}/similar`, {
      params: defaultParams,
    });
    
    const combinedResults = [
      ...response.data.results,
      ...fallbackResponse.data.results.filter(
        series => !response.data.results.some(s => s.id === series.id)
      )
    ];

    return {
      ...response.data,
      results: combinedResults.slice(0, 20)
    };
  }

  return response.data;
}

// Interface para episódios
export interface Episode {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
}

// Interface para temporadas
export interface Season {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  episodes?: Episode[];
}

// Obter detalhes de uma temporada específica
export async function getSeasonDetails(seriesId: number, seasonNumber: number): Promise<Season> {
  const response = await api.get(`/tv/${seriesId}/season/${seasonNumber}`);
  return response.data;
}

// Verificar novos episódios de uma série
export async function getLatestEpisode(seriesId: number): Promise<Episode | null> {
  try {
    // Obter detalhes da série para saber o número de temporadas
    const seriesDetails = await getSeriesDetails(seriesId);
    
    if (seriesDetails.number_of_seasons === 0) {
      return null;
    }
    
    // Obter detalhes da última temporada
    const latestSeason = await getSeasonDetails(
      seriesId, 
      seriesDetails.number_of_seasons
    );
    
    if (!latestSeason.episodes || latestSeason.episodes.length === 0) {
      return null;
    }
    
    // Ordenar episódios por data de lançamento (mais recente primeiro)
    const sortedEpisodes = [...latestSeason.episodes].sort((a, b) => {
      if (!a.air_date) return 1;
      if (!b.air_date) return -1;
      return new Date(b.air_date).getTime() - new Date(a.air_date).getTime();
    });
    
    // Retornar o episódio mais recente
    return sortedEpisodes[0];
  } catch (error) {
    return null;
  }
}

// IDs dos principais serviços de streaming
export const streamingServices = {
  NETFLIX: 213,
  AMAZON: 1024,
  DISNEY_PLUS: 2739,
  HBO: 49,
  APPLE_TV: 2552,
  PARAMOUNT: 4330,
} as const;

export async function getTrendingSeries() {
  const response = await api.get<SeriesResponse>("/trending/tv/week", {
    params: defaultParams,
  });
  const seriesList = response.data.results;

  // Buscar detalhes completos para cada série
  const detailedSeriesList = await Promise.all(
    seriesList.map(async (series) => {
      const details = await getSeriesDetails(series.id);
      return { ...series, ...details };
    })
  );

  return detailedSeriesList;
}

// Interface para vídeos
export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

// Obter vídeos de uma série
export async function getSeriesVideos(seriesId: number): Promise<Video[]> {
  try {
    const response = await api.get(`/tv/${seriesId}/videos`);
    return response.data.results;
  } catch (error) {
    return [];
  }
}

// Interface para detalhes de pessoas (atores)
export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  also_known_as: string[];
}

// Interface para créditos de pessoas (séries em que participou)
export interface PersonCredits {
  cast: {
    id: number;
    name: string;
    poster_path: string | null;
    character: string;
    vote_average: number;
    first_air_date: string;
    overview: string;
    popularity: number;
  }[];
}

// Obter detalhes de uma pessoa (ator, diretor, etc)
export async function getPersonDetails(personId: number) {
  const response = await api.get<Person>(`/person/${personId}`, {
    params: {
      ...defaultParams,
    },
  });
  return response.data;
}

// Obter créditos de uma pessoa (séries em que participou)
export async function getPersonCredits(personId: number) {
  const response = await api.get<PersonCredits>(`/person/${personId}/tv_credits`, {
    params: {
      ...defaultParams,
    },
  });
  return response.data;
}
