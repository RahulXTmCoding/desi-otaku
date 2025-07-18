import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeDebug: React.FC = () => {
  const { theme, themeName } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50" 
         style={{ 
           backgroundColor: theme.colors.surface,
           border: `2px solid ${theme.colors.border}`,
           color: theme.colors.text
         }}>
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <p className="text-sm">Current: {themeName}</p>
      <p className="text-sm">BG: {theme.colors.background}</p>
      <div className="mt-2 w-full h-4 rounded" 
           style={{ backgroundColor: theme.colors.primary }}></div>
    </div>
  );
};

export default ThemeDebug;
