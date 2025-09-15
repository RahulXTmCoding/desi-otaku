 import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Shirt, Package, Star, Zap, Sparkles, Heart, Shield, Crown, TrendingUp, Flame, Loader2, Tags } from 'lucide-react';
import { getCategoryTree, getProductTypes } from '../core/helper/coreapicalls';
import { useDevMode } from '../context/DevModeContext';
import { mockCategories } from '../data/mockData';

interface ShoppingDropdownProps {
  onLinkClick?: () => void;
}

const ShoppingDropdown: React.FC<ShoppingDropdownProps> = ({ onLinkClick }) => {
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<any>(null);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isTestMode } = useDevMode();

  // Fetch dynamic data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isTestMode) {
          // Use mock data in test mode
          setTimeout(() => {
            setProductTypes([
              { _id: '1', name: 'T-Shirts', category: 'apparel', icon: '👕' },
              { _id: '2', name: 'Hoodies', category: 'winter', icon: '🔥' }
            ]);
            setCategoryTree(mockCategories);
            setLoading(false);
          }, 500);
        } else {
          // Fetch real data from backend
          const [typesData, categoryData] = await Promise.all([
            getProductTypes(),
            getCategoryTree()
          ]);
          
          setProductTypes(typesData || []);
          setCategoryTree(categoryData || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [isTestMode]);

  const closeDropdowns = () => {
    setIsProductsDropdownOpen(false);
    setIsCategoriesDropdownOpen(false);
    setHoveredCategory(null);
    onLinkClick?.();
  };

  // Auto-select first category when categories dropdown opens
  useEffect(() => {
    if (isCategoriesDropdownOpen && categoryTree.length > 0 && !hoveredCategory) {
      setHoveredCategory(categoryTree[0]);
    }
  }, [isCategoriesDropdownOpen, categoryTree, hoveredCategory]);

  // Handle navigation with proper query parameter updates
  const handleNavigation = (link: string) => {
    closeDropdowns();
    
    // If we're already on the shop page, use replace to update the URL
    if (location.pathname === '/shop' && link.startsWith('/shop')) {
      navigate(link, { replace: true });
    } else {
      navigate(link);
    }
  };

  // Helper function to get product type icon
  const getProductTypeIcon = (typeName: string) => {
    if (!typeName || typeof typeName !== 'string') {
      return '👕';
    }
    
    const iconMap: Record<string, string> = {
      't-shirt': '👕',
      'printed t-shirt': '🎨',
      'oversized t-shirt': '👕',
      'plain t-shirt': '✨',
      'hoodie': '🔥',
      'hoodies': '🔥',
      'sweatshirt': '❄️',
      'jacket': '🧥',
      'pants': '👖',
      'shorts': '🩳',
      'cap': '🧢',
      'hat': '👒'
    };
    return iconMap[typeName.toLowerCase()] || '👕';
  };

  const getProductTypeGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-cyan-500 to-blue-500',
      'from-green-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500'
    ];
    return gradients[index % gradients.length];
  };

  const getBadgeForProductType = (typeName: string) => {
    const badgeMap: Record<string, string> = {
      'printed t-shirt': 'Popular',
      'oversized tee': 'Trending', 
      'hoodie': 'Hot',
      'hoodies': 'Hot'
    };
    return badgeMap[typeName.toLowerCase()] || null;
  };

  // Group product types by category for better organization
  const getGroupedProductTypes = () => {
    if (!productTypes.length) return [];
    
    const groups: Record<string, any[]> = {};
    
    productTypes.forEach(type => {
      const category = type.category || 'apparel';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({
        ...type,
        icon: getProductTypeIcon(type.displayName || type.name),
        badge: getBadgeForProductType(type.displayName || type.name),
        link: `/shop?type=${type._id}`
      });
    });
    
    return Object.entries(groups).map(([categoryName, types], index) => ({
      title: categoryName.toUpperCase().replace('_', ' '),
      icon: categoryName.includes('winter') ? <Package className="w-6 h-6" /> : <Shirt className="w-6 h-6" />,
      color: getProductTypeGradient(index),
      description: categoryName.includes('winter') ? 'Cozy and warm apparel' : 'Premium quality cotton tees',
      items: types
    }));
  };

  // Quick access featured items
  const featuredItems = [
    { 
      name: "Best Sellers", 
      link: "/shop?sort=bestselling", 
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Most loved by fashion enthusiasts",
      color: "from-yellow-400 to-orange-500"
    },
    { 
      name: "New Arrivals", 
      link: "/shop?sort=newest", 
      icon: <Sparkles className="w-5 h-5" />,
      description: "Fresh designs weekly",
      color: "from-purple-500 to-pink-500"
    },
    { 
      name: "Limited Edition", 
      link: "/shop?category=limited", 
      icon: <Crown className="w-5 h-5" />,
      description: "Exclusive drops",
      color: "from-red-500 to-pink-500"
    }
  ];

  // Helper functions for dynamic content
  const getCategoryIcon = (categoryName: string) => {
    if (!categoryName || typeof categoryName !== 'string') {
      return '📂';
    }
    
    const iconMap: Record<string, string> = {
      'anime': '🎌',
      'naruto': '🦊',
      'one piece': '☠️',
      'dragon ball': '🐉',
      'attack on titan': '⚔️',
      'demon slayer': '🌊',
      'jujutsu kaisen': '👻',
      'hunter x hunter': '🎯',
      'tokyo ghoul': '👹',
      'manga': '📚',
      'clothing': '👕',
      'accessories': '🎒',
      'collectibles': '🎮'
    };
    return iconMap[categoryName.toLowerCase()] || '📂';
  };

  const getCategoryGradient = (index: number) => {
    const gradients = [
      'from-orange-400 to-yellow-500',
      'from-blue-400 to-cyan-500',
      'from-orange-500 to-red-500',
      'from-gray-600 to-red-600',
      'from-blue-500 to-purple-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-blue-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500'
    ];
    return gradients[index % gradients.length];
  };

  const generateCategoryLink = (category: any, subcategory?: any) => {
    if (subcategory) {
      return `/shop?category=${category._id}&subcategory=${subcategory._id}`;
    }
    return `/shop?category=${category._id}`;
  };

  // Get popular categories (first level categories with subcategories)
  const getPopularCategories = () => {
    if (!categoryTree.length) return [];
    
    return categoryTree
      .filter(cat => cat.subcategories && cat.subcategories.length > 0)
      .slice(0, 6) // Show top 6 popular categories
      .map((cat, index) => ({
        ...cat,
        icon: getCategoryIcon(cat.name),
        gradient: getCategoryGradient(index),
        link: generateCategoryLink(cat),
        popular: true
      }));
  };

  // Get all subcategories for "More Categories" section
  const getMoreCategories = () => {
    if (!categoryTree.length) return [];
    
    const allSubcategories: any[] = [];
    categoryTree.forEach(mainCat => {
      if (mainCat.subcategories && mainCat.subcategories.length > 0) {
        mainCat.subcategories.forEach((subcat: any) => {
          allSubcategories.push({
            ...subcat,
            icon: getCategoryIcon(subcat.name),
            link: generateCategoryLink(mainCat, subcat),
            parentName: mainCat.name
          });
        });
      }
    });
    
    return allSubcategories.slice(6); // Skip the first 6 (shown in popular)
  };

  return (
    <>
      {/* Shop by Products Dropdown */}
      <div 
        className="relative group"
        onMouseEnter={() => {
          setIsProductsDropdownOpen(true);
          setIsCategoriesDropdownOpen(false);
        }}
        onMouseLeave={() => setIsProductsDropdownOpen(false)}
      >
        <button className="flex items-center gap-1 relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
          <span className="relative z-10">
            <span className="hidden xl:inline">SHOP BY PRODUCTS</span>
            <span className="xl:hidden">PRODUCTS</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProductsDropdownOpen ? 'rotate-180' : ''}`} />
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
        </button>
        
        {/* Products Dropdown - Clean Design */}
        <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 w-[380px] ${
          isProductsDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
        }`}>
          <div className="p-6">
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading products...</span>
              </div>
            ) : productTypes.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No products available</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Browse our collection</p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto">
                  {productTypes.map((product, index) => (
                    <div
                      key={product._id}
                      onClick={() => handleNavigation(`/shop?type=${product._id}`)}
                      className="group flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">
                        {getProductTypeIcon(product.displayName || product.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {product.displayName || product.name}
                        </span>
                      </div>
                      {getBadgeForProductType(product.displayName || product.name) && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                          {getBadgeForProductType(product.displayName || product.name)}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg] group-hover:text-blue-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-xs">Premium quality</span>
              </div>
              <Link
                to="/shop"
                onClick={closeDropdowns}
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All
                <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Shop by Categories Dropdown */}
      <div 
        className="relative group"
        onMouseEnter={() => {
          setIsCategoriesDropdownOpen(true);
          setIsProductsDropdownOpen(false);
        }}
        onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
      >
        <button className="flex items-center gap-1 relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
          <span className="relative z-10">
            <span className="hidden xl:inline">SHOP BY CATEGORY</span>
            <span className="xl:hidden">CATEGORY</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`} />
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
        </button>
        
        {/* Categories Dropdown - Responsive Two-Panel Design */}
        <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 w-[320px] sm:w-[580px] ${
          isCategoriesDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
        }`}>
          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading categories...</span>
            </div>
          ) : categoryTree.length === 0 ? (
            <div className="text-center py-8">
              <Tags className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No categories available</p>
            </div>
          ) : (
            <div className="flex">
              {/* Left Panel - Main Categories */}
              <div className="w-32 sm:w-52 border-r border-gray-200 dark:border-gray-700 p-2 sm:p-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Categories</h3>
                <div className="space-y-2">
                  {categoryTree.map((mainCategory, categoryIndex) => (
                    <div
                      key={mainCategory._id}
                      onMouseEnter={() => setHoveredCategory(mainCategory)}
                      onClick={() => handleNavigation(generateCategoryLink(mainCategory))}
                      className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        hoveredCategory?._id === mainCategory._id 
                          ? 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      } border border-transparent hover:border-gray-200 dark:hover:border-gray-700`}
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">
                        {getCategoryIcon(mainCategory.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium block truncate transition-colors ${
                          hoveredCategory?._id === mainCategory._id 
                            ? 'text-yellow-700 dark:text-yellow-400' 
                            : 'text-gray-700 dark:text-gray-200 group-hover:text-yellow-600 dark:group-hover:text-yellow-400'
                        }`}>
                          {mainCategory.name}
                        </span>
                        {/* <span className="text-xs text-gray-500 dark:text-gray-400">
                          {mainCategory.subcategories?.length || 0} items
                        </span> */}
                      </div>
                      {mainCategory.subcategories && mainCategory.subcategories.length > 0 && (
                        <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Subcategories */}
              <div className="flex-1 p-4">
                {hoveredCategory ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{getCategoryIcon(hoveredCategory.name)}</span>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {hoveredCategory.subcategories?.length || 0} subcategories
                        </p>
                      </div>
                    </div>
                    
                    {hoveredCategory.subcategories && hoveredCategory.subcategories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {hoveredCategory.subcategories.map((subcategory: any, subIndex: number) => (
                          <div
                            key={subcategory._id}
                            onClick={() => handleNavigation(generateCategoryLink(hoveredCategory, subcategory))}
                            className="group flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer border border-transparent hover:border-yellow-400/30"
                          >
                            <span className="text-sm group-hover:scale-105 transition-transform">
                              {getCategoryIcon(subcategory.name)}
                            </span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors truncate">
                              {subcategory.name}
                            </span>
                          </div>
                        ))}
                        
                        {/* View All Link */}
                        <div
                          onClick={() => handleNavigation(generateCategoryLink(hoveredCategory))}
                          className="group flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200 cursor-pointer border border-yellow-200 dark:border-yellow-800 col-span-2"
                        >
                          <span className="text-sm">📂</span>
                          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            View All {hoveredCategory.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No subcategories available</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-center">
                    <div>
                      <div className="text-4xl mb-2">👈</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Hover over a category to see subcategories</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Footer Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-xs">Official licensed merchandise</span>
            </div>
            <Link
              to="/shop"
              onClick={closeDropdowns}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full font-semibold text-sm hover:from-purple-400 hover:to-blue-400 transition-all transform hover:scale-105 shadow-lg"
            >
              Browse All
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShoppingDropdown;
