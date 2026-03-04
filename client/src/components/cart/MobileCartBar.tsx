import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface MobileCartBarProps {
  itemCount: number;
  totalPrice: number;
}

const MobileCartBar: React.FC<MobileCartBarProps> = ({ itemCount, totalPrice }) => {
  const navigate = useNavigate();

  const bar = (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0"
      style={{
        backgroundColor: 'var(--color-background)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.18)',
        zIndex: 200,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="px-4 pt-3 pb-3 flex items-center gap-3">
        {/* Price summary */}
        {/* <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
          <p className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
            ₹{totalPrice.toLocaleString('en-IN')}
          </p>
        </div> */}

        {/* Continue Shopping */}
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] whitespace-nowrap"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          Continue Shopping
        </button>

        {/* Checkout button */}
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] whitespace-nowrap"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primaryText)',
          }}
        >
          Proceed to Checkout
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return createPortal(bar, document.body);
};

export default MobileCartBar;
