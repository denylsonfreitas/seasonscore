import { createContext, useContext, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { 
  createOrUpdateUser, 
  getUserData, 
  getUserByEmail, 
  getUserByUsernameOrEmail,
  UserData
} from "../services/users";
import { ExtendedUser } from "../types/auth";
import { cleanupNotifications } from "../services/notifications";
import { useToast } from "@chakra-ui/react";
import { useAuthUIStore } from "../services/uiState";

interface AuthContextType {
  currentUser: ExtendedUser | null;
  signUp: (email: string, password: string, username: string) => Promise<UserData | null>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  linkWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const toast = useToast();
  const { closeAllAuth } = useAuthUIStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          const extendedUser: ExtendedUser = {
            ...user,
            coverURL: userData?.coverURL || undefined,
            description: userData?.description || undefined,
            username: userData?.username || undefined,
            favoriteSeries: userData?.favoriteSeries || undefined,
          };
          setCurrentUser(extendedUser);
          
          closeAllAuth();
        } catch (error) {
          setCurrentUser(user);
          closeAllAuth();
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [closeAllAuth]);

  async function signUp(email: string, password: string, username: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const existingUser = await getUserByEmail(email);
      
      const displayName = existingUser?.displayName || email.split("@")[0];
      
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      await createOrUpdateUser(result.user, {
        username: username.toLowerCase(),
        displayName: displayName,
        ...(existingUser && {
          description: existingUser.description,
          coverURL: existingUser.coverURL,
          favoriteSeries: existingUser.favoriteSeries,
        }),
      });

      const userData = await getUserData(result.user.uid);
      
      return userData;
    } catch (error: any) {
      
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Email em uso",
          description: "Este email já está em uso. Por favor, faça login ou use outro email.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw new Error("Este email já está em uso. Por favor, faça login ou use outro email.");
      } else if (error.code === 'auth/weak-password') {
        toast({
          title: "Senha fraca",
          description: "A senha deve ter pelo menos 6 caracteres.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw new Error("A senha deve ter pelo menos 6 caracteres.");
      } else if (error.code === 'auth/invalid-email') {
        toast({
          title: "Email inválido",
          description: "Por favor, forneça um endereço de email válido.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        throw new Error("Por favor, forneça um endereço de email válido.");
      }
      
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }

  async function login(usernameOrEmail: string, password: string) {
    try {
      const userData = await getUserByUsernameOrEmail(usernameOrEmail);
      
      if (!userData) {
        throw new Error("Usuário não encontrado. Verifique seu nome de usuário ou email.");
      }
      
      const email = userData.email;
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      await createOrUpdateUser(result.user, {
        username: userData.username,
        displayName: userData.displayName || result.user.displayName || "",
        description: userData.description,
        coverURL: userData.coverURL,
        favoriteSeries: userData.favoriteSeries,
      });
      
      const updatedUserData = await getUserData(result.user.uid);
      const extendedUser: ExtendedUser = {
        ...result.user,
        coverURL: updatedUserData?.coverURL || undefined,
        description: updatedUserData?.description || undefined,
        username: updatedUserData?.username || undefined,
        favoriteSeries: updatedUserData?.favoriteSeries || undefined,
      };
      setCurrentUser(extendedUser);
      
      await cleanupNotifications(result.user.uid);
    } catch (error: any) {
      
      if (error.code === 'auth/wrong-password') {
        throw new Error("Senha incorreta. Tente novamente.");
      } else if (error.code === 'auth/user-not-found' || error.message.includes("Usuário não encontrado")) {
        throw new Error("Usuário não encontrado. Verifique seu nome de usuário ou email.");
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error("Credenciais inválidas. Verifique seu nome de usuário ou email e senha.");
      }
      
      throw error;
    }
  }

  async function logout() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  }

  async function linkWithEmail(email: string, password: string) {
    if (!currentUser) {
      throw new Error("Nenhum usuário autenticado");
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      if (methods.length > 0) {
        throw new Error("Este email já está associado a outra conta");
      }
      
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(currentUser, credential);
      
      toast({
        title: "Email vinculado com sucesso",
        description: "Seu email foi vinculado à sua conta",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      if (error.code === 'auth/provider-already-linked') {
        toast({
          title: "Provedor já vinculado",
          description: "Este método de login já está vinculado à sua conta",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else if (error.code === 'auth/invalid-email') {
        toast({
          title: "Email inválido",
          description: "Por favor, forneça um endereço de email válido",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (error.code === 'auth/weak-password') {
        toast({
          title: "Senha fraca",
          description: "A senha deve ter pelo menos 6 caracteres",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (error.message === "Este email já está associado a outra conta") {
        toast({
          title: "Email já em uso",
          description: "Este email já está associado a outra conta",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Erro ao vincular email",
          description: "Ocorreu um erro ao vincular seu email",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        toast({
          title: "Usuário não encontrado",
          description: "Não há usuário registrado com este email",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else if (error.code === 'auth/invalid-email') {
        toast({
          title: "Email inválido",
          description: "Por favor, forneça um endereço de email válido",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Erro ao enviar email",
          description: "Ocorreu um erro ao enviar o email de redefinição de senha",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      throw error;
    }
  }

  const value = {
    currentUser,
    signUp,
    login,
    logout,
    linkWithEmail,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
