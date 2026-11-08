/**
 * Login com Google direto na página (Google Identity Services).
 * O Google entrega um ID token ao app, que o repassa ao Supabase com signInWithIdToken.
 * Assim a tela do Google mostra o domínio do site, e não o do Supabase.
 */

export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce?: string;
    ux_mode?: "popup" | "redirect";
    use_fedcm_for_button?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
      locale?: string;
    }
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_URL = "https://accounts.google.com/gsi/client";
let scriptPromise: Promise<GoogleAccountsId> | null = null;

/** Carrega o script do Google uma única vez. */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () =>
        window.google?.accounts?.id
          ? resolve(window.google.accounts.id)
          : reject(new Error("Google Identity Services indisponível"));
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Não foi possível carregar o login do Google"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Gera o par de nonce: o valor original vai para o Supabase e o hash SHA-256
 * (em hexadecimal) vai para o Google, que o inclui no ID token.
 */
export async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}
