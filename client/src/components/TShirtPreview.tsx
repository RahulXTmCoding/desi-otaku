import React, { useState } from 'react';
import { RotateCw, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface TShirtPreviewProps {
  selectedColor: string;
  selectedDesign: {
    _id: string;
    name: string;
    image?: string;
  } | null;
  designUrl: string;
}

const TShirtPreview: React.FC<TShirtPreviewProps> = ({
  selectedColor,
  selectedDesign,
  designUrl
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [designPosition, setDesignPosition] = useState({ x: 50, y: 40 });
  const [designScale, setDesignScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Color mapping for realistic t-shirt colors
  const colorMap: { [key: string]: { base: string; shadow: string; highlight: string } } = {
    '#FFFFFF': { base: '#FFFFFF', shadow: '#E5E7EB', highlight: '#FFFFFF' },
    '#000000': { base: '#1F2937', shadow: '#111827', highlight: '#374151' },
    '#1E3A8A': { base: '#1E3A8A', shadow: '#1E40AF', highlight: '#2563EB' },
    '#DC2626': { base: '#DC2626', shadow: '#B91C1C', highlight: '#EF4444' },
    '#6B7280': { base: '#6B7280', shadow: '#4B5563', highlight: '#9CA3AF' },
    '#059669': { base: '#059669', shadow: '#047857', highlight: '#10B981' },
    '#F59E0B': { base: '#F59E0B', shadow: '#D97706', highlight: '#FCD34D' },
    '#7C3AED': { base: '#7C3AED', shadow: '#6D28D9', highlight: '#8B5CF6' }
  };

  const currentColor = colorMap[selectedColor] || colorMap['#FFFFFF'];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedDesign) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (isDragging && selectedDesign) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Constrain design within printable area
      const constrainedX = Math.max(25, Math.min(75, x));
      const constrainedY = Math.max(25, Math.min(60, y));
      
      setDesignPosition({ x: constrainedX, y: constrainedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const adjustScale = (delta: number) => {
    setDesignScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setView('front')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'front' 
              ? 'bg-yellow-400 text-gray-900' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Front View
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'back' 
              ? 'bg-yellow-400 text-gray-900' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Back View
        </button>
      </div>

      {/* T-Shirt Preview */}
      <div className="relative bg-gray-700 rounded-xl p-8">
        <svg 
          viewBox="0 0 400 500" 
          className="w-full max-w-sm mx-auto cursor-move"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {/* Gradient for realistic fabric effect */}
            <linearGradient id="fabricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentColor.highlight} stopOpacity="0.3" />
              <stop offset="50%" stopColor={currentColor.base} />
              <stop offset="100%" stopColor={currentColor.shadow} stopOpacity="0.8" />
            </linearGradient>
            
            {/* Shadow filter */}
            <filter id="shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge> 
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>

            {/* Fabric texture pattern */}
            <pattern id="fabricTexture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill={currentColor.base} />
              <circle cx="2" cy="2" r="0.5" fill={currentColor.shadow} opacity="0.1" />
            </pattern>
          </defs>

          {/* T-Shirt Body */}
          <g filter="url(#shadow)">
            {/* Main body */}
            <path
              d="M 120 120
                 L 120 100
                 Q 120 80, 140 75
                 L 160 70
                 Q 170 60, 200 60
                 Q 230 60, 240 70
                 L 260 75
                 Q 280 80, 280 100
                 L 280 120
                 L 260 140
                 L 260 420
                 Q 260 440, 240 440
                 L 160 440
                 Q 140 440, 140 420
                 L 140 140
                 L 120 120"
              fill="url(#fabricGradient)"
              stroke={currentColor.shadow}
              strokeWidth="1"
            />

            {/* Collar */}
            <path
              d="M 170 70
                 Q 180 65, 200 65
                 Q 220 65, 230 70
                 L 225 85
                 Q 215 80, 200 80
                 Q 185 80, 175 85
                 L 170 70"
              fill={currentColor.shadow}
              opacity="0.3"
            />

            {/* Sleeves */}
            <path
              d="M 120 120
                 L 80 160
                 Q 70 170, 70 180
                 L 70 200
                 Q 70 210, 80 210
                 L 120 180
                 L 140 140"
              fill="url(#fabricGradient)"
              stroke={currentColor.shadow}
              strokeWidth="1"
            />
            <path
              d="M 280 120
                 L 320 160
                 Q 330 170, 330 180
                 L 330 200
                 Q 330 210, 320 210
                 L 280 180
                 L 260 140"
              fill="url(#fabricGradient)"
              stroke={currentColor.shadow}
              strokeWidth="1"
            />

            {/* Fabric fold lines for realism */}
            <path
              d="M 180 100 L 180 400 M 220 100 L 220 400"
              stroke={currentColor.shadow}
              strokeWidth="0.5"
              opacity="0.2"
            />
            <path
              d="M 140 200 Q 200 195, 260 200 M 140 300 Q 200 295, 260 300"
              stroke={currentColor.shadow}
              strokeWidth="0.5"
              opacity="0.2"
              fill="none"
            />

            {/* Apply fabric texture */}
            <rect x="0" y="0" width="400" height="500" fill="url(#fabricTexture)" opacity="0.05" />
          </g>

          {/* Design placement */}
          {selectedDesign && view === 'front' && (
            <g 
              transform={`translate(${designPosition.x * 4 - 100}, ${designPosition.y * 5 - 50})`}
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* Design background for better visibility */}
              <rect
                x={-5}
                y={-5}
                width={110}
                height={110}
                fill="white"
                opacity="0.1"
                rx="8"
              />
              
              {/* Design image */}
              <image
                href={designUrl}
                x="0"
                y="0"
                width={100 * designScale}
                height={100 * designScale}
                preserveAspectRatio="xMidYMid meet"
                opacity="0.95"
              />
              
              {/* Design border for selected state */}
              <rect
                x={-2}
                y={-2}
                width={104 * designScale}
                height={104 * designScale}
                fill="none"
                stroke="#FCD34D"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity={isDragging ? 1 : 0}
              />
            </g>
          )}
        </svg>

        {/* Controls */}
        {selectedDesign && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg p-2 flex gap-2">
            <button
              onClick={() => adjustScale(-0.1)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => adjustScale(0.1)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setDesignPosition({ x: 50, y: 40 });
                setDesignScale(1);
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Reset Position"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Instructions */}
        {selectedDesign && (
          <div className="absolute top-4 left-4 bg-gray-800/90 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Move className="w-4 h-4" />
              <span>Drag to position design</span>
            </div>
          </div>
        )}
      </div>

      {/* Position Info */}
      {selectedDesign && (
        <div className="text-center text-sm text-gray-400">
          Design: {selectedDesign.name} | Scale: {(designScale * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default TShirtPreview;
