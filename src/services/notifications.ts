import { supabase } from "../config/supabase";
import { logError } from "../utils/logger";

// As notificações sociais (seguidores, curtidas, comentários, avaliações) são criadas
// por triggers no banco. O app apenas lê, marca como lidas e exclui.

export const DEFAULT_NOTIFICATION_LIMIT = 50;

export enum NotificationType {
  NEW_FOLLOWER = "NEW_FOLLOWER",
  NEW_COMMENT = "NEW_COMMENT",
  NEW_REACTION = "NEW_REACTION",
  NEW_EPISODE = "NEW_EPISODE",
  NEW_REVIEW = "NEW_REVIEW",
  LIST_COMMENT = "LIST_COMMENT",
  LIST_REACTION = "LIST_REACTION",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  senderId?: string;
  /** Nome de usuário do remetente (usado para abrir o perfil). */
  senderName?: string;
  senderPhoto?: string;
  seriesId?: number;
  seriesName?: string;
  seriesPoster?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  /** Avaliação, lista ou comentário relacionado, conforme o tipo. */
  reviewId?: string;
  message: string;
  read: boolean;
  createdAt: Date;
  /** O remetente excluiu a conta. */
  isDeleted?: boolean;
}

const SELECT = "*, sender:profiles!notifications_sender_id_fkey(username, photo_url)";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  sender_id: string | null;
  series_id: number | null;
  series_name: string | null;
  series_poster: string | null;
  season_number: number | null;
  episode_number: number | null;
  target_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  sender: { username: string; photo_url: string | null } | null;
};

function fromRow(row: NotificationRow): Notification {
  const isSocial = row.type !== NotificationType.NEW_EPISODE;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    senderId: row.sender_id ?? undefined,
    senderName: row.sender?.username ?? (isSocial ? "Usuário excluído" : undefined),
    senderPhoto: row.sender?.photo_url ?? undefined,
    seriesId: row.series_id ?? undefined,
    seriesName: row.series_name ?? undefined,
    seriesPoster: row.series_poster ?? undefined,
    seasonNumber: row.season_number ?? undefined,
    episodeNumber: row.episode_number ?? undefined,
    reviewId: row.target_id ?? undefined,
    message: row.message,
    read: row.read,
    createdAt: new Date(row.created_at),
    isDeleted: isSocial && !row.sender,
  };
}

export async function getUserNotifications(
  userId: string,
  limit = DEFAULT_NOTIFICATION_LIMIT
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) {
    logError("getUserNotifications", error);
    return [];
  }
  return (data as unknown as NotificationRow[]).map(fromRow);
}

/** Notificações do usuário (as duplicatas já são evitadas no banco). */
export async function getGroupedNotifications(userId: string): Promise<Notification[]> {
  return getUserNotifications(userId);
}

/** Mantido por compatibilidade: a deduplicação agora acontece no banco. */
export async function cleanupNotifications(_userId: string): Promise<number> {
  return 0;
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
  if (error) logError("markNotificationAsRead", error);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId);
  if (error) {
    logError("deleteNotification", error);
    return false;
  }
  return true;
}

export async function deleteAllUserNotifications(userId: string): Promise<number> {
  const { error, count } = await supabase
    .from("notifications")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Escuta mudanças nas notificações do usuário em tempo real.
 * Retorna uma função para cancelar a inscrição.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const refresh = () => {
    getUserNotifications(userId).then(callback, (error) =>
      logError("subscribeToNotifications", error)
    );
  };

  const channel = supabase
    // nome único: o menu pode se inscrever mais de uma vez (desktop e mobile)
    .channel(`notifications:${userId}:${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      refresh
    )
    .subscribe();

  refresh();

  return () => {
    supabase.removeChannel(channel);
  };
}
