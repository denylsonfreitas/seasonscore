/** Código de erro (ex.: "23505" do Postgres ou "invalid_credentials" do Auth), se existir. */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

/** Mensagem legível de um erro desconhecido. */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado"): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}
