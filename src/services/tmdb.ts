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

// IDs dos principais serviços de streaming
export const streamingServices = {
  NETFLIX: 213,
  AMAZON: 1024,
  DISNEY_PLUS: 2739,
  HBO: 49,
  APPLE_TV: 2552,
  PARAMOUNT: 4330,
} as const;
