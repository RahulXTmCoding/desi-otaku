import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface RealisticTShirtPreviewProps {
  selectedColor: string;
  selectedDesign: {
    _id: string;
    name: string;
    image?: string;
  } | null;
  designUrl: string;
}

const RealisticTShirtPreview: React.FC<RealisticTShirtPreviewProps> = ({
  selectedColor,
  selectedDesign,
  designUrl
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mockupImage, setMockupImage] = useState<string>('');

  // T-shirt mockup configurations for different colors
  const mockupConfig = {
    '#FFFFFF': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/white-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/white-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#000000': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/black-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/black-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#1E3A8A': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/navy-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/navy-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#DC2626': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/red-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/red-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#6B7280': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/gray-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/gray-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#059669': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/green-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/green-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#F59E0B': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/yellow-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/yellow-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    },
    '#7C3AED': {
      front: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/purple-front.png',
      back: 'https://res.cloudinary.com/demo/image/upload/v1/tshirt-mockups/purple-back.png',
      designPosition: { x: 0.5, y: 0.35, width: 0.3, height: 0.35 }
    }
  };

  // Fallback to local mockup images
  const getLocalMockupImage = (color: string, viewType: 'front' | 'back') => {
    const colorName = {
      '#FFFFFF': 'white',
      '#000000': 'black',
      '#1E3A8A': 'navy',
      '#DC2626': 'red',
      '#6B7280': 'gray',
      '#059669': 'green',
      '#F59E0B': 'yellow',
      '#7C3AED': 'purple'
    }[color] || 'white';

    // Use placeholder image with color filter
    return `/mockups/tshirt-${colorName}-${viewType}.png`;
  };

  // Generate mockup with design overlay
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = mockupConfig[selectedColor] || mockupConfig['#FFFFFF'];
    const mockupSrc = config[view];

    // Load mockup image
    const mockupImg = new Image();
    mockupImg.crossOrigin = 'anonymous';
    
    mockupImg.onload = () => {
      canvas.width = mockupImg.width;
      canvas.height = mockupImg.height;
      
      // Draw the t-shirt mockup
      ctx.drawImage(mockupImg, 0, 0);

      // If there's a design, overlay it
      if (selectedDesign && designUrl && view === 'front') {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        
        designImg.onload = () => {
          // Calculate design position and size based on config
          const designX = canvas.width * config.designPosition.x - (canvas.width * config.designPosition.width) / 2;
          const designY = canvas.height * config.designPosition.y;
          const designWidth = canvas.width * config.designPosition.width;
          const designHeight = canvas.height * config.designPosition.height;

          // Apply multiply blend mode for realistic print effect
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(designImg, designX, designY, designWidth, designHeight);
          
          // Reset blend mode
          ctx.globalCompositeOperation = 'source-over';
          
          setIsLoading(false);
        };

        designImg.onerror = () => {
          console.error('Failed to load design image');
          setIsLoading(false);
        };

        designImg.src = designUrl;
      } else {
        setIsLoading(false);
      }
    };

    mockupImg.onerror = () => {
      // Fallback to colored rectangle if mockup fails to load
      canvas.width = 600;
      canvas.height = 700;
      
      // Draw a simple t-shirt shape
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      // T-shirt body
      ctx.moveTo(150, 150);
      ctx.lineTo(150, 100);
      ctx.quadraticCurveTo(150, 50, 200, 50);
      ctx.lineTo(250, 50);
      ctx.quadraticCurveTo(300, 50, 350, 80);
      ctx.lineTo(400, 50);
      ctx.quadraticCurveTo(450, 50, 450, 100);
      ctx.lineTo(450, 150);
      ctx.lineTo(400, 200);
      ctx.lineTo(400, 600);
      ctx.quadraticCurveTo(400, 650, 350, 650);
      ctx.lineTo(250, 650);
      ctx.quadraticCurveTo(200, 650, 200, 600);
      ctx.lineTo(200, 200);
      ctx.lineTo(150, 150);
      ctx.closePath();
      ctx.fill();
      
      // Add some shading
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(200, 100, 200, 550);
      
      // Draw design if available
      if (selectedDesign && designUrl && view === 'front') {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        
        designImg.onload = () => {
          ctx.drawImage(designImg, 225, 250, 150, 150);
        };
        
        designImg.src = designUrl;
      }
      
      setIsLoading(false);
    };

    setIsLoading(true);
    mockupImg.src = mockupSrc;

    // Try local image if remote fails
    setTimeout(() => {
      if (isLoading) {
        mockupImg.src = getLocalMockupImage(selectedColor, view);
      }
    }, 3000);

  }, [selectedColor, selectedDesign, designUrl, view]);

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Previous View"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h4 className="text-lg font-semibold capitalize">{view} View</h4>
          <p className="text-sm text-gray-400">
            {view === 'front' ? 'Click arrows to see back' : 'Design is on front only'}
          </p>
        </div>
        
        <button
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Next View"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* T-Shirt Preview */}
      <div className="relative bg-gray-100 rounded-xl overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-10">
            <div className="text-center">
              <RotateCw className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-2" />
              <p className="text-sm">Loading preview...</p>
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-w-md mx-auto"
          style={{ maxHeight: '500px', objectFit: 'contain' }}
        />
      </div>

      {/* Design Info */}
      {selectedDesign && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Design: <span className="text-white font-medium">{selectedDesign.name}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            The design will be professionally printed on the t-shirt
          </p>
        </div>
      )}

      {/* Color Swatches */}
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-3">Quick Color Preview:</p>
        <div className="flex justify-center gap-2">
          {Object.keys(mockupConfig).map((color) => (
            <button
              key={color}
              onClick={() => {}}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color 
                  ? 'border-yellow-400 scale-110' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color }}
              disabled
              title="Change color from options below"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealisticTShirtPreview;
