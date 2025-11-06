import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProduct } from '../hooks/useProducts';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { mockProducts, getMockProductImage } from '../data/mockData';
import { toggleWishlist, isInWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import SEOHead from '../components/SEOHead';
import SchemaMarkup from '../components/SchemaMarkup';
import QuantityDiscountBanner from '../components/QuantityDiscountBanner';
// import FreeShippingProgress from '../components/FreeShippingProgress';
import ProductBundles from '../components/ProductBundles';

// Import our new modular components
import ProductImageGallery from '../components/product/ProductImageGallery';
import ProductInfo from '../components/product/ProductInfo';
import ProductOptions from '../components/product/ProductOptions';
import ProductActions from '../components/product/ProductActions';
import ProductTabs from '../components/product/ProductTabs';

// Lazy load heavy components to improve initial page load
const ProductReviews = lazy(() => import('../components/ProductReviews'));
const LazyRelatedProducts = lazy(() => import('../components/LazyRelatedProducts').then(module => ({ default: module.default })));

interface Product {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  description: string;
  seoTitle?: string;
  metaDescription?: string;
  slug?: string;
  category: {
    _id: string;
    name: string;
  };
  productType?: {
    _id: string;
    name: string;
  };
  stock: number;
  sold: number;
  createdAt?: string;
  updatedAt?: string;
  originalPrice?: number;
  rating?: number;
  features?: string[];
  careInstructions?: string[];
  material?: string;
  badges?: {
    bestseller?: boolean;
    newArrival?: boolean;
    limitedEdition?: boolean;
  };
  images?: Array<{
    _id?: string;
    url?: string;
    data?: any;
    contentType?: string;
    isPrimary?: boolean;
    order?: number;
    caption?: string;
  }>;
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  customTags?: string[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { addToCart, getItemCount } = useCart();
  const { trackProductView, trackAddToWishlist, trackAddToCart } = useAnalytics();
  
  // React Query for product data
  const { 
    data: productData, 
    isLoading, 
    error: queryError,
    isFetching,
    isSuccess,
    dataUpdatedAt
  } = useProduct(id || '');

  // State management
  const [selectedColor, setSelectedColor] = useState<{ name: string; value: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [viewersCount, setViewersCount] = useState(Math.floor(Math.random() * 15) + 8);
  const [isMobile, setIsMobile] = useState(() => {
      // Check if window is available (client-side)
      if (typeof window !== 'undefined') {
        return window.innerWidth < 768;
      }
      // Default to mobile for SSR to prevent hydration mismatch
      return true;
    });
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  // Handle test mode and real data
  const product = isTestMode 
    ? mockProducts.find(p => p._id === id) 
    : productData;
  
  const loading = isTestMode ? false : (!productData && isLoading);
  const error = isTestMode 
    ? (id && !mockProducts.find(p => p._id === id) ? 'Product not found' : '')
    : (queryError?.message || '');

  // Default colors and sizes for t-shirts
  const defaultColors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Navy Blue', value: '#1E3A8A' },
    { name: 'Red', value: '#DC2626' }
  ];
  
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Dynamic product type detection and descriptions
  const getProductType = (product: Product): 'printed-tee' | 'oversized' | 'hoodie' | 'tshirt' => {
    const category = product?.productType?.name?.toLowerCase() || '';
    
    if (category.includes('hoodie')) {
      return 'hoodie';
    } else if (category.includes('oversized')) {
      return 'oversized';
    } else if (category.includes('tshirt') || category.includes('t-shirt')) {
      return 'printed-tee';
    }
    
    return 'tshirt';
  };

  const getProductDescriptions = (productType: string) => {
    switch (productType) {
      case 'printed-tee':
        return {
          material: "100% Cotton 220 GSM Premium Tees",
          features: [
            "100% Cotton 220 GSM premium fabric",
            "Pre-shrunk for perfect fit",
            "Bio-washed for extra softness",
            "High-quality digital print",
            "Double-stitched seams for durability",
            "Comfortable regular fit",
            "Fade-resistant colors"
          ],
          careInstructions: [
            "Machine wash cold with similar colors",
            "Do not bleach",
            "Tumble dry low",
            "Iron on reverse side",
            "Do not dry clean"
          ]
        };
      
      case 'oversized':
        return {
          material: "240 GSM French Terry",
          features: [
            "240 GSM French Terry fabric",
            "Pre-shrunk for perfect fit", 
            "Bio-washed for premium feel",
            "Relaxed oversized fit",
            "Super soft and comfortable",
            "High-quality print/embroidery",
            "Reinforced shoulder seams"
          ],
          careInstructions: [
            "Machine wash cold with similar colors",
            "Do not bleach",
            "Tumble dry low heat",
            "Iron on low heat if needed",
            "Do not dry clean"
          ]
        };
      
      case 'hoodie':
        return {
          material: "350 GSM Cotton",
          features: [
            "350 GSM premium cotton blend",
            "Heavyweight fabric for warmth",
            "Soft fleece inner lining",
            "Adjustable drawstring hood",
            "Kangaroo pocket design",
            "Pre-shrunk and bio-washed",
            "Durable ribbed cuffs and hem"
          ],
          careInstructions: [
            "Machine wash cold with similar colors",
            "Do not bleach",
            "Tumble dry medium heat",
            "Iron on medium heat if needed",
            "Do not dry clean"
          ]
        };
      
      default:
        return {
          material: "100% Premium Cotton",
          features: [
            "100% Premium Cotton",
            "High-quality digital print",
            "Pre-shrunk fabric",
            "Double-stitched seams",
            "Comfortable regular fit"
          ],
          careInstructions: [
            "Machine wash cold with similar colors",
            "Do not bleach",
            "Tumble dry low",
            "Iron on reverse side",
            "Do not dry clean"
          ]
        };
    }
  };

  // Get dynamic descriptions based on product type
  const productType = product ? getProductType(product) : 'tshirt';
  const productDescriptions = getProductDescriptions(productType);
  
  const defaultFeatures = productDescriptions.features;
  const defaultCareInstructions = productDescriptions.careInstructions;
  const defaultMaterial = productDescriptions.material;

  useEffect(() => {
      const checkIsMobile = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
      };
      
      // Check initially (in case SSR default was wrong)
      checkIsMobile();
      
      // Listen for window resize
      window.addEventListener('resize', checkIsMobile);
      
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

  // Simulate live viewers with slight fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(5, Math.min(25, newCount));
      });
    }, 8000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, []);

  // Size preference management
  const getSizePreferenceKey = (categoryName: string) => {
    return `size_preference_${categoryName.toLowerCase().replace(/\s+/g, '_')}`;
  };
  
  const getSavedSizePreference = (categoryName: string): string | null => {
    try {
      return localStorage.getItem(getSizePreferenceKey(categoryName));
    } catch (error) {
      console.warn('Error reading size preference:', error);
      return null;
    }
  };
  
  const saveSizePreference = (categoryName: string, size: string) => {
    try {
      localStorage.setItem(getSizePreferenceKey(categoryName), size);
    } catch (error) {
      console.warn('Error saving size preference:', error);
    }
  };

  // Initialize defaults when product loads
  useEffect(() => {
    if (product && id) {
      setSelectedColor(defaultColors[0]);
      
      if (product.sizeStock) {
        const categoryName = product.category?.name || '';
        
        // First, try to use saved size preference for this category
        const savedSize = getSavedSizePreference(categoryName);
        
        // Check if saved size is available in stock
        if (savedSize && product.sizeStock[savedSize as keyof typeof product.sizeStock] > 0) {
          setSelectedSize(savedSize);
        } else {
          // Fallback to first available size
          const firstAvailableSize = defaultSizes.find(size => 
            product.sizeStock && product.sizeStock[size as keyof typeof product.sizeStock] > 0
          );
          if (firstAvailableSize) {
            setSelectedSize(firstAvailableSize);
          }
        }
      }
    }
  }, [product, id]);
  
  // Save size preference when user changes selection
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    
    // Save the size preference for this category
    if (product?.category?.name) {
      saveSizePreference(product.category.name, size);
    }
  };

  // Build images from product data
  useEffect(() => {
    if (product && !isTestMode) {
      loadProductImages();
    }
  }, [product, isTestMode]);

  // Track product view when product loads
  useEffect(() => {
    if (product && product._id) {
      // Track product view for analytics
      trackProductView({
        _id: product._id,
        name: product.name,
        price: product.price,
        category: product.category?.name || 'T-Shirt'
      });
    }
  }, [product, trackProductView]);

  // Load wishlist status
  useEffect(() => {
    if (id && userId && token) {
      const timer = setTimeout(() => {
        checkWishlistStatus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [id, userId, token]);

  const checkWishlistStatus = async () => {
    if (!userId || !token || !id) return;
    
    try {
      const result = await isInWishlist(userId, token, id);
      setIsWishlisted(result.isInWishlist);
    } catch (err) {
      console.error('Error checking wishlist status:', err);
    }
  };

  const handleWishlistToggle = async () => {
    if (!userId || !token) {
      alert('Please login to add items to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      const result = await toggleWishlist(userId, token, product?._id || '');
      if (!result.error) {
        const newWishlistState = !isWishlisted;
        setIsWishlisted(newWishlistState);
        
        // Track analytics for adding to wishlist
        if (newWishlistState && product) {
          trackAddToWishlist(product);
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const loadProductImages = async () => {
    if (!product) return;
    
    const images = [];
    
    if (product.images && product.images.length > 0) {
      product.images.forEach((img: any, index: number) => {
        images.push({
          url: img.url || `${API}/product/image/${product._id}/${index}`,
          caption: img.caption,
          isPrimary: img.isPrimary || false,
          order: img.order || index
        });
      });
      
      images.sort((a, b) => a.order - b.order);
      
      if (!images.some(img => img.isPrimary) && images.length > 0) {
        images[0].isPrimary = true;
      }
    } else {
      images.push({
        url: `${API}/product/image/${product._id}`,
        caption: 'Main Image',
        isPrimary: true,
        order: 0
      });
    }
    
    setProductImages(images);
  };

  const getProductImage = (productData: Product) => {
    if (isTestMode) {
      return getMockProductImage(productData._id);
    }
    
    if (productData._id) {
      return `${API}/product/image/${productData._id}`;
    }
    return '/api/placeholder/600/600';
  };

  const handleAddToCart = async () => {
    if (!product || !selectedSize) {
      alert('Please select a size');
      return;
    }

    try {
      const cartItem: any = {
        product: product._id,
        name: product.name,
        price: product.price,
        size: selectedSize,
        color: selectedColor?.name || 'Black',
        quantity: quantity,
        isCustom: false
      };
      
      if ((product as any).photoUrl) {
        cartItem.photoUrl = (product as any).photoUrl;
      }
      
      await addToCart(cartItem);
      
      // Track add to cart for analytics
      trackAddToCart(product, quantity);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const handleBuyNow = () => {
    if (!product || !selectedSize) {
      alert('Please select a size');
      return;
    }
    
    const buyNowItem = {
      _id: `buy-now-${Date.now()}`,
      product: product._id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor?.name || 'Black',
      quantity: quantity,
      isCustom: false,
      photoUrl: (product as any).photoUrl || getProductImage(product)
    };
    
    navigate('/checkout', {
      state: { buyNowItem }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderBottomColor: 'var(--color-primary)' }}></div>
          <p className="text-gray-400">Loading product details...</p>
          {!isTestMode && productData && (
            <p className="text-green-400 text-sm mt-2">⚡ Loading from cache</p>
          )}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--color-error)' }}>{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-2 rounded-lg font-semibold transition-colors"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primaryText)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primaryHover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Optimization */}
      {product && (
        <>
          <SEOHead 
            title={product.seoTitle || product.name}
            description={product.metaDescription || product.description}
            product={product}
            category={product.category?.name?.toLowerCase()}
            includeOrganizationData={true}
            breadcrumbs={[
              { name: 'Home', url: '/' },
              { name: 'Shop', url: '/shop' },
              { name: product.category?.name || 'Products', url: `/category/${product.category?.name?.toLowerCase()}` },
              { name: product.name, url: `/product/${product.slug || product._id}` }
            ]}
          />
          <SchemaMarkup product={product} />
        </>
      )}
      
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        {/* Breadcrumb */}
        <div className="product-detail-container py-4">
          <div className="flex items-center gap-2 md:mt-5 text-sm animate-fade-in" style={{ color: 'var(--color-textMuted)' }}>
            <button onClick={() => navigate('/')} className="transition-colors hover:scale-105 transform" 
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-textMuted)'}
            >Home</button>
            <span>/</span>
            <button onClick={() => navigate('/shop')} className="transition-colors hover:scale-105 transform"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-textMuted)'}
            >Shop</button>
            <span>/</span>
            <span style={{ color: 'var(--color-text)' }}>{product.name}</span>
          </div>
        </div>

        <div className="product-detail-container md:py-8" id="details">
          <div className="grid md:grid-cols-5 md:gap-8  gap-6">
            {/* Product Images Section - Takes 3/5 of the width (60%) */}
            <div className="md:col-span-3">
              <ProductImageGallery
                product={product}
                productImages={productImages}
                getProductImage={getProductImage}
                selectedSize={selectedSize}
                viewersCount={viewersCount}
              />
            </div>

            {/* Product Info Section - Takes 2/5 of the width (40%) */}
            <div className="md:col-span-2 md:space-y-8 space-y-4">
              <ProductInfo
                product={product}
                isFetching={isFetching}
                isLoading={isLoading}
                isTestMode={isTestMode}
                isMobile={isMobile}
                defaultFeatures={defaultFeatures}
              />

              <ProductOptions
                product={product}
                selectedSize={selectedSize}
                setSelectedSize={handleSizeChange}
                quantity={quantity}
                setQuantity={setQuantity}
                productType={productType}
              />

              <ProductActions
                product={product}
                selectedSize={selectedSize}
                quantity={quantity}
                setQuantity={setQuantity}
                selectedColor={selectedColor}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onWishlistToggle={handleWishlistToggle}
                isWishlisted={isWishlisted}
                wishlistLoading={wishlistLoading}
                showSuccessMessage={showSuccessMessage}
                userId={userId}
                token={token}
              />

              {/* Premium AOV Enhancement Components - Only show when cart has items */}
              {getItemCount() > 0 && (
                <div className="space-y-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <QuantityDiscountBanner currentQuantity={0} />
                  {/* <FreeShippingProgress /> */}
                </div>
              )}
            </div>
          </div>

          {/* Product Details Tabs */}
          <ProductTabs
            product={product}
            productType={productType}
            defaultMaterial={defaultMaterial}
            defaultCareInstructions={defaultCareInstructions}
          />

          {/* Bundle Recommendations */}
          {/* {product && (
            <ProductBundles currentProduct={product} />
          )} */}

          {/* Reviews Section */}
          {product && (
            <Suspense fallback={
              <div className="mt-12 text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  <p className="text-gray-400">Loading reviews...</p>
                </div>
              </div>
            }>
              <ProductReviews 
                productId={product._id} 
                productImage={getProductImage(product)} 
              />
            </Suspense>
          )}

          {/* Related Products */}
          {id && (
            <Suspense fallback={
              <div className="mt-12 text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  <p className="text-gray-400">Loading related products...</p>
                </div>
              </div>
            }>
              <LazyRelatedProducts currentProductId={id} />
            </Suspense>
          )}
        </div>

        {/* Premium Mobile Sticky Footer */}
        {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 p-4 z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm text-gray-400">Total</div>
              <div className="font-semibold">₹{(product.price * quantity).toLocaleString('en-IN')}</div>
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                selectedSize 
                  ? 'bg-white text-black hover:bg-gray-100' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!selectedSize ? 'Select Size' : 'Add to Cart'}
            </button>
            {userId && token && (
              <button 
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className="px-4 py-3 border border-gray-600 rounded-lg"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
            )}
          </div>
        </div> */}
      </div>
    </>
  );
};

export default ProductDetail;
