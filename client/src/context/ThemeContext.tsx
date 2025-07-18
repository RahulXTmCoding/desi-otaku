import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName = 'dark' | 'light' | 'midnight' | 'cyberpunk' | 'sakura';

interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    // Base colors
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderHover: string;
    
    // Text colors
    text: string;
    textMuted: string;
    textInverse: string;
    
    // Brand colors
    primary: string;
    primaryHover: string;
    primaryText: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Special effects
    gradient: string;
    shadow: string;
  };
}

const themes: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    displayName: 'Dark',
    colors: {
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      text: '#f9fafb', // gray-50
      textMuted: '#9ca3af', // gray-400
      textInverse: '#111827', // gray-900
      primary: '#991B1B', // red-800 (maroon)
      primaryHover: '#7F1D1D', // red-900 (darker maroon)
      primaryText: '#ffffff', // white for better contrast
      success: '#10b981', // green-500
      warning: '#991B1B', // red-800 (maroon)
      error: '#ef4444', // red-500
      info: '#3b82f6', // blue-500
      gradient: 'from-red-800 to-red-900',
      shadow: 'rgba(153, 27, 27, 0.1)', // red-800 with opacity
    }
  },
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      background: '#f3f4f6', // gray-100 (darker than pure white)
      surface: '#e5e7eb', // gray-200 (more visible surface)
      surfaceHover: '#d1d5db', // gray-300
      border: '#9ca3af', // gray-400 (more visible borders)
      borderHover: '#6b7280', // gray-500
      text: '#111827', // gray-900
      textMuted: '#4b5563', // gray-600 (darker muted text)
      textInverse: '#ffffff',
      primary: '#991B1B', // red-800 (maroon)
      primaryHover: '#7F1D1D', // red-900 (darker maroon)
      primaryText: '#ffffff',
      success: '#059669', // green-600 (darker green)
      warning: '#991B1B', // red-800 (maroon)
      error: '#dc2626', // red-600 (darker red)
      info: '#2563eb', // blue-600 (darker blue)
      gradient: 'from-red-800 to-red-900',
      shadow: 'rgba(153, 27, 27, 0.15)', // red-800 with more opacity
    }
  },
  midnight: {
    name: 'midnight',
    displayName: 'Midnight Blue',
    colors: {
      background: '#0f172a', // slate-900
      surface: '#1e293b', // slate-800
      surfaceHover: '#334155', // slate-700
      border: '#334155', // slate-700
      borderHover: '#475569', // slate-600
      text: '#f1f5f9', // slate-100
      textMuted: '#94a3b8', // slate-400
      textInverse: '#0f172a', // slate-900
      primary: '#38bdf8', // sky-400
      primaryHover: '#0ea5e9', // sky-500
      primaryText: '#0f172a', // slate-900
      success: '#34d399', // emerald-400
      warning: '#991B1B', // red-800 (maroon)
      error: '#f87171', // red-400
      info: '#60a5fa', // blue-400
      gradient: 'from-sky-400 to-blue-500',
      shadow: 'rgba(56, 189, 248, 0.1)', // sky-400 with opacity
    }
  },
  cyberpunk: {
    name: 'cyberpunk',
    displayName: 'Cyberpunk',
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceHover: '#2a2a2a',
      border: '#333333',
      borderHover: '#444444',
      text: '#ffffff',
      textMuted: '#888888',
      textInverse: '#000000',
      primary: '#00ff88', // neon green
      primaryHover: '#00cc66',
      primaryText: '#000000',
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff0066',
      info: '#00ffff',
      gradient: 'from-green-400 via-cyan-400 to-blue-500',
      shadow: 'rgba(0, 255, 136, 0.2)', // neon green with opacity
    }
  },
  sakura: {
    name: 'sakura',
    displayName: 'Sakura',
    colors: {
      background: '#fdf2f8', // pink-50
      surface: '#fce7f3', // pink-100
      surfaceHover: '#fbcfe8', // pink-200
      border: '#f9a8d4', // pink-300
      borderHover: '#f472b6', // pink-400
      text: '#500724', // pink-950
      textMuted: '#9f1239', // pink-800
      textInverse: '#ffffff',
      primary: '#ec4899', // pink-500
      primaryHover: '#db2777', // pink-600
      primaryText: '#ffffff',
      success: '#84cc16', // lime-500
      warning: '#991B1B', // red-800 (maroon)
      error: '#dc2626', // red-600
      info: '#8b5cf6', // violet-500
      gradient: 'from-pink-400 via-purple-400 to-indigo-400',
      shadow: 'rgba(236, 72, 153, 0.1)', // pink-500 with opacity
    }
  }
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Get saved theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    return savedTheme && themes[savedTheme] ? savedTheme : 'dark';
  });

  const theme = themes[themeName];

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('theme', themeName);
    
    // Apply theme to document root
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Add theme class to body for additional styling
    document.body.className = `theme-${themeName}`;
    
    // Apply theme color overrides dynamically
    import('../utils/themeColors').then(({ applyThemeColors }) => {
      applyThemeColors();
    });
  }, [themeName, theme]);

  const setTheme = (newThemeName: ThemeName) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
    }
  };

  const availableThemes = Object.values(themes);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};
