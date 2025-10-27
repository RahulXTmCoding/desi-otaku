import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addItemToCart } from '../core/helper/cartHelper';
import { getCategories, getMainCategories, getSubcategories } from '../core/helper/coreapicalls';
import { getAllProductTypes } from '../admin/helper/productTypeApiCalls';
import { useFilteredProducts } from '../hooks/useProducts';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, mockCategories } from '../data/mockData';
import ProductGridItem from '../components/ProductGridItem';
import QuickViewModal from '../components/QuickViewModal';
import MobileFilterModal from '../components/MobileFilterModal';
import { useDebounce } from '../hooks/useDebounce';

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
  totalStock?: number;
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  sizeAvailability?: {
    S: boolean;
    M: boolean;
    L: boolean;
    XL: boolean;
    XXL: boolean;
  };
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
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedProductType, setSelectedProductType] = useState(searchParams.get('type') || 'all');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('price') || 'all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>((searchParams.get('sizes')?.split(',').filter(Boolean)) || []);
  const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('availability') || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>((searchParams.get('tags')?.split(',').filter(Boolean)) || []);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(searchParams.get('filters') !== 'hidden');
  
  // Debounce search query for optimal performance
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Use ref to track if we're updating from URL
  const isUpdatingFromURL = useRef(false);
  
  // Watch for URL changes and update state accordingly
  useEffect(() => {
    isUpdatingFromURL.current = true;
    
    // Extract values from URL params
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const subcategory = searchParams.get('subcategory') || 'all';
    const type = searchParams.get('type') || 'all';
    const price = searchParams.get('price') || 'all';
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const availability = searchParams.get('availability') || 'all';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const filters = searchParams.get('filters') !== 'hidden';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '5000');
    
    // Check for anime parameter
    const animeParam = searchParams.get('anime');
    if (animeParam) {
      setSearchQuery(animeParam.replace(/-/g, ' '));
      setSelectedCategory('all');
      setSelectedProductType('all');
    } else {
      // Update state only if values have changed
      setSearchQuery(search);
      setSelectedCategory(category);
      setSelectedProductType(type);
    }
    
    setSelectedSubcategory(subcategory);
    setSelectedPriceRange(price);
    setSelectedSizes(sizes);
    setSelectedAvailability(availability);
    setSelectedTags(tags);
    setSortBy(sort);
    setCurrentPage(page);
    setShowFilters(filters);
    setPriceRange([minPrice, maxPrice]);
    
    // Reset flag after React's render cycle
    requestAnimationFrame(() => {
      isUpdatingFromURL.current = false;
    });
  }, [searchParams]);
  
  // Price slider states
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  
  // Data states for metadata (categories, product types)
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  
  // Quick View Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Mobile Filter Modal state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available sizes
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  // Infinite scroll states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const productsPerPage = 12;
  
  // Prevent race conditions in infinite scroll
  const isLoadingRef = useRef(false);
  const debounceTimeoutRef = useRef<number>();

  // Parse sort options for API
  const getSortParams = (sortBy: string) => {
    switch (sortBy) {
      case 'price-low':
        return { sortBy: 'price', sortOrder: 'asc' };
      case 'price-high':
        return { sortBy: 'price', sortOrder: 'desc' };
      case 'bestselling':
        return { sortBy: 'bestselling', sortOrder: 'desc' };
      case 'name':
        return { sortBy: 'name', sortOrder: 'asc' };
      default:
        return { sortBy: 'newest', sortOrder: 'desc' };
    }
  };

  // Build filter parameters for React Query
  const filterParams = useMemo(() => {
    const sortParams = getSortParams(sortBy);
    return {
      search: debouncedSearchQuery || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      subcategory: selectedSubcategory === 'all' ? undefined : selectedSubcategory,
      productType: selectedProductType === 'all' ? undefined : selectedProductType,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
      availability: selectedAvailability === 'all' ? undefined : selectedAvailability,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
      page: currentPage,
      limit: productsPerPage
    };
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedProductType, priceRange, selectedSizes, selectedAvailability, selectedTags, sortBy, currentPage]);

  // Use React Query for filtered products (only when not in test mode)
  const { 
    data: filteredProductsData, 
    isLoading, 
    error: queryError,
    isFetching 
  } = useFilteredProducts(filterParams);

  // Accumulate products for infinite scroll
  useEffect(() => {
    if (filteredProductsData?.products) {
      if (currentPage === 1) {
        // First page - replace all products
        setAllProducts(filteredProductsData.products);
      } else {
        // Subsequent pages - append to existing products
        setAllProducts(prev => [...prev, ...filteredProductsData.products]);
      }
      
      // Update hasMore based on pagination info - more reliable logic
      const pagination = filteredProductsData.pagination;
      const receivedProducts = filteredProductsData.products;
      
      let shouldHaveMore = false;
      
      // Primary check: Trust API's hasMore if explicitly provided
      if (pagination && pagination.hasMore !== undefined) {
        shouldHaveMore = pagination.hasMore;
      } 
      // Secondary check: Compare current page with total pages
      else if (pagination && pagination.totalPages) {
        shouldHaveMore = currentPage < pagination.totalPages;
      } 
      // Tertiary check: Compare loaded products count with total
      else if (pagination && pagination.totalProducts) {
        // Calculate total products that will be loaded after this update
        let totalLoadedProducts;
        if (currentPage === 1) {
          // First page - total is just the received products
          totalLoadedProducts = receivedProducts.length;
        } else {
          // Subsequent pages - add to previous total
          // Note: allProducts hasn't been updated yet in this sync execution
          totalLoadedProducts = allProducts.length + receivedProducts.length;
        }
        shouldHaveMore = totalLoadedProducts < pagination.totalProducts;
      }
      // Final fallback: If we got fewer products than requested, we're at the end
      else {
        shouldHaveMore = receivedProducts.length >= productsPerPage;
      }
      
      setHasMore(shouldHaveMore);
      setIsLoadingMore(false);
      
      // Reset the loading ref flag to allow future requests
      isLoadingRef.current = false;
    }
  }, [filteredProductsData, currentPage]);

  // Reset products when filters change (but not when just page changes)
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, [searchQuery, selectedCategory, selectedProductType, selectedSizes, selectedAvailability, priceRange, selectedTags, sortBy]);

  // Handle test mode products
  const testModeProducts = useMemo(() => {
    if (!isTestMode) return [];
    
    // Simple filtering for test mode
    let filtered = [...mockProducts];
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category._id === selectedCategory);
    }
    
    return filtered;
  }, [isTestMode, searchQuery, selectedCategory, mockProducts]);

  // Get current products to display - use accumulated products for infinite scroll
  const currentProducts = isTestMode ? testModeProducts : allProducts;
  const currentLoading = isTestMode ? false : (isLoading && currentPage === 1);
  const currentError = isTestMode ? null : queryError;
  const totalProducts = isTestMode ? testModeProducts.length : (filteredProductsData?.pagination?.totalProducts || 0);
  const totalPages = isTestMode ? Math.ceil(testModeProducts.length / productsPerPage) : (filteredProductsData?.pagination?.totalPages || 1);

  // Update URL params whenever filters change (but not when syncing from URL)
  // Note: We don't include currentPage here to avoid infinite scroll URL oscillation
  useEffect(() => {
    if (isUpdatingFromURL.current) return; // Don't update URL when we're syncing from URL
    
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    if (selectedProductType !== 'all') params.set('type', selectedProductType);
    if (selectedSizes.length > 0) params.set('sizes', selectedSizes.join(','));
    if (selectedAvailability !== 'all') params.set('availability', selectedAvailability);
    if (priceRange[0] !== 0 || priceRange[1] !== 5000) {
      params.set('minPrice', priceRange[0].toString());
      params.set('maxPrice', priceRange[1].toString());
    }
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (!showFilters) params.set('filters', 'hidden');
    // Note: Removed currentPage from URL updates to prevent infinite scroll oscillation
    
    // Only update if params are different from current URL
    const currentParams = searchParams.toString();
    const newParams = params.toString();
    
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedProductType, selectedSizes, selectedAvailability, priceRange, selectedTags, sortBy, showFilters, searchParams, setSearchParams]);

  // Load categories and product types on mount
  useEffect(() => {
    loadCategories();
    loadProductTypes();
  }, [isTestMode]);

  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      loadSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('all');
    }
  }, [selectedCategory]);


  const loadCategories = () => {
    if (isTestMode) {
      setCategories(mockCategories);
    } else {
      getMainCategories()
        .then((data: any) => {
          if (data && !data.error) {
            setCategories(data);
          }
        })
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
      }
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    if (!isTestMode) {
      try {
        const subs = await getSubcategories(categoryId);
        if (subs && !subs.error) {
          setSubcategories(subs);
        }
      } catch (err) {
        console.log('Error loading subcategories:', err);
      }
    }
  };

  // Infinite scroll handler using window scroll with debouncing and race condition prevention
  const handleScroll = useCallback(() => {
    // Prevent loading if already loading, no more content, or initial page is loading
    if (isLoadingRef.current || isLoadingMore || !hasMore || currentLoading || isFetching) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    // Very aggressive trigger for seamless mobile experience
    // Mobile: trigger when 40% scrolled, Desktop: trigger when 75% scrolled
    const isMobile = window.innerWidth <= 768;
    const triggerPoint = isMobile ? 0.4 : 0.75;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= triggerPoint) {
      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Debounce the scroll trigger to prevent rapid-fire requests
      debounceTimeoutRef.current = window.setTimeout(() => {
        // Double-check conditions before making request
        if (isLoadingRef.current || isLoadingMore || !hasMore || currentLoading || isFetching) return;
        
        
        // Set loading flags to prevent concurrent requests
        isLoadingRef.current = true;
        setIsLoadingMore(true);
        setCurrentPage(prev => prev + 1);
      }, 150); // 150ms debounce for fast scrolling
    }
  }, [isLoadingMore, hasMore, currentLoading, isFetching]);
  
  // Add scroll event listener to window
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1); // Reset to first page
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProductType('all');
    setSelectedSizes([]);
    setSelectedAvailability('all');
    setPriceRange([0, 5000]);
    setSelectedTags([]);
    setSortBy('newest');
    setCurrentPage(1);
    setHasMore(true);
    // Clear URL params
    setSearchParams(new URLSearchParams());
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setCurrentPage(1); // Reset to first page when filters change
    setHasMore(true); // Reset infinite scroll
    
    switch (filterType) {
      case 'search':
        setSearchQuery(value);
        break;
      case 'category':
        setSelectedCategory(value);
        setSelectedSubcategory('all'); // Reset subcategory when main category changes
        break;
      case 'productType':
        setSelectedProductType(value);
        break;
      case 'availability':
        setSelectedAvailability(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
    }
  };

  const productTypesOptions = [
    { id: 'all', name: 'All Types', icon: '📦' },
    ...productTypes?.map(type => ({
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

  const getProductImage = (product: Product) => {
    if (product._id) {
      return `${API}/product/image/${product._id}`;
    }
    return '/api/placeholder/300/350';
  };

  // Count products with active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedProductType !== 'all') count++;
    if (selectedSizes.length > 0) count++;
    if (selectedAvailability !== 'all') count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 5000) count++;
    if (selectedTags.length > 0) count++;
    return count;
  }, [selectedCategory, selectedProductType, selectedSizes, selectedAvailability, priceRange, selectedTags]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="w-[96%] md:w-[90%] mx-auto md:px-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Hidden on mobile, only visible on desktop */}
          <div className={`lg:w-80 hidden lg:block`}>
            <div className="lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
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

              {/* Price Range Slider */}
              <div className="mb-8 bg-gray-700/50 p-4 rounded-xl">
                <h3 className="font-semibold mb-4 text-yellow-400">Price Range</h3>
                <div className="px-2">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-600">
                      <span className="text-xs text-gray-400">MIN</span>
                      <p className="font-semibold text-white">₹{priceRange[0]}</p>
                    </div>
                    <div className="flex-1 mx-4 h-px bg-gray-600"></div>
                    <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-600">
                      <span className="text-xs text-gray-400">MAX</span>
                      <p className="font-semibold text-white">₹{priceRange[1]}</p>
                    </div>
                  </div>
                  
                  <div className="relative py-1">
                    {/* Track background */}
                    <div className="absolute h-1.5 w-full bg-gray-600 rounded-full shadow-inner"></div>
                    
                    {/* Active track */}
                    <div 
                      className="absolute h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full shadow-lg"
                      style={{
                        left: `${(priceRange[0] / 5000) * 100}%`,
                        width: `${((priceRange[1] - priceRange[0]) / 5000) * 100}%`
                      }}
                    />
                    
                    {/* Min price slider */}
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
                      className="absolute w-full -top-1 h-5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(251,191,36,0.3)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_6px_rgba(251,191,36,0.4)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(251,191,36,0.3)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:hover:shadow-[0_0_0_6px_rgba(251,191,36,0.4)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150"
                    />
                    
                    {/* Max price slider */}
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
                      className="absolute w-full -top-1 h-5 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(251,191,36,0.3)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_6px_rgba(251,191,36,0.4)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(251,191,36,0.3)] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:hover:shadow-[0_0_0_6px_rgba(251,191,36,0.4)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* Size Filter */}
              <div className="mb-8">
                <h3 className="font-semibold mb-4 text-yellow-400">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        selectedSizes.includes(size)
                          ? 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/20 scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="mb-8">
                <h3 className="font-semibold mb-4 text-yellow-400">Availability</h3>
                <div className="space-y-3">
                  {[
                    { value: 'all', label: 'All Products', icon: '🛍️' },
                    { value: 'instock', label: 'In Stock', icon: '✅' },
                    { value: 'outofstock', label: 'Out of Stock', icon: '❌' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('availability', option.value)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        selectedAvailability === option.value
                          ? 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/20'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                      {selectedAvailability === option.value && (
                        <span className="ml-auto">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
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

              {/* Subcategories - show only when a category is selected */}
              {selectedCategory !== 'all' && subcategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Subcategories</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedSubcategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedSubcategory === 'all'
                          ? 'bg-yellow-400 text-gray-900'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <span>All Subcategories</span>
                    </button>
                    {subcategories.map(subcategory => (
                      <button
                        key={subcategory._id}
                        onClick={() => setSelectedSubcategory(subcategory._id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedSubcategory === subcategory._id
                            ? 'bg-yellow-400 text-gray-900'
                            : 'hover:bg-gray-700'
                        }`}
                      >
                        <span>{subcategory.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
            </div>
          </div>

          {/* Main Content - Uses page scroll */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                {/* Hide filter button on mobile since we have FAB */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden lg:flex bg-gray-800 p-2 rounded-lg items-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                
                {/* Desktop product count */}
                <p className="text-gray-300 hidden sm:block">
                  {currentLoading ? 'Loading...' : `Showing ${currentProducts.length} of ${totalProducts} products`}
                </p>
              </div>

              <div className="flex items-center gap-4 hidden sm:block">
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
              </div>
            </div>

            {/* Mobile single-row layout for product count and sort */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <p className="text-gray-300 text-sm">
                {currentLoading ? 'Loading...' : `Showing ${currentProducts.length} of ${totalProducts} products`}
              </p>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="bestselling">Best Selling</option>
                  <option value="name">Name</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
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
                {(priceRange[0] !== 0 || priceRange[1] !== 5000) && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Price: ₹{priceRange[0]} - ₹{priceRange[1]}
                    <button onClick={() => setPriceRange([0, 5000])}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedSizes.length > 0 && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Sizes: {selectedSizes.join(', ')}
                    <button onClick={() => setSelectedSizes([])}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedAvailability !== 'all' && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {selectedAvailability === 'instock' ? 'In Stock' : 'Out of Stock'}
                    <button onClick={() => handleFilterChange('availability', 'all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Loading State */}
            {currentLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400">Loading products...</p>
                {filteredProductsData?.cached && (
                  <p className="text-green-400 text-sm mt-2">⚡ Loading from cache</p>
                )}
              </div>
            )}

            {/* Error State */}
            {currentError && !currentLoading && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{currentError.message || 'Failed to load products'}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!currentLoading && !currentError && currentProducts.length > 0 ? (
              <>
                <div className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {currentProducts.map(product => (
                    <ProductGridItem 
                      key={product._id} 
                      product={product}
                      onQuickView={handleQuickView}
                    />
                  ))}
                </div>

                {/* Loading more products indicator */}
                {(isFetching && currentPage > 1) && (
                  <div className="flex justify-center items-center py-8">
                    <div className="flex items-center gap-3">
                      <Loader className="w-6 h-6 animate-spin text-yellow-400" />
                      <span className="text-gray-400">Loading more products...</span>
                      {filteredProductsData?.cached && (
                        <span className="text-green-400 text-sm">⚡ From Cache</span>
                      )}
                    </div>
                  </div>
                )}

                {/* End of products message */}
                {!hasMore && currentProducts.length > 0 && !isFetching && (
                  <div className="text-center py-8">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-lg font-medium">You've reached the end!</p>
                      <p className="text-gray-500 text-sm mt-1">That's all the products we have matching your filters.</p>
                    </div>
                  </div>
                )}

                {/* Pagination - Hidden when infinite scroll is active */}
                {false && totalPages > 1 && (
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
            ) : !currentLoading && !currentError && (
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

      {/* Mobile Filter FAB Button */}
      <button
        onClick={() => setIsMobileFilterOpen(true)}
        className="filter-fab bg-yellow-400 text-gray-900 flex items-center justify-center lg:hidden hover:bg-yellow-300 transition-colors"
      >
        <Filter className="w-6 h-6" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Mobile Filter Modal */}
      <MobileFilterModal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubcategory={selectedSubcategory}
        setSelectedSubcategory={setSelectedSubcategory}
        selectedProductType={selectedProductType}
        setSelectedProductType={setSelectedProductType}
        selectedSizes={selectedSizes}
        toggleSize={toggleSize}
        selectedAvailability={selectedAvailability}
        setSelectedAvailability={setSelectedAvailability}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={categories}
        subcategories={subcategories}
        productTypes={productTypes}
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        loadSubcategories={loadSubcategories}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </div>
  );
};

export default ShopWithBackendFilters;
