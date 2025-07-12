import React, { useState, useEffect, useRef } from 'react';
import { getSimilarProducts } from '../core/helper/shopApiCalls';
import { getProducts } from '../core/helper/coreapicalls';
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
  stock: number;
  sold: number;
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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Load when the container is 200px away from being visible
        if (entry.isIntersecting && !hasLoaded) {
          loadRelatedProducts();
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
  }, [hasLoaded, currentProductId]);

  const loadRelatedProducts = async () => {
    if (hasLoaded || isLoading) return;
    
    setIsLoading(true);
    
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
        
        setRelatedProducts(related);
      }
    } else {
      // Use the similar products API
      try {
        const data = await getSimilarProducts(currentProductId, 4);
        if (data && data.products) {
          setRelatedProducts(data.products);
        } else if (data && data.error) {
          console.error('Error loading similar products:', data.error);
          // Fallback to random products
          await loadRandomProducts();
        }
      } catch (err) {
        console.error('Error loading similar products:', err);
        // Fallback to random products
        await loadRandomProducts();
      }
    }
    
    setIsLoading(false);
    setHasLoaded(true);
  };
  
  const loadRandomProducts = async () => {
    try {
      const data = await getProducts();
      if (data && !data.error) {
        const related = data
          .filter((p: Product) => p._id !== currentProductId)
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (err) {
      console.error('Error loading random products:', err);
    }
  };

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
    <div ref={containerRef} className="mt-16">
      <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
      
      {isLoading && (
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
      
      {!isLoading && relatedProducts.length > 0 && (
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
      
      {!isLoading && relatedProducts.length === 0 && hasLoaded && (
        <div className="text-center py-8 text-gray-400">
          <p>No related products found</p>
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
