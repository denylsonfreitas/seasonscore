/**
 * Serviço centralizado de cache para armazenar dados temporários entre componentes
 * Substitui a duplicação de lógica de cache em vários hooks
 */

/** Interface genérica para itens de cache */
export interface CacheItem<T> {
  /** Os dados armazenados */
  data: T;
  /** Timestamp de quando os dados foram armazenados */
  timestamp: number;
}

/** Configuração padrão de cache */
export const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos em ms

/** Classe que gerencia o cache global */
class CacheService {
  /** Armazenamento de cache */
  private cache: Record<string, CacheItem<any>> = {};
  
  /**
   * Obtém um item do cache se existir e não estiver expirado
   * @param key Chave do item
   * @param expiryTime Tempo para expiração em ms (padrão: 5 minutos)
   */
  get<T>(key: string, expiryTime = DEFAULT_CACHE_EXPIRY): T | null {
    const item = this.cache[key];
    
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > expiryTime) {
      // Item expirado
      delete this.cache[key];
      return null;
    }
    
    return item.data;
  }
  
  /**
   * Armazena um item no cache
   * @param key Chave do item
   * @param data Dados a serem armazenados
   */
  set<T>(key: string, data: T): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Verifica se um item no cache é válido (existe e não está expirado)
   * @param key Chave do item
   * @param expiryTime Tempo para expiração em ms (padrão: 5 minutos)
   */
  isValid(key: string, expiryTime = DEFAULT_CACHE_EXPIRY): boolean {
    const item = this.cache[key];
    if (!item) return false;
    
    const now = Date.now();
    return (now - item.timestamp) < expiryTime;
  }
  
  /**
   * Remove um item do cache
   * @param key Chave do item
   */
  remove(key: string): void {
    delete this.cache[key];
  }
  
  /**
   * Limpa todo o cache ou itens com um prefixo específico
   * @param prefix Prefixo opcional para limpar apenas itens com este prefixo
   */
  clear(prefix?: string): void {
    if (!prefix) {
      this.cache = {};
      return;
    }
    
    // Limpar apenas itens que começam com o prefixo
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete this.cache[key];
      }
    });
  }
  
  /**
   * Atualiza a timestamp de um item de cache para renovar sua validade
   * @param key Chave do item
   */
  refreshTimestamp(key: string): void {
    const item = this.cache[key];
    if (item) {
      item.timestamp = Date.now();
    }
  }
}

// Exportar uma instância singleton para ser usada em toda a aplicação
export const cacheService = new CacheService();

// Utilitários de atalho para prefixos comuns
export const userCache = {
  /**
   * Obtém um usuário do cache
   * @param userId ID do usuário
   */
  getUser: <T>(userId: string) => cacheService.get<T>(`user:${userId}`),
  
  /**
   * Armazena um usuário no cache
   * @param userId ID do usuário
   * @param data Dados do usuário
   */
  setUser: <T>(userId: string, data: T) => cacheService.set(`user:${userId}`, data),
  
  /**
   * Verifica se um usuário está no cache e é válido
   * @param userId ID do usuário
   */
  isUserValid: (userId: string) => cacheService.isValid(`user:${userId}`),
  
  /**
   * Limpa o cache de usuários
   */
  clearUsers: () => cacheService.clear('user:'),
};

export default cacheService; 