import React, { useState, useEffect } from 'react';
import { 
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Loader,
  Image,
  Upload
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDesigns, useDesignCategories, useDesignTags, useProducts } from '../hooks/useProducts';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, getMockProductImage } from '../data/mockData';
import { API } from '../backend';
import RealTShirtPreview from '../components/RealTShirtPreview';

interface Design {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: string | { _id?: string; name: string } | null;
  tags: string[];
  price: number;
  popularity?: {
    views: number;
    likes: number;
    used: number;
  };
  isActive: boolean;
  isFeatured: boolean;
}

interface DesignPlacement {
  design: Design | null;
  position: string;
}

const Customize: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedType, setSelectedType] = useState('normal');
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [basePrice, setBasePrice] = useState(499); // Default base price
  const [currentPage, setCurrentPage] = useState(1);
  
  // New states for front/back design
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [frontDesign, setFrontDesign] = useState<DesignPlacement>({ design: null, position: 'center' });
  const [backDesign, setBackDesign] = useState<DesignPlacement>({ design: null, position: 'center' });

  // React Query hooks (disabled in test mode)
  const { 
    data: designsData, 
    isLoading: designsLoading, 
    error: designsError,
    isFetching: designsIsFetching 
  } = useDesigns({
    search: searchQuery,
    category: activeCategory,
    tag: selectedTag,
    page: currentPage,
    limit: 50
  });

  const { data: categoriesData } = useDesignCategories();
  const { data: tagsData } = useDesignTags();
  const { data: productsData } = useProducts();

  // Handle test mode and real data
  const designs = isTestMode ? [] : (designsData?.designs || designsData || []);
  const loading = isTestMode ? false : designsLoading;
  const error = isTestMode ? '' : (designsError?.message || '');
  const totalPages = isTestMode ? 1 : (designsData?.pagination?.totalPages || 1);
  const categories = isTestMode ? [] : (categoriesData || []);
  const allTags = isTestMode ? [] : (tagsData?.filter((tag: string) => 
    tag && tag.length > 2 && !tag.match(/^[0-9a-fA-F]{24}$/)
  ) || []);

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
  const types = [
    { id: 'normal', name: 'Regular Fit', available: true },
    { id: 'oversize', name: 'Oversize', available: false },
    { id: 'slim', name: 'Slim Fit', available: false }
  ];

  // Position options for front and back
  const frontPositions = [
    { value: 'center', label: 'Center', icon: '◼' },
    { value: 'left', label: 'Left Chest', icon: '◀' },
    { value: 'right', label: 'Right Chest', icon: '▶' },
    { value: 'center-bottom', label: 'Center Bottom', icon: '▼' }
  ];

  const backPositions = [
    { value: 'center', label: 'Center', icon: '◼' },
    { value: 'center-bottom', label: 'Center Bottom', icon: '▼' }
  ];

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (selectedTag) params.set('tag', selectedTag);
    setSearchParams(params);
  }, [searchQuery, activeCategory, selectedTag, setSearchParams]);

  // Load base price from products data
  useEffect(() => {
    if (isTestMode) {
      // Use mock products for base price
      const defaultProduct = mockProducts[0]; // Use first product as default
      if (defaultProduct) {
        setBasePrice(defaultProduct.price);
      }
    } else if (productsData && !productsData.error) {
      // Find the cheapest t-shirt as base price
      const tshirts = productsData.filter((p: any) => 
        p.productType === 't-shirt' || !p.productType
      );
      if (tshirts.length > 0) {
        const minPrice = Math.min(...tshirts.map((p: any) => p.price));
        setBasePrice(minPrice);
      }
    }
  }, [isTestMode, productsData]);

  const categoryLabels: Record<string, string> = {
    'anime': 'Anime',
    'gaming': 'Gaming',
    'funny': 'Funny',
    'motivational': 'Motivational',
    'custom': 'Custom',
    'brand': 'Brand',
    'abstract': 'Abstract',
    'other': 'Other'
  };

  // Backend filtering is applied, so we use designs directly
  const filteredDesigns = designs;

  const calculatePrice = () => {
    let designPrice = 0;
    if (frontDesign.design) designPrice += frontDesign.design.price;
    if (backDesign.design) designPrice += backDesign.design.price;
    return (basePrice + designPrice) * quantity;
  };

  const handleDesignSelect = (design: Design) => {
    if (currentSide === 'front') {
      setFrontDesign({ ...frontDesign, design });
    } else {
      setBackDesign({ ...backDesign, design });
    }
    setSelectedDesign(design); // Keep for backward compatibility
  };

  const handlePositionChange = (position: string) => {
    if (currentSide === 'front') {
      setFrontDesign({ ...frontDesign, position });
    } else {
      setBackDesign({ ...backDesign, position });
    }
  };

  const removeDesign = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontDesign({ design: null, position: 'center' });
    } else {
      setBackDesign({ design: null, position: 'center' });
    }
  };

  const getCurrentDesign = () => {
    return currentSide === 'front' ? frontDesign : backDesign;
  };

  const getPositionOptions = () => {
    return currentSide === 'front' ? frontPositions : backPositions;
  };

  const handleAddToCart = async () => {
    if (!frontDesign.design && !backDesign.design) {
      alert('Please select at least one design');
      return;
    }

    try {
      const designNames = [];
      if (frontDesign.design) designNames.push(`Front: ${frontDesign.design.name}`);
      if (backDesign.design) designNames.push(`Back: ${backDesign.design.name}`);

      const cartItem = {
        name: `Custom T-Shirt - ${designNames.join(', ')}`,
        price: calculatePrice() / quantity, // Price per item
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        isCustom: true,
        customization: {
          frontDesign: frontDesign.design ? {
            designId: frontDesign.design._id,
            designImage: getImageUrl(frontDesign.design),
            position: frontDesign.position,
            price: frontDesign.design.price
          } : undefined,
          backDesign: backDesign.design ? {
            designId: backDesign.design._id,
            designImage: getImageUrl(backDesign.design),
            position: backDesign.position,
            price: backDesign.design.price
          } : undefined
        }
      };

      await addToCart(cartItem);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const toggleTag = (tag: string) => {
    // Single tag selection (backend expects single tag)
    setSelectedTag(selectedTag === tag ? '' : tag);
  };

  const getImageUrl = (design: Design) => {
    if (design.imageUrl && (design.imageUrl.startsWith('http') || design.imageUrl.startsWith('data:'))) {
      return design.imageUrl;
    }
    return `${API}/design/image/${design._id}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
        <div className="w-[96%] md:w-[90%] mx-auto px-4 py-4 md:py-8">
          {/* Page Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
              Customize Your
              <span className="text-yellow-400"> T-Shirt</span>
            </h1>
            <p className="text-base md:text-xl text-gray-300">
              Choose from our collection of designs or create your unique style
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Design Selection */}
            <div className="xl:col-span-2 space-y-4 md:space-y-6">
              {/* Search and Filters */}
              <div className="bg-gray-800 rounded-xl p-4 md:p-6">
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search designs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
                        activeCategory === 'all' 
                          ? 'bg-yellow-400 text-gray-900' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat._id}
                        onClick={() => setActiveCategory(cat._id)}
                        className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
                          activeCategory === cat._id 
                            ? 'bg-yellow-400 text-gray-900' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allTags.slice(0, 10).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          selectedTag === tag
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Side Selector */}
              <div className="bg-gray-800 rounded-xl p-3 md:p-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setCurrentSide('front')}
                    className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium transition-all text-sm md:text-base ${
                      currentSide === 'front'
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">👕</span>
                      <span>Front Side</span>
                      {frontDesign.design && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                  <button
                    onClick={() => setCurrentSide('back')}
                    className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium transition-all text-sm md:text-base ${
                      currentSide === 'back'
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">👕</span>
                      <span>Back Side</span>
                      {backDesign.design && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Position Selector */}
              {getCurrentDesign().design && (
                <div className="bg-gray-800 rounded-xl p-3 md:p-4">
                  <h4 className="font-medium mb-3 text-sm md:text-base">Design Position ({currentSide})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getPositionOptions().map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => handlePositionChange(pos.value)}
                        className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          getCurrentDesign().position === pos.value
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-lg">{pos.icon}</span>
                        <span className="text-sm">{pos.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => removeDesign(currentSide)}
                    className="mt-3 w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
                  >
                    Remove {currentSide} design
                  </button>
                </div>
              )}

              {/* Design Grid */}
              <div className="bg-gray-800 rounded-xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-4">
                  Select a Design for {currentSide.charAt(0).toUpperCase() + currentSide.slice(1)} Side
                  {!loading && <span className="text-gray-400 text-xs md:text-sm ml-2">({filteredDesigns.length} available)</span>}
                  {!isTestMode && designsIsFetching && !loading && (
                    <span className="text-green-400 text-xs ml-2">⚡ Updating designs</span>
                  )}
                </h3>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-2" />
                      <p className="text-gray-400">Loading designs...</p>
                      {!isTestMode && designsData && (
                        <p className="text-green-400 text-sm mt-2">⚡ Loading from cache</p>
                      )}
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredDesigns.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No designs found matching your criteria
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-3 md:gap-4">
                    {filteredDesigns.map((design) => {
                      const isSelectedOnFront = frontDesign.design?._id === design._id;
                      const isSelectedOnBack = backDesign.design?._id === design._id;
                      const isCurrentSideSelected = getCurrentDesign().design?._id === design._id;
                      
                      return (
                        <div
                          key={design._id}
                          onClick={() => handleDesignSelect(design)}
                          className={`relative bg-gray-700 rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105 ${
                            isCurrentSideSelected
                              ? 'ring-2 ring-yellow-400 scale-105' 
                              : 'hover:bg-gray-600'
                          }`}
                        >
                        <div className="aspect-square bg-gray-600 rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={getImageUrl(design)}
                            alt={design.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/200?text=Design';
                            }}
                          />
                        </div>
                          <h4 className="font-medium text-sm mb-1 line-clamp-2">{design.name}</h4>
                          <p className="text-yellow-400 text-sm font-semibold">+₹{design.price}</p>
                          {isCurrentSideSelected && (
                            <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                              <Check className="w-4 h-4 text-gray-900" />
                            </div>
                          )}
                          {(isSelectedOnFront || isSelectedOnBack) && !isCurrentSideSelected && (
                            <div className="absolute top-2 left-2 text-xs bg-gray-600 px-2 py-1 rounded">
                              {isSelectedOnFront && isSelectedOnBack ? 'F+B' : isSelectedOnFront ? 'F' : 'B'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - T-Shirt Preview & Options */}
            <div className="space-y-4 md:space-y-6">
              {/* T-Shirt Preview */}
              <RealTShirtPreview
                selectedDesign={getCurrentDesign().design ? {
                  ...getCurrentDesign().design,
                  image: getImageUrl(getCurrentDesign().design)
                } : null}
                selectedColor={selectedColor}
                selectedColorName={tshirtColors.find(c => c.value === selectedColor)?.name || 'White'}
                selectedSize={selectedSize}
                position={getCurrentDesign().position}
                side={currentSide}
                frontDesign={frontDesign.design ? {
                  ...frontDesign.design,
                  image: getImageUrl(frontDesign.design),
                  position: frontDesign.position
                } : null}
                backDesign={backDesign.design ? {
                  ...backDesign.design,
                  image: getImageUrl(backDesign.design),
                  position: backDesign.position
                } : null}
              />

              {/* T-Shirt Options */}
              <div className="bg-gray-800 rounded-xl p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Type Selection */}
                <div>
                  <h4 className="font-medium mb-3 text-sm md:text-base">T-Shirt Type</h4>
                  <div className="space-y-2">
                    {types.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => type.available && setSelectedType(type.id)}
                        disabled={!type.available}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedType === type.id
                            ? 'bg-yellow-400 text-gray-900'
                            : type.available
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{type.name}</span>
                          {!type.available && (
                            <span className="text-xs bg-gray-600 px-2 py-1 rounded">Coming Soon</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <h4 className="font-medium mb-3 text-sm md:text-base">Color</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-8 xl:grid-cols-4 gap-2">
                    {tshirtColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 transition-all ${
                          selectedColor === color.value 
                            ? 'border-yellow-400 scale-110' 
                            : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <h4 className="font-medium mb-3 text-sm md:text-base">Size</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-3 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`p-2 rounded-lg border transition-all ${
                          selectedSize === size
                            ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <h4 className="font-medium mb-3 text-sm md:text-base">Quantity</h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 bg-gray-700 rounded-lg text-center min-w-[3rem]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gray-900 p-3 md:p-4 rounded-lg text-sm md:text-base">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Base Price:</span>
                    <span>₹{basePrice}</span>
                  </div>
                  {frontDesign.design && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Front Design:</span>
                      <span>₹{frontDesign.design.price}</span>
                    </div>
                  )}
                  {backDesign.design && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Back Design:</span>
                      <span>₹{backDesign.design.price}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Quantity:</span>
                    <span>×{quantity}</span>
                  </div>
                  <hr className="border-gray-700 my-2" />
                  <div className="flex justify-between items-center text-lg font-bold text-yellow-400">
                    <span>Total:</span>
                    <span>₹{calculatePrice()}</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>

              {/* Mode Indicator */}
              <div className="text-center text-xs text-gray-500">
                {isTestMode ? (
                  <p>Test Mode: Using sample designs</p>
                ) : (
                  <p>Backend Mode: Using product catalog</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-700">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Added to Cart!</h3>
                <p className="text-gray-300 mb-4">
                  Your custom t-shirt has been added to cart
                </p>
                <div className="bg-gray-900 p-4 rounded-lg mb-4">
                  {frontDesign.design && (
                    <div className="flex justify-between items-center mb-2">
                      <span>Front Design:</span>
                      <span className="font-medium">{frontDesign.design.name}</span>
                    </div>
                  )}
                  {backDesign.design && (
                    <div className="flex justify-between items-center mb-2">
                      <span>Back Design:</span>
                      <span className="font-medium">{backDesign.design.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                    <span>Total Amount:</span>
                    <span className="text-yellow-400 font-bold">₹{calculatePrice()}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-2 rounded-lg font-medium transition-colors"
                  >
                    Go to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Customize;
