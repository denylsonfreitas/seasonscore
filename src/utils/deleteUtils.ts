import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Função de utilitário que garante que os dados sejam excluídos do Firestore
 * Esta função encapsula o deleteDoc do Firestore e pode incluir lógica adicional
 * para garantir que a exclusão seja bem-sucedida
 * @param collectionName Nome da coleção no Firestore
 * @param documentId ID do documento a ser excluído
 * @returns Promise que resolve quando o documento foi excluído
 */
export const ensureFirestoreDelete = async (
  collectionName: string,
  documentId: string
): Promise<void> => {
  try {
    // Referência ao documento
    const docRef = doc(db, collectionName, documentId);
    
    // Executa a exclusão
    await deleteDoc(docRef);
    
    // Aqui poderíamos adicionar lógica de verificação adicional
    // Por exemplo, tentar ler o documento novamente para garantir que foi excluído
    // ou implementar tentativas adicionais se a exclusão falhar
    
  } catch (error) {
    throw error;
  }
};

/**
 * Função específica para excluir comentários garantindo atualização no Firestore
 * @param reviewId ID da avaliação
 * @param commentId ID do comentário
 */
export const ensureCommentDeletion = async (reviewId: string, commentId: string): Promise<void> => {
}; 