import type { FavoriteSeries, NotificationSettings } from "../services/users";

/**
 * Usuário logado no app (sessão do Supabase + perfil público).
 * Os nomes dos campos seguem o formato usado nas telas.
 */
export interface ExtendedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  coverURL?: string;
  description?: string;
  favoriteSeries?: FavoriteSeries;
  notificationSettings?: NotificationSettings;
  /** Provedores usados para entrar (ex.: "email", "google"). */
  providers: string[];
}
