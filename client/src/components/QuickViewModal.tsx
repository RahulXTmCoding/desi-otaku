import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Reset current image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
  }, [product]);

  if (!isOpen || !product) return null;

  // Get all images for the product
  const getAllImages = () => {
    const images = [];
    
    // Check if product has multiple images
    if ((product as any).images && (product as any).images.length > 0) {
      (product as any).images.forEach((img: any, index: number) => {
        if (img.url) {
          images.push(img.url);
        } else {
          images.push(`${API}/product/image/${product._id}/${index}`);
        }
      });
    } else if (product.photoUrl) {
      // Single image from photoUrl
      if (product.photoUrl.startsWith('http')) {
        images.push(product.photoUrl);
      } else if (product.photoUrl.startsWith('/api/')) {
        images.push(`${API}${product.photoUrl.substring(4)}`);
      } else {
        images.push(product.photoUrl);
      }
    } else {
      // Default image URL
      images.push(`${API}/product/image/${product._id}`);
    }
    
    return images;
  };

  const productImages = getAllImages();
  const hasMultipleImages = productImages.length > 1;

  const getImageUrl = () => {
    if (imageError) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23374151"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%236B7280"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    
    return productImages[currentImageIndex] || productImages[0];
  };

  const handlePreviousImage = () => {
    setImageError(false);
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const handleNextImage = () => {
    setImageError(false);
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
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
        <div className="relative bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
            {/* Image Section */}
            <div className="md:w-1/2 bg-gray-900 p-4 sm:p-6 lg:p-8">
              <div className="aspect-square relative group">
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
                
                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setImageError(false);
                            setCurrentImageIndex(index);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'bg-white w-8' 
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="md:w-1/2 p-4 sm:p-6 lg:p-8">
              {/* Category */}
              {product.category?.name && (
                <span className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  {product.category.name}
                </span>
              )}

              {/* Product Name */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">{product.name}</h2>

              {/* Price */}
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-400 mb-4">₹{product.price}</p>

              {/* Description */}
              {product.description && (
                <p className="text-gray-300 mb-6">{product.description}</p>
              )}

              {/* Size Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">SELECT SIZE</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!isSizeAvailable(size)}
                      className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all ${
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
                    className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                  <span className="w-12 sm:w-16 text-center text-lg sm:text-xl font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || product.stock === 0}
                  className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                    selectedSize && product.stock !== 0
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5" />
                  {product.stock === 0 ? 'Out of Stock' : selectedSize ? 'Add to Cart' : 'Select Size'}
                </button>
                <button
                  onClick={handleWishlistToggle}
                  disabled={isLoading}
                  className={`w-full sm:w-auto p-2.5 sm:p-3 rounded-lg transition-colors ${
                    wishlistState 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Heart className={`w-4 sm:w-5 h-4 sm:h-5 ${wishlistState ? 'fill-white' : ''} text-white mx-auto`} />
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
