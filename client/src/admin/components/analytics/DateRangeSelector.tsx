import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ selectedRange, onRangeChange }) => {
  const ranges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-gray-400" />
      <select
        value={selectedRange}
        onChange={(e) => onRangeChange(e.target.value)}
        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
      >
        {ranges.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateRangeSelector;
