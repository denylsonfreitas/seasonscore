import { createContext, useContext, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { createOrUpdateUser, getUserData } from "../services/users";
import { ExtendedUser } from "../types/auth";
import { cleanupNotifications } from "../services/notifications";

interface AuthContextType {
  currentUser: ExtendedUser | null;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          const extendedUser: ExtendedUser = {
            ...user,
            coverURL: userData?.coverURL,
            description: userData?.description,
            username: userData?.username,
            favoriteSeries: userData?.favoriteSeries,
          };
          setCurrentUser(extendedUser);
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signUp(email: string, password: string, username: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = email.split("@")[0];
    
    await updateProfile(result.user, {
      displayName,
    });

    await createOrUpdateUser(result.user, {
      username: username.toLowerCase(),
      displayName,
    });

    // Buscar dados atualizados do usuário
    const userData = await getUserData(result.user.uid);
    const extendedUser: ExtendedUser = {
      ...result.user,
      coverURL: userData?.coverURL,
      description: userData?.description,
      username: userData?.username,
      favoriteSeries: userData?.favoriteSeries,
    };
    setCurrentUser(extendedUser);
  }

  async function login(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(result.user.uid);
    const extendedUser: ExtendedUser = {
      ...result.user,
      coverURL: userData?.coverURL,
      description: userData?.description,
      username: userData?.username,
      favoriteSeries: userData?.favoriteSeries,
    };
    setCurrentUser(extendedUser);
    await createOrUpdateUser(result.user);
    
    // Limpar notificações duplicadas
    try {
      // Apenas limpar notificações do usuário atual
      if (result.user.uid === auth.currentUser?.uid) {
        await cleanupNotifications(result.user.uid);
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
    }
  }

  async function logout() {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Erro no logout:", error);
      throw error;
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(result.user.uid);
    const extendedUser: ExtendedUser = {
      ...result.user,
      coverURL: userData?.coverURL,
      description: userData?.description,
      username: userData?.username,
      favoriteSeries: userData?.favoriteSeries,
    };
    setCurrentUser(extendedUser);
    await createOrUpdateUser(result.user);
    
    // Limpar notificações duplicadas
    try {
      // Apenas limpar notificações do usuário atual
      if (result.user.uid === auth.currentUser?.uid) {
        await cleanupNotifications(result.user.uid);
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    signUp,
    login,
    logout,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
