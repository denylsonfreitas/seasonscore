/**
 * Registra erros não críticos apenas em desenvolvimento.
 * Em produção os consoles são removidos pelo build, então isso não polui o console do usuário.
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
}
