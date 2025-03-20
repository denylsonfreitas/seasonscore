import { db } from "../../config/firebase";
import {
  collection,
  writeBatch,
  doc,
  query,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { getFilteredSeries } from "../tmdb";

/**
 * Este script atualiza a coleção "series_by_genre" no Firestore
 * Ele pode ser executado como um CRON job em uma função do Firebase Cloud Functions
 * Para manter os dados de séries por gênero atualizados para recomendações
 */
export async function updateSeriesByGenre() {
  
  // Lista de gêneros para atualizar
  const genres = [
    { id: 18, name: "Drama" },
    { id: 35, name: "Comédia" },
    { id: 80, name: "Crime" },
    { id: 10759, name: "Ação & Aventura" },
    { id: 10765, name: "Ficção Científica & Fantasia" },
    { id: 9648, name: "Mistério" },
  ];
  
  try {
    // Criar um batch para operações em lote
    const batch = writeBatch(db);
    
    // Primeiro, excluir documentos existentes
    const existingSeriesRef = collection(db, "series_by_genre");
    const existingSeriesSnapshot = await getDocs(existingSeriesRef);
    
    existingSeriesSnapshot.forEach((document) => {
      batch.delete(doc(db, "series_by_genre", document.id));
    });
    
    // Para cada gênero, buscar séries populares
    for (const genre of genres) {
      
      // Buscar duas páginas de séries para cada gênero
      for (let page = 1; page <= 2; page++) {
        const seriesResponse = await getFilteredSeries({
          genre: genre.id.toString(),
          minVotes: 100,
          minRating: 7
        }, page);
        
        
        // Adicionar cada série ao batch
        for (const series of seriesResponse.results) {
          // Criar um ID único para o documento
          const seriesId = `${series.id}_${genre.id}`;
          
          // Adicionar o documento ao batch
          batch.set(doc(db, "series_by_genre", seriesId), {
            ...series,
            genreIds: [genre.id],
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Commit do batch
    await batch.commit();
    
  } catch (error) {
    console.error("Erro ao atualizar coleção series_by_genre:", error);
    throw error;
  }
} 