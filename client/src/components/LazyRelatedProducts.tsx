import React, { useState, useEffect, useRef } from 'react';
import { useSimilarProducts } from '../hooks/useProducts';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts } from '../data/mockData';
import ProductGridItem from './ProductGridItem';
import QuickViewModal from './QuickViewModal';

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  stock?: number;
  totalStock?: number;
  sold: number;
  similarityScore?: number;
}

interface LazyRelatedProductsProps {
  currentProductId: string;
  onQuickView?: (product: Product) => void;
}

const LazyRelatedProducts: React.FC<LazyRelatedProductsProps> = ({ 
  currentProductId,
  onQuickView 
}) => {
  const { isTestMode } = useDevMode();
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use React Query hook - only enabled when component is visible
  const { 
    data: similarProductsData, 
    isLoading, 
    error,
    isFetched 
  } = useSimilarProducts(
    isIntersecting && !isTestMode ? currentProductId : '', 
    4
  );

  // Setup intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      {
        // Start loading when the element is 200px before coming into view
        rootMargin: '200px',
        threshold: 0
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Get products to display
  const getProductsToDisplay = (): Product[] => {
    if (isTestMode) {
      // In test mode, show products from same category
      const currentProduct = mockProducts.find(p => p._id === currentProductId);
      if (currentProduct) {
        const related = mockProducts
          .filter(p => p._id !== currentProductId && p.category._id === currentProduct.category._id)
          .slice(0, 4);
        
        // If not enough from same category, add random ones
        if (related.length < 4) {
          const additional = mockProducts
            .filter(p => p._id !== currentProductId && !related.includes(p))
            .slice(0, 4 - related.length);
          related.push(...additional);
        }
        
        return related;
      }
      return [];
    }

    // Return React Query data if available
    return similarProductsData?.products || [];
  };

  const relatedProducts = getProductsToDisplay();
  const showLoading = isLoading && isIntersecting;
  const showNoResults = !showLoading && relatedProducts.length === 0 && (isFetched || isTestMode);

  const handleQuickView = (product: Product) => {
    if (onQuickView) {
      onQuickView(product);
    } else {
      setSelectedProduct(product);
      setIsQuickViewOpen(true);
    }
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div ref={containerRef} className="mt-6 mb-6">
      <h2 className="text-2xl font-bold mb-8">
        You May Also Like
        {similarProductsData?.cached && (
          <span className="text-sm text-green-400 ml-2">
            ⚡ Cached
          </span>
        )}
      </h2>
      
      {/* Loading State */}
      {showLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-700"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Products Grid */}
      {!showLoading && relatedProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.map((product) => (
            <ProductGridItem 
              key={product._id} 
              product={product}
              onQuickView={handleQuickView}
            />
          ))}
        </div>
      )}
      
      {/* No Results */}
      {showNoResults && (
        <div className="text-center py-8 text-gray-400">
          <p>No related products found</p>
          {error && (
            <p className="text-sm mt-2 text-red-400">
              Failed to load recommendations
            </p>
          )}
        </div>
      )}

      {/* Quick View Modal */}
      {!onQuickView && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={isQuickViewOpen}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  );
};

export default LazyRelatedProducts;
