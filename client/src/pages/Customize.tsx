import React, { useState, useEffect } from 'react';
import { 
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addItemToCart } from '../core/helper/cartHelper';
import { getProducts } from '../core/helper/coreapicalls';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, getMockProductImage } from '../data/mockData';
import { API } from '../backend';

interface Design {
  _id: string;
  name: string;
  image?: string;
  price: number;
  category: {
    _id: string;
    name: string;
  };
  description?: string;
}

const Customize: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedType, setSelectedType] = useState('normal');
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

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

  // Load designs from backend or mock data
  useEffect(() => {
    loadDesigns();
  }, [isTestMode]);

  const loadDesigns = async () => {
    setLoading(true);
    setError('');

    try {
      if (isTestMode) {
        // Use mock data in test mode - treat products as designs
        setTimeout(() => {
          setDesigns(mockProducts.map(p => ({
            ...p,
            image: getMockProductImage(p._id)
          })));
          setLoading(false);
        }, 500);
      } else {
        // Fetch from backend
        const data = await getProducts();
        if (data.error) {
          setError(data.error);
          setDesigns([]);
        } else {
          // Use products as designs
          setDesigns(data);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading designs:', err);
      setError('Failed to load designs');
      setLoading(false);
    }
  };

  // Extract unique tags from designs
  const allTags = Array.from(new Set(
    designs.flatMap(design => {
      const tags = [];
      if (design.category?.name) tags.push(design.category.name.toLowerCase());
      if (design.name) {
        // Extract tags from product name
        const nameTags = design.name.toLowerCase().split(' ');
        tags.push(...nameTags);
      }
      return tags;
    })
  )).filter((tag): tag is string => typeof tag === 'string' && tag.length > 2); // Filter out short words

  // Get unique categories
  const categories = Array.from(new Set(
    designs.map(d => d.category?.name).filter(Boolean)
  ));

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => 
      design.name.toLowerCase().includes(tag) || 
      design.category?.name.toLowerCase() === tag
    );
    const matchesCategory = activeCategory === 'all' || design.category?.name === activeCategory;
    return matchesSearch && matchesTags && matchesCategory;
  });

  const calculatePrice = () => {
    const basePrice = 499; // Base t-shirt price
    const designPrice = selectedDesign ? 150 : 0; // Fixed design price
    return (basePrice + designPrice) * quantity;
  };

  const handleAddToCart = () => {
    if (!selectedDesign) {
      alert('Please select a design');
      return;
    }

    const cartItem = {
      _id: `custom-${selectedDesign._id}-${selectedColor}-${selectedSize}-${Date.now()}`,
      name: `Custom T-Shirt - ${selectedDesign.name}`,
      price: calculatePrice() / quantity, // Price per item
      category: 'custom',
      size: selectedSize,
      color: tshirtColors.find(c => c.value === selectedColor)?.name || 'White',
      colorValue: selectedColor,
      quantity: quantity,
      type: 'custom',
      design: selectedDesign.name,
      designPrice: 150,
      image: selectedDesign.image || `${API}/product/photo/${selectedDesign._id}`
    };

    addItemToCart(cartItem, () => {
      setShowSuccessModal(true);
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getImageUrl = (design: Design) => {
    if (design.image?.startsWith('http')) {
      return design.image;
    }
    return `${API}/product/photo/${design._id}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Customize Your
              <span className="text-yellow-400"> T-Shirt</span>
            </h1>
            <p className="text-xl text-gray-300">
              Choose from our collection of designs or create your unique style
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Design Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filters */}
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeCategory === 'all' 
                          ? 'bg-yellow-400 text-gray-900' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          activeCategory === cat 
                            ? 'bg-yellow-400 text-gray-900' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {cat}
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
                          selectedTags.includes(tag)
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

              {/* Design Grid */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Select a Design 
                  {!loading && <span className="text-gray-400 text-sm ml-2">({filteredDesigns.length} available)</span>}
                </h3>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={loadDesigns}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredDesigns.map((design) => (
                      <div
                        key={design._id}
                        onClick={() => setSelectedDesign(design)}
                        className={`relative bg-gray-700 rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedDesign?._id === design._id 
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
                        <p className="text-yellow-400 text-sm font-semibold">+₹150</p>
                        {selectedDesign?._id === design._id && (
                          <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                            <Check className="w-4 h-4 text-gray-900" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - T-Shirt Preview & Options */}
            <div className="space-y-6">
              {/* T-Shirt Preview */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="relative mx-auto w-full max-w-xs">
                  {/* T-Shirt Shape */}
                  <svg viewBox="0 0 200 200" className="w-full h-auto">
                    <path
                      d="M50 60 Q50 40 70 40 L80 40 Q85 35 100 35 Q115 35 120 40 L130 40 Q150 40 150 60 L150 80 L140 80 L140 160 Q140 170 130 170 L70 170 Q60 170 60 160 L60 80 L50 80 Z"
                      fill={selectedColor}
                      stroke="#374151"
                      strokeWidth="2"
                    />
                  </svg>
                  {/* Design on T-Shirt */}
                  {selectedDesign && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-600 rounded-lg overflow-hidden">
                      <img 
                        src={getImageUrl(selectedDesign)}
                        alt={selectedDesign.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* T-Shirt Options */}
              <div className="bg-gray-800 rounded-xl p-6 space-y-6">
                {/* Type Selection */}
                <div>
                  <h4 className="font-medium mb-3">T-Shirt Type</h4>
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
                  <h4 className="font-medium mb-3">Color</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {tshirtColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
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
                  <h4 className="font-medium mb-3">Size</h4>
                  <div className="grid grid-cols-3 gap-2">
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
                  <h4 className="font-medium mb-3">Quantity</h4>
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
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Base Price:</span>
                    <span>₹499</span>
                  </div>
                  {selectedDesign && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Design:</span>
                      <span>₹150</span>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Added to Cart!</h3>
                <p className="text-gray-300 mb-4">
                  Your custom t-shirt has been added to cart
                </p>
                <div className="bg-gray-900 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>Design:</span>
                    <span className="font-medium">{selectedDesign?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
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
