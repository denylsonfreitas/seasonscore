/** Notas vão de 0,5 a 5,0. Médias são arredondadas para a faixa mais próxima. */
export type ScoreTier = "low" | "mid" | "high";

export function scoreTier(score: number): ScoreTier {
  if (score < 2.25) return "low";
  if (score < 3.75) return "mid";
  return "high";
}

export function scoreColor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "ink.700";
  return `score.${scoreTier(score)}`;
}

/** Formata no padrão brasileiro com uma casa: 4,5 */
export function formatScore(score: number): string {
  return score.toFixed(1).replace(".", ",");
}

export function yearOf(date?: string | null): string {
  return date ? date.slice(0, 4) : "";
}
