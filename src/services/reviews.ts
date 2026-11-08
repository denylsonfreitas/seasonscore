import { getSessionUser, requireUserId, supabase, unwrap } from "../config/supabase";
import type { Tables } from "../types/database";
import type { SeasonReview } from "../types/review";
import { createBatcher } from "../utils/batch";
import { getFollowing } from "./followers";
import { getSeriesDetails } from "./tmdb";

export interface SeriesReview {
  id: string;
  userId: string;
  /** Nome de usuário do autor (mantido com este nome por compatibilidade). */
  userEmail: string;
  seriesId: number;
  seasonReviews: SeasonReview[];
  series: {
    name: string;
    poster_path: string | null;
  };
  selectedSeasonNumber?: number;
  createdAt?: Date;
}

export interface PopularReview {
  id: string;
  userId: string;
  seriesId: number;
  seriesName: string;
  seriesPoster: string | null;
  seasonNumber: number;
  rating: number;
  comment: string;
  userName: string;
  userAvatar: string;
  createdAt: Date;
  likes: number;
}

// Avaliação com temporadas, curtidas e autor em uma única consulta
const REVIEW_SELECT =
  "*, author:profiles!reviews_user_id_fkey(username), season_reviews(*, season_review_likes(user_id))";

type ReviewRow = Tables<"reviews"> & {
  author: { username: string } | null;
  season_reviews: (Tables<"season_reviews"> & {
    season_review_likes: { user_id: string }[];
  })[];
};

function reviewFromRow(row: ReviewRow): SeriesReview {
  const username = row.author?.username ?? "";
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: username,
    seriesId: row.series_id,
    series: { name: row.series_name, poster_path: row.series_poster },
    createdAt: new Date(row.created_at),
    seasonReviews: [...row.season_reviews]
      .sort((a, b) => a.season_number - b.season_number)
      .map((sr) => ({
        seasonNumber: sr.season_number,
        userId: row.user_id,
        userEmail: username,
        rating: Number(sr.rating),
        comment: sr.comment,
        comments: [],
        createdAt: new Date(sr.created_at),
        reactions: { likes: sr.season_review_likes.map((l) => l.user_id) },
      })),
  };
}

type FeedRow = Tables<"season_review_feed">;

function popularFromRow(row: FeedRow): PopularReview {
  return {
    id: row.review_id ?? "",
    userId: row.user_id ?? "",
    seriesId: row.series_id ?? 0,
    seriesName: row.series_name ?? "",
    seriesPoster: row.series_poster,
    seasonNumber: row.season_number ?? 1,
    rating: row.rating ?? 0,
    comment: row.comment ?? "",
    userName: row.display_name || row.username || "",
    userAvatar: row.photo_url ?? "",
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    likes: row.likes_count ?? 0,
  };
}

function validateSeasonReview(rating: number, comment: string) {
  if (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
    throw new Error("A nota deve estar entre 0.5 e 5, com incrementos de 0.5");
  }
  if (comment && comment.length > 280) {
    throw new Error("O comentário não pode ter mais que 280 caracteres");
  }
}

/** Cria ou atualiza a avaliação de uma temporada pelo usuário logado. */
export async function addSeasonReview(
  seriesId: number,
  seasonNumber: number,
  rating: number,
  comment: string
): Promise<void> {
  const userId = requireUserId();
  validateSeasonReview(rating, comment);

  try {
    let { data: review } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("series_id", seriesId)
      .maybeSingle();

    if (!review) {
      const series = await getSeriesDetails(seriesId);
      review = unwrap(
        await supabase
          .from("reviews")
          .insert({
            user_id: userId,
            series_id: seriesId,
            series_name: series.name,
            series_poster: series.poster_path,
          })
          .select("id")
          .single()
      );
    }

    unwrap(
      await supabase.from("season_reviews").upsert({
        review_id: review.id,
        season_number: seasonNumber,
        rating,
        comment: comment || "",
      })
    );
    // Seguidores que têm a série na watchlist são notificados por trigger no banco.
  } catch (error) {
    throw new Error("Não foi possível salvar a avaliação", { cause: error });
  }
}

export async function getSeriesReviews(seriesId: number): Promise<SeriesReview[]> {
  const rows = unwrap(
    await supabase.from("reviews").select(REVIEW_SELECT).eq("series_id", seriesId)
  );
  return (rows as unknown as ReviewRow[]).map(reviewFromRow);
}

/** Média das notas de todas as temporadas avaliadas, por série. */
const loadAverageRatings = createBatcher<number, number>(async (seriesIds) => {
  const rows = unwrap(
    await supabase
      .from("series_ratings")
      .select("series_id, average_rating")
      .in("series_id", seriesIds)
  );
  const averages = new Map<number, number>();
  rows.forEach((row) => {
    if (row.series_id !== null && row.average_rating !== null) {
      averages.set(row.series_id, row.average_rating);
    }
  });
  return averages;
});

/**
 * Nota média de uma série na comunidade (ou undefined se não houver avaliações).
 * Chamadas simultâneas são agrupadas em uma única consulta.
 */
export function getSeriesAverageRating(seriesId: number): Promise<number | undefined> {
  return loadAverageRatings(seriesId);
}

