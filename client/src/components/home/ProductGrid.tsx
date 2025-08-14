import React from 'react';
import { ChevronRight } from 'lucide-react';
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

interface ProductGridProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
  loading?: boolean;
  onQuickView: (product: Product) => void;
  maxItems?: number;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  title,
  products,
  viewAllLink,
  loading,
  onQuickView,
  maxItems = 8
}) => {
  // Limit products to display
  const displayProducts = products.slice(0, maxItems);

  if (loading) {
  return (
    <div className="mb-8 sm:mb-12 lg:mb-16">
        {/* Enhanced Section Header */}
        <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          {title}
        </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* Loading Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 animate-pulse border border-gray-700">
              <div className="h-64 bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-3"></div>
              <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 sm:mb-12 lg:mb-16">
      {/* Enhanced Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full mb-3"></div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Discover our latest collection of premium designs and trending styles
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mb-10">
        {displayProducts.map((product, index) => (
          <div
            key={product._id}
            className="transform transition-all duration-500 hover:scale-105 animate-fade-in-up"
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <ProductGridItem 
              product={product}
              onQuickView={onQuickView}
            />
          </div>
        ))}
      </div>

      {/* View All Button */}
      {viewAllLink && (
        <div className="text-center">
          <Link 
            to={viewAllLink}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span>View All Products</span>
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
