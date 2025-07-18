import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette } from 'lucide-react';

const ThemeSwitcher: React.FC = () => {
  const { theme, themeName, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeIcons = {
    dark: '🌙',
    light: '☀️',
    midnight: '🌌',
    cyberpunk: '🤖',
    sakura: '🌸'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
          e.currentTarget.style.borderColor = theme.colors.borderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.surface;
          e.currentTarget.style.borderColor = theme.colors.border;
        }}
        aria-label="Theme switcher"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50"
            style={{
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <div className="p-2">
              <p className="text-xs font-semibold mb-2 px-2" style={{ color: theme.colors.textMuted }}>
                Choose Theme
              </p>
              {availableThemes.map((availableTheme) => (
                <button
                  key={availableTheme.name}
                  onClick={() => {
                    setTheme(availableTheme.name);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-3"
                  style={{
                    backgroundColor: themeName === availableTheme.name ? theme.colors.primary : 'transparent',
                    color: themeName === availableTheme.name ? theme.colors.primaryText : theme.colors.text
                  }}
                  onMouseEnter={(e) => {
                    if (themeName !== availableTheme.name) {
                      e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (themeName !== availableTheme.name) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span className="text-lg">{themeIcons[availableTheme.name as keyof typeof themeIcons]}</span>
                  <span className="text-sm font-medium">{availableTheme.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
