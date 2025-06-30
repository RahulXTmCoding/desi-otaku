import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeChartProps {
  productType?: 'tshirt' | 'hoodie' | 'tank';
}

const SizeChart: React.FC<SizeChartProps> = ({ productType = 'tshirt' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeData = {
    tshirt: {
      title: 'T-Shirt Size Chart',
      headers: ['Size', 'Chest (inches)', 'Length (inches)', 'Shoulder (inches)'],
      sizes: [
        { size: 'S', chest: '36-38', length: '28', shoulder: '17' },
        { size: 'M', chest: '39-41', length: '29', shoulder: '18' },
        { size: 'L', chest: '42-44', length: '30', shoulder: '19' },
        { size: 'XL', chest: '45-47', length: '31', shoulder: '20' },
        { size: 'XXL', chest: '48-50', length: '32', shoulder: '21' },
      ],
      measurementGuide: [
        { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
        { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
        { part: 'Shoulder', instruction: 'Measure from shoulder seam to shoulder seam' },
      ],
    },
    hoodie: {
      title: 'Hoodie Size Chart',
      headers: ['Size', 'Chest (inches)', 'Length (inches)', 'Sleeve (inches)'],
      sizes: [
        { size: 'S', chest: '38-40', length: '27', sleeve: '33' },
        { size: 'M', chest: '41-43', length: '28', sleeve: '34' },
        { size: 'L', chest: '44-46', length: '29', sleeve: '35' },
        { size: 'XL', chest: '47-49', length: '30', sleeve: '36' },
        { size: 'XXL', chest: '50-52', length: '31', sleeve: '37' },
      ],
      measurementGuide: [
        { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
        { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
        { part: 'Sleeve', instruction: 'Measure from center back to wrist' },
      ],
    },
    tank: {
      title: 'Tank Top Size Chart',
      headers: ['Size', 'Chest (inches)', 'Length (inches)'],
      sizes: [
        { size: 'S', chest: '35-37', length: '27' },
        { size: 'M', chest: '38-40', length: '28' },
        { size: 'L', chest: '41-43', length: '29' },
        { size: 'XL', chest: '44-46', length: '30' },
        { size: 'XXL', chest: '47-49', length: '31' },
      ],
      measurementGuide: [
        { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
        { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
      ],
    },
  };

  const currentData = sizeData[productType];

  return (
    <>
      {/* Size Chart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
      >
        <Ruler className="w-4 h-4" />
        <span className="text-sm font-medium">Size Chart</span>
      </button>

      {/* Size Chart Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Ruler className="w-6 h-6" />
                {currentData.title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Size Table */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {currentData.headers.map((header, index) => (
                        <th
                          key={index}
                          className={`py-3 px-4 text-left font-semibold ${
                            index === 0 ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.sizes.map((row, rowIndex) => (
                      <tr
                        key={row.size}
                        className={`border-b border-gray-700/50 ${
                          rowIndex % 2 === 0 ? 'bg-gray-700/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-yellow-400">
                          {row.size}
                        </td>
                        <td className="py-3 px-4 text-gray-300">{row.chest}</td>
                        <td className="py-3 px-4 text-gray-300">{row.length}</td>
                        {row.shoulder && (
                          <td className="py-3 px-4 text-gray-300">{row.shoulder}</td>
                        )}
                        {row.sleeve && (
                          <td className="py-3 px-4 text-gray-300">{row.sleeve}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* How to Measure */}
              <div className="bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-yellow-400">
                  How to Measure
                </h3>
                <div className="space-y-3">
                  {currentData.measurementGuide.map((guide, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="font-semibold text-gray-300 min-w-[80px]">
                        {guide.part}:
                      </span>
                      <span className="text-gray-400">{guide.instruction}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  <strong>Pro Tip:</strong> If you're between sizes, we recommend choosing the larger size for a comfortable fit.
                </p>
              </div>

              {/* Visual Guide */}
              <div className="mt-6 text-center">
                <div className="inline-block bg-gray-700 rounded-lg p-8">
                  <svg
                    width="200"
                    height="250"
                    viewBox="0 0 200 250"
                    className="text-gray-500"
                  >
                    {/* T-shirt outline */}
                    <path
                      d="M50 60 L50 40 Q50 30 60 30 L80 30 Q90 20 110 20 Q130 20 140 30 L160 30 Q170 30 170 40 L170 60 L150 80 L150 200 Q150 210 140 210 L60 210 Q50 210 50 200 L50 80 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    
                    {/* Measurement indicators */}
                    {/* Chest */}
                    <line x1="50" y1="100" x2="150" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                    <text x="100" y="95" textAnchor="middle" className="text-xs fill-current">Chest</text>
                    
                    {/* Length */}
                    <line x1="30" y1="60" x2="30" y2="210" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                    <text x="30" y="135" textAnchor="middle" className="text-xs fill-current" transform="rotate(-90 30 135)">Length</text>
                    
                    {/* Shoulder */}
                    <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                    <text x="100" y="45" textAnchor="middle" className="text-xs fill-current">Shoulder</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SizeChart;
