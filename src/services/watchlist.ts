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
  }
}

export async function removeFromWatchlist(userId: string, seriesId: number): Promise<void> {
  try {
    // Criar a referência ao documento usando o formato de ID composto
    const docId = `${userId}_${seriesId}`;
    const watchlistRef = doc(db, "watchlist", docId);
    
    // Verificar se o documento existe antes de excluir
    const docSnap = await getDoc(watchlistRef);
    if (!docSnap.exists()) {
      return;
    }
    
    // Verificar se os dados do documento correspondem ao usuário correto
    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error("Você não tem permissão para remover este item da watchlist");
    }
    
    // Excluir o documento
    await deleteDoc(watchlistRef);
    
    // Aqui poderíamos adicionar lógica adicional se necessário
    // Por exemplo, remover também notificações relacionadas a esta série
  } catch (error) {
    throw error;
  }
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
      // Incluir o ID do documento junto com os dados
      watchlistItems.push({
        id: doc.id,  // Incluir o ID do documento
        ...doc.data()
      });
    });
    
    return watchlistItems;
  } catch (error) {
    return [];
  }
} 