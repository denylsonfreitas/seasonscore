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
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { 
  createOrUpdateUser, 
  getUserData, 
  getUserByEmail, 
  getUserByUsernameOrEmail
} from "../services/users";
import { ExtendedUser } from "../types/auth";
import { cleanupNotifications } from "../services/notifications";
import { useToast } from "@chakra-ui/react";

interface AuthContextType {
  currentUser: ExtendedUser | null;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  linkWithEmail: (email: string, password: string) => Promise<void>;
  linkWithGoogle: () => Promise<void>;
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
    try {
      // Tentar criar a conta diretamente
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Se chegou aqui, a conta foi criada com sucesso
      // Verificar se já existe um usuário com este email no Firestore
      const existingUser = await getUserByEmail(email);
      
      // Definir o displayName
      const displayName = existingUser?.displayName || email.split("@")[0];
      
      // Atualizar o perfil do Firebase Auth
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      // Atualizar dados do usuário
      await createOrUpdateUser(result.user, {
        username: username.toLowerCase(),
        displayName: displayName,
        ...(existingUser && {
          description: existingUser.description,
          coverURL: existingUser.coverURL,
          favoriteSeries: existingUser.favoriteSeries,
        }),
      });

      // Buscar dados atualizados
      const userData = await getUserData(result.user.uid);
      const extendedUser: ExtendedUser = {
        ...result.user,
        coverURL: userData?.coverURL,
        description: userData?.description,
        username: userData?.username,
        favoriteSeries: userData?.favoriteSeries,
      };
      setCurrentUser(extendedUser);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      
      // Tratar erros específicos
      if (error.code === 'auth/email-already-in-use') {
        // Verificar se a conta existente é do Google
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);
          if (signInMethods.includes(GoogleAuthProvider.PROVIDER_ID)) {
            toast({
              title: "Conta Google existente",
              description: "Este email já está associado a uma conta Google. Por favor, faça login com o Google.",
              status: "info",
              duration: 5000,
              isClosable: true,
            });
            throw new Error("Este email já está associado a uma conta Google. Por favor, faça login com o Google.");
          } else {
            toast({
              title: "Email em uso",
              description: "Este email já está em uso. Por favor, faça login ou use outro email.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            throw new Error("Este email já está em uso. Por favor, faça login ou use outro email.");
          }
        } catch (methodError) {
          toast({
            title: "Email em uso",
            description: "Este email já está em uso. Por favor, faça login ou use outro email.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          throw new Error("Este email já está em uso. Por favor, faça login ou use outro email.");
        }
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
      
      // Para outros erros, mostrar mensagem genérica
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
      // Verificar se o input é um username ou email
      const userData = await getUserByUsernameOrEmail(usernameOrEmail);
      
      if (!userData) {
        throw new Error("Usuário não encontrado. Verifique seu nome de usuário ou email.");
      }
      
      // Usar o email associado à conta para fazer login
      const email = userData.email;
      
      // Tentar login com email/senha
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Atualizar dados do usuário preservando informações importantes
      await createOrUpdateUser(result.user, {
        username: userData.username,
        displayName: userData.displayName || result.user.displayName || "",
        description: userData.description,
        coverURL: userData.coverURL,
        favoriteSeries: userData.favoriteSeries,
      });
      
      // Buscar dados atualizados
      const updatedUserData = await getUserData(result.user.uid);
      const extendedUser: ExtendedUser = {
        ...result.user,
        coverURL: updatedUserData?.coverURL,
        description: updatedUserData?.description,
        username: updatedUserData?.username,
        favoriteSeries: updatedUserData?.favoriteSeries,
      };
      setCurrentUser(extendedUser);
      
      // Limpar notificações duplicadas
      await cleanupNotifications(result.user.uid);
    } catch (error: any) {
      console.error("Erro no login:", error);
      
      if (error.code === 'auth/wrong-password') {
        // Verificar se existe conta Google vinculada
        try {
          // Obter o email para verificação do Google
          const userData = await getUserByUsernameOrEmail(usernameOrEmail);
          if (!userData || !userData.email) {
            throw new Error("Usuário não encontrado. Verifique seu nome de usuário ou email.");
          }
          
          const signInMethods = await fetchSignInMethodsForEmail(auth, userData.email);
          if (signInMethods.includes(GoogleAuthProvider.PROVIDER_ID)) {
            toast({
              title: "Conta vinculada ao Google",
              description: "Esta conta está vinculada ao Google. Você pode entrar com o Google ou redefinir sua senha.",
              status: "info",
              duration: 8000,
              isClosable: true,
            });
            throw new Error("Esta conta está vinculada ao Google. Você pode entrar com o Google ou redefinir sua senha.");
          }
        } catch (methodError: any) {
          // Se não conseguir verificar, mostrar mensagem padrão de senha incorreta
          if (methodError.message.includes("Usuário não encontrado")) {
            throw methodError;
          } else {
            throw new Error("Senha incorreta. Tente novamente.");
          }
        }
        throw new Error("Senha incorreta. Tente novamente.");
      } else if (error.code === 'auth/user-not-found' || error.message.includes("Usuário não encontrado")) {
        // Se o erro é personalizado por nossa lógica ou do Firebase
        throw new Error("Usuário não encontrado. Verifique seu nome de usuário ou email.");
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error("Credenciais inválidas. Verifique seu nome de usuário ou email e senha.");
      }
      
      // Para outros erros, repassar
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account"
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Verificar se já existe um usuário com este email
      const existingUser = await getUserByEmail(result.user.email!);
      
      if (existingUser) {
        
        // Atualizar dados do usuário preservando informações importantes
        const displayName = existingUser.displayName || "";
        
        // Atualizar o perfil do Firebase Auth preservando a foto existente
        if (result.user) {
          await updateProfile(result.user, {
            displayName: displayName,
            photoURL: existingUser.photoURL ?? result.user.photoURL ?? undefined
          });
        }
        
        // Atualizar dados no Firestore preservando a foto
        await createOrUpdateUser(result.user, {
          username: existingUser.username,
          displayName: displayName,
          description: existingUser.description,
          coverURL: existingUser.coverURL,
          favoriteSeries: existingUser.favoriteSeries,
          photoURL: existingUser.photoURL ?? result.user.photoURL ?? undefined
        });
      } else {
        // Criar novo usuário
        const displayName = result.user.displayName || "";
        await createOrUpdateUser(result.user, {
          username: result.user.email!.split("@")[0].toLowerCase(),
          displayName: displayName,
        });
      }
      
      // Buscar dados atualizados
      const userData = await getUserData(result.user.uid);
      const extendedUser: ExtendedUser = {
        ...result.user,
        coverURL: userData?.coverURL,
        description: userData?.description,
        username: userData?.username,
        favoriteSeries: userData?.favoriteSeries,
      };
      setCurrentUser(extendedUser);
      
      // Se não existia usuário antes, mostrar mensagem para definir senha
      if (!existingUser) {
        toast({
          title: "Conta criada com sucesso",
          description: "Você pode definir uma senha nas configurações para acessar sua conta com email e senha também.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("O popup de login foi fechado. Tente novamente quando quiser.");
      }
      
      throw error;
    }
  }

  async function linkWithEmail(email: string, password: string) {
    if (!currentUser) {
      throw new Error("Nenhum usuário logado");
    }

    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(currentUser, credential);
      await createOrUpdateUser(currentUser);
    } catch (error) {
      console.error("Erro ao vincular conta:", error);
      throw error;
    }
  }

  async function linkWithGoogle() {
    if (!currentUser) {
      throw new Error("Nenhum usuário logado");
    }

    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(currentUser, provider);
      await createOrUpdateUser(currentUser);
    } catch (error) {
      console.error("Erro ao vincular conta com Google:", error);
      throw error;
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

  const value = {
    currentUser,
    signUp,
    login,
    logout,
    loginWithGoogle,
    linkWithEmail,
    linkWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
