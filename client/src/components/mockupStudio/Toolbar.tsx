import React from 'react';

interface ToolbarProps {
  onImageUpload: (file: File) => void;
  printSize: 'A3' | 'A2';
  setPrintSize: (size: 'A3' | 'A2') => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ printSize, setPrintSize }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-700 font-medium">Print Size:</span>
      <label className="flex items-center">
        <input
          type="radio"
          name="printSize"
          value="A3"
          checked={printSize === 'A3'}
          onChange={() => setPrintSize('A3')}
          className="mr-1"
        />
        <span className="text-gray-700">A3 (297×420mm)</span>
      </label>
      <label className="flex items-center ml-4">
        <input
          type="radio"
          name="printSize"
          value="A2"
          checked={printSize === 'A2'}
          onChange={() => setPrintSize('A2')}
          className="mr-1"
        />
        <span className="text-gray-700">A2 (420×594mm)</span>
      </label>
    </div>
  );
};

export default Toolbar;
