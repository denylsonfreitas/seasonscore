import { getSeriesDetails, SeriesListItem, getFilteredSeries, getPopularSeries } from "./tmdb";
import { getSeriesReviews } from "./reviews";
import { getUserWatchlist } from "./watchlist";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../config/firebase";

// Interface para os gêneros preferidos do usuário
interface UserPreference {
  genreId: number;
  genreName: string;
  count: number;
  averageRating: number;
}

// Interface para séries recomendadas
export interface RecommendedSeries extends SeriesListItem {
  matchScore: number;  // Score de 0-100 indicando quão bem a série corresponde às preferências
  matchReason: string; // Razão da recomendação
}

/**
 * Obtém as recomendações personalizadas para um usuário
 */
export async function getPersonalizedRecommendations(userId: string): Promise<RecommendedSeries[]> {
  if (!userId) return [];

  try {
    // 1. Buscar séries que o usuário já avaliou
    const userReviews = await getUserReviews(userId);
    
    // 2. Buscar séries na watchlist do usuário
    const watchlist = await getUserWatchlist(userId);
    
    // 3. Analisar preferências do usuário (gêneros favoritos, redes, etc.)
    const preferences = await analyzeUserPreferences(userReviews);
    
    // 4. Buscar recomendações baseadas nas preferências
    const recommendations = await fetchRecommendedSeries(preferences, userReviews, watchlist);
    
    return recommendations;
  } catch (error) {
    console.error("Erro ao buscar recomendações:", error);
    return [];
  }
}

/**
 * Busca todas as avaliações feitas pelo usuário
 */
async function getUserReviews(userId: string) {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  
  const reviews = [];
  for (const doc of querySnapshot.docs) {
    const reviewData = doc.data();
    
    // Buscar detalhes da série para cada avaliação
    try {
      const seriesDetails = await getSeriesDetails(Number(reviewData.seriesId));
      
      if (!seriesDetails) {
        console.error(`Não foi possível obter detalhes da série ${reviewData.seriesId}`);
        continue;
      }
      
      if (!seriesDetails.genres || seriesDetails.genres.length === 0) {
      }
      
      reviews.push({
        ...reviewData,
        seriesDetails
      });
    } catch (error) {
      console.error(`Erro ao buscar detalhes da série ${reviewData.seriesId}:`, error);
    }
  }
  
  return reviews;
}

/**
 * Analisa as preferências do usuário com base nas avaliações
 */
async function analyzeUserPreferences(userReviews: any[]): Promise<UserPreference[]> {
  // Mapear os gêneros que o usuário gosta
  const genrePreferences: Record<number, {
    count: number;
    totalRating: number;
    name: string;
  }> = {};
  
  
  // Analisar avaliações por gênero
  userReviews.forEach(review => {
    // Pegar a nota média dada pelo usuário para esta série
    const ratings = review.seasonReviews.map((sr: any) => sr.rating);
    const averageRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
    
    
    // Considerar apenas séries bem avaliadas (acima de 3.5 em uma escala de 1-5)
    if (averageRating >= 3.5) {
      // Verificar se a série tem gêneros
      if (!review.seriesDetails || !review.seriesDetails.genres || review.seriesDetails.genres.length === 0) {
        return;
      }
      
      // Adicionar cada gênero da série às preferências
      review.seriesDetails.genres.forEach((genre: { id: number; name: string }) => {
        
        if (!genrePreferences[genre.id]) {
          genrePreferences[genre.id] = {
            count: 0,
            totalRating: 0,
            name: genre.name
          };
        }
        
        genrePreferences[genre.id].count += 1;
        genrePreferences[genre.id].totalRating += averageRating;
      });
    } else {
    }
  });
  
  // Converter para array e ordenar por contagem
  let preferences = Object.entries(genrePreferences).map(([genreId, data]) => ({
    genreId: Number(genreId),
    genreName: data.name,
    count: data.count,
    averageRating: data.totalRating / data.count
  }));
  
  // Ordenar por contagem (mais frequente primeiro)
  preferences = preferences.sort((a, b) => b.count - a.count);
  
  // Se não encontramos nenhuma preferência mas o usuário tem avaliações, adicionar gêneros populares
  if (preferences.length === 0 && userReviews.length > 0) {
    
    // Lista de gêneros populares para usar como fallback
    const popularGenres = [
      { id: 18, name: "Drama" },
      { id: 10759, name: "Ação & Aventura" },
      { id: 10765, name: "Ficção Científica & Fantasia" },
      { id: 35, name: "Comédia" },
      { id: 80, name: "Crime" }
    ];
    
    // Adicionar cada gênero popular como preferência
    popularGenres.forEach(genre => {
      preferences.push({
        genreId: genre.id,
        genreName: genre.name,
        count: 1,
        averageRating: 4.0 // Valor padrão razoável
      });
    });
  }
  
  return preferences;
}

/**
 * Busca séries recomendadas com base nas preferências do usuário
 */
async function fetchRecommendedSeries(
  preferences: UserPreference[],
  userReviews: any[],
  watchlist: SeriesListItem[]
): Promise<RecommendedSeries[]> {
  
  // Obter os top 3 gêneros preferidos
  const topPreferences = [...preferences]
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);
  
  
  // IDs das séries que o usuário já assistiu ou tem na watchlist para evitar recomendar
  const processedSeriesIds = new Set<number>();
  
  // Adicionar séries já vistas pelo usuário
  userReviews.forEach(review => {
    processedSeriesIds.add(Number(review.seriesId));
  });
  
  // Adicionar séries da watchlist
  watchlist.forEach(series => {
    processedSeriesIds.add(series.id);
  });
  
  
  const recommendations: RecommendedSeries[] = [];
  let totalFoundSeries = 0;
  
  // Buscar séries para cada preferência
  for (const pref of topPreferences) {
    
    try {
      // Buscar séries populares para este gênero do TMDB
      const { results } = await getFilteredSeries({ 
        genre: pref.genreId.toString(),
        minVotes: 100,
        minRating: 7
      });
      
      
      // Calcular match score baseado na avaliação média
      const matchScore = Math.min(100, Math.round((pref.averageRating / 5) * 100));
      
      // Adicionar no máximo 5 séries deste gênero que o usuário ainda não viu
      let addedCount = 0;
      
      for (const series of results) {
        if (processedSeriesIds.has(series.id)) {
          continue;
        }
        
        recommendations.push({
          ...series,
          matchScore,
          matchReason: `Baseado no seu interesse por ${pref.genreName}`
        });
        
        processedSeriesIds.add(series.id);
        totalFoundSeries++;
        addedCount++;
        
        if (addedCount >= 5) break;
      }
      
    } catch (error) {
      console.error(`Erro ao buscar séries para o gênero ${pref.genreName}:`, error);
    }
  }
  
  // Se não encontrou recomendações suficientes, buscar séries populares gerais
  if (totalFoundSeries < 6) {
    try {
      const { results } = await getPopularSeries();
      
      // Adicionar séries populares que o usuário ainda não viu
      for (const series of results) {
        if (processedSeriesIds.has(series.id)) continue;
        if (recommendations.length >= 10) break;
        
        recommendations.push({
          ...series,
          matchScore: 70, // Score padrão para recomendações genéricas
          matchReason: "Série popular que pode interessar você"
        });
        
        processedSeriesIds.add(series.id);
      }
      
    } catch (error) {
      console.error("Erro ao buscar séries populares gerais:", error);
    }
  }
  
  
  // Ordenar recomendações por score de match
  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
} 