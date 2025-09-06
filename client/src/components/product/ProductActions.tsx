import React from 'react';
import { ShoppingCart, Zap, Heart, Check, Truck, Shield, RotateCw, Plus, Minus } from 'lucide-react';

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

interface ProductActionsProps {
  product: Product;
  selectedSize: string;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedColor?: { name: string; value: string } | null;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onWishlistToggle: () => void;
  isWishlisted: boolean;
  wishlistLoading: boolean;
  showSuccessMessage: boolean;
  userId?: string | null;
  token?: string | null;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  product,
  selectedSize,
  quantity,
  setQuantity,
  selectedColor,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  isWishlisted,
  wishlistLoading,
  showSuccessMessage,
  userId,
  token
}) => {
  // Calculate stock availability
  const selectedSizeStock = selectedSize && product.sizeStock 
    ? product.sizeStock[selectedSize as keyof typeof product.sizeStock] 
    : product.stock;
  const isStockAvailable = selectedSize && selectedSizeStock > 0;

  return (
    <div className="space-y-6">
      {/* Success Message - Integrated */}
      {showSuccessMessage && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
          <Check className="w-5 h-5" />
          <span className="text-sm font-medium">Added to cart successfully!</span>
        </div>
      )}

      {/* Premium Action Buttons with Inline Quantity */}
      <div className="space-y-4">
        {/* Quantity & Add to Cart Row */}
        <div className="flex gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-gray-600 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={!selectedSize || selectedSizeStock === 0 || quantity <= 1}
              className="px-3 py-3 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-3 border-x border-gray-600 min-w-[60px] text-center font-medium">{quantity}</span>
            <button
              onClick={() => {
                if (selectedSize && product.sizeStock) {
                  const maxQty = product.sizeStock[selectedSize as keyof typeof product.sizeStock] || 0;
                  setQuantity(Math.min(maxQty, quantity + 1));
                } else {
                  setQuantity(Math.min(product.stock, quantity + 1));
                }
              }}
              disabled={!selectedSize || quantity >= selectedSizeStock}
              className="px-3 py-3 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={onAddToCart}
            disabled={!selectedSize || !isStockAvailable}
            className={`flex-1 py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              selectedSize && isStockAvailable
                ? 'hover:opacity-90'
                : 'cursor-not-allowed opacity-50'
            }`}
            style={{
              backgroundColor: selectedSize && isStockAvailable ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedSize && isStockAvailable ? 'var(--color-primaryText)' : 'var(--color-textMuted)',
              border: `1px solid ${selectedSize && isStockAvailable ? 'var(--color-primary)' : 'var(--color-border)'}`
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            {!selectedSize 
              ? 'Select a Size' 
              : !isStockAvailable
              ? 'Out of Stock'
              : `Add to Cart • ₹${(product.price * quantity).toLocaleString()}`}
          </button>

          {/* Wishlist Button - Integrated */}
          {userId && token && (
            <button 
              onClick={onWishlistToggle}
              disabled={wishlistLoading}
              className="px-4 py-4 rounded-lg transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <Heart 
                className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
                style={{ color: isWishlisted ? '#ef4444' : 'var(--color-text)' }}
              />
            </button>
          )}
        </div>

        <button
          onClick={onBuyNow}
          disabled={!selectedSize || !isStockAvailable}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedSize && isStockAvailable
              ? 'hover:opacity-90'
              : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            backgroundColor: selectedSize && isStockAvailable ? '#10b981' : 'var(--color-surface)',
            color: selectedSize && isStockAvailable ? 'white' : 'var(--color-textMuted)',
            border: `1px solid ${selectedSize && isStockAvailable ? '#10b981' : 'var(--color-border)'}`
          }}
        >
          <Zap className="w-5 h-5" />
          Buy Now
        </button>
      
      </div>
    </div>
  );
};

export default ProductActions;
