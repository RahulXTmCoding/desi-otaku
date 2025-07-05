import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toggleWishlist, isInWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';

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
    } catch (error) {
      console.error('Failed to add to cart:', error);
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
      return primaryImage.url;
    }
    return `${API}/product/photo/${product._id}`;
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
      <div className="relative aspect-square overflow-hidden bg-gray-700">
        <Link to={`/product/${product._id}`}>
          <img
            src={getImageUrl()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png';
              (e.target as HTMLImageElement).onerror = null;
            }}
          />
        </Link>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
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
          <span className="text-2xl font-bold text-yellow-400">
            ₹{product.price}
          </span>
          
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
