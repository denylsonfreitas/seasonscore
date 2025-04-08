import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { RateLimiter } from 'limiter';

// Configuração do rate limiter (5 requisições por minuto)
const limiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: 'minute'
});

export const authService = {
  async login(email: string, password: string) {
    try {
      // Verificar rate limit
      const remainingTokens = await limiter.removeTokens(1);
      if (remainingTokens < 0) {
        throw new Error('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  },

  onAuthStateChanged(callback: (user: any) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Validação de token
  async validateToken(token: string) {
    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na validação do token:', error);
      throw error;
    }
  }
}; 