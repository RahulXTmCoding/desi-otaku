import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Truck, 
  Shield, 
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Share2,
  Zap,
  Loader
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProduct, useProductImages } from '../hooks/useProducts';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, getMockProductImage } from '../data/mockData';
import SizeChart from '../components/SizeChart';
import { toggleWishlist, isInWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { productCache } from '../utils/productCache';

// Lazy load heavy components to improve initial page load
const ProductReviews = lazy(() => import('../components/ProductReviews'));
const LazyRelatedProducts = lazy(() => import('../components/LazyRelatedProducts'));

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
  createdAt?: string;
  updatedAt?: string;
  // Additional fields from admin
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
  // New multi-image support
  images?: Array<{
    _id?: string;
    url?: string;
    data?: any;
    contentType?: string;
    isPrimary?: boolean;
    order?: number;
    caption?: string;
  }>;
  // Size-based stock
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
}

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { addToCart } = useCart();
  
  // React Query for product data (disabled in test mode)
  const { 
    data: productData, 
    isLoading, 
    error: queryError,
    isFetching,
    isSuccess,
    dataUpdatedAt
  } = useProduct(id || '');

  // Comprehensive React Query debugging
  console.log('🔍 REACT QUERY DEBUG:', {
    productId: id,
    hasData: !!productData,
    isLoading,
    isFetching,
    isSuccess,
    isError: !!queryError,
    error: queryError?.message,
    dataUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : 'NO_CACHE',
    cacheAge: dataUpdatedAt ? `${Math.round((Date.now() - dataUpdatedAt) / 1000)}s` : 'NO_CACHE',
    isStale: dataUpdatedAt ? (Date.now() - dataUpdatedAt) > (10 * 60 * 1000) : true,
    timestamp: new Date().toISOString()
  });

  // Log cache status more clearly
  useEffect(() => {
    if (id && productData) {
      const cacheAge = dataUpdatedAt ? Date.now() - dataUpdatedAt : 0;
      const isFromCache = cacheAge > 0 && cacheAge < 1000; // Less than 1s means likely from cache
      
      console.log(`📊 CACHE STATUS for product ${id}:`, {
        source: isFromCache ? '💾 CACHE HIT' : '🌐 FRESH FETCH',
        ageSeconds: Math.round(cacheAge / 1000),
        dataSize: JSON.stringify(productData).length + ' bytes',
        productName: productData.name
      });
    }
  }, [id, productData, dataUpdatedAt]);

  // Remove the duplicate image hook that was causing delays
  // We'll build images directly from product data for better performance

  
  const [selectedColor, setSelectedColor] = useState<{ name: string; value: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  // Handle test mode and real data
  const product = isTestMode 
    ? mockProducts.find(p => p._id === id) 
    : productData;
  
  // Fix loading logic - only show loading if no data
  const loading = isTestMode ? false : (!productData && isLoading);
  const error = isTestMode 
    ? (id && !mockProducts.find(p => p._id === id) ? 'Product not found' : '')
    : (queryError?.message || '');

  // More detailed debugging
  console.log('Detailed Debug:', {
    id,
    isTestMode,
    productData: productData ? 'EXISTS' : 'NULL',
    product: product ? 'EXISTS' : 'NULL', 
    isLoading,
    queryError: queryError ? queryError.message : 'NO_ERROR',
    loading,
    error,
    cacheStatus: dataUpdatedAt ? 'CACHED' : 'NO_CACHE'
  });

  // Default colors and sizes for t-shirts
  const defaultColors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Navy Blue', value: '#1E3A8A' },
    { name: 'Red', value: '#DC2626' }
  ];
  
  const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const defaultFeatures = [
    "100% Premium Cotton",
    "High-quality digital print",
    "Pre-shrunk fabric",
    "Double-stitched seams",
    "Comfortable regular fit"
  ];

  const defaultCareInstructions = [
    "Machine wash cold with similar colors",
    "Do not bleach",
    "Tumble dry low",
    "Iron on reverse side",
    "Do not dry clean"
  ];

  const defaultMaterial = "100% Cotton (180 GSM)";

  // Initialize defaults immediately when product loads (non-blocking)
  useEffect(() => {
    if (product && id) {
      // Set defaults immediately for better UX
      setSelectedColor(defaultColors[0]);
      
      // Auto-select first available size
      if (product.sizeStock) {
        const firstAvailableSize = defaultSizes.find(size => 
          product.sizeStock && product.sizeStock[size as keyof typeof product.sizeStock] > 0
        );
        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize);
        }
      }
    }
  }, [product, id]);

  // Build images directly from product data for instant loading
  useEffect(() => {
    if (product && !isTestMode) {
      loadProductImages();
    }
  }, [product, isTestMode]);

  // Load wishlist status asynchronously (non-blocking, only if user is logged in)
  useEffect(() => {
    if (id && userId && token) {
      // Use setTimeout to make it truly non-blocking
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
        setIsWishlisted(!isWishlisted);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };



  const loadProductImages = async () => {
    if (!product) return;
    
    console.log('Loading product images:', product.images);
    
    // Build image array from product data
    const images = [];
    
    if (product.images && product.images.length > 0) {
      // Use the new images array from product
      product.images.forEach((img: any, index: number) => {
        images.push({
          url: img.url || `${API}/product/image/${product._id}/${index}`,
          caption: img.caption || `Image ${index + 1}`,
          isPrimary: img.isPrimary || false,
          order: img.order || index
        });
      });
      
      // Sort by order
      images.sort((a, b) => a.order - b.order);
      
      // Ensure at least one image is primary
      if (!images.some(img => img.isPrimary) && images.length > 0) {
        images[0].isPrimary = true;
      }
    } else {
      // Fallback to single image
      images.push({
        url: `${API}/product/image/${product._id}`,
        caption: 'Main Image',
        isPrimary: true,
        order: 0
      });
    }
    
    console.log('Processed images:', images);
    setProductImages(images);
    
    // Set primary image as current
    const primaryIndex = images.findIndex(img => img.isPrimary);
    setCurrentImageIndex(primaryIndex !== -1 ? primaryIndex : 0);
  };

  const loadProductVariants = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API}/product/${id}/variants`);
      const data = await response.json();
      
      if (response.ok && data.variants) {
        // Filter only enabled variants
        const enabledVariants = data.variants.filter((v: any) => v.enabled);
        setProductVariants(enabledVariants);
        
        // Build comprehensive image array with main image + variant images
        const allImages = [];
        
        // Always include the main product image first
        allImages.push({
          url: getProductImage(product!),
          caption: 'Main Image',
          isMain: true
        });
        
        // Add variant images
        enabledVariants.forEach((variant: any) => {
          if (variant.image) {
            allImages.push({
              url: variant.image,
              caption: `${variant.color} Variant`,
              color: variant.color,
              colorValue: variant.colorValue
            });
          }
        });
        
        setProductImages(allImages);
        
        // If variants exist, set the first available color as selected
        if (enabledVariants.length > 0) {
          setSelectedColor({
            name: enabledVariants[0].color,
            value: enabledVariants[0].colorValue
          });
        }
      }
    } catch (err) {
      console.error('Failed to load product variants:', err);
      // Fallback to default colors if variants loading fails
    }
  };

  const getProductImage = (productData: Product) => {
    if (isTestMode) {
      return getMockProductImage(productData._id);
    }
    
    // Use the new image endpoint
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
      
      // Include photoUrl if product has it
      if ((product as any).photoUrl) {
        cartItem.photoUrl = (product as any).photoUrl;
      }
      
      await addToCart(cartItem);
      
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

  const nextImage = () => {
    // For now we only have one image per product
    // This can be expanded when multiple images are supported
  };

  const prevImage = () => {
    // For now we only have one image per product
    // This can be expanded when multiple images are supported
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

  console.log(error , !product)

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

  const originalPrice = Math.round(product.price * 1.33);
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      {/* Breadcrumb */}
      <div className="w-[96%] md:w-[90%] mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-textMuted)' }}>
          <button onClick={() => navigate('/')} className="transition-colors" 
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-textMuted)'}
          >Home</button>
          <span>/</span>
          <button onClick={() => navigate('/shop')} className="transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-textMuted)'}
          >Shop</button>
          <span>/</span>
          <span style={{ color: 'var(--color-text)' }}>{product.name}</span>
        </div>
      </div>

      <div className="w-[96%] md:w-[90%] mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="relative rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="aspect-square relative" style={{ backgroundColor: 'var(--color-surfaceHover)' }}>
                {/* Main Image */}
                <img 
                  src={productImages.length > 0 && productImages[currentImageIndex]?.url 
                    ? productImages[currentImageIndex].url 
                    : getProductImage(product)}
                  alt={productImages[currentImageIndex]?.caption || product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getProductImage(product);
                    (e.target as HTMLImageElement).onerror = null;
                  }}
                />
                
                {/* Navigation Arrows (if multiple images) */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              
              {/* Badges */}
              {product.sold > 30 && (
                <span className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                  Bestseller
                </span>
              )}
              {product.stock <= 5 && product.stock > 0 && (
                <span className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Low Stock
                </span>
              )}
              {product.stock === 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-4">
              {productImages.length > 0 ? (
                productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`rounded-lg p-2 border-2 transition-all`}
                    style={{ 
                      backgroundColor: 'var(--color-surface)',
                      borderColor: currentImageIndex === index ? 'var(--color-primary)' : 'var(--color-border)'
                    }}
                  >
                    <img 
                      src={image.url}
                      alt={image.caption || `${product.name} ${index + 1}`}
                      className="w-full h-full object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/150/150';
                        (e.target as HTMLImageElement).onerror = null;
                      }}
                    />
                  </button>
                ))
              ) : (
                <button
                  className="rounded-lg p-2 border-2"
                  style={{ 
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-primary)'
                  }}
                >
                  <img 
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/api/placeholder/150/150';
                      (e.target as HTMLImageElement).onerror = null;
                    }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {!isTestMode && isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>⚡ Updating</span>
                </div>
              )}
            </div>
            
            {/* Rating and Reviews - Only show if product has actual reviews */}
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < product.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold">{product.rating}</span>
                </div>
                {product.sold > 5 && (
                  <span className="text-gray-400">({product.sold} sold)</span>
                )}
                <button 
                  onClick={() => {
                    const shareData = {
                      title: product.name,
                      text: `Check out this awesome ${product.name}!`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {
                        // Fallback to copying link
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      });
                    } else {
                      // Fallback for browsers that don't support Web Share API
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-400 hover:text-yellow-400"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            )}
            
            {/* Share button when no ratings */}
            {(!product.rating || product.rating === 0) && (
              <div className="flex items-center gap-4 mb-6">
                {product.sold > 5 && (
                  <span className="text-gray-400">({product.sold} sold)</span>
                )}
                <button 
                  onClick={() => {
                    const shareData = {
                      title: product.name,
                      text: `Check out this awesome ${product.name}!`,
                      url: window.location.href
                    };
                    
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {
                        // Fallback to copying link
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      });
                    } else {
                      // Fallback for browsers that don't support Web Share API
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-400 hover:text-yellow-400"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>₹{product.price}</span>
              <span className="text-xl line-through" style={{ color: 'var(--color-textMuted)' }}>₹{originalPrice}</span>
              <span className="px-2 py-1 rounded text-sm font-semibold" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                {discount}% OFF
              </span>
            </div>

            {/* Description */}
            <p className="mb-8" style={{ color: 'var(--color-textMuted)' }}>{product.description}</p>

            {/* Category */}
            <div className="mb-6">
              <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                Category: <span style={{ color: 'var(--color-primary)' }}>{product.category?.name}</span>
              </p>
            </div>


            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Size</h3>
                <SizeChart productType="tshirt" />
              </div>
              <div className="grid grid-cols-5 gap-3">
                {defaultSizes.map((size) => {
                  // Check stock availability from sizeStock
                  const sizeStockCount = product.sizeStock?.[size as keyof typeof product.sizeStock] || 0;
                  const isAvailable = sizeStockCount > 0;
                  const isLowStock = sizeStockCount > 0 && sizeStockCount <= 5;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1); // Reset quantity when changing size
                      }}
                      disabled={!isAvailable}
                      className={`py-3 rounded-lg border-2 font-medium transition-all relative ${
                        !isAvailable ? 'cursor-not-allowed' : ''
                      }`}
                      style={{
                        backgroundColor: selectedSize === size ? 'var(--color-primary)' : 'var(--color-surface)',
                        borderColor: selectedSize === size ? 'var(--color-primary)' : 'var(--color-border)',
                        color: selectedSize === size ? 'var(--color-primaryText)' : (!isAvailable ? 'var(--color-textMuted)' : 'var(--color-text)')
                      }}
                      onMouseEnter={(e) => {
                        if (!isAvailable || selectedSize === size) return;
                        e.currentTarget.style.borderColor = 'var(--color-borderHover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isAvailable || selectedSize === size) return;
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }}
                    >
                      {size}
                      {!isAvailable && (
                        <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded">
                          Out
                        </span>
                      )}
                      {isLowStock && (
                        <span className="absolute -top-1 -right-1 text-xs bg-orange-500 text-white px-1 rounded">
                          {sizeStockCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock Info */}
            <div className="mb-6">
              <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                {selectedSize && product.sizeStock ? (
                  <>
                    Stock for size {selectedSize}: 
                    <span style={{ color: product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 5 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {' '}{product.sizeStock[selectedSize as keyof typeof product.sizeStock]} available
                    </span>
                  </>
                ) : (
                  <>
                    Total Stock: <span style={{ color: product.stock > 5 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!selectedSize || (product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] === 0)}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-surfaceHover)')}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-16 text-center text-xl font-medium">{quantity}</span>
                <button
                  onClick={() => {
                    if (selectedSize && product.sizeStock) {
                      const maxQty = product.sizeStock[selectedSize as keyof typeof product.sizeStock] || 0;
                      setQuantity(Math.min(maxQty, quantity + 1));
                    }
                  }}
                  disabled={!selectedSize || (product.sizeStock && quantity >= (product.sizeStock[selectedSize as keyof typeof product.sizeStock] || 0))}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'var(--color-surfaceHover)')}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || (selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] === 0)}
                className={`flex-1 py-4 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                  selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0
                    ? ''
                    : 'cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0
                    ? 'var(--color-primary)'
                    : 'var(--color-surface)',
                  color: selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0
                    ? 'var(--color-primaryText)'
                    : 'var(--color-textMuted)'
                }}
                onMouseEnter={(e) => {
                  if (selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primaryHover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  }
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                {!selectedSize 
                  ? 'Select a Size' 
                  : product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize || (selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] === 0)}
                className={`flex-1 py-4 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                  selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0
                    ? ''
                    : 'cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0
                    ? '#10b981'
                    : 'var(--color-surface)',
                  color: selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0
                    ? 'white'
                    : 'var(--color-textMuted)'
                }}
                onMouseEnter={(e) => {
                  if (selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0) {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSize && product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 0) {
                    e.currentTarget.style.backgroundColor = '#10b981';
                  }
                }}
              >
                <Zap className="w-5 h-5" />
                Buy Now
              </button>
              <button 
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`p-4 rounded-lg transition-colors`}
                style={{
                  backgroundColor: isWishlisted ? 'var(--color-error)' : 'var(--color-surface)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isWishlisted ? '#dc2626' : 'var(--color-surfaceHover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isWishlisted ? 'var(--color-error)' : 'var(--color-surface)';
                }}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="px-4 py-3 rounded-lg mb-6 flex items-center gap-2" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
                <Check className="w-5 h-5" />
                Product added to cart successfully!
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                <Truck className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                <p className="text-sm">Free Shipping</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                <RotateCw className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                <p className="text-sm">Easy Returns</p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                <p className="text-sm">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex gap-8">
              {['description', 'features', 'care'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 capitalize font-medium transition-colors relative`}
                  style={{ color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-textMuted)' }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) e.currentTarget.style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) e.currentTarget.style.color = 'var(--color-textMuted)';
                  }}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-primary)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <p style={{ color: 'var(--color-textMuted)' }}>{product.description}</p>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Material</h4>
                  <p style={{ color: 'var(--color-textMuted)' }}>100% Cotton (180 GSM)</p>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <ul className="space-y-3">
                {(product.features || defaultFeatures).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <span style={{ color: 'var(--color-textMuted)' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'care' && (
              <ul className="space-y-3">
                {(product.careInstructions || defaultCareInstructions).map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: 'var(--color-primary)' }} />
                    <span style={{ color: 'var(--color-textMuted)' }}>{instruction}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

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

        {/* Lazy Related Products */}
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
    </div>
  );
};

export default ProductDetail;
