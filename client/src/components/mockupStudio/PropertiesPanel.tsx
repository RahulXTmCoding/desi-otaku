import React from 'react';
import { Trash2 } from 'lucide-react';
import * as fabric from 'fabric';

interface PropertiesPanelProps {
  tshirtColor: string;
  setTshirtColor: (color: string) => void;
  selectedObject?: fabric.Object | null;
  fabricCanvas?: fabric.Canvas | null;
  onDelete?: () => void;
  currentView?: 'front' | 'back';
  setCurrentView?: (view: 'front' | 'back') => void;
  frontDesignsCount?: number;
  backDesignsCount?: number;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  tshirtColor, 
  setTshirtColor, 
  selectedObject,
  fabricCanvas,
  onDelete,
  currentView = 'front',
  setCurrentView,
  frontDesignsCount = 0,
  backDesignsCount = 0
}) => {
  const handleTextChange = (value: string) => {
    if (selectedObject && selectedObject.type === 'i-text' && fabricCanvas) {
      (selectedObject as fabric.IText).set('text', value);
      fabricCanvas.renderAll();
    }
  };

  const handleFontSizeChange = (value: number) => {
    if (selectedObject && selectedObject.type === 'i-text' && fabricCanvas) {
      (selectedObject as fabric.IText).set('fontSize', value);
      fabricCanvas.renderAll();
    }
  };

  const handleTextColorChange = (value: string) => {
    if (selectedObject && selectedObject.type === 'i-text' && fabricCanvas) {
      (selectedObject as fabric.IText).set('fill', value);
      fabricCanvas.renderAll();
    }
  };

  const handleFontFamilyChange = (value: string) => {
    if (selectedObject && selectedObject.type === 'i-text' && fabricCanvas) {
      (selectedObject as fabric.IText).set('fontFamily', value);
      fabricCanvas.renderAll();
    }
  };

  const isTextObject = selectedObject?.type === 'i-text';

  // Helper function to get text color safely
  const getTextColor = (): string => {
    if (!isTextObject) return '#000000';
    const fill = (selectedObject as fabric.IText).fill;
    if (typeof fill === 'string') return fill;
    return '#000000'; // Default for gradients or other types
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-6">Properties</h3>
      
      {/* Side Selector */}
      {setCurrentView && (
        <div className="mb-6 bg-gray-100 rounded-lg p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('front')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                currentView === 'front'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">👕</span>
                <span>Front</span>
                {frontDesignsCount > 0 && <span className="text-sm">✓</span>}
              </div>
            </button>
            <button
              onClick={() => setCurrentView('back')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                currentView === 'back'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">👕</span>
                <span>Back</span>
                {backDesignsCount > 0 && <span className="text-sm">✓</span>}
              </div>
            </button>
          </div>
        </div>
      )}
      
      {/* T-Shirt Color */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          T-Shirt Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'White', value: '#FFFFFF' },
            { name: 'Black', value: '#000000' },
            { name: 'Navy', value: '#1E3A8A' },
            { name: 'Red', value: '#DC2626' },
            { name: 'Gray', value: '#6B7280' },
            { name: 'Green', value: '#059669' },
            { name: 'Yellow', value: '#F59E0B' },
            { name: 'Purple', value: '#7C3AED' }
          ].map((color) => (
            <button
              key={color.value}
              onClick={() => setTshirtColor(color.value)}
              className={`w-full h-10 rounded-lg border-2 transition-all ${
                tshirtColor === color.value 
                  ? 'border-blue-500 scale-110' 
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Selected: {
            [
              { name: 'White', value: '#FFFFFF' },
              { name: 'Black', value: '#000000' },
              { name: 'Navy', value: '#1E3A8A' },
              { name: 'Red', value: '#DC2626' },
              { name: 'Gray', value: '#6B7280' },
              { name: 'Green', value: '#059669' },
              { name: 'Yellow', value: '#F59E0B' },
              { name: 'Purple', value: '#7C3AED' }
            ].find(c => c.value === tshirtColor)?.name || 'Custom'
          }
        </div>
      </div>

      {/* Selected Object Properties */}
      {selectedObject && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-700 mb-4">
            {isTextObject ? 'Text Properties' : 'Design Properties'}
          </h4>
          
          {/* Text-specific properties */}
          {isTextObject && (
            <>
              {/* Text Content */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text
                </label>
                <input
                  type="text"
                  value={(selectedObject as fabric.IText).text || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Font Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={(selectedObject as fabric.IText).fontSize || 40}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{(selectedObject as fabric.IText).fontSize}px</span>
              </div>

              {/* Font Family */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={(selectedObject as fabric.IText).fontFamily || 'Arial'}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>

              {/* Text Color */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={getTextColor()}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {getTextColor()}
                  </span>
                </div>
              </div>
            </>
          )}
          

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors w-full justify-center"
          >
            <Trash2 className="w-4 h-4" />
            Delete Object
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
