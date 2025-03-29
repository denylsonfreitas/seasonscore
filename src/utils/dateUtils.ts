import { 
  format, 
  formatDistance, 
  formatRelative, 
  isToday, 
  isYesterday,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from "firebase/firestore";

/**
 * Formata uma data para exibição em notificações
 * @param date A data a ser formatada
 * @param longFormat Se deve usar formato longo para datas antigas
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
    const options = { day: 'numeric', month: 'short' } as Intl.DateTimeFormatOptions;
    return dateObj.toLocaleDateString('pt-BR', options);
  }
  
  // Se for em outro ano, mostrar dia/mês/ano
  const options = { day: 'numeric', month: 'short', year: 'numeric' } as Intl.DateTimeFormatOptions;
  return dateObj.toLocaleDateString('pt-BR', options);
}

/**
 * Formata uma data para exibição relativa (ex: "há 2 horas")
 * @param date A data a ser formatada
 * @returns String formatada da data relativa
 */
export function formatRelativeDate(date: Date | null): string {
  if (!date) return 'Agora';
  
  try {
    return formatDistance(date, new Date(), {
      addSuffix: true,
      locale: ptBR
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Formata uma data como dia e mês abreviado
 * @param date A data a ser formatada
 * @returns String formatada da data (ex: "21 jan")
 */
export function formatShortDate(date: Date | null): string {
  if (!date) return '';
  
  try {
    return format(date, "dd MMM", { locale: ptBR });
  } catch (error) {
    return '';
  }
}

/**
 * Formata uma data como dia, mês e ano
 * @param date A data a ser formatada
 * @returns String formatada da data (ex: "21 de janeiro de 2023")
 */
export function formatLongDate(date: Date | null): string {
  if (!date) return '';
  
  try {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    return '';
  }
}

// Função para formatar datas completas
export function formatFullDate(date: Date | Timestamp | null | undefined): string {
  if (!date) return "";
  
  // Converter Timestamp para Date se necessário
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  } as Intl.DateTimeFormatOptions;
  
  return dateObj.toLocaleDateString('pt-BR', options);
}

// Função para formatar apenas o dia e o mês
export function formatDayMonth(date: Date | Timestamp | null | undefined): string {
  if (!date) return "";
  
  // Converter Timestamp para Date se necessário
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  
  const options = { day: 'numeric', month: 'long' } as Intl.DateTimeFormatOptions;
  return dateObj.toLocaleDateString('pt-BR', options);
}

// Função para formatar apenas dia da semana
export function formatWeekday(date: Date | Timestamp | null | undefined): string {
  if (!date) return "";
  
  // Converter Timestamp para Date se necessário
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  
  const options = { weekday: 'long' } as Intl.DateTimeFormatOptions;
  return dateObj.toLocaleDateString('pt-BR', options);
}

// Função para formatar data de criação em formato relativo
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
    return `há ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  // Menos de 24 horas
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `há ${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  
  // Menos de 7 dias
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `há ${days} dia${days !== 1 ? 's' : ''}`;
  }
  
  // Menos de 30 dias
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    return `há ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  }
  
  // Menos de 365 dias
  if (diff < 365 * 24 * 60 * 60 * 1000) {
    const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  
  // Mais de 365 dias
  const years = Math.floor(diff / (365 * 24 * 60 * 60 * 1000));
  return `há ${years} ano${years !== 1 ? 's' : ''}`;
} 