// Utility functions for generating consistent random colors

/**
 * Generate a consistent random light color based on a string seed (like product ID)
 * Returns a light/pastel color that works well with dark themes
 */
export const generateLightColorFromSeed = (seed: string): string => {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value to ensure positive number
  const positiveHash = Math.abs(hash);
  
  // Generate light pastel colors with good contrast on dark backgrounds
  const lightColors = [
    'rgb(254, 240, 138)', // light yellow
    'rgb(196, 181, 253)', // light purple  
    'rgb(167, 243, 208)', // light green
    'rgb(147, 197, 253)', // light blue
    'rgb(252, 165, 165)', // light red/pink
    'rgb(251, 207, 232)', // light pink
    'rgb(196, 223, 252)', // light sky blue
    'rgb(254, 215, 170)', // light orange
    'rgb(209, 250, 229)', // light mint
    'rgb(233, 213, 255)', // light lavender
    'rgb(254, 202, 202)', // light coral
    'rgb(191, 219, 254)', // light periwinkle
    'rgb(220, 252, 231)', // light seafoam
    'rgb(253, 230, 138)', // light amber
    'rgb(207, 250, 254)', // light cyan
    'rgb(245, 208, 254)', // light magenta
    'rgb(254, 235, 200)', // light peach
    'rgb(186, 230, 253)', // light powder blue
    'rgb(240, 253, 244)', // light emerald
    'rgb(255, 228, 230)', // light rose
  ];
  
  // Select color based on hash
  const colorIndex = positiveHash % lightColors.length;
  return lightColors[colorIndex];
};

/**
 * Generate a consistent random light color with slight transparency
 * Good for subtle backgrounds
 */
export const generateLightColorWithOpacity = (seed: string, opacity: number = 0.3): string => {
  const baseColor = generateLightColorFromSeed(seed);
  // Convert rgb to rgba with opacity
  return baseColor.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
};

/**
 * Generate multiple color variants for a product
 * Useful for gradients or complementary colors
 */
export const generateColorPalette = (seed: string): {
  primary: string;
  secondary: string;
  accent: string;
} => {
  const primary = generateLightColorFromSeed(seed);
  const secondary = generateLightColorFromSeed(seed + '_secondary');
  const accent = generateLightColorFromSeed(seed + '_accent');
  
  return { primary, secondary, accent };
};

/**
 * Convert color codes to user-friendly color names
 * Maps hex codes and common color values to readable names
 */
export const getColorName = (colorCode: string): string => {
  if (!colorCode) return 'Unknown';
  
  // Normalize the color code (convert to lowercase, remove spaces)
  const normalizedColor = colorCode.toLowerCase().trim();
  
  // Color mapping for common t-shirt colors
  const colorMap: Record<string, string> = {
    '#ffffff': 'White',
    '#000000': 'Black',
    '#1e3a8a': 'Navy Blue',
    '#dc2626': 'Red',
    '#6b7280': 'Gray',
    '#059669': 'Green',
    '#f59e0b': 'Yellow',
    '#7c3aed': 'Purple',
    '#ef4444': 'Bright Red',
    '#10b981': 'Emerald',
    '#3b82f6': 'Blue',
    '#f97316': 'Orange',
    '#ec4899': 'Pink',
    '#8b5cf6': 'Violet',
    '#06b6d4': 'Cyan',
    '#84cc16': 'Lime',
    '#6366f1': 'Indigo',
    '#14b8a6': 'Teal',
    '#a855f7': 'Light Purple',
    '#d946ef': 'Fuchsia',
    '#f43f5e': 'Rose',
    '#22c55e': 'Light Green',
    '#facc15': 'Golden Yellow',
    '#94a3b8': 'Slate Gray',
    '#64748b': 'Dark Gray',
    '#374151': 'Charcoal',
    '#1f2937': 'Dark Charcoal',
    '#111827': 'Almost Black',
    '#f8fafc': 'Off White',
    '#f1f5f9': 'Light Gray',
    
    // RGB format colors
    'rgb(255, 255, 255)': 'White',
    'rgb(0, 0, 0)': 'Black',
    'rgb(30, 58, 138)': 'Navy Blue',
    'rgb(220, 38, 38)': 'Red',
    'rgb(107, 114, 128)': 'Gray',
    'rgb(5, 150, 105)': 'Green',
    'rgb(245, 158, 11)': 'Yellow',
    'rgb(124, 58, 237)': 'Purple',
    
    // Common CSS color names
    'white': 'White',
    'black': 'Black',
    'red': 'Red',
    'green': 'Green',
    'blue': 'Blue',
    'yellow': 'Yellow',
    'purple': 'Purple',
    'orange': 'Orange',
    'pink': 'Pink',
    'gray': 'Gray',
    'grey': 'Gray',
    'navy': 'Navy Blue',
    'cyan': 'Cyan',
    'magenta': 'Magenta',
    'lime': 'Lime',
    'maroon': 'Maroon',
    'olive': 'Olive',
    'silver': 'Silver',
    'teal': 'Teal',
    'aqua': 'Aqua',
    'fuchsia': 'Fuchsia',
  };
  
  // Direct match
  if (colorMap[normalizedColor]) {
    return colorMap[normalizedColor];
  }
  
  // If it's a hex color, try to match by converting to basic colors
  if (normalizedColor.startsWith('#') && normalizedColor.length === 7) {
    const hex = normalizedColor.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Define color ranges for basic color detection
    if (r > 240 && g > 240 && b > 240) return 'White';
    if (r < 20 && g < 20 && b < 20) return 'Black';
    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (r < 100 && g > 200 && b < 100) return 'Green';
    if (r < 100 && g < 100 && b > 200) return 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 150 && g < 100 && b > 150) return 'Purple';
    if (r > 200 && g > 100 && b < 100) return 'Orange';
    if (r > 200 && g < 150 && b > 150) return 'Pink';
    if (r > 100 && r < 150 && g > 100 && g < 150 && b > 100 && b < 150) return 'Gray';
    if (r < 50 && g < 100 && b > 150) return 'Navy Blue';
  }
  
  // If no match found, return the original color code but capitalize it
  return colorCode.charAt(0).toUpperCase() + colorCode.slice(1);
};
