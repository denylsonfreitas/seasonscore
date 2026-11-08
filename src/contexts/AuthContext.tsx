import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { getUserData, invalidateUserData } from "../services/users";
import { useAuthUIStore } from "../services/uiState";
import type { ExtendedUser } from "../types/auth";

interface SignUpResult {
  /** O Supabase exige confirmação por email antes do primeiro login. */
  needsEmailConfirmation: boolean;
}

interface AuthContextType {
  currentUser: ExtendedUser | null;
  signUp: (email: string, password: string, username: string) => Promise<SignUpResult>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  /** Recarrega o perfil (após editar foto, nome etc.). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

/** Traduz os erros mais comuns do Supabase Auth. */
function authErrorMessage(error: { message?: string; code?: string }): string {
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (code === "invalid_credentials" || message.includes("Invalid login credentials")) {
    return "Email ou senha incorretos.";
  }
  if (code === "email_not_confirmed") {
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
  }
  if (code === "user_already_exists" || message.includes("already registered")) {
    return "Este email já está em uso.";
  }
  if (code === "weak_password" || message.includes("Password should be")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (code === "validation_failed" || message.includes("invalid format")) {
    return "Email inválido. Verifique o formato do email.";
  }
  return message || "Ocorreu um erro inesperado. Tente novamente.";
}

function fail(error: { message?: string; code?: string }): never {
  throw new Error(authErrorMessage(error), { cause: error });
}

async function buildUser(user: SupabaseUser): Promise<ExtendedUser> {
  invalidateUserData(user.id);
  const profile = await getUserData(user.id);
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [
    user.app_metadata?.provider ?? "email",
  ];
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: profile?.displayName ?? profile?.username ?? null,
    photoURL: profile?.photoURL ?? null,
    username: profile?.username,
    coverURL: profile?.coverURL ?? undefined,
    description: profile?.description,
    favoriteSeries: profile?.favoriteSeries ?? undefined,
    notificationSettings: profile?.notificationSettings,
    providers,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { closeAllAuth } = useAuthUIStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // As chamadas ao banco ficam fora do callback para não travar o cliente de auth.
      setTimeout(async () => {
        if (session?.user) {
          setCurrentUser(await buildUser(session.user));
          if (event === "SIGNED_IN") closeAllAuth();
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, [closeAllAuth]);

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.toLowerCase(), display_name: username },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) fail(error);
    // Com confirmação de email ativa, o Supabase devolve o usuário sem sessão
    return { needsEmailConfirmation: !data.session };
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) fail(error);
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) fail(error);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) fail(error);
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) fail(error);
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) fail(error);
  }

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data.user ? await buildUser(data.user) : null);
  }, []);

  const value = {
    currentUser,
    signUp,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updatePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
