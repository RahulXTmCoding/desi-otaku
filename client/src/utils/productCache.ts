// Simple in-memory cache for products that persists across navigations
interface CachedProduct {
  data: any;
  timestamp: number;
  expires: number;
}

class ProductCache {
  private cache = new Map<string, CachedProduct>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(productId: string, data: any): void {
    const now = Date.now();
    this.cache.set(productId, {
      data,
      timestamp: now,
      expires: now + this.TTL
    });
    if (import.meta.env.DEV) {
    }
  }

  get(productId: string): any | null {
    const cached = this.cache.get(productId);
    if (!cached) {
      if (import.meta.env.DEV) {
      }
      return null;
    }

    const now = Date.now();
    if (now > cached.expires) {
      if (import.meta.env.DEV) {
      }
      this.cache.delete(productId);
      return null;
    }

    const age = (now - cached.timestamp) / 1000;
    if (import.meta.env.DEV) {
    }
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
    if (import.meta.env.DEV) {
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const productCache = new ProductCache();
