import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Trash2, Star, X, ChevronLeft, Plus, Minus, Zap, Tag } from 'lucide-react';
import { API } from '../backend';
import { useCart } from '../context/CartContext';
import { useAOV } from '../context/AOVContext';
import { toggleWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { generateLightColorWithOpacity } from '../utils/colorUtils';
import { 
  getAvailableStock, 
  getCurrentCartQuantity
} from '../utils/inventoryUtils';

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { addToCart, cart } = useCart();
  const { quantityTiers } = useAOV();

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Helper functions for inventory validation
  const getMaxQuantityForSize = (size: string): number => {
    if (!selectedSize || !product.sizeStock) return 0;
    const availableStock = getAvailableStock(product, size);
    const currentCartQuantity = getCurrentCartQuantity(cart, product._id, size);
    return Math.max(0, availableStock - currentCartQuantity);
  };

  const isQuantityValid = (): boolean => {
    if (!selectedSize) return true;
    const maxQuantity = getMaxQuantityForSize(selectedSize);
    return quantity <= maxQuantity;
  };

  const getStockMessage = (): string => {
    if (!selectedSize) return '';
    const maxQuantity = getMaxQuantityForSize(selectedSize);
    if (maxQuantity === 0) {
      return `Size ${selectedSize} is out of stock`;
    } else if (quantity > maxQuantity) {
      return `Only ${maxQuantity} available in size ${selectedSize}`;
    }
    return '';
  };

  // Update error message when size or quantity changes
  useEffect(() => {
    if (selectedSize) {
      const message = getStockMessage();
      setErrorMessage(message);
    } else {
      setErrorMessage('');
    }
  }, [selectedSize, quantity, cart]);

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

  const getSecondImageUrl = () => {
    if ((product as any).images && (product as any).images.length > 1) {
      const secondImage = (product as any).images.find((img: any) => !img.isPrimary) || (product as any).images[1];
      if (secondImage.url) {
        return secondImage.url;
      } else {
        const imageIndex = (product as any).images.indexOf(secondImage);
        return `${API}/product/image/${product._id}/${imageIndex}`;
      }
    }
    return null;
  };

  const hasSecondImage = () => {
    return (product as any).images && (product as any).images.length > 1;
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
    
    if (!selectedSize || !isQuantityValid()) {
      return;
    }
    
    setIsAddingToCart(true);
    
    try {
      await addToCart({
        product: product._id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: 'Black',
        quantity: quantity,
        isCustom: false
      });
      
      if (isFlipped) {
        handleBackToFront(e);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Error handling is already implemented in CartContext
      // The addToCart function will show appropriate error messages
    } finally {
      setIsAddingToCart(false);
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
            {/* Primary Image */}
            <img 
              src={getImageUrl()}
              alt={product.name}
              className={`w-full h-full object-contain transition-all duration-500 ${
                hasSecondImage() ? 'group-hover:opacity-0' : 'group-hover:scale-110'
              }`}
              onError={handleImageError}
              loading="lazy"
            />
            
            {/* Second Image (if available) */}
            {hasSecondImage() && (
              <img
                src={getSecondImageUrl()!}
                alt={`${product.name} - Alternative view`}
                className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            
            {/* Mobile Action Buttons - Always visible on right bottom */}
            <div className="absolute bottom-2 right-1 flex flex-col gap-1.5 sm:hidden z-10">
              {/* Quick View Button - Shows modal like desktop */}
              {showQuickView && onQuickView && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickView(e);
                  }}
                  className="p-2 bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-sm rounded-full transition-all shadow-lg border border-gray-600/50"
                  title="Quick View"
                >
                  <Eye className="w-3 h-3 text-white" />
                </button>
              )}
              
              {showWishlistButton && user && token && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWishlistToggle(e);
                  }}
                  className={`p-2 backdrop-blur-sm rounded-full transition-all shadow-lg border border-gray-600/50 ${
                    wishlistState 
                      ? 'bg-red-500/90 hover:bg-red-600/90' 
                      : 'bg-gray-800/90 hover:bg-gray-700/90'
                  }`}
                  disabled={isLoading}
                  title={wishlistState ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart className={`w-3 h-3 ${wishlistState ? 'fill-white' : ''} text-white`} />
                </button>
              )}
              
              {showCartButton && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickAddToCart(e);
                  }}
                  className="p-2 bg-yellow-400/90 hover:bg-yellow-500/90 backdrop-blur-sm rounded-full transition-all shadow-lg border border-yellow-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Quick Add to Cart"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-3 h-3 text-gray-900" />
                </button>
              )}
              
              {showRemoveButton && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(e);
                  }}
                  className="p-2 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-sm rounded-full transition-all shadow-lg border border-red-400/50"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>

            {/* Desktop Action Buttons on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity items-end justify-center pb-4 gap-3 hidden sm:flex">
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
            
            {/* Stock Badge - Adjusted position for mobile buttons */}
            {product.stock === 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
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
              <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2">
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

            {/* Compact Quantity Discount Badge */}
            {quantityTiers.length > 0 && (
              <div className="mt-2 p-1.5 bg-blue-500/10 rounded border border-blue-500/20 hidden sm:block">
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-blue-400 flex-shrink-0">Bulk:</span>
                  {quantityTiers.slice(0, 2).map((tier, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded"
                    >
                      {tier.minQuantity}+ = {tier.discount}% off
                    </span>
                  ))}
                  {quantityTiers.length > 2 && (
                    <span className="text-xs text-blue-300">
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
                disabled={quantity <= 1}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={selectedSize && quantity >= getMaxQuantityForSize(selectedSize)}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          
          </div>
            {/* Stock Status Message */}
            {selectedSize && (
              <div className="mt-1">
                {errorMessage ? (
                  <p className="text-xs text-red-400">{errorMessage}</p>
                ) : (
                  <p className="text-xs text-green-400">
                    {getMaxQuantityForSize(selectedSize)} available
                  </p>
                )}
              </div>
            )}

          {/* Action Buttons - Stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize || !isQuantityValid() || isAddingToCart}
              className={`flex-1 py-2 sm:py-3 rounded text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                selectedSize && isQuantityValid() && !isAddingToCart
                  ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {!selectedSize 
                  ? 'Select Size' 
                  : !isQuantityValid() 
                  ? 'Invalid Qty' 
                  : isAddingToCart 
                  ? 'Adding...' 
                  : 'Add to Cart'}
              </span>
              <span className="sm:hidden">
                {!selectedSize 
                  ? 'Size' 
                  : !isQuantityValid() 
                  ? 'Invalid' 
                  : isAddingToCart 
                  ? '...' 
                  : 'Add'}
              </span>
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={!selectedSize || !isQuantityValid()}
              className={`flex-1 py-2 sm:py-3 rounded text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                selectedSize && isQuantityValid()
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {!selectedSize 
                  ? 'Select Size' 
                  : !isQuantityValid() 
                  ? 'Invalid Qty' 
                  : 'Buy Now'}
              </span>
              <span className="sm:hidden">
                {!selectedSize 
                  ? 'Size' 
                  : !isQuantityValid() 
                  ? 'Invalid' 
                  : 'Buy'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGridItem;
