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
  const itemsPerView = 4; // Number of items to show at once
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - itemsPerView));
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(maxIndex, currentIndex + itemsPerView));
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
        {products.length > itemsPerView && (
          <>
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 p-2 rounded-full shadow-lg transition-all ${
                currentIndex === 0 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-700'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 p-2 rounded-full shadow-lg transition-all ${
                currentIndex >= maxIndex 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-700'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Products Grid */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-in-out gap-6"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
          >
            {products.map((product) => (
              <div key={product._id} className="w-full sm:w-1/2 lg:w-1/4 flex-shrink-0">
                <ProductGridItem 
                  product={product}
                  onQuickView={onQuickView}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;
