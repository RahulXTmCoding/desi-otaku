import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API } from '../backend';

// ─── localStorage cache helpers (30-minute TTL) ─────────────────────────────
const AOV_CACHE_KEY = 'aov_quantity_tiers_cache';
const AOV_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedTiers {
  data: QuantityTier[];
  timestamp: number;
}

const getCachedTiers = (): QuantityTier[] | null => {
  try {
    const raw = localStorage.getItem(AOV_CACHE_KEY);
    if (!raw) return null;
    const cached: CachedTiers = JSON.parse(raw);
    if (Date.now() - cached.timestamp > AOV_CACHE_TTL) {
      localStorage.removeItem(AOV_CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
};

const setCachedTiers = (tiers: QuantityTier[]): void => {
  try {
    const payload: CachedTiers = { data: tiers, timestamp: Date.now() };
    localStorage.setItem(AOV_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors silently
  }
};

interface QuantityTier {
  minQuantity: number;
  discount: number;
  description?: string;
}

interface AOVContextType {
  quantityTiers: QuantityTier[];
  isLoading: boolean;
  error: string | null;
  refetchTiers: () => void;
}

const AOVContext = createContext<AOVContextType | undefined>(undefined);

export const useAOV = () => {
  const context = useContext(AOVContext);
  if (context === undefined) {
    throw new Error('useAOV must be used within an AOVProvider');
  }
  return context;
};

interface AOVProviderProps {
  children: ReactNode;
}

export const AOVProvider: React.FC<AOVProviderProps> = ({ children }) => {
  const [quantityTiers, setQuantityTiers] = useState<QuantityTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuantityTiers = async () => {
    // Serve from cache if still fresh
    const cached = getCachedTiers();
    if (cached) {
      setQuantityTiers(cached);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API}/aov/quantity-discounts`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quantity tiers: ${response.statusText}`);
      }
      
      const data = await response.json();
      const tiers = data.tiers || [];
      setQuantityTiers(tiers);
      setCachedTiers(tiers); // persist for 30 minutes
      
    } catch (error) {
      console.error('❌ Failed to fetch AOV quantity tiers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load quantity tiers');
      setQuantityTiers([]); // Set empty array as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const refetchTiers = () => {
    fetchQuantityTiers();
  };

  // Fetch on mount
  useEffect(() => {
    fetchQuantityTiers();
  }, []);

  const value: AOVContextType = {
    quantityTiers,
    isLoading,
    error,
    refetchTiers
  };

  return (
    <AOVContext.Provider value={value}>
      {children}
    </AOVContext.Provider>
  );
};

export default AOVProvider;
