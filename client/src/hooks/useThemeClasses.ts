import { useTheme } from '../context/ThemeContext';

export const useThemeClasses = () => {
  const { themeName } = useTheme();

  const getBackgroundClass = () => {
    switch (themeName) {
      case 'light':
        return 'bg-white';
      case 'midnight':
        return 'bg-slate-900';
      case 'cyberpunk':
        return 'bg-black';
      case 'sakura':
        return 'bg-pink-50';
      default:
        return 'bg-gray-900';
    }
  };

  const getSurfaceClass = () => {
    switch (themeName) {
      case 'light':
        return 'bg-gray-50';
      case 'midnight':
        return 'bg-slate-800';
      case 'cyberpunk':
        return 'bg-gray-900';
      case 'sakura':
        return 'bg-pink-100';
      default:
        return 'bg-gray-800';
    }
  };

  const getBorderClass = () => {
    switch (themeName) {
      case 'light':
        return 'border-gray-200';
      case 'midnight':
        return 'border-slate-700';
      case 'cyberpunk':
        return 'border-gray-800';
      case 'sakura':
        return 'border-pink-300';
      default:
        return 'border-gray-700';
    }
  };

  const getTextClass = () => {
    switch (themeName) {
      case 'light':
        return 'text-gray-900';
      case 'midnight':
        return 'text-slate-100';
      case 'cyberpunk':
        return 'text-white';
      case 'sakura':
        return 'text-pink-950';
      default:
        return 'text-gray-50';
    }
  };

  const getTextMutedClass = () => {
    switch (themeName) {
      case 'light':
        return 'text-gray-500';
      case 'midnight':
        return 'text-slate-400';
      case 'cyberpunk':
        return 'text-gray-400';
      case 'sakura':
        return 'text-pink-800';
      default:
        return 'text-gray-400';
    }
  };

  const getPrimaryClass = () => {
    switch (themeName) {
      case 'light':
        return 'bg-yellow-500 text-white';
      case 'midnight':
        return 'bg-sky-400 text-slate-900';
      case 'cyberpunk':
        return 'bg-green-400 text-black';
      case 'sakura':
        return 'bg-pink-500 text-white';
      default:
        return 'bg-yellow-400 text-gray-900';
    }
  };

  const getPrimaryHoverClass = () => {
    switch (themeName) {
      case 'light':
        return 'hover:bg-yellow-600';
      case 'midnight':
        return 'hover:bg-sky-500';
      case 'cyberpunk':
        return 'hover:bg-green-500';
      case 'sakura':
        return 'hover:bg-pink-600';
      default:
        return 'hover:bg-yellow-500';
    }
  };

  const getGradientClass = () => {
    switch (themeName) {
      case 'light':
        return 'from-yellow-500 to-yellow-600';
      case 'midnight':
        return 'from-sky-400 to-blue-500';
      case 'cyberpunk':
        return 'from-green-400 via-cyan-400 to-blue-500';
      case 'sakura':
        return 'from-pink-400 via-purple-400 to-indigo-400';
      default:
        return 'from-yellow-400 to-yellow-500';
    }
  };

  return {
    background: getBackgroundClass(),
    surface: getSurfaceClass(),
    border: getBorderClass(),
    text: getTextClass(),
    textMuted: getTextMutedClass(),
    primary: getPrimaryClass(),
    primaryHover: getPrimaryHoverClass(),
    gradient: getGradientClass(),
  };
};
