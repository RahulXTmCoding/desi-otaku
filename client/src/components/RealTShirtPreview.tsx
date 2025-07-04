import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { API } from '../backend';

interface RealTShirtPreviewProps {
  selectedDesign: any | null;
  selectedColor: string;
  selectedSize: string;
  position?: string;
  side?: 'front' | 'back';
  frontDesign?: any | null;
  backDesign?: any | null;
}

const RealTShirtPreview: React.FC<RealTShirtPreviewProps> = ({
  selectedDesign,
  selectedColor,
  selectedSize,
  position = 'center',
  side,
  frontDesign,
  backDesign,
}) => {
  const [view, setView] = useState<'front' | 'back'>(side || 'front');
  
  // Sync view with parent side prop
  React.useEffect(() => {
    if (side) {
      setView(side);
    }
  }, [side]);
  
  // T-shirt images - using local images from public folder
  const tshirtImages = {
    front: '/front.png', // White t-shirt front view
    back: '/back.png'    // White t-shirt back view
  };

  // Convert color name to hex for overlay
  const getColorValue = (colorName: string): string => {
    const colors: { [key: string]: string } = {
      'White': '#FFFFFF',
      'Black': '#000000',
      'Navy': '#1e3a8a',
      'Red': '#dc2626',
      'Gray': '#6b7280',
      'Green': '#059669',
      'Blue': '#2563eb',
      'Yellow': '#fbbf24',
      'Purple': '#7c3aed',
      'Pink': '#ec4899',
    };
    return colors[colorName] || '#FFFFFF';
  };

  const colorHex = getColorValue(selectedColor);
  const isWhite = selectedColor === 'White';

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
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Preview</h3>
        <button
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
        >
          <RotateCw className="w-4 h-4" />
          {view === 'front' ? 'View Back' : 'View Front'}
        </button>
      </div>

      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/5' }}>
        {/* T-shirt base image */}
        <div className="relative w-full h-full">
          {/* White t-shirt image with color filter */}
          <img
            src={tshirtImages[view]}
            alt={`T-shirt ${view} view`}
            className="w-full h-full object-contain"
            style={{
              filter: getColorFilter(selectedColor),
              transition: 'filter 0.3s ease',
            }}
          />
        </div>

        {/* Design overlay */}
        {renderDesign()}
      </div>

      {/* Color and Size Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Color:</span>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full border-2 border-gray-600"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-white">{selectedColor}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Size:</span>
          <span className="text-white">{selectedSize}</span>
        </div>
        {(frontDesign || backDesign) && (
          <div className="space-y-1">
            {frontDesign && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Front Design:</span>
                <span className="text-white truncate max-w-[150px]">{frontDesign.name}</span>
              </div>
            )}
            {backDesign && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Back Design:</span>
                <span className="text-white truncate max-w-[150px]">{backDesign.name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <p className="text-xs text-gray-300">
          💡 Tip: Click "View Back" to see the back of the t-shirt. 
          {frontDesign && backDesign && ' Both sides have designs!'}
          {!frontDesign && !backDesign && selectedDesign && ` Design is placed on the ${view}.`}
        </p>
      </div>
    </div>
  );

  function renderDesign() {
    // For Customize page with multi-design support
    if (frontDesign || backDesign) {
      const currentDesign = view === 'front' ? frontDesign : backDesign;
      if (!currentDesign) return null;
      
      // Get position from the design object itself
      const currentPosition = currentDesign.position || 'center';
      return renderDesignWithPosition(currentDesign, currentPosition);
    }
    
    // For legacy single design (only show on the selected side)
    if (selectedDesign && view === side) {
      return renderDesignWithPosition(selectedDesign, position || 'center');
    }
    
    return null;
  }

  function renderDesignWithPosition(design: any, designPosition: string) {

    // Position styles based on design position
    let positionStyles: React.CSSProperties = {};
    let sizeClass = '';
    
    switch (designPosition) {
      case 'center':
        positionStyles = {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '48%',
          height: '48%'
        };
        break;
      case 'left':
        positionStyles = {
          position: 'absolute',
          top: '22%',
          left: '28%',
          width: '18%',
          height: '18%'
        };
        break;
      case 'right':
        positionStyles = {
          position: 'absolute',
          top: '22%',
          right: '28%',
          width: '18%',
          height: '18%'
        };
        break;
      case 'center-bottom':
        positionStyles = {
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '48%',
          height: '48%'
        };
        break;
      default:
        positionStyles = {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '35%',
          height: '35%'
        };
    }

    return (
      <div style={positionStyles} className="flex items-center justify-center">
        {(design.image || design.imageUrl || design._id) ? (
          <img
            src={design.image || design.imageUrl || `${API}/design/image/${design._id}`}
            alt={design.name}
            className="w-full h-full object-contain"
            style={{
              filter: selectedColor === 'Black' ? 'brightness(1.2)' : 'none',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.log('Image failed to load:', target.src);
              console.log('Design object:', design);
              // Try alternative sources
              if (!target.dataset.triedAlternatives) {
                target.dataset.triedAlternatives = 'true';
                
                // If we have an imageUrl that's different from current src, try it
                if (design.imageUrl && !target.src.includes(design.imageUrl)) {
                  console.log('Trying imageUrl:', design.imageUrl);
                  target.src = design.imageUrl;
                  return;
                }
                
                // If current src doesn't have /api/design/image/, try that
                if (!target.src.includes('/design/image/')) {
                  const apiUrl = `${API}/design/image/${design._id}`;
                  console.log('Trying API URL:', apiUrl);
                  target.src = apiUrl;
                  return;
                }
              }
              
              // If all attempts failed, show fallback
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="bg-gray-300 rounded-lg p-4 text-center">
                    <p class="text-gray-600 text-sm">Design Preview</p>
                    <p class="text-xs text-gray-500 mt-1">${design.name}</p>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="bg-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600">Design Preview</p>
            <p className="text-sm text-gray-500 mt-1">{design.name}</p>
          </div>
        )}
      </div>
    );
  }
};

export default RealTShirtPreview;
