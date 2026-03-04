import React from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Zap, Plus, Minus } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  isFreeSize?: boolean;
  sizeStock?: {
    [key: string]: number;
  };
}

interface SizeChartData {
  measurements: any[];
  [key: string]: any;
}

interface MobileBottomBarProps {
  product: Product;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isFreeSize?: boolean;
  sizeChartData?: SizeChartData | null;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  product,
  selectedSize,
  setSelectedSize,
  quantity,
  setQuantity,
  onAddToCart,
  onBuyNow,
  isFreeSize = false,
  sizeChartData = null,
}) => {
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const getDisplaySizes = (): string[] => {
    if (isFreeSize || product.isFreeSize) return [];
    if (sizeChartData?.measurements && sizeChartData.measurements.length > 0) {
      return sizeChartData.measurements.map((m: any) => m.size).filter(Boolean);
    }
    return defaultSizes;
  };

  const displaySizes = getDisplaySizes();
  const showSizes = displaySizes.length > 0;

  const selectedSizeStock = selectedSize && product.sizeStock
    ? product.sizeStock[selectedSize] ?? 0
    : product.stock;

  const isStockAvailable = (isFreeSize || product.isFreeSize)
    ? product.stock > 0
    : !!(selectedSize && selectedSizeStock > 0);

  const isSizeAvailable = (size: string) =>
    product.sizeStock ? (product.sizeStock[size] ?? 0) > 0 : product.stock > 0;

  const canAct = isFreeSize || product.isFreeSize ? product.stock > 0 : isStockAvailable;

  const totalPrice = (product.price * quantity).toLocaleString('en-IN');

  const maxQty = selectedSize && product.sizeStock
    ? product.sizeStock[selectedSize] ?? 0
    : product.stock;

  const bar = (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0"
      style={{
        backgroundColor: 'var(--color-background)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.18)',
        zIndex: 200,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Row 1: Size pills + Qty stepper */}
      {showSizes && (
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
          <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar min-w-0">
            {displaySizes.map((size) => {
              const available = isSizeAvailable(size);
              const selected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => available && setSelectedSize(size)}
                  disabled={!available}
                  className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all active:scale-95"
                  style={{
                    backgroundColor: selected ? 'var(--color-primary)' : 'transparent',
                    borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                    color: selected ? 'var(--color-primaryText)' : available ? 'var(--color-text)' : 'var(--color-textMuted)',
                    opacity: available ? 1 : 0.35,
                  }}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex-shrink-0 h-6 w-px" style={{ backgroundColor: 'var(--color-border)' }} />

          {/* Qty stepper */}
          <div className="flex-shrink-0 flex items-center gap-1 rounded-lg px-1" style={{ border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center transition-all active:scale-90"
              style={{ color: quantity <= 1 ? 'var(--color-textMuted)' : 'var(--color-text)', opacity: quantity <= 1 ? 0.35 : 1 }}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold w-4 text-center select-none" style={{ color: 'var(--color-text)' }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
              disabled={!canAct || quantity >= maxQty}
              className="w-7 h-7 flex items-center justify-center transition-all active:scale-90"
              style={{ color: !canAct || quantity >= maxQty ? 'var(--color-textMuted)' : 'var(--color-primary)', opacity: !canAct || quantity >= maxQty ? 0.35 : 1 }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Free-size: qty only row */}
      {!showSizes && (
        <div className="flex items-center justify-end px-3 pt-2.5 pb-2 gap-2">
          <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>Qty</span>
          <div className="flex items-center gap-1 rounded-lg px-1" style={{ border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center transition-all active:scale-90"
              style={{ color: quantity <= 1 ? 'var(--color-textMuted)' : 'var(--color-text)', opacity: quantity <= 1 ? 0.35 : 1 }}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold w-4 text-center select-none" style={{ color: 'var(--color-text)' }}>
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
              disabled={!canAct || quantity >= maxQty}
              className="w-7 h-7 flex items-center justify-center transition-all active:scale-90"
              style={{ color: !canAct || quantity >= maxQty ? 'var(--color-textMuted)' : 'var(--color-primary)', opacity: !canAct || quantity >= maxQty ? 0.35 : 1 }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Row 2: Action Buttons */}
      <div
        className="px-3 pb-3 pt-2 flex gap-2"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <button
          onClick={onAddToCart}
          disabled={!canAct}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-s font-semibold transition-all active:scale-[0.97] ${
            canAct ? '' : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            backgroundColor: canAct ? 'var(--color-primary)' : 'var(--color-surface)',
            color: canAct ? 'var(--color-primaryText)' : 'var(--color-textMuted)',
            border: `1px solid ${canAct ? 'var(--color-primary)' : 'var(--color-border)'}`,
          }}
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {!selectedSize && showSizes ? 'Select Size' : !isStockAvailable ? 'Out of Stock' : `Add to Cart · ₹${totalPrice}`}
          </span>
        </button>

        <button
          onClick={onBuyNow}
          disabled={!canAct}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-s  font-semibold transition-all active:scale-[0.97] ${
            canAct ? '' : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            backgroundColor: canAct ? 'var(--color-success)' : 'var(--color-surface)',
            color: canAct ? '#fff' : 'var(--color-textMuted)',
            border: `1px solid ${canAct ? 'var(--color-success)' : 'var(--color-border)'}`,
          }}
        >
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span>{!selectedSize && showSizes ? 'Select Size' : 'Buy Now'}</span>
        </button>
      </div>
    </div>
  );

  return createPortal(bar, document.body);
};

export default MobileBottomBar;