export async function getUserReview(seriesId: number, userId: string) {
  const row = unwrap(
    await supabase
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("series_id", seriesId)
      .eq("user_id", userId)
      .maybeSingle()
  );
  return row ? reviewFromRow(row as unknown as ReviewRow) : null;
}

export async function updateReview(
  reviewId: string,
  seasonNumber: number,
  rating: number,
  comment: string
): Promise<void> {
  requireUserId();
  validateSeasonReview(rating, comment);
  unwrap(
    await supabase
      .from("season_reviews")
      .update({ rating, comment })
      .eq("review_id", reviewId)
      .eq("season_number", seasonNumber)
  );
}

/** Remove a avaliação de uma temporada (a avaliação some quando não restam temporadas). */
export async function deleteReview(reviewId: string, seasonNumber: number): Promise<boolean> {
  requireUserId();
  try {
    unwrap(
      await supabase
        .from("season_reviews")
        .delete()
        .eq("review_id", reviewId)
        .eq("season_number", seasonNumber)
    );
    return true;
  } catch (error) {
    throw new Error("Não foi possível excluir a avaliação", { cause: error });
  }
}

export async function getUserReviews(userId: string): Promise<SeriesReview[]> {
  const rows = unwrap(
    await supabase
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
  );
  return (rows as unknown as ReviewRow[]).map(reviewFromRow);
}

export interface TopRatedSeriesEntry {
  seriesId: number;
  seriesName: string;
  seriesPoster: string | null;
  averageRating: number;
  ratingsCount: number;
}

/** Séries mais bem avaliadas pela comunidade (média calculada no banco). */
export async function getTopRatedSeries(
  limitCount = 10,
  minRating = 3
): Promise<TopRatedSeriesEntry[]> {
  const rows = unwrap(
    await supabase
      .from("series_ratings")
      .select("*")
      .gte("average_rating", minRating)
      .order("average_rating", { ascending: false })
      .order("ratings_count", { ascending: false })
      .limit(limitCount)
  );
  return rows.map((row) => ({
    seriesId: row.series_id ?? 0,
    seriesName: row.series_name ?? "",
    seriesPoster: row.series_poster,
    averageRating: row.average_rating ?? 0,
    ratingsCount: row.ratings_count ?? 0,
  }));
}

/** Curte ou descurte a avaliação de uma temporada. */
export async function toggleReaction(
  reviewId: string,
  seasonNumber: number,
  _reactionType: "likes"
): Promise<{ likes: number; userReaction: "likes" | null }> {
  const userId = requireUserId();
  const match = { review_id: reviewId, season_number: seasonNumber, user_id: userId };

  const { count } = await supabase
    .from("season_review_likes")
    .select("*", { count: "exact", head: true })
    .match(match);

  const liked = (count ?? 0) > 0;
  if (liked) {
    unwrap(await supabase.from("season_review_likes").delete().match(match));
  } else {
    unwrap(await supabase.from("season_review_likes").insert(match));
  }

  const { count: total } = await supabase
    .from("season_review_likes")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId)
    .eq("season_number", seasonNumber);

  return { likes: total ?? 0, userReaction: liked ? null : "likes" };
}

export async function getPopularReviews(limitCount = 30): Promise<PopularReview[]> {
  const { data, error } = await supabase
    .from("season_review_feed")
    .select("*")
    .gte("likes_count", 1)
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limitCount);
  if (error || !data) return [];
  return data.map(popularFromRow);
}

/** Avaliações de quem `userId` segue para uma série. */
export async function getFollowedUsersReviews(
  userId: string,
  seriesId: number
): Promise<SeriesReview[]> {
  const following = await getFollowing(userId);
  const ids = following.map((f) => f.userId);
  if (ids.length === 0) return [];

  const rows = unwrap(
    await supabase
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("series_id", seriesId)
      .in("user_id", ids)
  );
  return (rows as unknown as ReviewRow[]).map(reviewFromRow);
}

/** Avaliações da última semana de quem o usuário logado segue. */
export async function getRecentFollowedUsersReviews(limitCount = 10): Promise<PopularReview[]> {
  const currentUser = getSessionUser();
  if (!currentUser) return [];

  const following = await getFollowing(currentUser.id);
  const ids = following.map((f) => f.userId);
  if (ids.length === 0) return [];

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("season_review_feed")
    .select("*")
    .in("user_id", ids)
    .gte("created_at", oneWeekAgo)
    .order("created_at", { ascending: false })
    .limit(limitCount);
  if (error || !data) return [];
  return data.map(popularFromRow);
}

export async function getUserRecentReviews(
  userId: string,
  limitCount: number = 3
): Promise<PopularReview[]> {
  const { data, error } = await supabase
    .from("season_review_feed")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limitCount);
  if (error || !data) return [];
  return data.map(popularFromRow);
}

/** Avaliações mais recentes da comunidade. */
export async function getAllReviews(limitCount: number = 30): Promise<PopularReview[]> {
  const { data, error } = await supabase
    .from("season_review_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limitCount);
  if (error || !data) return [];
  return data.map(popularFromRow);
}

/** Avaliação completa (todas as temporadas) com os dados da série. */
export async function getReviewDetails(reviewId: string): Promise<SeriesReview | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("id", reviewId)
    .maybeSingle();
  if (error) throw error;
  return data ? reviewFromRow(data as unknown as ReviewRow) : null;
}
