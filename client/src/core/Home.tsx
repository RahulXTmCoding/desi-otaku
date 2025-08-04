import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ChevronRight, Shuffle, ShoppingCart, Sparkles, Check, X } from 'lucide-react';
import Base from './Base';
import { useCart } from '../context/CartContext';
import { getFilteredProducts } from './helper/shopApiCalls';
import { getCategories } from './helper/coreapicalls';
import { getDesigns } from '../admin/helper/designapicall';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, mockCategories, getMockProductImage } from '../data/mockData';
import ProductGridItem from '../components/ProductGridItem';
import RealTShirtPreview from '../components/RealTShirtPreview';
import QuickViewModal from '../components/QuickViewModal';

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
}

interface Category {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { addToCart } = useCart();
  const [tshirts, setTshirts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomSelection, setRandomSelection] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRandomColor, setSelectedRandomColor] = useState<any>(null);
  const [selectedRandomSize, setSelectedRandomSize] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Quick View Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [isTestMode]);

  const loadProducts = () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data - show only first 8 products for home page
      setTimeout(() => {
        setTshirts(mockProducts.slice(0, 8));
        setLoading(false);
      }, 500);
    } else {
      // Use real backend
      getFilteredProducts({ sortBy: 'newest', sortOrder: 'desc', limit: 8 })
        .then((data: any) => {
          if (data && data.products) {
            setTshirts(data.products);
          } else if (data && data.error) {
            setError(data.error);
          }
          setLoading(false);
        })
        .catch((err: any) => {
          console.log(err);
          setError('Failed to load products');
          setLoading(false);
        });
    }
  };

  const loadCategories = () => {
    if (isTestMode) {
      setCategories(mockCategories);
    } else {
      getCategories()
        .then((data: any) => {
          if (data && !data.error) {
            setCategories(data);
          }
        })
        .catch((err: any) => console.log(err));
    }
  };

  const categoryDisplay = [
    { name: "Anime Characters", icon: "🎭", categoryName: "Anime" },
    { name: "Brand Collection", icon: "⚡", categoryName: "Brand" },
    { name: "Custom Design", icon: "🎨", categoryName: "Custom" },
    { name: "Limited Edition", icon: "💎", categoryName: "Limited Edition" }
  ];

  const handleCustomize = () => {
    navigate('/customize');
  };

  const handleRandomDesign = async () => {
    setIsGenerating(true);
    setShowRandomModal(true);
    setAddedToCart(false);
    
    // Simulate loading animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Get all available designs
      let designList = [];
      
      if (isTestMode) {
        // Use mock products as designs in test mode
        designList = mockProducts.map(p => ({
          _id: p._id,
          name: p.name,
          imageUrl: getMockProductImage(p._id),
          price: 150,
          category: p.category,
          isActive: true
        }));
      } else {
        // Fetch real designs
        const designsData = await getDesigns(1, 100, {});
        designList = designsData.designs || designsData || [];
      }
      
      if (!Array.isArray(designList) || designList.length === 0) {
        setIsGenerating(false);
        return;
      }
      
      // Random selections
      const randomDesign = designList[Math.floor(Math.random() * designList.length)];
      const colors = [
        { name: 'White', value: '#FFFFFF' },
        { name: 'Black', value: '#000000' },
        { name: 'Navy', value: '#1E3A8A' },
        { name: 'Red', value: '#DC2626' },
        { name: 'Gray', value: '#6B7280' },
        { name: 'Green', value: '#059669' },
        { name: 'Yellow', value: '#F59E0B' },
        { name: 'Purple', value: '#7C3AED' }
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      
      // Randomly decide front or back (not both)
      const positions = ['front', 'back'];
      const randomPosition = positions[Math.floor(Math.random() * positions.length)];
      
      // Randomly decide center or center-bottom
      const designPositions = ['center', 'center-bottom'];
      const randomDesignPosition = designPositions[Math.floor(Math.random() * designPositions.length)];
      
      const selection = {
        design: randomDesign,
        color: randomColor,
        size: randomSize,
        position: randomPosition,
        designPosition: randomDesignPosition,
        price: 499 + 150 // Base + design price (single side only)
      };
      
      setRandomSelection(selection);
      setSelectedRandomColor(randomColor);
      setSelectedRandomSize(randomSize);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating random design:', error);
      setIsGenerating(false);
    }
  };

  const handleAddRandomToCart = async () => {
    if (!randomSelection || !selectedRandomColor || !selectedRandomSize) return;
    
    try {
      const designName = `${randomSelection.position === 'front' ? 'Front' : 'Back'}: ${randomSelection.design.name}`;
      
      const cartItem = {
        name: `Custom T-Shirt - ${designName}`,
        price: randomSelection.price,
        size: selectedRandomSize,
        color: selectedRandomColor.value,
        quantity: 1,
        isCustom: true,
        customization: {
          frontDesign: randomSelection.position === 'front' ? {
            designId: randomSelection.design._id,
            designImage: getDesignImageUrl(randomSelection.design),
            position: randomSelection.designPosition,
            price: 150
          } : undefined,
          backDesign: randomSelection.position === 'back' ? {
            designId: randomSelection.design._id,
            designImage: getDesignImageUrl(randomSelection.design),
            position: randomSelection.designPosition,
            price: 150
          } : undefined
        }
      };

      await addToCart(cartItem);
      setAddedToCart(true);
      
      setTimeout(() => {
        setShowRandomModal(false);
        setRandomSelection(null);
        setSelectedRandomColor(null);
        setSelectedRandomSize('');
        setAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const tshirtColors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Navy', value: '#1E3A8A' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Green', value: '#059669' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#7C3AED' }
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const getProductImage = (product: Product) => {
    if (isTestMode) {
      return getMockProductImage(product._id);
    }
    if (product._id) {
      return `${API}/product/image/${product._id}`;
    }
    return '/api/placeholder/300/350';
  };

  const getDesignImageUrl = (design: any) => {
    if (design.imageUrl && (design.imageUrl.startsWith('http') || design.imageUrl.startsWith('data:'))) {
      return design.imageUrl;
    }
    return `${API}/design/image/${design._id}`;
  };

  const getCategoryCount = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return 0;
    
    return tshirts.filter(product => product.category?._id === category._id).length;
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setSelectedProduct(null);
  };

  return (
    <Base title="" description="">
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-gray-900"></div>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
            ))}
          </div>

          <div className="absolute bottom-20 left-10 w-20 h-20 bg-orange-500 rounded-full opacity-30"></div>
          <div className="absolute top-40 left-20 w-12 h-12 bg-yellow-400 rounded-full opacity-40"></div>

          <div className="relative w-[96%] md:w-[90%] mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Design Your Own
                <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Otakool T-Shirt
                </span>
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed">
                Create custom anime t-shirts with our design tool or choose from our collection of premium anime designs. Express your otaku style!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleCustomize}
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105"
                >
                  Customize Now
                </button>
                <button 
                  onClick={handleRandomDesign}
                  className="flex items-center justify-center space-x-2 bg-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-purple-500 transition-all"
                >
                  <Shuffle className="w-5 h-5" />
                  <span>Surprise Me!</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-blue-500 rounded-2xl p-4 text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <div className="text-2xl font-bold text-yellow-300">Create</div>
                  <div className="text-sm opacity-90">Your Dream Design</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section
        <section className="px-6 py-16 bg-gray-800/50">
          <div className="w-[96%] md:w-[90%] mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {categoryDisplay.map((display, index) => {
                const categoryData = categories.find(cat => cat.name === display.categoryName);
                const count = categoryData ? getCategoryCount(display.categoryName) : 0;
                
                return (
                  <div 
                    key={index} 
                    className="bg-gray-800 rounded-2xl p-6 text-center hover:bg-gray-700 transition-all transform hover:scale-105 cursor-pointer border border-gray-700 hover:border-yellow-400/50"
                    onClick={() => {
                      if (display.categoryName === 'Custom') {
                        navigate('/customize');
                      } else {
                        navigate('/shop');
                      }
                    }}
                  >
                    <div className="text-4xl mb-4">{display.icon}</div>
                    <h3 className="font-semibold mb-2">{display.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {display.categoryName === 'Custom' ? 'Create your own' : `${count} designs`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section> */}

        {/* Trending Section */}
        <section className="px-6 py-16">
          <div className="w-[96%] md:w-[90%] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Trending T-Shirts</h2>
              <Link 
                to="/shop"
                className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-medium transition-colors group"
              >
                View All Products
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tshirts.map((product) => (
                  <ProductGridItem 
                    key={product._id} 
                    product={product}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Create Your
              <span className="text-yellow-400"> Perfect Otakool Shirt?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of anime fans who've designed their dream t-shirts with us
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleCustomize}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105"
              >
                Start Designing
              </button>
              <Link 
                to="/shop"
                className="border border-yellow-400 text-yellow-400 px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 hover:text-gray-900 transition-all inline-flex items-center justify-center"
              >
                Browse Collection
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Random Design Modal */}
      {showRandomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl max-w-2xl w-full border border-gray-700 transform transition-all duration-500 scale-100 max-h-[90vh] overflow-hidden flex flex-col relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowRandomModal(false);
                setRandomSelection(null);
                setSelectedRandomColor(null);
                setSelectedRandomSize('');
              }}
              className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Modal Header */}
            
            {isGenerating ? (
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <Shuffle className="w-16 h-16 text-yellow-400 animate-spin" />
                  <Sparkles className="w-8 h-8 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Generating Your Random Design...</h3>
                <p className="text-gray-400">Our AI is picking the perfect combination for you!</p>
              </div>
            ) : null}
            
            
            {/* Modal Content - Scrollable */}
            {randomSelection && !isGenerating && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column - Preview */}
                  <div className="lg:w-1/2">
                    <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
                      {/* T-Shirt Preview - Full height */}
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-sm">
                          <RealTShirtPreview
                              selectedDesign={randomSelection.design ? {
                                ...randomSelection.design,
                                image: getDesignImageUrl(randomSelection.design)
                              } : null}
                              selectedColor={selectedRandomColor?.value || '#FFFFFF'}
                              selectedColorName={selectedRandomColor?.name || 'White'}
                              selectedSize={selectedRandomSize || 'M'}
                              position={randomSelection.designPosition}
                              side={randomSelection.position}
                              frontDesign={
                                randomSelection.position === 'front' && randomSelection.design
                                  ? {
                                      ...randomSelection.design,
                                      image: getDesignImageUrl(randomSelection.design),
                                      position: randomSelection.designPosition
                                    }
                                  : null
                              }
                              backDesign={
                                randomSelection.position === 'back' && randomSelection.design
                                  ? {
                                      ...randomSelection.design,
                                      image: getDesignImageUrl(randomSelection.design),
                                      position: randomSelection.designPosition
                                    }
                                  : null
                              }
                            />
                        </div>
                      </div>
                      
                      {/* Design Info - Separated from preview */}
                      <div className="text-center p-3 bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-sm">{randomSelection.design.name}</h4>
                        <p className="text-gray-400 text-xs mt-1">
                          {randomSelection.position === 'front' ? 'Front' : 'Back'} - {randomSelection.designPosition === 'center-bottom' ? 'Bottom' : 'Center'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Options */}
                  <div className="lg:w-1/2 space-y-4">
                    {/* Color Selection */}
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-3">T-Shirt Color</p>
                      <div className="flex gap-2 flex-wrap">
                        {tshirtColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setSelectedRandomColor(color)}
                            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                              selectedRandomColor?.value === color.value 
                                ? 'border-yellow-400 scale-110' 
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {selectedRandomColor?.value === color.value && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-lg" 
                                  style={{ 
                                    filter: color.value === '#FFFFFF' ? 'invert(1)' : 'none' 
                                  }}
                                />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-3">Size</p>
                      <div className="grid grid-cols-5 gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedRandomSize(size)}
                            className={`py-2 text-sm rounded-lg font-medium transition-all ${
                              selectedRandomSize === size
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm">Total Price</p>
                      <p className="text-2xl font-bold text-yellow-400">₹{randomSelection.price}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Base ₹499 + Design ₹150
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => {
                          setRandomSelection(null);
                          setSelectedRandomColor(null);
                          setSelectedRandomSize('');
                          handleRandomDesign();
                        }}
                        className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Shuffle className="w-5 h-5" />
                        Try Again
                      </button>
                      <button
                        onClick={handleAddRandomToCart}
                        disabled={addedToCart}
                        className={`py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                          addedToCart 
                            ? 'bg-green-500 text-white' 
                            : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
                        }`}
                      >
                        {addedToCart ? (
                          <>
                            <Check className="w-5 h-5" />
                            Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </Base>
  );
};

export default Home;
