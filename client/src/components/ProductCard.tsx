import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toggleWishlist, isInWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';
import { generateLightColorWithOpacity } from '../utils/colorUtils';

interface ProductCardProps {
  product: any;
  showActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showActions = true }) => {
  const [isInCart, setIsInCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    checkWishlistStatus();
  }, []);

  const checkWishlistStatus = async () => {
    if (userId && token) {
      try {
        const result = await isInWishlist(userId, token, product._id);
        setIsWishlisted(result.isInWishlist);
      } catch (err) {
        console.error('Error checking wishlist status:', err);
      }
    }
  };

  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    try {
      // Default to first available size or M
      const availableSizes = getAvailableSizes();
      const defaultSize = availableSizes.length > 0 ? availableSizes[0] : 'M';
      
      await addToCart({
        product: product._id,
        name: product.name,
        size: defaultSize,
        color: 'Black', // Default color
        price: product.price,
        quantity: 1,
        isCustom: false
      });
      
      setIsInCart(true);
      setTimeout(() => setIsInCart(false), 2000);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      // Show inventory error message to user
      alert(error.message || 'Unable to add to cart. Please check product availability.');
    }
  };

  const handleWishlistToggle = async () => {
    if (!userId || !token) {
      // Redirect to login or show message
      alert('Please login to add items to wishlist');
      return;
    }

    setLoading(true);
    try {
      const result = await toggleWishlist(userId, token, product._id);
      if (!result.error) {
        setIsWishlisted(!isWishlisted);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    if (product.photoUrl) return product.photoUrl;
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      if (primaryImage.url) {
        return primaryImage.url;
      } else {
        // For file uploads, we need to get the image from the backend
        const imageIndex = product.images.indexOf(primaryImage);
        return `${API}/product/image/${product._id}/${imageIndex}`;
      }
    }
    // Fallback to default endpoint which returns primary image
    return `${API}/product/image/${product._id}`;
  };

  const getSecondImageUrl = () => {
    if (product.images && product.images.length > 1) {
      const secondImage = product.images.find(img => !img.isPrimary) || product.images[1];
      if (secondImage.url) {
        return secondImage.url;
      } else {
        const imageIndex = product.images.indexOf(secondImage);
        return `${API}/product/image/${product._id}/${imageIndex}`;
      }
    }
    return null;
  };

  const hasSecondImage = () => {
    return product.images && product.images.length > 1;
  };

  const getAvailableSizes = () => {
    if (!product.inventory) return [];
    return ['S', 'M', 'L', 'XL', 'XXL'].filter(size => 
      product.inventory[size] && product.inventory[size].stock > 0
    );
  };

  const isOutOfStock = () => {
    return product.stock === 0 || getAvailableSizes().length === 0;
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-105">
      {/* Image Container */}
      <div 
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: generateLightColorWithOpacity(product._id, 0.2) }}
      >
        <Link to={`/product/${product._id}`} className="relative block w-full h-full">
          {/* Primary Image */}
          <img
            src={getImageUrl()}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              hasSecondImage() ? 'group-hover:opacity-0' : 'group-hover:scale-110'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png';
              (e.target as HTMLImageElement).onerror = null;
            }}
          />
          
          {/* Second Image (if available) */}
          {hasSecondImage() && (
            <img
              src={getSecondImageUrl()!}
              alt={`${product.name} - Alternative view`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </Link>

        {/* Mobile Action Buttons - Always visible on right bottom */}
        {showActions && (
          <div className="absolute bottom-2 right-1 flex flex-col gap-1.5 sm:hidden z-10">
            {/* Note: ProductCard doesn't have onQuickView prop, so we keep the Link for now */}
            <Link
              to={`/product/${product._id}`}
              className="p-2 bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-sm rounded-full transition-all shadow-lg border border-gray-600/50"
              title="View Details"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-3 h-3 text-white" />
            </Link>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle();
              }}
              disabled={loading}
              className={`p-2 backdrop-blur-sm rounded-full transition-all shadow-lg border border-gray-600/50 ${
                isWishlisted
                  ? 'bg-red-500/90 hover:bg-red-600/90'
                  : 'bg-gray-800/90 hover:bg-gray-700/90'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3 h-3 text-white ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isOutOfStock()}
              className="p-2 bg-yellow-400/90 hover:bg-yellow-500/90 backdrop-blur-sm rounded-full transition-all shadow-lg border border-yellow-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
            >
              <ShoppingCart className="w-3 h-3 text-gray-900" />
            </button>
          </div>
        )}

        {/* Desktop Action Buttons on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end justify-center pb-4 gap-3 hidden sm:flex">
          {showActions && (
            <>
              <Link
                to={`/product/${product._id}`}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                title="View Details"
              >
                <Eye className="w-5 h-5" />
              </Link>

              <button
                onClick={handleWishlistToggle}
                disabled={loading}
                className={`p-3 rounded-full transition-all ${
                  isWishlisted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock()}
                className="p-3 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
              >
                <ShoppingCart className="w-5 h-5 text-gray-900" />
              </button>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isOutOfStock() && (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
              Out of Stock
            </span>
          )}
          {product.totalReviews > 0 && (
            <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-semibold rounded-full flex items-center gap-1">
              ⭐ {product.averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link 
          to={`/product/${product._id}`}
          className="block hover:text-yellow-400 transition-colors"
        >
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
        </Link>
        
        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
          {product.description}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700/50 text-xs rounded text-gray-300"
              >
                #{tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Compact Quantity Discount Badge - if AOV context is available */}
        {typeof window !== 'undefined' && (
          <div className="mt-2 p-1.5 bg-blue-500/10 rounded border border-blue-500/20 hidden sm:block">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-medium text-blue-400 flex-shrink-0">Bulk:</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                3+ = 5% off
              </span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                5+ = 10% off
              </span>
              <span className="text-xs text-blue-300">
                +1 more
              </span>
            </div>
          </div>
        )}

        {/* Available Sizes */}
        {!isOutOfStock() && (
          <div className="flex gap-1 mt-3">
            {getAvailableSizes().map(size => (
              <span
                key={size}
                className="px-2 py-1 bg-gray-700 text-xs rounded"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            {/* MRP and Selling Price */}
            <div className="flex items-center gap-2">
              {product.mrp && product.mrp > product.price ? (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.mrp}
                  </span>
                  <span className="text-lg font-bold text-yellow-400">
                    ₹{product.price}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-yellow-400">
                  ₹{product.price}
                </span>
              )}
            </div>
            
            {/* Discount Badge */}
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-green-400 font-medium">
                Save ₹{product.mrp - product.price} ({Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off)
              </span>
            )}
          </div>
          
          {isInCart && (
            <span className="text-green-500 text-sm animate-pulse">
              Added to cart!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
