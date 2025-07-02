import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { API } from '../backend';

interface RealTShirtPreviewProps {
  selectedDesign: any | null;
  selectedColor: string;
  selectedSize: string;
}

const RealTShirtPreview: React.FC<RealTShirtPreviewProps> = ({
  selectedDesign,
  selectedColor,
  selectedSize,
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  
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
        {selectedDesign && view === 'front' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1/3 h-1/3 flex items-center justify-center">
              {(selectedDesign.image || selectedDesign.imageUrl || selectedDesign._id) ? (
                <img
                  src={selectedDesign.image || selectedDesign.imageUrl || `${API}/design/image/${selectedDesign._id}`}
                  alt={selectedDesign.name}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    filter: selectedColor === 'Black' ? 'brightness(1.2)' : 'none',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Image failed to load:', target.src);
                    console.log('Design object:', selectedDesign);
                    // Try alternative sources
                    if (!target.dataset.triedAlternatives) {
                      target.dataset.triedAlternatives = 'true';
                      
                      // If we have an imageUrl that's different from current src, try it
                      if (selectedDesign.imageUrl && !target.src.includes(selectedDesign.imageUrl)) {
                        console.log('Trying imageUrl:', selectedDesign.imageUrl);
                        target.src = selectedDesign.imageUrl;
                        return;
                      }
                      
                      // If current src doesn't have /api/design/image/, try that
                      if (!target.src.includes('/design/image/')) {
                        const apiUrl = `${API}/design/image/${selectedDesign._id}`;
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
                          <p class="text-xs text-gray-500 mt-1">${selectedDesign.name}</p>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="bg-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Design Preview</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedDesign.name}</p>
                </div>
              )}
            </div>
          </div>
        )}
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
        {selectedDesign && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Design:</span>
            <span className="text-white truncate max-w-[150px]">{selectedDesign.name}</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <p className="text-xs text-gray-300">
          💡 Tip: Click "View Back" to see the back of the t-shirt. Designs are placed on the front.
        </p>
      </div>
    </div>
  );
};

export default RealTShirtPreview;
