import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
import { API } from '../../backend';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  stock: number;
  sold: number;
  isNew?: boolean;
  rating?: number;
  discount?: number;
}

interface EnhancedProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
  onAddToWishlist
}) => {
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const getProductImage = () => {
    return `${API}/product/image/${product._id}`;
  };

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-400/50 transition-all duration-300">
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
        {product.isNew && (
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            NEW
          </span>
        )}
        {discountPercentage > 0 && (
          <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onAddToWishlist?.(product);
        }}
        className="absolute top-2 right-2 z-10 p-2 bg-gray-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-400 hover:text-gray-900"
      >
        <Heart className="w-4 h-4" />
      </button>

      {/* Product Image */}
      <Link to={`/product/${product._id}`}>
        <div className="relative h-64 overflow-hidden bg-gray-700">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/api/placeholder/300/350';
            }}
          />
          
          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product);
              }}
              className="bg-white text-gray-900 p-3 rounded-full hover:bg-yellow-400 transition-colors"
              title="Quick View"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(product);
              }}
              className="bg-white text-gray-900 p-3 rounded-full hover:bg-yellow-400 transition-colors"
              title="Add to Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-white mb-2 hover:text-yellow-400 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating!) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-600'
                }`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">
              ({product.sold} sold)
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-yellow-400">
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.stock < 10 && product.stock > 0 && (
          <p className="text-xs text-orange-400 mt-2">
            Only {product.stock} left in stock!
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-400 mt-2">
            Out of Stock
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedProductCard;
