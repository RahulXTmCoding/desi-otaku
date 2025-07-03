import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Trash2, Star } from 'lucide-react';
import { API } from '../backend';
import { addItemToCart } from '../core/helper/cartHelper';
import { toggleWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  photoUrl?: string;
  stock?: number;
  category?: {
    _id: string;
    name: string;
  };
  rating?: number;
  reviews?: number;
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
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wishlistState, setWishlistState] = useState(isInWishlist);

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  // Generate image URL with fallback
  const getImageUrl = () => {
    if (imageError) {
      // Use a data URL for placeholder
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%236B7280"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    
    if (product.photoUrl) {
      // If photoUrl is a full URL (from cloudinary, etc)
      if (product.photoUrl.startsWith('http')) {
        return product.photoUrl;
      }
      // If it's a relative API path
      if (product.photoUrl.startsWith('/api/')) {
        return `${API}${product.photoUrl.substring(4)}`; // Remove /api prefix and add API base URL
      }
      // If it's any other relative path
      return product.photoUrl;
    }
    
    // Default to API photo endpoint
    return `${API}/product/photo/${product._id}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      size: 'M',
      color: 'Default',
      colorValue: '#000000',
      quantity: 1,
      type: 'product',
      image: getImageUrl()
    };
    
    addItemToCart(cartItem, () => {
      // Optional: Show success message
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !token) {
      // Redirect to login or show message
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

  return (
    <div className={`bg-gray-800/50 backdrop-blur rounded-xl overflow-hidden hover:bg-gray-800/70 transition-all group ${className}`}>
      <Link to={`/product/${product._id}`} className="block">
        {/* Image Container */}
        <div className="aspect-square bg-gray-700 relative overflow-hidden">
          <img 
            src={getImageUrl()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            {showCartButton && product.stock !== 0 && (
              <button
                onClick={handleAddToCart}
                className="p-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full transition-colors"
                title="Add to Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
            
            {showQuickView && (
              <Link
                to={`/product/${product._id}`}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                title="View Details"
              >
                <Eye className="w-5 h-5 text-white" />
              </Link>
            )}
            
            {showWishlistButton && (
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
          
          {/* Sale/New Badge */}
          {product.category?.name && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
              {product.category.name}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-yellow-400 transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
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
            <span className="text-2xl font-bold text-yellow-400">₹{product.price}</span>
            {product.stock !== undefined && product.stock > 0 && product.stock < 10 && (
              <span className="text-orange-400 text-sm">Only {product.stock} left!</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductGridItem;
