import { initializeApp } from "firebase/app";
import { getAuth, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Remove a configuração de cookies que pode estar causando problemas
};

const app = initializeApp(firebaseConfig);

// Configuração correta da persistência usando constantes do Firebase
const auth = getAuth(app);
// Configurar persistência de sessão para mitigar problemas com cookies de terceiros
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Erro ao configurar persistência:", error);
});

export { auth };
export const db = getFirestore(app);

