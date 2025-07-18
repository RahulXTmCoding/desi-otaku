// This utility ensures theme colors are applied globally
export const applyThemeColors = () => {
  // Create or update a style element for theme overrides
  let styleEl = document.getElementById('theme-overrides');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'theme-overrides';
    document.head.appendChild(styleEl);
  }

  // Apply comprehensive overrides for common Tailwind classes
  styleEl.textContent = `
    /* Background overrides */
    .bg-gray-900, .dark\\:bg-gray-900 { background-color: var(--color-background) !important; }
    .bg-gray-800, .dark\\:bg-gray-800 { background-color: var(--color-surface) !important; }
    .bg-gray-700, .dark\\:bg-gray-700 { background-color: var(--color-surfaceHover) !important; }
    .bg-black { background-color: var(--color-background) !important; }
    
    /* Text color overrides */
    .text-white, .dark\\:text-white { color: var(--color-text) !important; }
    .text-gray-50 { color: var(--color-text) !important; }
    .text-gray-100 { color: var(--color-text) !important; }
    .text-gray-300 { color: var(--color-textMuted) !important; }
    .text-gray-400 { color: var(--color-textMuted) !important; }
    .text-gray-500 { color: var(--color-textMuted) !important; }
    
    /* Border overrides */
    .border-gray-700, .dark\\:border-gray-700 { border-color: var(--color-border) !important; }
    .border-gray-800, .dark\\:border-gray-800 { border-color: var(--color-border) !important; }
    .border-gray-600 { border-color: var(--color-border) !important; }
    
    /* Primary color overrides */
    .bg-yellow-400 { background-color: var(--color-primary) !important; }
    .bg-yellow-500 { background-color: var(--color-primaryHover) !important; }
    .text-yellow-400 { color: var(--color-primary) !important; }
    .text-yellow-500 { color: var(--color-primaryHover) !important; }
    .border-yellow-400 { border-color: var(--color-primary) !important; }
    
    /* Hover states */
    .hover\\:bg-gray-700:hover { background-color: var(--color-surfaceHover) !important; }
    .hover\\:bg-gray-800:hover { background-color: var(--color-surface) !important; }
    .hover\\:bg-gray-600:hover { background-color: var(--color-surfaceHover) !important; }
    
    /* Gradient overrides */
    .from-yellow-400 { --tw-gradient-from: var(--color-primary) !important; }
    .to-yellow-500 { --tw-gradient-to: var(--color-primaryHover) !important; }
    
    /* Special sections */
    .bg-gradient-to-br.from-purple-900\\/20 { background: transparent !important; }
    .bg-gradient-to-r.from-gray-900 { background: var(--color-surface) !important; }
    .bg-gray-800\\/30 { background-color: var(--color-surface) !important; opacity: 0.3; }
    .bg-gray-800\\/50 { background-color: var(--color-surface) !important; opacity: 0.5; }
  `;
};
