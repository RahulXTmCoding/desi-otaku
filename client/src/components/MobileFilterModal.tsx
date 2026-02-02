import React, { useState, useEffect } from 'react';
import { X, Filter, Search, ChevronDown } from 'lucide-react';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (value: string) => void;
  selectedProductType: string;
  setSelectedProductType: (value: string) => void;
  selectedGender: string;
  setSelectedGender: (value: string) => void;
  selectedSizes: string[];
  toggleSize: (size: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (value: string) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  categories: any[];
  subcategories: any[];
  productTypes: any[];
  activeFilterCount: number;
  clearFilters: () => void;
  loadSubcategories: (categoryId: string) => void;
}

const MobileFilterModal: React.FC<MobileFilterModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedProductType,
  setSelectedProductType,
  selectedGender,
  setSelectedGender,
  selectedSizes,
  toggleSize,
  selectedAvailability,
  setSelectedAvailability,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  categories,
  subcategories,
  productTypes,
  activeFilterCount,
  clearFilters,
  loadSubcategories
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'sort'>('filters');
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Filter categories by selected gender
  const filteredCategories = categories.filter(cat => {
    // If no genders defined, show for all (backward compatibility)
    if (!cat.genders || cat.genders.length === 0) return true;
    // Only show if category explicitly includes the selected gender
    return cat.genders.includes(selectedGender);
  });

  const categoryOptions = [
    { id: 'all', name: 'All Products' },
    ...filteredCategories.map(cat => ({
      id: cat._id,
      name: cat.name
    }))
  ];

  // Filter product types by selected gender
  const filteredProductTypes = productTypes?.filter(type => {
    // If no genders defined, show for all (backward compatibility)
    if (!type.genders || type.genders.length === 0) return true;
    // Only show if type explicitly includes the selected gender
    return type.genders.includes(selectedGender);
  }) || [];

  const productTypesOptions = [
    { id: 'all', name: 'All Types', icon: '📦' },
    ...filteredProductTypes.map(type => ({
      id: type._id,
      name: type.displayName,
      icon: type.icon || '📦'
    }))
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl h-full overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Sort
              {activeFilterCount > 0 && (
                <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('filters')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'filters'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              Filters
            </button>
            <button
              onClick={() => setActiveTab('sort')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'sort'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              Sort
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {activeTab === 'filters' ? (
            <div className="space-y-6">
              {/* Search */}
              <div>
                <h3 className="font-semibold mb-3 text-yellow-400">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Gender Filter */}
              <div>
                <h3 className="font-semibold mb-3 text-yellow-400">Gender</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'unisex', name: 'Unisex', icon: '👕' },
                    { id: 'men', name: 'Men', icon: '👔' },
                    { id: 'women', name: 'Women', icon: '👗' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedGender(option.id)}
                      className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs ${
                        selectedGender === option.id
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium">{option.name}</span>
                    </button>
                  ))}
                </div>
              </div>

            
              {/* Product Types */}
              <div>
                <h3 className="font-semibold mb-3 text-yellow-400">Product Type</h3>
                {filteredProductTypes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic p-3">No product types available for {selectedGender === 'women' ? 'Women' : selectedGender === 'men' ? 'Men' : 'Unisex'}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {productTypesOptions.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedProductType(type.id)}
                        className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-1 text-xs ${
                          selectedProductType === type.id
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <span className="font-medium">{type.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-yellow-400">Categories</h3>
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-gray-400 italic p-3">No categories available for {selectedGender === 'women' ? 'Women' : selectedGender === 'men' ? 'Men' : 'Unisex'}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedSubcategory('all');
                          if (category.id !== 'all') {
                            loadSubcategories(category.id);
                          }
                        }}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subcategories */}
              {selectedCategory !== 'all' && subcategories.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-yellow-400">Subcategories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedSubcategory('all')}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedSubcategory === 'all'
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      All Subcategories
                    </button>
                    {subcategories.map(subcategory => (
                      <button
                        key={subcategory._id}
                        onClick={() => setSelectedSubcategory(subcategory._id)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedSubcategory === subcategory._id
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}


                {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-4 text-yellow-400">Price Range</h3>
                <div className="bg-gray-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-600">
                      <span className="text-xs text-gray-400">MIN</span>
                      <p className="font-semibold text-white">₹{priceRange[0]}</p>
                    </div>
                    <div className="flex-1 mx-4 h-px bg-gray-600"></div>
                    <div className="bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-600">
                      <span className="text-xs text-gray-400">MAX</span>
                      <p className="font-semibold text-white">₹{priceRange[1]}</p>
                    </div>
                  </div>
                  
                  <div className="relative py-1">
                    <div className="absolute h-1.5 w-full bg-gray-600 rounded-full"></div>
                    <div 
                      className="absolute h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                      style={{
                        left: `${(priceRange[0] / 5000) * 100}%`,
                        width: `${((priceRange[1] - priceRange[0]) / 5000) * 100}%`
                      }}
                    />
                    
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="50"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const newMin = Math.min(value, priceRange[1] - 100);
                        setPriceRange([newMin, priceRange[1]]);
                      }}
                      className="absolute w-full -top-1 h-5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(251,191,36,0.3)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                    />
                    
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="50"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const newMax = Math.max(value, priceRange[0] + 100);
                        setPriceRange([priceRange[0], newMax]);
                      }}
                      className="absolute w-full -top-1 h-5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(251,191,36,0.3)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="font-semibold mb-3 text-yellow-400">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        selectedSizes.includes(size)
                          ? 'bg-yellow-400 text-gray-900 shadow-lg scale-105'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="font-semibold mb-3 text-yellow-400">Availability</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Products', icon: '🛍️' },
                    { value: 'instock', label: 'In Stock', icon: '✅' },
                    { value: 'outofstock', label: 'Out of Stock', icon: '❌' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedAvailability(option.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        selectedAvailability === option.value
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold mb-4 text-yellow-400">Sort By</h3>
              {[
                { value: 'newest', label: 'Newest First', icon: '🆕' },
                { value: 'price-low', label: 'Price: Low to High', icon: '💰' },
                { value: 'price-high', label: 'Price: High to Low', icon: '💸' },
                { value: 'bestselling', label: 'Best Selling', icon: '🔥' },
                { value: 'name', label: 'Name A-Z', icon: '🔤' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 ${
                    sortBy === option.value
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-medium text-left">{option.label}</span>
                  {sortBy === option.value && (
                    <span className="ml-auto">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 border-t border-gray-700 p-4">
          <div className="flex gap-3">
            <button
              onClick={clearFilters}
              className="flex-1 py-3 px-4 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-yellow-400 text-gray-900 rounded-xl font-medium hover:bg-yellow-300 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterModal;
