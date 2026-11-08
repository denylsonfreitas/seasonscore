import { supabase, unwrap } from "../config/supabase";
import { checkNewEpisodeForSeries } from "./episodeNotifications";
import { logError } from "../utils/logger";

export interface WatchlistItem {
  id?: string;
  userId: string;
  seriesId: number;
  addedAt: Date;
  seriesData: {
    name: string;
    poster_path: string | null;
    first_air_date: string;
  };
}

export async function addToWatchlist(
  userId: string,
  series: {
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string;
  }
): Promise<void> {
  unwrap(
    await supabase.from("watchlist").upsert({
      user_id: userId,
      series_id: series.id,
      series_name: series.name,
      poster_path: series.poster_path,
      first_air_date: series.first_air_date,
    })
  );

  // Verificar se há novos episódios para esta série
  try {
    await checkNewEpisodeForSeries(userId, series.id, series.name, series.poster_path);
  } catch (error) {
    logError("addToWatchlist", error);
  }
}

export async function removeFromWatchlist(userId: string, seriesId: number): Promise<void> {
  unwrap(await supabase.from("watchlist").delete().eq("user_id", userId).eq("series_id", seriesId));
}

export async function isInWatchlist(userId: string, seriesId: number): Promise<boolean> {
  const { count } = await supabase
    .from("watchlist")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("series_id", seriesId);
  return (count ?? 0) > 0;
}

/** Séries na watchlist do usuário, das mais recentes para as mais antigas. */
export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: `${row.user_id}_${row.series_id}`,
    userId: row.user_id,
    seriesId: row.series_id,
    addedAt: new Date(row.added_at),
    seriesData: {
      name: row.series_name,
      poster_path: row.poster_path,
      first_air_date: row.first_air_date ?? "",
    },
  }));
}
