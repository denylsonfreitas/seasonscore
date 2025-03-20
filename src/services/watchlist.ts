import { db } from "../config/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { Series } from "./tmdb";
import { checkNewEpisodeForSeries } from "./episodeNotifications";

export interface WatchlistItem {
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
  const watchlistRef = doc(db, "watchlist", `${userId}_${series.id}`);
  
  await setDoc(watchlistRef, {
    userId,
    seriesId: series.id,
    addedAt: new Date(),
    seriesData: {
      name: series.name,
      poster_path: series.poster_path,
      first_air_date: series.first_air_date,
    },
  });
  
  // Verificar se há novos episódios para esta série
  try {
    await checkNewEpisodeForSeries(userId, series.id, series.name, series.poster_path);
  } catch (error) {
    console.error("Erro ao verificar novos episódios ao adicionar à watchlist:", error);
  }
}

export async function removeFromWatchlist(userId: string, seriesId: number): Promise<void> {
  const watchlistRef = doc(db, "watchlist", `${userId}_${seriesId}`);
  await deleteDoc(watchlistRef);
}

export async function isInWatchlist(userId: string, seriesId: number): Promise<boolean> {
  const watchlistRef = doc(db, "watchlist", `${userId}_${seriesId}`);
  const docSnap = await getDoc(watchlistRef);
  return docSnap.exists();
}

/**
 * Obtém todas as séries da watchlist do usuário
 */
export async function getUserWatchlist(userId: string) {
  if (!userId) return [];
  
  try {
    const watchlistRef = collection(db, "watchlist");
    const q = query(watchlistRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const watchlistItems: any[] = [];
    
    querySnapshot.forEach((doc) => {
      watchlistItems.push(doc.data());
    });
    
    return watchlistItems;
  } catch (error) {
    console.error("Erro ao buscar watchlist:", error);
    return [];
  }
} 