import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ManageProductVariants from './ManageProductVariants';
import { getProduct } from '../core/helper/coreapicalls';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts } from '../data/mockData';

const ProductVariantsPage: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId, isTestMode]);

  const loadProduct = async () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      const mockProduct = mockProducts.find(p => p._id === productId);
      if (mockProduct) {
        setProduct(mockProduct);
      }
      setLoading(false);
    } else {
      // Use real backend
      try {
        const data = await getProduct(productId!);
        if (data && !data.error) {
          setProduct(data);
        }
      } catch (err) {
        console.error('Error loading product:', err);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Product not found</p>
          <button
            onClick={() => navigate('/admin/products')}
            className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Products
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Product Variants</h1>
          <p className="text-gray-400">Configure color variants and stock levels</p>
        </div>

        {/* Variants Component */}
        <ManageProductVariants 
          productId={productId!} 
          productName={product.name} 
        />

        {/* Mode Indicator */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {isTestMode ? (
            <p>Test Mode: Variants won't persist after refresh</p>
          ) : (
            <p>Backend Mode: Connected to server</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductVariantsPage;
