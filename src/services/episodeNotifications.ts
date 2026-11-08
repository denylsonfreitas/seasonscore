import { supabase } from "../config/supabase";
import { getLatestEpisode } from "./tmdb";
import { NotificationType } from "./notifications";
import { logError } from "../utils/logger";

/**
 * Ao adicionar uma série à watchlist, avisa se ela teve episódio nos últimos 7 dias.
 * Depois disso, a tarefa agendada no banco (private.check_new_episodes) cuida dos
 * episódios seguintes. Cada episódio é avisado uma única vez (last_notified_episodes).
 */
/** Mesmo formato da tarefa agendada: "Novo episódio de X: T2 · E08 – Nome". */
export function episodeMessage(
  seriesName: string,
  episode: { season_number: number; episode_number: number; name?: string }
): string {
  const number = String(episode.episode_number).padStart(2, "0");
  const name = episode.name?.trim() ? ` – ${episode.name.trim()}` : "";
  return `Novo episódio de ${seriesName}: T${episode.season_number} · E${number}${name}`.slice(
    0,
    500
  );
}

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

    // Só episódios já exibidos, de no máximo 7 dias atrás
    const diffDays =
      (Date.now() - new Date(latestEpisode.air_date).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0 || diffDays > 7) return;

    await supabase.from("notifications").insert({
      user_id: userId,
      type: NotificationType.NEW_EPISODE,
      series_id: seriesId,
      series_name: seriesName,
      series_poster: posterPath,
      season_number: latestEpisode.season_number,
      episode_number: latestEpisode.episode_number,
      message: episodeMessage(seriesName, latestEpisode),
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
