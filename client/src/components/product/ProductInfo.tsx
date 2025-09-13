import React from 'react';
import { Star, Share2, Users, Loader } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  rating?: number;
  sold: number;
  stock: number;
  material?: string;
}

interface ProductInfoProps {
  product: Product;
  isFetching?: boolean;
  isLoading?: boolean;
  isTestMode?: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  isFetching,
  isLoading,
  isTestMode
}) => {
  // Use actual MRP if available, otherwise calculate for display
  const displayMRP = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.33);
  const actualDiscount = product.mrp && product.mrp > product.price ? 
    Math.round(((product.mrp - product.price) / product.mrp) * 100) : 
    Math.round(((displayMRP - product.price) / displayMRP) * 100);
  const savings = displayMRP - product.price;

  const handleShare = () => {
    const shareData = {
      title: product.name,
      text: `Check out this awesome ${product.name}!`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          {product.name}
        </h1>
        <div className="flex items-center gap-3">
          {!isTestMode && isFetching && !isLoading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-success)' }}>
              <Loader className="w-4 h-4 animate-spin" />
              <span>⚡ Updating</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Premium Rating and Social Proof */}
      <div className="flex items-center gap-6 mb-6">
        {/* <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating || 4.5)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
            {product.rating || 4.5} ({Math.floor(Math.random() * 50) + 20} reviews)
          </span>
        </div> */}
        
        {/* <span className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
          • {product.sold}+ sold this week
        </span> */}

         <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-textMuted)' }}>
            Category:
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
            {product.category?.name}
          </span>
        </div>

        <button 
          onClick={handleShare}
          className="flex items-center gap-1 text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--color-textMuted)' }}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Compact Dual Pricing Display */}
      <div>
        {/* MRP and Original Discount Info */}
        {(product.mrp && product.mrp > product.price) && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base line-through" style={{ color: 'var(--color-textMuted)' }}>
              MRP ₹{product.mrp.toLocaleString('en-IN')}
            </span>
            <span className="px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
              {actualDiscount}% OFF
            </span>
          </div>
        )}

        {/* Compact Dual Price Cards */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3">
          {/* Online Payment Price */}
          <div className="border-2 border-green-500 rounded-lg p-2 bg-green-500/10 relative">
            <div className="absolute top-1 right-1">
              <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">
                -5%
              </span>
            </div>
            <div className="mb-1">
              <span className="text-xs font-medium text-green-400">
                💳 Pay Online
              </span>
            </div>
            <div>
              <span className="text-lg md:text-2xl font-bold text-green-400">
                ₹{Math.round(product.price * 0.95).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* COD Price */}
          <div className="border rounded-lg p-2 md:p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div className="mb-1">
              <span className="text-xs font-medium" style={{ color: 'var(--color-textMuted)' }}>
                🚚 Cash on Delivery
              </span>
            </div>
            <div>
              <span className="text-lg md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Savings Summary */}
        {/* <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-2 mb-3">
          <span className="text-xs font-medium text-yellow-400">
            💰 Save ₹{Math.round(product.price * 0.05).toLocaleString('en-IN')} with online payment
          </span>
        </div> */}

        {/* Additional Savings from MRP */}
        {(product.mrp && product.mrp > product.price) && (
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-success)' }}>
            🎉 Total savings: ₹{savings.toLocaleString('en-IN')} + ₹{Math.round(product.price * 0.05).toLocaleString('en-IN')} online discount
          </div>
        )}

        {(!product.mrp || product.mrp <= product.price) && (
          <div className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
            ✨ Best price guaranteed with online savings
          </div>
        )}
      </div>
      <p className="mb-4 mt-4" style={{ color: 'var(--color-textMuted)' }}>{product.description}</p>
      </div>
      
  );
};

export default ProductInfo;
