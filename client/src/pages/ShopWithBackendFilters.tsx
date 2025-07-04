import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter,
  X,
  Grid,
  List,
  ChevronDown,
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addItemToCart } from '../core/helper/cartHelper';
import { getCategories } from '../core/helper/coreapicalls';
import { getAllProductTypes } from '../admin/helper/productTypeApiCalls';
import { getFilteredProducts } from '../core/helper/shopApiCalls';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, mockCategories } from '../data/mockData';
import ProductGridItem from '../components/ProductGridItem';

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  productType?: string | { _id: string; displayName: string } | null;
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

const ShopWithBackendFilters: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isTestMode } = useDevMode();
  
  // Initialize filter states from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedProductType, setSelectedProductType] = useState(searchParams.get('type') || 'all');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('price') || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>((searchParams.get('tags')?.split(',').filter(Boolean)) || []);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>((searchParams.get('view') as 'grid' | 'list') || 'grid');
  const [showFilters, setShowFilters] = useState(searchParams.get('filters') !== 'hidden');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  // Update URL params whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedProductType !== 'all') params.set('type', selectedProductType);
    if (selectedPriceRange !== 'all') params.set('price', selectedPriceRange);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (!showFilters) params.set('filters', 'hidden');
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedProductType, selectedPriceRange, selectedTags, sortBy, currentPage, viewMode, showFilters, setSearchParams]);

  // Load categories and product types on mount
  useEffect(() => {
    loadCategories();
    loadProductTypes();
  }, [isTestMode]);

  // Load products whenever filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadFilteredProducts();
    }, 500); // Debounce for search input

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, selectedProductType, selectedPriceRange, selectedTags, sortBy, currentPage, isTestMode]);

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

  const loadProductTypes = async () => {
    if (!isTestMode) {
      try {
        const types = await getAllProductTypes(true);
        if (Array.isArray(types)) {
          setProductTypes(types);
        }
      } catch (err) {
        console.log('Error loading product types:', err);
      }
    }
  };

  const loadFilteredProducts = async () => {
    setLoading(true);
    setError('');

    if (isTestMode) {
      // Mock filtering for test mode
      setTimeout(() => {
        setProducts(mockProducts);
        setTotalPages(Math.ceil(mockProducts.length / productsPerPage));
        setTotalProducts(mockProducts.length);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      // Parse price range
      let minPrice, maxPrice;
      if (selectedPriceRange !== 'all') {
        const [min, max] = selectedPriceRange.split('-');
        minPrice = parseInt(min);
        maxPrice = max ? parseInt(max) : undefined;
      }

      // Parse sort options
      let sortField = 'createdAt';
      let sortOrder = 'desc';
      
      switch (sortBy) {
        case 'price-low':
          sortField = 'price';
          sortOrder = 'asc';
          break;
        case 'price-high':
          sortField = 'price';
          sortOrder = 'desc';
          break;
        case 'bestselling':
          sortField = 'bestselling';
          break;
        case 'name':
          sortField = 'name';
          sortOrder = 'asc';
          break;
      }

      const response = await getFilteredProducts({
        search: searchQuery,
        category: selectedCategory,
        productType: selectedProductType,
        minPrice,
        maxPrice,
        tags: selectedTags,
        sortBy: sortField,
        sortOrder,
        page: currentPage,
        limit: productsPerPage
      });

      if (response.error) {
        setError(response.error);
      } else {
        setProducts(response.products || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalProducts(response.pagination.totalProducts);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProductType('all');
    setSelectedPriceRange('all');
    setSelectedTags([]);
    setSortBy('newest');
    setCurrentPage(1);
    // Clear URL params
    setSearchParams(new URLSearchParams());
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'search':
        setSearchQuery(value);
        break;
      case 'category':
        setSelectedCategory(value);
        break;
      case 'productType':
        setSelectedProductType(value);
        break;
      case 'priceRange':
        setSelectedPriceRange(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
    }
  };

  const productTypesOptions = [
    { id: 'all', name: 'All Types', icon: '📦' },
    ...productTypes.map(type => ({
      id: type._id,
      name: type.displayName,
      icon: type.icon || '📦'
    }))
  ];

  const categoryOptions = [
    { id: 'all', name: 'All Products' },
    ...categories.map(cat => ({
      id: cat._id,
      name: cat.name
    }))
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: '0-500', name: 'Under ₹500' },
    { id: '500-700', name: '₹500 - ₹700' },
    { id: '700-1000', name: '₹700 - ₹1000' },
    { id: '1000-', name: 'Above ₹1000' },
  ];

  const getProductImage = (product: Product) => {
    if (product._id) {
      return `${API}/product/photo/${product._id}`;
    }
    return '/api/placeholder/300/350';
  };

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
          <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
            <div className="bg-gray-800 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                <button
                  onClick={clearFilters}
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
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  {categoryOptions.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange('category', category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-yellow-400 text-gray-900'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Types */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Product Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {productTypesOptions.map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleFilterChange('productType', type.id)}
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
                  {priceRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => handleFilterChange('priceRange', range.id)}
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
            </div>
          </div>

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
                  {loading ? 'Loading...' : `Showing ${products.length} of ${totalProducts} products`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="bestselling">Best Selling</option>
                    <option value="name">Name</option>
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
                    <button onClick={() => handleFilterChange('category', 'all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedProductType !== 'all' && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Type: {productTypesOptions.find(t => t.id === selectedProductType)?.name}
                    <button onClick={() => handleFilterChange('productType', 'all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedPriceRange !== 'all' && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Price: {priceRanges.find(r => r.id === selectedPriceRange)?.name}
                    <button onClick={() => handleFilterChange('priceRange', 'all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadFilteredProducts}
                  className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Products Grid/List */}
            {!loading && !error && products.length > 0 ? (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {products.map(product => (
                    <ProductGridItem key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg ${
                        currentPage === 1
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg ${
                        currentPage === totalPages
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : !loading && !error && (
              <div className="text-center py-12">
                <p className="text-xl text-gray-400 mb-4">No products found matching your criteria</p>
                <button
                  onClick={clearFilters}
                  className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopWithBackendFilters;
