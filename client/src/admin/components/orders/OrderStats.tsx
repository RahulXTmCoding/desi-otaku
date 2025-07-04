import React from 'react';
import { Package, Clock, Box, Truck, CheckCircle, XCircle } from 'lucide-react';

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
}

interface OrderStatsProps {
  stats: OrderStats;
}

const OrderStats: React.FC<OrderStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <Package className="w-5 h-5 text-gray-400" />
          <span className="text-2xl font-bold">{stats.total}</span>
        </div>
        <p className="text-sm text-gray-400">Total Orders</p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 border border-yellow-400/20">
        <div className="flex items-center justify-between mb-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          <span className="text-2xl font-bold text-yellow-400">{stats.pending}</span>
        </div>
        <p className="text-sm text-gray-400">Pending</p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 border border-blue-400/20">
        <div className="flex items-center justify-between mb-2">
          <Box className="w-5 h-5 text-blue-400" />
          <span className="text-2xl font-bold text-blue-400">{stats.processing}</span>
        </div>
        <p className="text-sm text-gray-400">Processing</p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 border border-purple-400/20">
        <div className="flex items-center justify-between mb-2">
          <Truck className="w-5 h-5 text-purple-400" />
          <span className="text-2xl font-bold text-purple-400">{stats.shipped}</span>
        </div>
        <p className="text-sm text-gray-400">Shipped</p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 border border-green-400/20">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-2xl font-bold text-green-400">{stats.delivered}</span>
        </div>
        <p className="text-sm text-gray-400">Delivered</p>
      </div>
      
      <div className="bg-gray-800 rounded-xl p-4 border border-red-400/20">
        <div className="flex items-center justify-between mb-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-2xl font-bold text-red-400">{stats.cancelled}</span>
        </div>
        <p className="text-sm text-gray-400">Cancelled</p>
      </div>
    </div>
  );
};

export default OrderStats;
