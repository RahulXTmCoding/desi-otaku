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
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  inventory?: {
    S?: { stock: number };
    M?: { stock: number };
    L?: { stock: number };
    XL?: { stock: number };
    XXL?: { stock: number };
  };
}

interface ProductInfoProps {
  product: Product;
  isFetching?: boolean;
  isLoading?: boolean;
  isTestMode?: boolean;
  isMobile?: boolean;
  defaultFeatures?: String[];
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  isFetching,
  isLoading,
  isTestMode,
  isMobile,
  defaultFeatures
}) => {
  // Use actual MRP if available, otherwise calculate for display
  const displayMRP = product.mrp && product.mrp > product.price ? product.mrp : Math.round(product.price * 1.33);
  const actualDiscount = product.mrp && product.mrp > product.price ? 
    Math.round(((product.mrp - product.price) / product.mrp) * 100) : 
    Math.round(((displayMRP - product.price) / displayMRP) * 100);
  const savings = displayMRP - product.price;

  const getAvailableSizes = () => {
    if (product.inventory) {
      return ['S', 'M', 'L', 'XL', 'XXL'].filter(size => 
        product.inventory![size as keyof typeof product.inventory] && 
        product.inventory![size as keyof typeof product.inventory]!.stock > 0
      );
    }
    if (product.sizeStock) {
      return ['S', 'M', 'L', 'XL', 'XXL'].filter(size => 
        product.sizeStock![size as keyof typeof product.sizeStock] > 0
      );
    }
    return [];
  };

  const isOutOfStock = () => {
    return product.stock === 0 || getAvailableSizes().length === 0;
  };

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
        <h1 className="flex items-center justify-between text-3xl font-bold display-inline" style={{ color: 'var(--color-text)' }}>
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
      {/* {isMobile?<></>:<div className="flex items-center gap-6 mb-6"> */}
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

        {/* <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--color-textMuted)' }}>
              Category:
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
              {product.category?.name}
            </span>
          </div>

          {isOutOfStock() && (
            <div className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
              <span className="text-sm font-bold text-red-400">
                Out of Stock
              </span>
            </div>
          )}

          
          <button 
              onClick={handleShare}
              className="flex items-center gap-1 text-sm transition-colors hover:opacity-80"
              style={{ color: 'var(--color-textMuted)' }}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
          </button>
        </div> */}
      {/* </div>} */}
      

      {/* Compact Dual Pricing Display */}
      <div>
        {/* MRP and Original Discount Info */}
        {(product.mrp && product.mrp > product.price) && (
          <div className="flex items-center gap-2 mb-3">
            {isMobile?<span className="font-bold" style={{ color: 'var(--color-success)' }}>
                ₹{Math.round(product.price * 0.95).toLocaleString('en-IN')}
            </span> :<></>}
            
            {/* MRP: ₹{product.mrp.toLocaleString('en-IN')} ({actualDiscount}% OFF)  */}
            <span className="text-base line-through" style={{ color: 'var(--color-textMuted)' }}>
              MRP ₹{product.mrp.toLocaleString('en-IN')}
            </span>
            <span className="px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
              {actualDiscount}% OFF
            </span>
            {!isMobile?<></>:<span>
            (COD price: ₹{product.price.toLocaleString('en-IN')})
            </span>}
          </div>
        )}

        {/* Compact Pricing Information */}
        {isMobile? <></>: 
        <div className="mb-3 display-none md:display-block">
          <div className="mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-textMuted)' }}>
              💰 Payment Options:
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-1.5 px-2 rounded text-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center gap-2">
                <span>💳</span>
                <span style={{ color: 'var(--color-text)' }}>Online Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: 'var(--color-success)' }}>
                  ₹{Math.round(product.price * 0.95).toLocaleString('en-IN')}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                  (-₹{Math.round(product.price * 0.05).toLocaleString('en-IN')})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 px-2 rounded text-sm">
              <div className="flex items-center gap-2">
                <span>🚚</span>
                <span style={{ color: 'var(--color-text)' }}>Cash on Delivery</span>
              </div>
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
}

{/*         
        {isMobile? <></>:(product.mrp && product.mrp > product.price) && (
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-success)' }}>
            🎉 Total savings: ₹{savings.toLocaleString('en-IN')} + ₹{Math.round(product.price * 0.05).toLocaleString('en-IN')} online discount
          </div>
        )}

        {isMobile?<></>:(!product.mrp || product.mrp <= product.price) && (
          <div className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
            ✨ Best price guaranteed with online savings
          </div>
        )} */}
      </div>
      <p style={{ color: 'var(--color-textMuted)' }}>
        {defaultFeatures.join('. ')}
      </p>
      </div>
      
  );
};

export default ProductInfo;
