import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ChartData } from './types';

interface RevenueChartProps {
  data: ChartData;
  loading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // For demonstration, showing a simple bar chart
  const hasData = data.datasets && data.datasets.length > 0 && data.datasets[0].data;
  const maxValue = hasData ? Math.max(...data.datasets[0].data) : 0;
  const chartHeight = 256; // h-64 in pixels

  if (!hasData || maxValue === 0) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            Revenue Trend
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>No revenue data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          Revenue Trend
        </h3>
      </div>
      
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>₹{(maxValue / 1000).toFixed(0)}k</span>
          <span>₹{(maxValue / 2000).toFixed(0)}k</span>
          <span>₹0</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-12 h-full overflow-x-auto">
          <div className="h-full flex items-end gap-2" style={{ width: `${data.labels.length * 40}px` }}>
            {data.datasets[0].data.map((value, index) => {
              const height = (value / maxValue) * chartHeight;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-yellow-400 rounded-t hover:bg-yellow-300 transition-colors cursor-pointer relative group"
                    style={{ height: `${height}px` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{value.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{data.labels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
