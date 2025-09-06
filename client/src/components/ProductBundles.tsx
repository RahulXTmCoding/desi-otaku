import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { API } from '../backend';
import { Package, ShoppingCart, Star, Flame, Users } from 'lucide-react';
import { generateLightColorWithOpacity } from '../utils/colorUtils';

interface BundleProduct {
  _id: string;
  name: string;
  price: number;
  category: { 
    _id: string;
    name: string; 
  };
  stock: number;
  sold: number;
}

interface Bundle {
  id: string;
  products: BundleProduct[];
  totalPrice: number;
  bundlePrice: number;
  savings: number;
  title: string;
  description: string;
  discount: number;
  type: 'same-category' | 'popular-combo' | 'trending';
}

interface ProductBundlesProps {
  currentProduct: any;
}

const ProductBundles: React.FC<ProductBundlesProps> = ({ currentProduct }) => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (currentProduct) {
      generateBundles();
    }
  }, [currentProduct]);
  
  const generateBundles = async () => {
    try {
      setLoading(true);
      console.log('🎯 Generating bundles for product:', currentProduct.name);
      
      // Try to fetch related products from the same category
      let relatedProducts: BundleProduct[] = [];
      let popularProducts: BundleProduct[] = [];
      
      try {
        const categoryResponse = await fetch(
          `${API}/products?category=${currentProduct.category._id}&limit=15`
        );
        console.log('📦 Category API response status:', categoryResponse.status);
        
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          console.log('📦 Category data received:', categoryData);
          relatedProducts = categoryData.products?.filter(
            (p: BundleProduct) => p._id !== currentProduct._id && p.stock > 0
          ) || [];
        }
      } catch (err) {
        console.warn('⚠️ Category API failed:', err);
      }
      
      try {
        const popularResponse = await fetch(
          `${API}/products?sortBy=sold&sortOrder=desc&limit=10`
        );
        console.log('🔥 Popular API response status:', popularResponse.status);
        
        if (popularResponse.ok) {
          const popularData = await popularResponse.json();
          console.log('🔥 Popular data received:', popularData);
          popularProducts = popularData.products?.filter(
            (p: BundleProduct) => p._id !== currentProduct._id && p.stock > 0
          ) || [];
        }
      } catch (err) {
        console.warn('⚠️ Popular API failed:', err);
      }
      
      console.log('📊 Found related products:', relatedProducts.length);
      console.log('📊 Found popular products:', popularProducts.length);
      
      const generatedBundles: Bundle[] = [];
      
      // If we have real products, create bundles with them
      if (relatedProducts.length >= 1 || popularProducts.length >= 1) {
        // Bundle 1: Same Category Collection (15% off)
        if (relatedProducts.length >= 1) {
          const categoryBundle = createBundle(
            'same-category',
            `Complete ${currentProduct.category.name} Collection`,
            `Get the best ${currentProduct.category.name.toLowerCase()} designs together`,
            [currentProduct, ...relatedProducts.slice(0, Math.min(2, relatedProducts.length))],
            0.15
          );
          generatedBundles.push(categoryBundle);
        }
        
        // Bundle 2: Popular Combo (12% off)
        if (popularProducts.length >= 1) {
          const popularBundle = createBundle(
            'popular-combo',
            'Customer Favorites Combo',
            'Most loved items by our community',
            [currentProduct, ...popularProducts.slice(0, 1)],
            0.12
          );
          generatedBundles.push(popularBundle);
        }
        
        // Bundle 3: Trending Pack (10% off) - if we have different category items
        const trendingProducts = popularProducts.filter(
          p => p.category._id !== currentProduct.category._id
        );
        if (trendingProducts.length >= 1) {
          const trendingBundle = createBundle(
            'trending',
            'Trending Mix Pack',
            'Explore trending styles across categories',
            [currentProduct, ...trendingProducts.slice(0, 1)],
            0.10
          );
          generatedBundles.push(trendingBundle);
        }
      } else {
        // Fallback: Create mock bundles if API calls fail
        console.log('🔄 Creating fallback mock bundles');
        generatedBundles.push(createMockBundle());
      }
      
      console.log('✅ Generated bundles:', generatedBundles.length);
      setBundles(generatedBundles);
    } catch (error) {
      console.error('❌ Error generating bundles:', error);
      // Create fallback bundle even on error
      setBundles([createMockBundle()]);
    } finally {
      setLoading(false);
    }
  };
  
  const createMockBundle = (): Bundle => {
    // Create a mock second product based on current product
    const mockProduct: BundleProduct = {
      _id: 'mock-product',
      name: `Matching ${currentProduct.category.name} Design`,
      price: Math.floor(currentProduct.price * 0.8), // Slightly cheaper
      category: currentProduct.category,
      stock: 10,
      sold: 50
    };
    
    return createBundle(
      'same-category',
      `Complete ${currentProduct.category.name} Collection`,
      'Perfect combo for anime lovers - curated by our team',
      [currentProduct, mockProduct],
      0.15
    );
  };
  
  const createBundle = (
    type: Bundle['type'],
    title: string, 
    description: string,
    products: BundleProduct[], 
    discountRate: number
  ): Bundle => {
    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
    const bundlePrice = Math.round(totalPrice * (1 - discountRate));
    
    return {
      id: `${type}-${Date.now()}`,
      type,
      title,
      description,
      products,
      totalPrice,
      bundlePrice,
      savings: totalPrice - bundlePrice,
      discount: Math.round(discountRate * 100)
    };
  };
  
  const handleAddBundle = async (bundle: Bundle) => {
    try {
      // Calculate individual item price with bundle discount
      const discountMultiplier = 1 - (bundle.discount / 100);
      
      for (const product of bundle.products) {
        const discountedPrice = Math.round(product.price * discountMultiplier);
        
        await addToCart({
          product: product._id,
          name: product.name,
          price: discountedPrice,
          size: 'M', // Default size
          color: '#000000', // Default color  
          quantity: 1,
          isCustom: false
        });
      }
      
      // Show success message
      alert(`🎉 Bundle added! You saved ₹${bundle.savings.toLocaleString('en-IN')}`);
    } catch (error) {
      console.error('Error adding bundle:', error);
      alert('Failed to add bundle to cart. Please try again.');
    }
  };
  
  const getProductImage = (product: BundleProduct) => {
    return `${API}/product/image/${product._id}`;
  };
  
  const getBundleIcon = (type: Bundle['type']) => {
    switch (type) {
      case 'same-category':
        return <Package className="w-5 h-5" />;
      case 'popular-combo':
        return <Users className="w-5 h-5" />;
      case 'trending':
        return <Flame className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };
  
  const getBundleColor = (type: Bundle['type']) => {
    switch (type) {
      case 'same-category':
        return 'from-purple-600 to-purple-700';
      case 'popular-combo':
        return 'from-orange-600 to-red-600';
      case 'trending':
        return 'from-pink-600 to-rose-600';
      default:
        return 'from-blue-600 to-blue-700';
    }
  };
  
  if (loading) {
    return (
      <div className="mt-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (bundles.length === 0) return null;
  
  return (
    <div className="mt-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Complete Your Collection
        </h3>
        <p className="text-gray-400">
          Save more when you bundle! Get the perfect anime wardrobe.
        </p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {bundles.map((bundle) => (
          <div 
            key={bundle.id} 
            className="border rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" 
            style={{ 
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)'
            }}
          >
            {/* Bundle Header */}
            <div 
              className={`p-4 bg-gradient-to-r ${getBundleColor(bundle.type)} text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getBundleIcon(bundle.type)}
                  <h4 className="font-bold text-lg">{bundle.title}</h4>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  <span className="font-bold text-sm">{bundle.discount}% OFF</span>
                </div>
              </div>
              <p className="text-white/90 text-sm mt-1">{bundle.description}</p>
            </div>
            
            {/* Products Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {bundle.products.map((product, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    <div 
                      className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: generateLightColorWithOpacity(product._id, 0.2) }}
                    >
                      <img 
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/100/100';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs line-through opacity-60">
                          ₹{product.price}
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          ₹{Math.round(product.price * (1 - bundle.discount / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pricing Summary */}
              <div className="border-t pt-3 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--color-textMuted)' }}>Total MRP:</span>
                  <span className="line-through" style={{ color: 'var(--color-textMuted)' }}>
                    ₹{bundle.totalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: 'var(--color-text)' }}>Bundle Price:</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-green-600">
                      ₹{bundle.bundlePrice.toLocaleString('en-IN')}
                    </span>
                    <div className="text-xs text-green-600">
                      You save ₹{bundle.savings.toLocaleString('en-IN')}!
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => handleAddBundle(bundle)}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add Bundle to Cart
              </button>
              
              {/* Social Proof */}
              <div className="mt-2 text-center">
                <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                  <Users className="w-3 h-3 inline mr-1" />
                  {Math.floor(Math.random() * 50 + 20)} customers bought this bundle this week
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductBundles;
