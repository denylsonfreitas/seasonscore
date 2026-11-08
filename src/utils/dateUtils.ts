import { Timestamp } from "firebase/firestore";

/**
 * Formata uma data para exibição em notificações
 * @param date A data a ser formatada
 * @returns String formatada da data
 */
export function formatNotificationDate(date: Date | Timestamp | null | undefined): string {
  if (!date) return "Agora";

  // Converter Timestamp para Date se necessário
  const dateObj = date instanceof Timestamp ? date.toDate() : date;

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  // Menos de 1 minuto
  if (diff < 60 * 1000) {
    return "Agora";
  }

  // Menos de 1 hora
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m atrás`;
  }

  // Menos de 24 horas
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h atrás`;
  }

  // Menos de 7 dias
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d atrás`;
  }

  // Se for no mesmo ano, mostrar o dia e o mês
  if (dateObj.getFullYear() === now.getFullYear()) {
    const options = { day: "numeric", month: "short" } as Intl.DateTimeFormatOptions;
    return dateObj.toLocaleDateString("pt-BR", options);
  }

  // Se for em outro ano, mostrar dia/mês/ano
  const options = { day: "numeric", month: "short", year: "numeric" } as Intl.DateTimeFormatOptions;
  return dateObj.toLocaleDateString("pt-BR", options);
}

/** Formata uma data em texto relativo (ex.: "há 2 horas"). */
export function formatRelativeTime(date: Date | Timestamp | null | undefined): string {
  if (!date) return "recentemente";

  // Converter Timestamp para Date se necessário
  const dateObj = date instanceof Timestamp ? date.toDate() : date;

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  // Menos de 1 minuto
  if (diff < 60 * 1000) {
    return "agora mesmo";
  }

  // Menos de 1 hora
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `há ${minutes} minuto${minutes !== 1 ? "s" : ""}`;
  }

  // Menos de 24 horas
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `há ${hours} hora${hours !== 1 ? "s" : ""}`;
  }

  // Menos de 7 dias
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `há ${days} dia${days !== 1 ? "s" : ""}`;
  }

  // Menos de 30 dias
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    return `há ${weeks} semana${weeks !== 1 ? "s" : ""}`;
  }

  // Menos de 365 dias
  if (diff < 365 * 24 * 60 * 60 * 1000) {
    const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
    return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  }

  // Mais de 365 dias
  const years = Math.floor(diff / (365 * 24 * 60 * 60 * 1000));
  return `há ${years} ano${years !== 1 ? "s" : ""}`;
}

// Função para formatar data em formato comum (dia/mês/ano)
