import { createClient, type User } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local");
}

export const supabase = createClient<Database>(supabaseUrl ?? "", supabaseKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Usuário da sessão atual, mantido em memória para acesso síncrono nos serviços.
let sessionUser: User | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  sessionUser = session?.user ?? null;
});

/** Usuário autenticado no momento (ou null). */
export function getSessionUser(): User | null {
  return sessionUser;
}

/** ID do usuário autenticado; lança erro se ninguém estiver logado. */
export function requireUserId(): string {
  if (!sessionUser) throw new Error("Usuário não autenticado");
  return sessionUser.id;
}

/** Lança o erro retornado pelo Supabase, se houver, e devolve os dados. */
export function unwrap<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw result.error;
  return result.data as NonNullable<T>;
}
