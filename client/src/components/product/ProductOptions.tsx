import React from 'react';
import { Plus, Minus, Clock } from 'lucide-react';
import SizeChart from '../SizeChart';

interface SizeChartData {
  _id?: string;
  displayTitle: string;
  headers: { key: string; label: string }[];
  measurements: any[];
  measurementGuide?: { part: string; instruction: string }[];
  note?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  customTags?: string[];
  sizeStock?: {
    [key: string]: number;
  };
  isFreeSize?: boolean;
}

interface ProductOptionsProps {
  product: Product;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  productType?: 'tshirt' | 'hoodie' | 'tank' | 'oversized' | 'printed-tee';
  sizeChartData?: SizeChartData | null;
  isFreeSize?: boolean;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
  product,
  selectedSize,
  setSelectedSize,
  quantity,
  setQuantity,
  productType = 'tshirt',
  sizeChartData = null,
  isFreeSize = false,
}) => {
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  // Get available sizes from size chart if available, otherwise use defaults
  const getDisplaySizes = (): string[] => {
    // Handle free size products
    if (isFreeSize || product.isFreeSize) {
      return ['Free'];
    }
    if (sizeChartData?.measurements && sizeChartData.measurements.length > 0) {
      // Extract sizes from size chart measurements
      return sizeChartData.measurements.map((m: any) => m.size).filter(Boolean);
    }
    // Fallback to default sizes
    return defaultSizes;
  };
  
  const displaySizes = getDisplaySizes();

  // Calculate stock info for selected size
  const selectedSizeStock = selectedSize && product.sizeStock 
    ? product.sizeStock[selectedSize] || 0
    : product.stock;

  return (
    <div className="space-y-2">
      {/* Premium Size Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Size</label>
          {/* Hide size chart for free size products */}
          {!isFreeSize && !product.isFreeSize && (
            <SizeChart 
              productType={productType} 
              customTags={product.customTags} 
              sizeChartData={sizeChartData}
            />
          )}
        </div>
        <div className={`grid gap-2 ${displaySizes.length === 1 ? 'grid-cols-1 max-w-[150px]' : 'grid-cols-5'}`}>
          {displaySizes.map((size) => {
            const sizeStockCount = product.sizeStock?.[size] || 0;
            const isAvailable = sizeStockCount > 0;
            const isLowStock = sizeStockCount > 0 && sizeStockCount <= 5;
            
            return (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  setQuantity(1);
                }}
                disabled={!isAvailable}
                className={`py-2 text-sm border rounded-lg transition-colors relative ${
                  selectedSize === size 
                    ? '' 
                    : isAvailable
                    ? 'border-gray-600 hover:border-gray-400'
                    : 'border-gray-700 opacity-40 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: selectedSize === size ? 'var(--color-primary)' : 'transparent',
                  borderColor: selectedSize === size ? 'var(--color-primary)' : '',
                  color: selectedSize === size ? 'var(--color-primaryText)' : ''
                }}
              >
                {size}
              </button>
            );
          })}
        </div>
        
        {/* Integrated Stock Info */}
        {selectedSize && (
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-textMuted)' }}>Availability:</span>
            {selectedSizeStock < 10 && selectedSizeStock > 0 ? (
              <span className="text-amber-400">Limited ({selectedSizeStock} remaining)</span>
            ) : selectedSizeStock > 0 ? (
              <span className="text-green-400">In Stock</span>
            ) : (
              <span className="text-red-400">Out of Stock</span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductOptions;
