import React from 'react';
import { Plus, Minus, Clock } from 'lucide-react';
import SizeChart from '../SizeChart';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
}

interface ProductOptionsProps {
  product: Product;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  productType?: 'tshirt' | 'hoodie' | 'tank' | 'oversized' | 'printed-tee';
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
  product,
  selectedSize,
  setSelectedSize,
  quantity,
  setQuantity,
  productType = 'tshirt',
}) => {
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Calculate stock info for selected size
  const selectedSizeStock = selectedSize && product.sizeStock 
    ? product.sizeStock[selectedSize as keyof typeof product.sizeStock] 
    : product.stock;

  return (
    <div className="space-y-2">
      {/* Premium Size Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Size</label>
          <SizeChart productType={productType} />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {defaultSizes.map((size) => {
            const sizeStockCount = product.sizeStock?.[size as keyof typeof product.sizeStock] || 0;
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
