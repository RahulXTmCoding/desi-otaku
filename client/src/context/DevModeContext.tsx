import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextType {
  isTestMode: boolean;
  toggleTestMode: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  isTestMode: true,
  toggleTestMode: () => {},
});

export const useDevMode = () => useContext(DevModeContext);

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('devTestMode');
    return saved !== null ? saved === 'true' : true; // Default to test mode
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem('devTestMode', isTestMode.toString());
  }, [isTestMode]);

  const toggleTestMode = () => {
    setIsTestMode(prev => !prev);
  };

  return (
    <DevModeContext.Provider value={{ isTestMode, toggleTestMode }}>
      {children}
    </DevModeContext.Provider>
  );
};
