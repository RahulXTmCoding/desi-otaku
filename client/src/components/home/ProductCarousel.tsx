import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductGridItem from '../ProductGridItem';

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
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
  loading?: boolean;
  onQuickView: (product: Product) => void;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  products,
  viewAllLink,
  loading,
  onQuickView
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Desktop: 4 items, Tablet: 2 items, Mobile: 1 item
  const itemsPerView = {
    desktop: 4,
    tablet: 2,
    mobile: 1
  };

  const maxIndex = Math.max(0, products.length - itemsPerView.desktop);

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(maxIndex, currentIndex + 1));
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-64 bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If we have 4 or fewer products, just show them all without carousel
  if (products.length <= 4) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          {viewAllLink && (
            <Link 
              to={viewAllLink}
              className="text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-2"
            >
              View All
              <ChevronRight className="w-5 h-5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductGridItem 
              key={product._id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="text-yellow-400 hover:text-yellow-300 font-medium flex items-center gap-2"
          >
            View All
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 backdrop-blur-sm p-3 rounded-full shadow-lg transition-all ${
            currentIndex === 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-700/90 hover:scale-110'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 backdrop-blur-sm p-3 rounded-full shadow-lg transition-all ${
            currentIndex >= maxIndex 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-700/90 hover:scale-110'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Products Container */}
        <div className="mx-16"> {/* Margin for nav buttons */}
          
          {/* Desktop View (4 items) - Only show exactly 4 cards */}
          <div className="hidden lg:block overflow-hidden">
            <div className="grid grid-cols-4 gap-6">
              {products.slice(currentIndex, currentIndex + 4).map((product) => (
                <ProductGridItem 
                  key={product._id}
                  product={product}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>

          {/* Tablet View (2 items) - Only show exactly 2 cards */}
          <div className="hidden sm:block lg:hidden overflow-hidden">
            <div className="grid grid-cols-2 gap-6">
              {products.slice(currentIndex, currentIndex + 2).map((product) => (
                <ProductGridItem 
                  key={product._id}
                  product={product}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>

          {/* Mobile View (1 item) - Only show exactly 1 card */}
          <div className="block sm:hidden overflow-hidden">
            <div className="grid grid-cols-1 gap-6">
              {products.slice(currentIndex, currentIndex + 1).map((product) => (
                <ProductGridItem 
                  key={product._id}
                  product={product}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        {products.length > 4 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentIndex === i 
                    ? 'bg-yellow-400 scale-125' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCarousel;
