import React, { useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface DateRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  selectedRange, 
  onRangeChange, 
  onCustomDateChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const ranges = [
    { value: 'today', label: 'Today', description: 'Today\'s data' },
    { value: 'week', label: 'This Week', description: 'Last 7 days' },
    { value: 'month', label: 'This Month', description: 'Current month' },
    { value: 'quarter', label: 'This Quarter', description: '3 months' },
    { value: 'year', label: 'This Year', description: 'Current year' },
    { value: 'custom', label: 'Custom Range', description: 'Pick specific dates' }
  ];

  const getCurrentRangeLabel = () => {
    if (selectedRange === 'custom' && customStartDate && customEndDate) {
      return formatCustomDateDisplay();
    }
    const range = ranges.find(r => r.value === selectedRange);
    return range ? range.label : 'Select Range';
  };

  const handleRangeSelect = (value: string) => {
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      onRangeChange(value);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onCustomDateChange?.(customStartDate, customEndDate);
      setShowCustomPicker(false);
      setIsOpen(false);
    }
  };

  const formatCustomDateDisplay = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString();
      const end = new Date(customEndDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    return 'Custom Range';
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-yellow-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white transition-colors"
      >
        <Calendar className="w-5 h-5 text-gray-400" />
        <span className="text-sm font-medium">
          {selectedRange === 'custom' && customStartDate && customEndDate
            ? formatCustomDateDisplay()
            : getCurrentRangeLabel()
          }
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCustomPicker(false);
            }}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            {!showCustomPicker ? (
              /* Range Options */
              <div className="p-2">
                <div className="text-xs font-medium text-gray-400 px-3 py-2 uppercase tracking-wide">
                  Select Date Range
                </div>
                {ranges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handleRangeSelect(range.value)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-700 transition-colors ${
                      selectedRange === range.value ? 'bg-yellow-400/10 border-l-4 border-yellow-400' : ''
                    }`}
                  >
                    <div className="font-medium text-white">{range.label}</div>
                    <div className="text-xs text-gray-400">{range.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Date Picker */
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-white">Custom Date Range</h3>
                  <button
                    onClick={() => setShowCustomPicker(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCustomPicker(false)}
                      className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCustomDateApply}
                      disabled={!customStartDate || !customEndDate}
                      className="flex-1 px-3 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-900 font-medium transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeSelector;
