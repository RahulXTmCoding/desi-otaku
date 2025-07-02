import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { getTshirtMockup, designPositions } from '../data/tshirtMockups';

interface PhotoRealisticPreviewProps {
  selectedColor: string;
  selectedDesign: {
    _id: string;
    name: string;
    image?: string;
  } | null;
  designUrl: string;
}

const PhotoRealisticPreview: React.FC<PhotoRealisticPreviewProps> = ({
  selectedColor,
  selectedDesign,
  designUrl
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Generate composite image
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 500;

    // Get the appropriate mockup
    const mockupSrc = getTshirtMockup(selectedColor, view);

    // Load and draw the t-shirt mockup
    const mockupImg = new Image();
    mockupImg.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply color filter for non-white/black colors
      if (selectedColor !== '#FFFFFF' && selectedColor !== '#000000') {
        // Draw the base mockup
        ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
        
        // Apply color overlay
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = selectedColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Draw mockup directly for white/black
        ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
      }

      // Draw the design if selected and on front view
      if (selectedDesign && designUrl && view === 'front') {
        const designImg = new Image();
        designImg.onload = () => {
          const position = designPositions[view];
          
          // Calculate design placement
          const designX = (canvas.width * position.x) - (canvas.width * position.width / 2);
          const designY = canvas.height * position.y;
          const designWidth = canvas.width * position.width;
          const designHeight = canvas.height * position.height;

          // Save context state
          ctx.save();

          // Apply slight transformation for realistic perspective
          ctx.transform(1, 0, 0.05, 1, designX, designY);

          // Draw design with multiply blend mode for realistic print effect
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(designImg, 0, 0, designWidth, designHeight);
          
          // Add a slight overlay to make it look printed
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(0, 0, designWidth, designHeight);

          // Restore context state
          ctx.restore();

          // Generate preview URL
          setPreviewUrl(canvas.toDataURL('image/png'));
        };
        designImg.onerror = () => {
          console.error('Failed to load design image');
          setPreviewUrl(canvas.toDataURL('image/png'));
        };
        designImg.src = designUrl;
      } else {
        // No design, just set the mockup as preview
        setPreviewUrl(canvas.toDataURL('image/png'));
      }
    };

    mockupImg.src = mockupSrc;
  }, [selectedColor, selectedDesign, designUrl, view]);

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Previous View"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h4 className="text-lg font-semibold">
            {view === 'front' ? 'Front View' : 'Back View'}
          </h4>
          <p className="text-sm text-gray-400">
            {view === 'front' && selectedDesign 
              ? `Showing: ${selectedDesign.name}`
              : 'Click arrows to change view'
            }
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

      {/* Main Preview */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(0,0,0,.03) 20px,
              rgba(0,0,0,.03) 40px
            )`
          }} />
        </div>

        {/* Canvas (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview Image */}
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="T-shirt preview"
            className="relative z-10 w-full h-auto max-w-sm mx-auto"
          />
        ) : (
          <div className="relative z-10 w-full h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Generating preview...</p>
            </div>
          </div>
        )}

        {/* Floating badges */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm text-gray-700 font-medium">
            100% Cotton
          </div>
          <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm text-gray-700 font-medium">
            Premium Quality
          </div>
        </div>

        {/* View indicator */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm text-gray-700">
          {view === 'front' ? '👁️ Front' : '🔄 Back'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.download = `tshirt-preview-${Date.now()}.png`;
            link.href = previewUrl;
            link.click();
          }}
          disabled={!previewUrl}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Preview
        </button>
      </div>

      {/* Color Reference */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h5 className="text-sm font-medium mb-2">Selected Options</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Color:</span>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded border border-gray-600"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="capitalize">
                {selectedColor === '#FFFFFF' ? 'White' :
                 selectedColor === '#000000' ? 'Black' :
                 selectedColor === '#1E3A8A' ? 'Navy' :
                 selectedColor === '#DC2626' ? 'Red' :
                 selectedColor === '#6B7280' ? 'Gray' :
                 selectedColor === '#059669' ? 'Green' :
                 selectedColor === '#F59E0B' ? 'Yellow' :
                 selectedColor === '#7C3AED' ? 'Purple' : 'Custom'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-400">Design:</span>
            <div className="mt-1">
              {selectedDesign ? selectedDesign.name : 'None selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Notice */}
      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 text-center">
        <p className="text-xs text-yellow-300">
          ✨ Final product will have professional DTG printing with vibrant, long-lasting colors
        </p>
      </div>
    </div>
  );
};

export default PhotoRealisticPreview;
