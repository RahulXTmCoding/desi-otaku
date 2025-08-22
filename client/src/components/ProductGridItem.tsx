import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Trash2, Star, X, ChevronLeft, Plus, Minus, Zap, Tag } from 'lucide-react';
import { API } from '../backend';
import { useCart } from '../context/CartContext';
import { useAOV } from '../context/AOVContext';
import { toggleWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { generateLightColorWithOpacity } from '../utils/colorUtils';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  discount?: number;
  discountPercentage?: number;
  photoUrl?: string;
  stock?: number;
  totalStock?: number;
  category?: {
    _id: string;
    name: string;
  };
  rating?: number;
  reviews?: number;
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  sizeAvailability?: {
    S: boolean;
    M: boolean;
    L: boolean;
    XL: boolean;
    XXL: boolean;
  };
}

interface ProductGridItemProps {
  product: Product;
  showWishlistButton?: boolean;
  showCartButton?: boolean;
  showQuickView?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (productId: string) => void;
  isInWishlist?: boolean;
  onWishlistToggle?: (productId: string) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
}

const ProductGridItem: React.FC<ProductGridItemProps> = ({
  product,
  showWishlistButton = true,
  showCartButton = true,
  showQuickView = true,
  showRemoveButton = false,
  onRemove,
  isInWishlist = false,
  onWishlistToggle,
  onQuickView,
  className = ''
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistState, setWishlistState] = useState(isInWishlist);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { quantityTiers } = useAOV();

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Generate image URL with fallback
  const getImageUrl = () => {
    if (imageError) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%236B7280"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    
    if (product.photoUrl) {
      if (product.photoUrl.startsWith('http')) {
        return product.photoUrl;
      }
      if (product.photoUrl.startsWith('/api/')) {
        return `${API}${product.photoUrl.substring(4)}`;
      }
      return product.photoUrl;
    }
    
    if ((product as any).images && (product as any).images.length > 0) {
      
      const primaryImage = (product as any).images.find((img: any) => img.isPrimary);
       
      if (!primaryImage) {
        console.log("No primary image found, using first image");
      }
      
      const imageToUse = primaryImage || (product as any).images[0];
        
      if (imageToUse.url) {
        return imageToUse.url;
      } else {
        const imageIndex = (product as any).images.indexOf(imageToUse);
        const apiUrl = `${API}/product/image/${product._id}/${imageIndex}`;
        return apiUrl;
      }
    }
    
    return `${API}/product/image/${product._id}`;
  };

  const handleImageError = () => {
    setImageError(false);
  };

  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped(true);
  };

  const handleBackToFront = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFlipped(false);
    setSelectedSize('');
    setQuantity(1);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedSize && isFlipped) {
      return;
    }
    
    try {
      await addToCart({
        product: product._id,
        name: product.name,
        price: product.price,
        size: selectedSize || 'M',
        color: 'Black',
        quantity: quantity,
        isCustom: false
      });
      
      if (isFlipped) {
        handleBackToFront(e);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedSize) {
      return;
    }
    
    const buyNowItem = {
      _id: `buy-now-${Date.now()}`,
      product: product._id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: 'Black',
      quantity: quantity,
      isCustom: false,
      photoUrl: product.photoUrl || getImageUrl()
    };
    
    navigate('/checkout', {
      state: { buyNowItem }
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const isSizeAvailable = (size: string) => {
    if (product.sizeAvailability) {
      return product.sizeAvailability[size as keyof typeof product.sizeAvailability];
    }
    if (product.sizeStock) {
      return product.sizeStock[size as keyof typeof product.sizeStock] > 0;
    }
    return true;
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !token) {
      return;
    }

    setIsLoading(true);
    try {
      await toggleWishlist(user._id, token, product._id);
      setWishlistState(!wishlistState);
      if (onWishlistToggle) {
        onWishlistToggle(product._id);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove(product._id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if we're not on the flipped side
    if (!isFlipped) {
      // Check if the click was on the card itself, not on a button
      const target = e.target as HTMLElement;
      const isButton = target.closest('button');
      if (!isButton) {
        navigate(`/product/${product._id}`);
      }
    }
  };

  return (
    <div 
      className={`rounded-xl overflow-hidden transition-all group relative cursor-pointer ${className}`}
      style={{ backgroundColor: 'var(--color-surface)' }}
      onClick={handleCardClick}
    >
      {/* Card Container with Flip Effect */}
      <div 
        className={`relative transition-all duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        
        {/* Front of Card */}
        <div className="block" style={{ backfaceVisibility: 'hidden' }}>
          {/* Image Container - Taller on mobile for bigger images */}
          <div 
            className="aspect-[3.6/5] sm:aspect-square relative overflow-hidden"
            style={{ backgroundColor: generateLightColorWithOpacity(product._id, 0.2) }}
          >
            <img 
              src={getImageUrl()}
              alt={product.name}
              className="w-full h-full object-contain"
              onError={handleImageError}
              loading="lazy"
            />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              {showQuickView && onQuickView && (
                <button
                  onClick={handleQuickView}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                  title="Quick View"
                >
                  <Eye className="w-5 h-5 text-white" />
                </button>
              )}
              
              {showCartButton && (
                <button
                  onClick={handleQuickAddToCart}
                  className="p-3 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-colors"
                  title="Quick Add to Cart"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-900" />
                </button>
              )}
              
              {showWishlistButton && user && token && (
                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 rounded-full transition-colors ${
                    wishlistState 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  disabled={isLoading}
                  title={wishlistState ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart className={`w-5 h-5 ${wishlistState ? 'fill-white' : ''} text-white`} />
                </button>
              )}
              
              {showRemoveButton && (
                <button
                  onClick={handleRemove}
                  className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
            
            {/* Stock Badge */}
            {product.stock === 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Out of Stock
              </div>
            )}
            
            {/* Category Badge */}
            {/* {product.category?.name && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                {product.category.name}
              </div>
            )} */}
          </div>
          
          {/* Product Info */}
          <div className="p-3 sm:p-4">
            <Link to={`/product/${product._id}`}>
              <h3 className="font-semibold text-sm sm:text-lg mb-1 line-clamp-1 hover:text-yellow-400 transition-colors">
                {product.name}
              </h3>
            </Link>
            
            {product.description && (
              <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2 hidden sm:block">
                {product.description}
              </p>
            )}
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating!) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-400">({product.reviews || 0})</span>
              </div>
            )}
            
            {/* Price and Stock */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <span className="text-lg sm:text-2xl font-bold text-yellow-400">₹{product.price}</span>
                  {product.mrp && product.mrp > product.price && (
                    <>
                      <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.mrp}</span>
                      <span className="text-xs bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        {product.discountPercentage || Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-xs text-green-400">
                    Save ₹{product.discount || (product.mrp - product.price)}
                  </span>
                )}
              </div>
              {product.stock !== undefined && product.stock > 0 && product.stock < 10 && (
                <span className="text-orange-400 text-xs sm:text-sm">Only {product.stock} left!</span>
              )}
            </div>

            {/* Quantity Discount Badge - Hidden on mobile for space */}
            {quantityTiers.length > 0 && (
              <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 hidden sm:block">
                <div className="flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Bulk Discounts</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {quantityTiers.slice(0, 2).map((tier, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                    >
                      {tier.minQuantity}+ items: {tier.discount}% off
                    </span>
                  ))}
                  {quantityTiers.length > 2 && (
                    <span className="text-xs text-blue-400">
                      +{quantityTiers.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back of Card (Flipped) - Mobile Responsive */}
        <div 
          className="absolute inset-0 bg-gray-800 rounded-xl p-2 sm:p-4 flex flex-col [transform:rotateY(180deg)]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Back Button */}
          <button
            onClick={handleBackToFront}
            className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white mb-2 sm:mb-4 text-xs sm:text-sm"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Back
          </button>

          {/* Product Info */}
          <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-lg sm:text-2xl font-bold text-yellow-400 mb-2 sm:mb-4">₹{product.price}</p>

          {/* Size Selection */}
          <div className="mb-2 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Select Size:</p>
            <div className="grid grid-cols-5 sm:grid-cols-3 gap-1 sm:gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  disabled={!isSizeAvailable(size)}
                  className={`py-1 sm:py-2 px-0.5 sm:px-3 rounded text-xs sm:text-sm font-medium transition-all ${
                    selectedSize === size
                      ? 'bg-yellow-400 text-gray-900'
                      : isSizeAvailable(size)
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection - More compact on mobile */}
          <div className="mb-2 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">Quantity:</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <span className="w-8 sm:w-12 text-center text-sm sm:text-base">{quantity}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuantity(quantity + 1);
                }}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons - Stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={`flex-1 py-2 sm:py-3 rounded text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                selectedSize
                  ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{selectedSize ? 'Add to Cart' : 'Select Size'}</span>
              <span className="sm:hidden">{selectedSize ? 'Add' : 'Size'}</span>
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={!selectedSize}
              className={`flex-1 py-2 sm:py-3 rounded text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                selectedSize
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Buy Now</span>
              <span className="sm:hidden">Buy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGridItem;
