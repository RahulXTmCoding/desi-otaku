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
