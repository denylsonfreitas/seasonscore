import { supabase } from "../config/supabase";
import { getLatestEpisode } from "./tmdb";
import { NotificationType } from "./notifications";
import { logError } from "../utils/logger";

/**
 * Avisa o próprio usuário quando uma série da watchlist teve episódio nos últimos 7 dias.
 * Cada episódio é avisado uma única vez (controle em last_notified_episodes).
 */
export async function checkNewEpisodeForSeries(
  userId: string,
  seriesId: number,
  seriesName: string,
  posterPath: string | null
): Promise<void> {
  try {
    const latestEpisode = await getLatestEpisode(seriesId);
    if (!latestEpisode?.air_date) return;

    const { data: lastNotified } = await supabase
      .from("last_notified_episodes")
      .select("season_number, episode_number")
      .eq("user_id", userId)
      .eq("series_id", seriesId)
      .maybeSingle();

    if (
      lastNotified?.season_number === latestEpisode.season_number &&
      lastNotified?.episode_number === latestEpisode.episode_number
    ) {
      return;
    }

    const diffDays =
      Math.abs(Date.now() - new Date(latestEpisode.air_date).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) return;

    await supabase.from("notifications").insert({
      user_id: userId,
      type: NotificationType.NEW_EPISODE,
      series_id: seriesId,
      series_name: seriesName,
      series_poster: posterPath,
      season_number: latestEpisode.season_number,
      episode_number: latestEpisode.episode_number,
      message: `Novo episódio de ${seriesName}: S${latestEpisode.season_number}E${latestEpisode.episode_number} - ${latestEpisode.name}`,
    });

    await supabase.from("last_notified_episodes").upsert({
      user_id: userId,
      series_id: seriesId,
      season_number: latestEpisode.season_number,
      episode_number: latestEpisode.episode_number,
      notified_at: new Date().toISOString(),
    });
  } catch (error) {
    logError("checkNewEpisodeForSeries", error);
  }
}
