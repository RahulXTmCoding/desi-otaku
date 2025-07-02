import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Search, 
  Filter,
  X,
  Grid,
  List,
  ChevronDown,
  ShoppingCart,
  ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addItemToCart } from '../core/helper/cartHelper';
import { getProducts, getCategories } from '../core/helper/coreapicalls';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, mockCategories, getMockProductImage } from '../data/mockData';
import ProductCard from '../components/ProductCard';

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  productType?: string;
  stock: number;
  sold: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// Memoized filter sidebar component
const FilterSidebar = memo(({
  showFilters,
  searchQuery,
  selectedCategory,
  selectedProductType,
  selectedPriceRange,
  selectedTags,
  categoryOptions,
  productTypes,
  priceRanges,
  popularTags,
  onSearchChange,
  onCategoryChange,
  onProductTypeChange,
  onPriceRangeChange,
  onToggleTag,
  onClearFilters
}: any) => {
  if (!showFilters) return null;

  return (
    <div className="w-80 transition-all duration-300 overflow-hidden">
      <div className="bg-gray-800 rounded-2xl p-6 sticky top-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={onClearFilters}
            className="text-sm text-yellow-400 hover:text-yellow-300"
          >
            Clear all
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="space-y-2">
            {categoryOptions.map((category: any) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                  selectedCategory === category.id
                    ? 'bg-yellow-400 text-gray-900'
                    : 'hover:bg-gray-700'
                }`}
              >
                <span>{category.name}</span>
                <span className="text-sm">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Types */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Product Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {productTypes.map((type: any) => (
              <button
                key={type.id}
                onClick={() => onProductTypeChange(type.id)}
                className={`px-3 py-2 rounded-lg transition-colors flex flex-col items-center gap-1 text-sm ${
                  selectedProductType === type.id
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span className="text-lg">{type.icon}</span>
                <span className="text-xs">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Price Range</h3>
          <div className="space-y-2">
            {priceRanges.map((range: any) => (
              <button
                key={range.id}
                onClick={() => onPriceRangeChange(range.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedPriceRange === range.id
                    ? 'bg-yellow-400 text-gray-900'
                    : 'hover:bg-gray-700'
                }`}
              >
                {range.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="font-semibold mb-3">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag: string) => (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
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
        </div>
      </div>
    </div>
  );
});

FilterSidebar.displayName = 'FilterSidebar';

// Memoized product grid component
const ProductGrid = memo(({ 
  products, 
  viewMode, 
  loading, 
  error,
  onRetry,
  onClearFilters
}: any) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-400 mb-4">No products found matching your criteria</p>
        <button
          onClick={onClearFilters}
          className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1'
    }`}>
      {products.map((product: Product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

const ShopOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load products and categories
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [isTestMode]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    
    if (isTestMode) {
      setTimeout(() => {
        setProducts(mockProducts);
        setLoading(false);
      }, 500);
    } else {
      getProducts()
        .then((data: any) => {
          if (data && data.error) {
            setError(data.error);
          } else {
            setProducts(data || []);
          }
          setLoading(false);
        })
        .catch((err: any) => {
          console.log(err);
          setError('Failed to load products from backend. Make sure the server is running.');
          setLoading(false);
        });
    }
  }, [isTestMode]);

  const loadCategories = useCallback(() => {
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
  }, [isTestMode]);

  // Memoized static data
  const productTypes = useMemo(() => [
    { id: 'all', name: 'All Types', icon: '📦' },
    { id: 't-shirt', name: 'T-Shirt', icon: '👔' },
    { id: 'vest', name: 'Vest', icon: '🦺' },
    { id: 'hoodie', name: 'Hoodie', icon: '🧥' },
    { id: 'oversized-tee', name: 'Oversized Tee', icon: '👕' },
    { id: 'acid-wash', name: 'Acid Wash', icon: '🎨' },
    { id: 'tank-top', name: 'Tank Top', icon: '🎽' },
    { id: 'long-sleeve', name: 'Long Sleeve', icon: '🥼' },
    { id: 'crop-top', name: 'Crop Top', icon: '👚' },
    { id: 'other', name: 'Other', icon: '📦' }
  ], []);

  const priceRanges = useMemo(() => [
    { id: 'all', name: 'All Prices' },
    { id: '0-500', name: 'Under ₹500' },
    { id: '500-700', name: '₹500 - ₹700' },
    { id: '700-1000', name: '₹700 - ₹1000' },
    { id: '1000-', name: 'Above ₹1000' },
  ], []);

  // Memoized category options
  const categoryOptions = useMemo(() => [
    { id: 'all', name: 'All Products', count: products.length },
    ...categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      count: products.filter(p => p.category?._id === cat._id).length
    }))
  ], [categories, products]);

  // Memoized popular tags
  const popularTags = useMemo(() => {
    const tagCounts = products.reduce((acc, product) => {
      (product.tags || []).forEach(tag => {
        if (tag) {
          acc[tag] = (acc[tag] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [products]);

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category?._id === selectedCategory);
    }

    // Product type filter
    if (selectedProductType !== 'all') {
      filtered = filtered.filter(product => 
        (product.productType || 't-shirt') === selectedProductType
      );
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      filtered = filtered.filter(product => 
        product.price >= min && (max ? product.price <= max : true)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(product => 
        product.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
      case 'bestselling':
        filtered.sort((a, b) => b.sold - a.sold);
        break;
      default:
        // featured - keep original order
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedProductType, selectedPriceRange, selectedTags, sortBy, products]);

  // Callback handlers
  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProductType('all');
    setSelectedPriceRange('all');
    setSelectedTags([]);
    setSortBy('featured');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Shop All Products</h1>
          <p className="text-gray-300">Discover our collection of anime and brand t-shirts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <FilterSidebar
            showFilters={showFilters}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedProductType={selectedProductType}
            selectedPriceRange={selectedPriceRange}
            selectedTags={selectedTags}
            categoryOptions={categoryOptions}
            productTypes={productTypes}
            priceRanges={priceRanges}
            popularTags={popularTags}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onProductTypeChange={setSelectedProductType}
            onPriceRangeChange={setSelectedPriceRange}
            onToggleTag={handleToggleTag}
            onClearFilters={handleClearFilters}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden bg-gray-800 p-2 rounded-lg"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <p className="text-gray-300">
                  {loading ? 'Loading...' : `Showing ${filteredProducts.length} of ${products.length} products`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 appearance-none cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="bestselling">Best Selling</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
                </div>

                {/* View Mode */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700' : ''}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedTags.length > 0 || selectedCategory !== 'all' || selectedProductType !== 'all' || selectedPriceRange !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory !== 'all' && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Category: {categoryOptions.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedProductType !== 'all' && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Type: {productTypes.find(t => t.id === selectedProductType)?.name}
                    <button onClick={() => setSelectedProductType('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedPriceRange !== 'all' && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Price: {priceRanges.find(r => r.id === selectedPriceRange)?.name}
                    <button onClick={() => setSelectedPriceRange('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    #{tag}
                    <button onClick={() => handleToggleTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Products Grid */}
            <ProductGrid
              products={filteredProducts}
              viewMode={viewMode}
              loading={loading}
              error={error}
              onRetry={loadProducts}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopOptimized;
