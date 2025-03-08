import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getFirestore,
  orderBy,
  serverTimestamp,
  DocumentData,
  updateDoc,
  getDoc,
  deleteDoc,
  Timestamp,
  doc,
} from "firebase/firestore";
import { auth } from "../config/firebase";
import { getSeriesDetails } from "./tmdb";

const db = getFirestore();
const reviewsCollection = collection(db, "reviews");

export interface Review {
  id: string;
  seriesId: number;
  userId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface SeasonReview {
  id?: string;
  seriesId: number;
  seasonNumber: number;
  userId: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: Date | Timestamp;
}

export interface SeriesReview {
  id: string;
  userId: string;
  userEmail: string;
  seriesId: number;
  seasonReviews: SeasonReview[];
  series: {
    name: string;
    poster_path: string;
  };
}

export async function addReview(
  seriesId: number,
  rating: number,
  comment: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const review = {
    seriesId,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email,
    rating,
    comment,
    createdAt: serverTimestamp(),
  };

  await addDoc(reviewsCollection, review);
}

export async function addSeasonReview(
  seriesId: number,
  seasonNumber: number,
  rating: number,
  comment: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");
  if (!auth.currentUser.email)
    throw new Error("Email do usuário não encontrado");

  const seasonReview = {
    seriesId,
    seasonNumber,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email,
    rating,
    comment,
    createdAt: new Date(),
  };

  // Verifica se já existe uma avaliação para esta série do usuário
  const userReviewQuery = query(
    reviewsCollection,
    where("userId", "==", auth.currentUser.uid),
    where("seriesId", "==", seriesId)
  );

  const userReviewSnapshot = await getDocs(userReviewQuery);

  if (userReviewSnapshot.empty) {
    // Cria uma nova avaliação da série
    const seriesReview = {
      seriesId,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      seasonReviews: [seasonReview],
      createdAt: new Date(),
    };

    await addDoc(reviewsCollection, seriesReview);
  } else {
    // Atualiza a avaliação existente
    const reviewDoc = userReviewSnapshot.docs[0];
    const existingReview = reviewDoc.data() as SeriesReview;

    // Verifica se já existe uma avaliação para esta temporada
    const existingSeasonIndex = existingReview.seasonReviews.findIndex(
      (sr) => sr.seasonNumber === seasonNumber
    );

    if (existingSeasonIndex >= 0) {
      // Atualiza a avaliação da temporada existente
      existingReview.seasonReviews[existingSeasonIndex] = seasonReview;
    } else {
      // Adiciona nova avaliação de temporada
      existingReview.seasonReviews.push(seasonReview);
    }

    await updateDoc(reviewDoc.ref, {
      seasonReviews: existingReview.seasonReviews,
    });
  }
}

export async function getSeriesReviews(seriesId: number) {
  const reviewsQuery = query(
    reviewsCollection,
    where("seriesId", "==", seriesId)
  );

  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SeriesReview[];
}

export async function getUserReview(seriesId: number, userId: string) {
  const reviewQuery = query(
    reviewsCollection,
    where("seriesId", "==", seriesId),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(reviewQuery);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as SeriesReview;
}

export async function updateReview(
  reviewId: string,
  seasonNumber: number,
  rating: number,
  comment: string
) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewDoc = await getDoc(doc(reviewsCollection, reviewId));
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;
  const seasonIndex = review.seasonReviews.findIndex(
    (sr) => sr.seasonNumber === seasonNumber
  );

  if (seasonIndex === -1) throw new Error("Temporada não encontrada");

  review.seasonReviews[seasonIndex] = {
    ...review.seasonReviews[seasonIndex],
    rating,
    comment,
    createdAt: new Date(),
  };

  await updateDoc(reviewDoc.ref, {
    seasonReviews: review.seasonReviews,
  });
}

export async function deleteReview(reviewId: string, seasonNumber: number) {
  if (!auth.currentUser) throw new Error("Usuário não autenticado");

  const reviewDoc = await getDoc(doc(reviewsCollection, reviewId));
  if (!reviewDoc.exists()) throw new Error("Avaliação não encontrada");

  const review = reviewDoc.data() as SeriesReview;

  // Remove a avaliação da temporada específica
  review.seasonReviews = review.seasonReviews.filter(
    (sr) => sr.seasonNumber !== seasonNumber
  );

  if (review.seasonReviews.length === 0) {
    // Se não houver mais avaliações, remove o documento inteiro
    await deleteDoc(reviewDoc.ref);
  } else {
    // Caso contrário, atualiza o documento com as avaliações restantes
    await updateDoc(reviewDoc.ref, {
      seasonReviews: review.seasonReviews,
    });
  }
}

export async function getUserReviews(userId: string): Promise<SeriesReview[]> {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  const reviews = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const seriesDetails = await getSeriesDetails(data.seriesId);

      return {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        seriesId: data.seriesId,
        seasonReviews: data.seasonReviews,
        series: {
          name: seriesDetails.name,
          poster_path: seriesDetails.poster_path,
        },
      } as SeriesReview;
    })
  );

  return reviews;
}
