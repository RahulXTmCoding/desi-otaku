import React from 'react';
import { Package, TrendingUp, Eye } from 'lucide-react';
import { ProductPerformance } from './types';

interface ProductPerformanceTableProps {
  products: ProductPerformance[];
  loading?: boolean;
}

const ProductPerformanceTable: React.FC<ProductPerformanceTableProps> = ({ products, loading }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-yellow-400" />
        Top Performing Products
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-3 text-sm font-medium text-gray-400">Product</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Sold</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Revenue</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Views</th>
              <th className="pb-3 text-sm font-medium text-gray-400 text-right">Conv. Rate</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No product data available
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.productId} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-400">#{product.productId.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-medium">{product.sold}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="font-medium text-green-400">{formatCurrency(product.revenue)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{product.views}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {product.conversionRate > 5 && <TrendingUp className="w-4 h-4 text-green-400" />}
                      <span className={product.conversionRate > 5 ? 'text-green-400' : ''}>
                        {product.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductPerformanceTable;
