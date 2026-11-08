import { db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getLatestEpisode } from "./tmdb";
import { createNotification, NotificationType } from "./notifications";
import { logError } from "../utils/logger";

// Verificar novos episódios para um usuário específico
// Verificar novos episódios para uma série específica
export async function checkNewEpisodeForSeries(
  userId: string, 
  seriesId: number, 
  seriesName: string, 
  posterPath: string | null
): Promise<void> {
  try {
    // Obter o último episódio da série
    const latestEpisode = await getLatestEpisode(seriesId);
    
    if (!latestEpisode) {
      return;
    }
    
    // Verificar se o episódio já foi notificado para este usuário
    const lastNotifiedRef = doc(db, "lastNotifiedEpisodes", `${userId}_${seriesId}`);
    const lastNotifiedDoc = await getDoc(lastNotifiedRef);
    
    if (lastNotifiedDoc.exists()) {
      const lastNotified = lastNotifiedDoc.data();
      
      // Se o último episódio notificado for o mesmo, não notificar novamente
      if (
        lastNotified.seasonNumber === latestEpisode.season_number &&
        lastNotified.episodeNumber === latestEpisode.episode_number
      ) {
        return;
      }
    }
    
    // Verificar se o episódio foi lançado recentemente (nos últimos 7 dias)
    const episodeDate = new Date(latestEpisode.air_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - episodeDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      // Criar notificação para o usuário
      await createNotification(
        userId,
        NotificationType.NEW_EPISODE,
        {
          seriesId,
          seriesName,
          seriesPoster: posterPath || undefined,
          seasonNumber: latestEpisode.season_number,
          episodeNumber: latestEpisode.episode_number,
          message: `Novo episódio de ${seriesName}: S${latestEpisode.season_number}E${latestEpisode.episode_number} - ${latestEpisode.name}`
        }
      );
      
      // Atualizar o último episódio notificado
      await setDoc(lastNotifiedRef, {
        seriesId,
        seasonNumber: latestEpisode.season_number,
        episodeNumber: latestEpisode.episode_number,
        notifiedAt: new Date()
      });
    }
  } catch (error) {
    logError("checkNewEpisodeForSeries", error);
  }
}

// Verificar novos episódios para todos os usuários 