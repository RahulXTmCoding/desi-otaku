import React, { useState } from 'react';
import { X, ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { API } from '../backend';
import { useCart } from '../context/CartContext';
import { toggleWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { Link } from 'react-router-dom';

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
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

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isInWishlist?: boolean;
  onWishlistToggle?: (productId: string) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  isInWishlist = false,
  onWishlistToggle
}) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [wishlistState, setWishlistState] = useState(isInWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  if (!isOpen || !product) return null;

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
      const primaryImage = (product as any).images.find((img: any) => img.isPrimary) || (product as any).images[0];
      if (primaryImage.url) {
        return primaryImage.url;
      } else {
        const imageIndex = (product as any).images.indexOf(primaryImage);
        return `${API}/product/image/${product._id}/${imageIndex}`;
      }
    }
    
    return `${API}/product/image/${product._id}`;
  };

  const handleImageError = () => {
    setImageError(true);
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

  const handleAddToCart = async () => {
    if (!selectedSize) return;

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
      onClose();
      setSelectedSize('');
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleWishlistToggle = async () => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-900 p-8">
              <div className="aspect-square relative">
                <img 
                  src={getImageUrl()}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-lg"
                  onError={handleImageError}
                />
                {product.stock === 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-8">
              {/* Category */}
              {product.category?.name && (
                <span className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  {product.category.name}
                </span>
              )}

              {/* Product Name */}
              <h2 className="text-3xl font-bold mb-4">{product.name}</h2>

              {/* Price */}
              <p className="text-4xl font-bold text-yellow-400 mb-4">₹{product.price}</p>

              {/* Description */}
              {product.description && (
                <p className="text-gray-300 mb-6">{product.description}</p>
              )}

              {/* Size Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">SELECT SIZE</h3>
                <div className="grid grid-cols-5 gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!isSizeAvailable(size)}
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'bg-yellow-400 text-gray-900'
                          : isSizeAvailable(size)
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">QUANTITY</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center text-xl font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || product.stock === 0}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    selectedSize && product.stock !== 0
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock === 0 ? 'Out of Stock' : selectedSize ? 'Add to Cart' : 'Select Size'}
                </button>
                <button
                  onClick={handleWishlistToggle}
                  disabled={isLoading}
                  className={`p-3 rounded-lg transition-colors ${
                    wishlistState 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${wishlistState ? 'fill-white' : ''} text-white`} />
                </button>
              </div>

              {/* View Full Details Link */}
              <Link
                to={`/product/${product._id}`}
                onClick={onClose}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium inline-flex items-center gap-2"
              >
                View Full Details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
