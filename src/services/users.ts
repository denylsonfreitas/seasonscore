import { supabase, unwrap } from "../config/supabase";
import type { Json, Tables } from "../types/database";
import { memoizeAsync } from "../utils/memo";

export interface NotificationSettings {
  newEpisode: boolean;
  newFollower: boolean;
  newComment: boolean;
  newReaction: boolean;
  newReview: boolean;
  listComment: boolean;
  listReaction: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  newEpisode: true,
  newFollower: true,
  newComment: true,
  newReaction: true,
  newReview: true,
  listComment: true,
  listReaction: true,
};

export interface FavoriteSeries {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
  images?: {
    logos?: Array<{ file_path: string }>;
  };
}

/** Dados públicos de um usuário (o email não é público). */
export interface UserData {
  id: string;
  username: string;
  displayName?: string;
  photoURL?: string | null;
  coverURL?: string | null;
  description?: string;
  favoriteSeries?: FavoriteSeries | null;
  notificationSettings?: NotificationSettings;
  createdAt?: Date | null;
  isDeleted?: boolean;
}

// Interface estendida com estatísticas do usuário para exibição em páginas como Community
export interface UserWithStats extends UserData {
  reviewCount?: number;
  listCount?: number;
  followerCount?: number;
  followingCount?: number;
  popularityScore?: number;
}

type ProfileRow = Tables<"profiles">;
type ProfileStatsRow = Tables<"profile_stats">;

export function profileFromRow(row: ProfileRow): UserData {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? undefined,
    photoURL: row.photo_url,
    coverURL: row.cover_url,
    description: row.description ?? undefined,
    favoriteSeries: (row.favorite_series as unknown as FavoriteSeries | null) ?? null,
    notificationSettings: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...((row.notification_settings as Partial<NotificationSettings> | null) ?? {}),
    },
    createdAt: row.created_at ? new Date(row.created_at) : null,
  };
}

function statsFromRow(row: ProfileStatsRow): UserWithStats {
  const followerCount = row.followers_count ?? 0;
  const reviewCount = row.reviews_count ?? 0;
  return {
    id: row.id ?? "",
    username: row.username ?? "",
    displayName: row.display_name ?? undefined,
    photoURL: row.photo_url,
    coverURL: row.cover_url,
    description: row.description ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    followerCount,
    followingCount: row.following_count ?? 0,
    reviewCount,
    listCount: row.lists_count ?? 0,
    popularityScore: followerCount * 3 + reviewCount,
  };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.length < 3) return false;
  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: username.toLowerCase(),
  });
  if (error) return false;
  return data === true;
}

export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  unwrap(
    await supabase.from("profiles").update({ username: newUsername.toLowerCase() }).eq("id", userId)
  );
  invalidateUserData(userId);
}

/** Campos do perfil que o próprio usuário pode alterar. */
export interface ProfileUpdate {
  username?: string;
  displayName?: string;
  photoURL?: string | null;
  coverURL?: string | null;
  description?: string;
  favoriteSeries?: FavoriteSeries | null;
}

export async function updateProfile(userId: string, data: ProfileUpdate): Promise<void> {
  const update: Partial<ProfileRow> = {};
  if (data.username !== undefined) update.username = data.username.toLowerCase();
  if (data.displayName !== undefined) update.display_name = data.displayName;
  if (data.photoURL !== undefined) update.photo_url = data.photoURL;
  if (data.coverURL !== undefined) update.cover_url = data.coverURL;
  if (data.description !== undefined) update.description = data.description;
  if (data.favoriteSeries !== undefined) {
    update.favorite_series = data.favoriteSeries as unknown as Json;
  }
  if (Object.keys(update).length === 0) return;

  unwrap(await supabase.from("profiles").update(update).eq("id", userId));
  invalidateUserData(userId);
}

async function fetchUserData(userId: string): Promise<UserData | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return profileFromRow(data);
}

/**
 * Dados públicos de um usuário. Guardados por 1 minuto para evitar leituras
 * repetidas quando vários componentes exibem o mesmo usuário.
 */
export const getUserData = memoizeAsync(fetchUserData, { ttlMs: 60 * 1000, key: (id) => id });

/** Descarta o cache de um usuário após alterações no perfil. */
export function invalidateUserData(userId: string): void {
  getUserData.invalidate(userId);
}

export async function getUserByUsername(username: string): Promise<UserData | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  return profileFromRow(data);
}

/**
 * Exclui a conta do usuário logado. As imagens do Storage são removidas antes;
 * avaliações, listas, comentários etc. são apagados em cascata no banco.
 */
export async function deleteCurrentUserAccount(userId: string): Promise<void> {
  const { data: files } = await supabase.storage.from("profile-images").list(userId);
  if (files && files.length > 0) {
    await supabase.storage.from("profile-images").remove(files.map((f) => `${userId}/${f.name}`));
  }
  unwrap(await supabase.rpc("delete_my_account"));
  invalidateUserData(userId);
  await supabase.auth.signOut();
}

export async function updateUserNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  if (!userId) throw new Error("ID de usuário não fornecido");
  const current = (await getUserNotificationSettings(userId)) ?? DEFAULT_NOTIFICATION_SETTINGS;
  unwrap(
    await supabase
      .from("profiles")
      .update({ notification_settings: { ...current, ...settings } as unknown as Json })
      .eq("id", userId)
  );
  invalidateUserData(userId);
}

export async function getUserNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  if (!userId) return null;
  const user = await fetchUserData(userId);
  return user?.notificationSettings ?? null;
}

type UserOrder = "popular" | "newest" | "all";

function sortUsers(users: UserWithStats[], order: UserOrder, limitCount: number) {
  let result = [...users];
  switch (order) {
    case "popular":
      result = result
        .filter((u) => (u.followerCount ?? 0) >= 1)
        .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
      break;
    case "newest": {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      result = result
        .filter((u) => (u.createdAt?.getTime() ?? 0) >= threeDaysAgo)
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      break;
    }
    case "all":
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      break;
  }
  return result.slice(0, limitCount);
}

// Retorna os usuários mais populares baseado em quantidade de seguidores e reviews
export async function getPopularUsers(
  limitCount: number = 10,
  orderBy: UserOrder = "popular"
): Promise<UserWithStats[]> {
  const { data, error } = await supabase
    .from("profile_stats")
    .select("*")
    .order(orderBy === "newest" ? "created_at" : "followers_count", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return sortUsers(data.map(statsFromRow), orderBy, limitCount);
}

/** Busca usuários por nome ou username. */
export async function searchUsers(
  searchText: string,
  limitCount: number = 10,
  orderType: UserOrder = "popular"
): Promise<UserWithStats[]> {
  const term = searchText.trim().replace(/[%_,()]/g, "");
  if (!term) return [];
  const { data, error } = await supabase
    .from("profile_stats")
    .select("*")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(100);
  if (error || !data) return [];
  // Na busca, mostra todos os resultados (sem exigir seguidores), ordenados pela popularidade
  const users = data.map(statsFromRow);
  if (orderType === "popular") {
    return users
      .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
      .slice(0, limitCount);
  }
  return sortUsers(users, orderType, limitCount);
}
