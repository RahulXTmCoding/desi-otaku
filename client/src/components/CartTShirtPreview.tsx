import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';

interface CartTShirtPreviewProps {
  design?: string;
  color?: string;
  colorValue?: string;
  image?: string;
  customization?: {
    frontDesign?: {
      designImage: string;
      position: string;
    } | null;
    backDesign?: {
      designImage: string;
      position: string;
    } | null;
  };
}

const CartTShirtPreview: React.FC<CartTShirtPreviewProps> = ({
  design,
  color = 'White',
  colorValue,
  image,
  customization
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  
  // Check if we have multi-side designs with actual design data
  const hasFrontDesign = (customization?.frontDesign?.designImage) || (!customization && design && image);
  const hasBackDesign = customization?.backDesign?.designImage;
  const hasMultipleSides = !!(customization?.frontDesign?.designImage || customization?.backDesign?.designImage);
  // T-shirt images
  const tshirtImages = {
    front: '/front.png',
    back: '/back.png'
  };

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

  const getPositionStyles = (position: string) => {
    switch (position) {
      case 'left':
        return { 
          position: 'absolute' as const, 
          top: '20%', 
          left: '28%', 
          width: '18%', 
          height: '18%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        };
      case 'right':
        return { 
          position: 'absolute' as const, 
          top: '20%', 
          right: '28%',
          width: '18%', 
          height: '18%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        };
      case 'center-bottom':
        return { 
          position: 'absolute' as const, 
          bottom: '10%', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '48%', 
          height: '48%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        };
      case 'center':
      default:
        return { 
          position: 'absolute' as const, 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '35%', 
          height: '35%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        };
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* View toggle for multi-side designs */}
      {hasMultipleSides && (
        <button
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="absolute top-2 right-2 z-10 p-1 bg-gray-800/80 rounded hover:bg-gray-700/80 transition-colors"
          title={view === 'front' ? 'View back' : 'View front'}
        >
          <RotateCw className="w-3 h-3 text-white" />
        </button>
      )}
      
      {/* Indicator badges */}
      {hasMultipleSides && (
        <div className="absolute top-2 left-2 z-10 flex gap-1">
          {hasFrontDesign && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${view === 'front' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>
              F
            </span>
          )}
          {hasBackDesign && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${view === 'back' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>
              B
            </span>
          )}
        </div>
      )}
      
      <div className="relative w-full h-full bg-gray-100 rounded overflow-hidden">
        {/* T-shirt base */}
        <img
          src={tshirtImages[view]}
          alt="T-shirt preview"
          className="w-full h-full object-contain"
          style={{
            filter: getColorFilter(color),
          }}
        />
        
        {/* Design overlay */}
        {renderDesign()}
      </div>
    </div>
  );

  function renderDesign() {
    if (hasMultipleSides) {
      // New multi-side design structure
      const currentDesign = view === 'front' ? customization?.frontDesign : customization?.backDesign;
      if (!currentDesign) return null;

      // Extract position from the design object
      const position = currentDesign.position || 'center';
      const positionStyles = getPositionStyles(position);
      
      return (
        <div style={positionStyles}>
          <img
            src={currentDesign.designImage}
            alt=""
            className="w-full h-full object-contain"
            style={{
              filter: color === 'Black' ? 'brightness(1.2)' : 'none',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/100?text=Design';
            }}
          />
        </div>
      );
    } else if (design && image && view === 'front') {
      // Legacy single design support
      return (
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
      );
    }
    
    return null;
  }
};

export default CartTShirtPreview;
