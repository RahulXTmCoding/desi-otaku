import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API } from '../backend';

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
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API}/aov/quantity-discounts`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quantity tiers: ${response.statusText}`);
      }
      
      const data = await response.json();
      setQuantityTiers(data.tiers || []);
      
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
