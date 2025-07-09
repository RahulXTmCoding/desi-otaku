import React, { useState, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProduct, getProducts } from '../core/helper/coreapicalls';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, getMockProductImage } from '../data/mockData';
import SizeChart from '../components/SizeChart';
import ProductReviews from '../components/ProductReviews';
import { toggleWishlist, isInWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';

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
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedColor, setSelectedColor] = useState<{ name: string; value: string } | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

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

  useEffect(() => {
    loadProduct();
    loadRelatedProducts();
    if (id) {
      if (userId && token) {
        checkWishlistStatus();
      }
    }
  }, [id, isTestMode]);

  // Load images after product is loaded
  useEffect(() => {
    if (product && id) {
      loadProductImages();
      
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

  const loadProduct = () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      const mockProduct = mockProducts.find(p => p._id === id);
      if (mockProduct) {
        setProduct(mockProduct);
        setSelectedColor(defaultColors[0]);
      } else {
        setError('Product not found');
      }
      setLoading(false);
    } else {
      // Use real backend
      if (id) {
        getProduct(id)
          .then((data: any) => {
            if (data && data.error) {
              setError(data.error);
            } else {
              setProduct(data);
              setSelectedColor(defaultColors[0]);
            }
            setLoading(false);
          })
          .catch((err: any) => {
            console.log(err);
            setError('Failed to load product');
            setLoading(false);
          });
      }
    }
  };

  const loadRelatedProducts = () => {
    if (isTestMode) {
      // Show 4 random products as related
      const related = mockProducts
        .filter(p => p._id !== id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
      setRelatedProducts(related);
    } else {
      getProducts()
        .then((data: any) => {
          if (data && !data.error) {
            // Show 4 products from same category or random
            const related = data
              .filter((p: Product) => p._id !== id)
              .sort(() => Math.random() - 0.5)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        })
        .catch((err: any) => console.log(err));
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-yellow-400">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/shop')} className="hover:text-yellow-400">Shop</button>
          <span>/</span>
          <span className="text-white">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="relative bg-gray-800 rounded-2xl overflow-hidden mb-4">
              <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-600 relative">
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-900/80 hover:bg-gray-900 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-900/80 hover:bg-gray-900 rounded-full transition-colors"
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
                    className={`bg-gray-800 rounded-lg p-2 border-2 transition-all ${
                      currentImageIndex === index ? 'border-yellow-400' : 'border-gray-700'
                    }`}
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
                  className="bg-gray-800 rounded-lg p-2 border-2 border-yellow-400"
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
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            {/* Rating and Reviews */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < (product.rating || 4)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold">{product.rating || 4.5}</span>
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

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-yellow-400">₹{product.price}</span>
              <span className="text-xl text-gray-400 line-through">₹{originalPrice}</span>
              <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-semibold">
                {discount}% OFF
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-300 mb-8">{product.description}</p>

            {/* Category */}
            <div className="mb-6">
              <p className="text-sm text-gray-400">
                Category: <span className="text-yellow-400">{product.category?.name}</span>
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
                        selectedSize === size
                          ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                          : !isAvailable
                          ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
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
              <p className="text-sm text-gray-400">
                {selectedSize && product.sizeStock ? (
                  <>
                    Stock for size {selectedSize}: 
                    <span className={product.sizeStock[selectedSize as keyof typeof product.sizeStock] > 5 ? 'text-green-400' : 'text-orange-400'}>
                      {' '}{product.sizeStock[selectedSize as keyof typeof product.sizeStock]} available
                    </span>
                  </>
                ) : (
                  <>
                    Total Stock: <span className={product.stock > 5 ? 'text-green-400' : 'text-orange-400'}>
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
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {!selectedSize 
                  ? 'Select a Size' 
                  : product.sizeStock && product.sizeStock[selectedSize as keyof typeof product.sizeStock] === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
              </button>
              <button 
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`p-4 rounded-lg transition-colors ${
                  isWishlisted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <div className="bg-green-500 text-white px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Product added to cart successfully!
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800 p-4 rounded-lg">
                <Truck className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm">Free Shipping</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <RotateCw className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm">Easy Returns</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <Shield className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-800">
            <div className="flex gap-8">
              {['description', 'features', 'care'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 capitalize font-medium transition-colors relative ${
                    activeTab === tab ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300">{product.description}</p>
                <div className="mt-4">
                  <h4 className="text-white font-semibold mb-2">Material</h4>
                  <p className="text-gray-300">100% Cotton (180 GSM)</p>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <ul className="space-y-3">
                {(product.features || defaultFeatures).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'care' && (
              <ul className="space-y-3">
                {(product.careInstructions || defaultCareInstructions).map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
                    <span className="text-gray-300">{instruction}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {product && (
          <ProductReviews 
            productId={product._id} 
            productImage={getProductImage(product)} 
          />
        )}

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div 
                key={relatedProduct._id} 
                className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all transform hover:scale-105"
                onClick={() => navigate(`/product/${relatedProduct._id}`)}
              >
                <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={getProductImage(relatedProduct)}
                    alt={relatedProduct.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/api/placeholder/300/300';
                      (e.target as HTMLImageElement).onerror = null;
                    }}
                  />
                </div>
                <h4 className="font-medium mb-2 truncate">{relatedProduct.name}</h4>
                <div className="flex justify-between items-center">
                  <p className="text-yellow-400 font-bold">₹{relatedProduct.price}</p>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (relatedProduct.stock > 0) {
                        try {
                          await addToCart({
                            product: relatedProduct._id,
                            name: relatedProduct.name,
                            price: relatedProduct.price,
                            size: 'M',
                            color: 'Black',
                            quantity: 1,
                            isCustom: false
                          });
                          setShowSuccessMessage(true);
                          setTimeout(() => setShowSuccessMessage(false), 3000);
                        } catch (error) {
                          console.error('Failed to add to cart:', error);
                        }
                      }
                    }}
                    disabled={relatedProduct.stock === 0}
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      relatedProduct.stock > 0
                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {relatedProduct.stock > 0 ? 'Quick Add' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
