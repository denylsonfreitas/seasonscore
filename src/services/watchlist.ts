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

export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  const watchlistRef = collection(db, "watchlist");
  const q = query(watchlistRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    addedAt: doc.data().addedAt.toDate(),
  })) as WatchlistItem[];
} 