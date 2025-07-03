import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  X,
  Grid,
  List,
  ChevronDown,
  Star,
  Heart,
  ShoppingCart,
  ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addItemToCart } from '../core/helper/cartHelper';
import { getProducts, getCategories } from '../core/helper/coreapicalls';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, mockCategories, getMockProductImage } from '../data/mockData';
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

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [isTestMode]);

  const loadProducts = () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      setTimeout(() => {
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setLoading(false);
      }, 500); // Simulate loading delay
    } else {
      // Use real backend
      getProducts()
        .then((data: any) => {
          if (data && data.error) {
            setError(data.error);
          } else {
            setProducts(data || []);
            setFilteredProducts(data || []);
          }
          setLoading(false);
        })
        .catch((err: any) => {
          console.log(err);
          setError('Failed to load products from backend. Make sure the server is running.');
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

  useEffect(() => {
    filterAndSortProducts();
  }, [searchQuery, selectedCategory, selectedProductType, selectedPriceRange, selectedTags, sortBy, products]);

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter - now includes tags
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

    setFilteredProducts(filtered);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProductType('all');
    setSelectedPriceRange('all');
    setSelectedTags([]);
    setSortBy('featured');
  };

  const productTypes = [
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
  ];

  const categoryOptions = [
    { id: 'all', name: 'All Products', count: products.length },
    ...categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      count: products.filter(p => p.category?._id === cat._id).length
    }))
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: '0-500', name: 'Under ₹500' },
    { id: '500-700', name: '₹500 - ₹700' },
    { id: '700-1000', name: '₹700 - ₹1000' },
    { id: '1000-', name: 'Above ₹1000' },
  ];

  // Extract all unique tags from products
  const allTags = Array.from(new Set(
    products.flatMap(product => product.tags || [])
  )).filter(tag => tag && tag.length > 0);
  
  // Get popular tags (most used) - limit to top 10
  const tagCounts = products.reduce((acc, product) => {
    (product.tags || []).forEach(tag => {
      if (tag) {
        acc[tag] = (acc[tag] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);
  
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag);

  const getProductImage = (product: Product) => {
    if (isTestMode) {
      return getMockProductImage(product._id);
    }
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                      onClick={() => setSelectedCategory(category.id)}
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
                  {productTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedProductType(type.id)}
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
                      onClick={() => setSelectedPriceRange(range.id)}
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
                  {popularTags.map(tag => (
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
                    <button onClick={() => toggleTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
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
                  onClick={loadProducts}
                  className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Products Grid/List */}
            {!loading && !error && filteredProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {viewMode === 'grid' ? (
                  filteredProducts.map(product => (
                    <ProductGridItem key={product._id} product={product} />
                  ))
                ) : (
                  // List view
                  filteredProducts.map(product => (
                    <div
                      key={product._id}
                      className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition-all border border-gray-700 hover:border-yellow-400/50 group cursor-pointer flex"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {/* Product Image */}
                      <div className="relative bg-gradient-to-br from-gray-700 to-gray-600 w-48">
                        <img 
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/300/350';
                            (e.target as HTMLImageElement).onerror = null;
                          }}
                        />
                        {product.stock <= 5 && product.stock > 0 && (
                          <span className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            Low Stock
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">{product.description}</p>
                          {product.category && (
                            <p className="text-sm text-gray-400 mb-2">Category: {product.category.name}</p>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-yellow-400">₹{product.price}</span>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </p>
                        </div>
                        
                        <div className="flex flex-col justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product.stock > 0) {
                                const cartItem = {
                                  _id: product._id,
                                  name: product.name,
                                  price: product.price,
                                  category: product.category?.name || '',
                                  size: 'M',
                                  color: 'Default',
                                  colorValue: '#000000',
                                  quantity: 1,
                                  type: 'product',
                                  image: getProductImage(product)
                                };
                                addItemToCart(cartItem, () => {
                                  console.log('Product added to cart');
                                });
                              }
                            }}
                            disabled={product.stock === 0}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                              product.stock > 0
                                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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

export default Shop;
