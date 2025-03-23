/**
 * Formata um valor de classificação para exibição
 * @param rating - O valor de classificação a ser formatado
 * @returns O valor formatado com 1 casa decimal
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
