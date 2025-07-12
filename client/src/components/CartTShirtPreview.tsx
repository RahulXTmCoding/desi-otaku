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
  
  const hasFrontDesign = (customization?.frontDesign?.designImage) || (!customization && design && image);
  const hasBackDesign = customization?.backDesign?.designImage;
  const hasMultipleSides = !!(customization?.frontDesign?.designImage && customization?.backDesign?.designImage);
  
  const tshirtImages = {
    front: '/front.png',
    back: '/back.png'
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
          width: '48%',
          height: '48%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        };
    }
  };

  const renderDesign = () => {
    if (hasMultipleSides || customization) {
      const currentDesign = view === 'front' ? customization?.frontDesign : customization?.backDesign;
      if (!currentDesign) return null;

      const position = currentDesign.position || 'center';
      const positionStyles = getPositionStyles(position);
      
      return (
        <div style={positionStyles}>
          <img
            src={currentDesign.designImage}
            alt=""
            className="w-full h-full object-contain"
            style={{
              filter: color === '#000000' ? 'brightness(1.2)' : 'none',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error('Failed to load design image:', currentDesign.designImage);
              target.src = 'https://via.placeholder.com/100?text=Design';
            }}
          />
        </div>
      );
    } else if (design && image && view === 'front') {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/3 h-1/3 flex items-center justify-center">
            <img
              src={image}
              alt={design}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: color === '#000000' ? 'brightness(1.2)' : 'none',
              }}
            />
          </div>
        </div>
      );
    }
    
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {hasMultipleSides && (
        <button
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="absolute top-2 right-2 z-10 p-1 bg-gray-800/80 rounded hover:bg-gray-700/80 transition-colors"
          title={view === 'front' ? 'View back' : 'View front'}
        >
          <RotateCw className="w-3 h-3 text-white" />
        </button>
      )}
      
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
        <img
          src={tshirtImages[view]}
          alt="T-shirt preview"
          className="w-full h-full object-contain"
        />
        
        {color && color !== '#FFFFFF' && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: color,
              maskImage: `url(${tshirtImages[view]})`,
              maskSize: 'contain',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: `url(${tshirtImages[view]})`,
              WebkitMaskSize: 'contain',
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
            }}
          ></div>
        )}
        
        {renderDesign()}
      </div>
    </div>
  );
};

export default CartTShirtPreview;
