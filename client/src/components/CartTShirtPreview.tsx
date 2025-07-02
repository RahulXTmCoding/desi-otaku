import React from 'react';

interface CartTShirtPreviewProps {
  design?: string;
  color?: string;
  colorValue?: string;
  image?: string;
}

const CartTShirtPreview: React.FC<CartTShirtPreviewProps> = ({
  design,
  color = 'White',
  colorValue,
  image
}) => {
  // T-shirt image
  const tshirtImage = '/front.png';

  // Get CSS filter for t-shirt color
  const getColorFilter = (colorName: string): string => {
    switch (colorName) {
      case 'Black':
        return 'brightness(0.2) contrast(1.2)';
      case 'Navy':
        return 'brightness(0.4) sepia(1) hue-rotate(190deg) saturate(2)';
      case 'Red':
        return 'brightness(0.6) sepia(1) hue-rotate(-20deg) saturate(2.5)';
      case 'Gray':
        return 'brightness(0.6) grayscale(1)';
      case 'Green':
        return 'brightness(0.6) sepia(1) hue-rotate(90deg) saturate(2)';
      case 'Blue':
        return 'brightness(0.7) sepia(1) hue-rotate(180deg) saturate(2)';
      case 'Yellow':
        return 'brightness(0.9) sepia(1) hue-rotate(30deg) saturate(2)';
      case 'Purple':
        return 'brightness(0.6) sepia(1) hue-rotate(250deg) saturate(2)';
      case 'Pink':
        return 'brightness(0.8) sepia(1) hue-rotate(300deg) saturate(1.5)';
      default:
        return 'none';
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100 rounded overflow-hidden">
      {/* T-shirt base */}
      <img
        src={tshirtImage}
        alt="T-shirt preview"
        className="w-full h-full object-contain"
        style={{
          filter: getColorFilter(color),
        }}
      />
      
      {/* Design overlay */}
      {design && image && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 flex items-center justify-center">
            <img
              src={image}
              alt={design}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: color === 'Black' ? 'brightness(1.2)' : 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CartTShirtPreview;
