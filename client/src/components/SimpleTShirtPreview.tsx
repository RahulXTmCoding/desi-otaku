import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimpleTShirtPreviewProps {
  selectedColor: string;
  selectedDesign: {
    _id: string;
    name: string;
    image?: string;
  } | null;
  designUrl: string;
}

const SimpleTShirtPreview: React.FC<SimpleTShirtPreviewProps> = ({
  selectedColor,
  selectedDesign,
  designUrl
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  // Map colors to CSS filters for t-shirt mockup
  const colorFilters = {
    '#FFFFFF': 'brightness(1) saturate(1)',
    '#000000': 'brightness(0.2) saturate(0)',
    '#1E3A8A': 'brightness(0.4) saturate(1.5) hue-rotate(200deg)',
    '#DC2626': 'brightness(0.6) saturate(2) hue-rotate(-10deg)',
    '#6B7280': 'brightness(0.5) saturate(0.3)',
    '#059669': 'brightness(0.5) saturate(1.5) hue-rotate(90deg)',
    '#F59E0B': 'brightness(0.7) saturate(2) hue-rotate(30deg)',
    '#7C3AED': 'brightness(0.5) saturate(1.5) hue-rotate(240deg)'
  };

  const currentFilter = colorFilters[selectedColor] || colorFilters['#FFFFFF'];

  // Use a generic t-shirt template
  const tshirtTemplate = 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-template.png';
  
  // Fallback to inline SVG t-shirt
  const TShirtSVG = () => (
    <svg viewBox="0 0 400 500" className="w-full h-auto">
      <defs>
        <linearGradient id="fabric" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={selectedColor} stopOpacity="0.9" />
          <stop offset="50%" stopColor={selectedColor} />
          <stop offset="100%" stopColor={selectedColor} stopOpacity="0.8" />
        </linearGradient>
        <filter id="texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 0.05 0.1 0.05" />
          </feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>
      
      {/* T-shirt shape with realistic curves */}
      <g filter="url(#texture)">
        <path
          d="M 100 120
             C 100 100, 100 60, 130 50
             L 170 40
             C 180 35, 220 35, 230 40
             L 270 50
             C 300 60, 300 100, 300 120
             L 280 140
             L 270 150
             L 270 430
             C 270 450, 260 460, 240 460
             L 160 460
             C 140 460, 130 450, 130 430
             L 130 150
             L 120 140
             Z"
          fill="url(#fabric)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
        
        {/* Collar */}
        <ellipse cx="200" cy="50" rx="35" ry="15" 
          fill="none" 
          stroke={selectedColor} 
          strokeWidth="8"
          opacity="0.8"
        />
        
        {/* Sleeves */}
        <path
          d="M 100 120
             L 50 170
             C 40 180, 40 190, 50 200
             L 80 230
             L 120 180
             L 130 150"
          fill="url(#fabric)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
        <path
          d="M 300 120
             L 350 170
             C 360 180, 360 190, 350 200
             L 320 230
             L 280 180
             L 270 150"
          fill="url(#fabric)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
        
        {/* Fabric folds for realism */}
        <path
          d="M 180 100 L 180 400 M 220 100 L 220 400"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="1"
        />
        <path
          d="M 130 200 Q 200 195, 270 200 M 130 300 Q 200 295, 270 300"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="1"
          fill="none"
        />
      </g>
      
      {/* Design placement */}
      {selectedDesign && view === 'front' && designUrl && (
        <g transform="translate(200, 250)">
          <rect x="-60" y="-60" width="120" height="120" fill="white" opacity="0.1" rx="8" />
          <image
            href={designUrl}
            x="-50"
            y="-50"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.9"
          />
        </g>
      )}
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={() => setView('front')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'front' 
              ? 'bg-yellow-400 text-gray-900' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'back' 
              ? 'bg-yellow-400 text-gray-900' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Back
        </button>
      </div>

      {/* T-Shirt Preview Container */}
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px)'
          }} />
        </div>
        
        {/* T-shirt mockup */}
        <div className="relative z-10 max-w-sm mx-auto">
          <TShirtSVG />
        </div>
        
        {/* View indicator */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-sm text-gray-700">
          {view === 'front' ? 'Front View' : 'Back View'}
        </div>
      </div>

      {/* Design Info */}
      {selectedDesign && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Selected Design</p>
              <p className="font-medium">{selectedDesign.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Design Fee</p>
              <p className="font-medium text-yellow-400">+₹150</p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-400">
          💡 The final printed t-shirt will have professional quality printing with vibrant colors
        </p>
      </div>
    </div>
  );
};

export default SimpleTShirtPreview;
