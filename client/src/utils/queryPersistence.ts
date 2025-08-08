// Query cache persistence using localStorage
const CACHE_KEY = 'react-query-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
  queryKey: string[];
}

interface PersistedCache {
  [key: string]: CacheEntry;
}

class QueryCachePersistence {
  private isClient = typeof window !== 'undefined';

  // Save query to localStorage
  saveQuery(queryKey: string[], data: any): void {
    if (!this.isClient) return;
    
    try {
      const cacheKey = this.generateCacheKey(queryKey);
      const existingCache = this.getPersistedCache();
      
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        queryKey
      };
      
      existingCache[cacheKey] = entry;
      localStorage.setItem(CACHE_KEY, JSON.stringify(existingCache));
      
      console.log(`💾 Persisted query: ${cacheKey}`);
    } catch (error) {
      console.warn('Failed to persist query cache:', error);
    }
  }

  // Get query from localStorage
  getQuery(queryKey: string[]): any | null {
    if (!this.isClient) return null;
    
    try {
      const cacheKey = this.generateCacheKey(queryKey);
      const cache = this.getPersistedCache();
      const entry = cache[cacheKey];
      
      if (!entry) {
        console.log(`❌ No cached data for: ${cacheKey}`);
        return null;
      }
      
      // Check if entry has expired
      const age = Date.now() - entry.timestamp;
      if (age > CACHE_TTL) {
        console.log(`⏰ Cache expired for: ${cacheKey} (${Math.round(age/1000)}s old)`);
        this.removeQuery(queryKey);
        return null;
      }
      
      console.log(`✅ Serving cached data for: ${cacheKey} (${Math.round(age/1000)}s old)`);
      return entry.data;
    } catch (error) {
      console.warn('Failed to get cached query:', error);
      return null;
    }
  }

  // Remove expired or specific query
  removeQuery(queryKey: string[]): void {
    if (!this.isClient) return;
    
    try {
      const cacheKey = this.generateCacheKey(queryKey);
      const cache = this.getPersistedCache();
      delete cache[cacheKey];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to remove cached query:', error);
    }
  }

  // Clear all cache
  clearCache(): void {
    if (!this.isClient) return;
    
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('🗑️ Cleared all persisted cache');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get all persisted cache
  private getPersistedCache(): PersistedCache {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  // Generate cache key from query key array
  private generateCacheKey(queryKey: string[]): string {
    return queryKey.join('|');
  }

  // Clean up expired entries
  cleanupExpired(): void {
    if (!this.isClient) return;
    
    try {
      const cache = this.getPersistedCache();
      const now = Date.now();
      let cleaned = 0;
      
      Object.keys(cache).forEach(key => {
        const entry = cache[key];
        if (now - entry.timestamp > CACHE_TTL) {
          delete cache[key];
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }
}

// Export singleton instance
export const queryPersistence = new QueryCachePersistence();

// Cleanup on app start
if (typeof window !== 'undefined') {
  queryPersistence.cleanupExpired();
}
