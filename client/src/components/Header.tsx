import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, X, Sparkles, Palette, Shuffle, Check, ChevronDown, ChevronRight, Loader2, Package, Tags } from 'lucide-react';
import { signout, isAutheticated } from '../auth/helper';
import { useCart } from '../context/CartContext';
import { getWishlistCount } from '../core/helper/wishlistHelper';
import CartDrawer from './CartDrawer';
import ThemeSwitcher from './ThemeSwitcher';
import ShoppingDropdown from './ShoppingDropdown';
import SearchInput from './SearchInput';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, getMockProductImage, mockCategories } from '../data/mockData';
import { useFilteredProducts } from '../hooks/useProducts';
import { getRandomDesign } from '../admin/helper/designapicall';
import { getCategoryTree, getProductTypes } from '../core/helper/coreapicalls';
import { API } from '../backend';
import RealTShirtPreview from './RealTShirtPreview';
import { toast } from 'react-hot-toast';
import '../styles/adaptive-logo.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const auth = isAutheticated();
  const isAdmin = auth && auth.user && auth.user.role === 1;
  const { isTestMode } = useDevMode();
  
  // Only use cart functionality for non-admin users
  const { getItemCount, syncCart, addToCart } = !isAdmin ? useCart() : { getItemCount: () => 0, syncCart: async () => {}, addToCart: async () => {} };
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileUserDropdownOpen, setIsMobileUserDropdownOpen] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(0);

  // Mobile menu dynamic data state
  const [mobileProductTypes, setMobileProductTypes] = useState<any[]>([]);
  const [mobileCategoryTree, setMobileCategoryTree] = useState<any[]>([]);
  const [mobileDataLoading, setMobileDataLoading] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>('categories');
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  // Random design modal state
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomSelection, setRandomSelection] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRandomColor, setSelectedRandomColor] = useState<any>(null);
  const [selectedRandomSize, setSelectedRandomSize] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);

  const cartCount = !isAdmin ? getItemCount() : 0;

  useEffect(() => {
    // Trigger animation when cart count changes
    if (cartCount !== prevCartCount && cartCount > prevCartCount) {
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 600);
    }
    setPrevCartCount(cartCount);
  }, [cartCount, prevCartCount]);

  // Fetch data when mobile menu opens
  useEffect(() => {
    const fetchMobileMenuData = async () => {
      if (isMobileMenuOpen && (!mobileProductTypes.length || !mobileCategoryTree.length)) {
        setMobileDataLoading(true);
        try {
          if (isTestMode) {
            // Use mock data in test mode
            setTimeout(() => {
              setMobileProductTypes([
                { _id: '1', name: 'T-Shirts', displayName: 'T-Shirts', category: 'apparel', icon: '👕' },
                { _id: '2', name: 'Hoodies', displayName: 'Hoodies', category: 'winter', icon: '🔥' }
              ]);
              setMobileCategoryTree(mockCategories);
              setMobileDataLoading(false);
            }, 500);
          } else {
            // Fetch real data from backend
            const [typesData, categoryData] = await Promise.all([
              getProductTypes(),
              getCategoryTree()
            ]);
            
            setMobileProductTypes(typesData || []);
            setMobileCategoryTree(categoryData || []);
            setMobileDataLoading(false);
          }
        } catch (error) {
          console.error('Error fetching mobile menu data:', error);
          setMobileDataLoading(false);
        }
      }
    };

    fetchMobileMenuData();
  }, [isMobileMenuOpen, isTestMode, mobileProductTypes.length, mobileCategoryTree.length]);

  const handleRandomSurprise = async () => {
    // Always generate random custom design modal
    handleRandomDesign();
  };

  const handleRandomDesign = async () => {
    setIsGenerating(true);
    setShowRandomModal(true);
    setAddedToCart(false);
    
    // Simulate loading animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      let randomDesign;
      
      if (isTestMode) {
        // Use mock products as designs in test mode
        const mockDesigns = mockProducts.map(p => ({
          _id: p._id,
          name: p.name,
          imageUrl: getMockProductImage(p._id),
          price: 150,
          category: p.category,
          isActive: true
        }));
        randomDesign = mockDesigns[Math.floor(Math.random() * mockDesigns.length)];
      } else {
        // OPTIMIZED: Get single random design from backend
        randomDesign = await getRandomDesign();
      }
      
      if (!randomDesign) {
        setIsGenerating(false);
        return;
      }
      
      // Generate random color, size, and placement
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
        price: 499 + (randomDesign.price || 150) // Base + actual design price
      };
      
      setRandomSelection(selection);
      setSelectedRandomColor(randomColor);
      setSelectedRandomSize(randomSize);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating random design:', error);
      setIsGenerating(false);
      toast.error('Failed to generate random design');
    }
  };

  const handleAddRandomToCart = async () => {
    if (!randomSelection || !selectedRandomColor || !selectedRandomSize) {
      toast.error('Please select color and size');
      return;
    }
    
    try {
      const designName = `${randomSelection.position === 'front' ? 'Front' : 'Back'}: ${randomSelection.design.name}`;
      const designImageUrl = getDesignImageUrl(randomSelection.design);
      
      
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
            designImage: designImageUrl,
            position: randomSelection.designPosition,
            price: randomSelection.design.price || 150
          } : undefined,
          backDesign: randomSelection.position === 'back' ? {
            designId: randomSelection.design._id,
            designImage: designImageUrl,
            position: randomSelection.designPosition,
            price: randomSelection.design.price || 150
          } : undefined
        }
      };

      
      await addToCart(cartItem);
      setAddedToCart(true);
      toast.success('Added to cart!');
      
      setTimeout(() => {
        setShowRandomModal(false);
        setRandomSelection(null);
        setSelectedRandomColor(null);
        setSelectedRandomSize('');
        setAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to add to cart:', error);
      toast.error('Failed to add to cart: ' + (error.message || 'Unknown error'));
    }
  };

  const getDesignImageUrl = (design: any) => {
    
    if (design.imageUrl && (design.imageUrl.startsWith('http') || design.imageUrl.startsWith('data:'))) {
      return design.imageUrl;
    }
    
    const apiImageUrl = `${API}/design/image/${design._id}`;
    return apiImageUrl;
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

  const handleSignout = async () => {
    // Clear cart context on logout
    await syncCart();
    signout(() => {
      navigate("/");
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setExpandedMobileSection(null);
    setExpandedMobileCategory(null);
  };

  // Helper functions for mobile menu (similar to ShoppingDropdown)
  const getMobileProductTypeIcon = (typeName: string) => {
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

  const getMobileCategoryIcon = (categoryName: string) => {
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

  const handleMobileNavigation = (link: string) => {
    closeMobileMenu();
    navigate(link);
  };

  const toggleMobileSection = (section: string) => {
    setExpandedMobileSection(expandedMobileSection === section ? null : section);
  };

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategory(expandedMobileCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      {/* Desktop Header - Hidden on Mobile */}
      <nav className="hidden md:flex sticky top-0 z-50 items-center justify-between px-6 py-4 shadow-lg backdrop-blur-md" style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
        {/* Desktop Logo - Left Side */}
        <Link to={auth && auth.user && auth.user.role === 1 ? "/admin/dashboard" : "/"} className="flex items-center space-x-3 group">
          <div className="relative">
            {/* <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div> */}
            <div className="relative w-36  flex items-center justify-center ">
              <img src="/brand.png" alt="Attars Club Logo" className="w-36 object-contain logo-adaptive" />
            </div>
          </div>
        </Link>

        {/* Desktop Navigation - Center */}
        <div className="flex items-center space-x-2 lg:space-x-4 xl:space-x-6 2xl:space-x-8">
          {auth && auth.user && auth.user.role === 1 ? (
            // Admin Navigation
            <>
              <Link to="/admin/dashboard" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Dashboard</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/designs" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Designs</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/products" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Products</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/product-types" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Types</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/categories" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Categories</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/orders" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Orders</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/analytics" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Analytics</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </>
          ) : (
            // Customer Navigation
            <>
              <Link to="/" className="relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
                <span className="relative z-10">Home</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {/* Shopping Dropdown */}
              <ShoppingDropdown />
              
              <Link to="/customize" className="relative group">
                <div style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primaryText)' }} className="relative px-3 lg:px-4 py-1.5 rounded-full font-semibold transform group-hover:scale-105 transition-all shadow-lg">
                  <Palette className="inline-block w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Custom Design</span>
                  <span className="lg:hidden">Custom</span>
                  <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </Link>
              <button 
                onClick={handleRandomSurprise}
                className="relative group"
                title="Surprise Me!"
              >
                <div className="relative px-3 lg:px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold transform group-hover:scale-105 transition-all shadow-lg">
                  <Sparkles className="inline-block w-4 h-4 mr-1 group-hover:animate-spin" />
                  <span className="hidden lg:inline">Surprise Me!</span>
                  <span className="lg:hidden">Surprise</span>
                  <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Desktop Right Side Icons */}
        <div className="flex items-center space-x-3">
          {/* Theme Switcher */}
          <ThemeSwitcher />
          
          {/* Search Button - Only show for non-admin customers */}
          {(!auth || !auth.user || auth.user.role !== 1) && (
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: 'var(--color-text)', opacity: 0.8 }}
              title="Search"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          {/* Only show wishlist and cart for non-admin users */}
          {(!auth || !auth.user || auth.user.role !== 1) && (
            <>
              <Link to="/wishlist" className="relative p-2 rounded-lg transition-all" title="Wishlist" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                <Heart className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2 rounded-lg transition-all group"
                style={{ color: 'var(--color-text)', opacity: 0.8 }}
                aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
              >
                <ShoppingCart 
                  className={`w-5 h-5 ${cartAnimation ? 'animate-bounce' : ''}`} 
                />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${
                    cartAnimation ? 'animate-ping' : ''
                  }`}>
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}
          {!auth ? (
            <Link to="/signin" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Sign In</span>
            </Link>
          ) : (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-900" />
                </div>
                <span className="text-sm font-medium text-white">
                  {auth.user.name || 'Account'}
                </span>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transform group-hover:translate-y-0 translate-y-2 transition-all duration-200 z-50 border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="font-medium text-white truncate">{auth.user.email}</p>
                </div>
                <Link
                  to={auth.user.role === 1 ? "/admin/dashboard" : "/user/dashboard"}
                  className="block px-4 py-3 text-sm text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    Dashboard
                  </span>
                </Link>
                <button
                  onClick={handleSignout}
                  className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 hover:text-yellow-400 rounded-b-xl transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Header - Hidden on Desktop */}
      <nav className="md:hidden sticky top-0 z-50 flex items-center px-1 py-4 shadow-lg backdrop-blur-md" style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
        {/* Mobile Left Section - Menu + Search */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 transition-all hover:scale-110"
            style={{ color: 'var(--color-text)' }}
            aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Search Button - Only show for non-admin customers on mobile */}
          {(!auth || !auth.user || auth.user.role !== 1) && (
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ color: 'var(--color-text)', opacity: 0.8 }}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <ThemeSwitcher />
        </div>

        {/* Mobile Center Section - Logo (Absolutely Centered) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to={auth && auth.user && auth.user.role === 1 ? "/admin/dashboard" : "/"} className="flex items-center group">
            <div className="relative">
              {/* <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div> */}
              <div className="relative w-28 flex items-center justify-center transform group-hover:scale-110 transition-transform rounded-xl overflow-hidden">
                <img src="/brand.png" alt="Attars Club Logo" className="w-28 h-10 object-contain logo-adaptive" />
              </div>
            </div>
          </Link>
        </div>

        {/* Mobile Right Section - Theme + Cart + User */}
        <div className="flex items-center ml-auto">
          {/* Theme Switcher */}
        
          
          {/* Only show wishlist and cart for non-admin users */}
          {(!auth || !auth.user || auth.user.role !== 1) && (
            <>
              {/* Mobile wishlist - only when logged in */}
              {auth && (
                <Link to="/wishlist" className="relative p-2 rounded-lg transition-all" title="Wishlist" style={{ color: 'var(--color-text)', opacity: 0.8 }}>
                  <Heart className="w-5 h-5" />
                </Link>
              )}
              <button 
                onClick={() => navigate('/cart')} 
                className="relative p-2 rounded-lg transition-all group"
                style={{ color: 'var(--color-text)', opacity: 0.8 }}
              >
                <ShoppingCart 
                  className={`w-5 h-5 ${cartAnimation ? 'animate-bounce' : ''}`} 
                />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${
                    cartAnimation ? 'animate-ping' : ''
                  }`}>
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          )}
          
          {/* Mobile User Authentication */}
          {!auth ? (
            <Link to="/signin" className="p-2 rounded-lg transition-all hover:scale-110" style={{ color: 'var(--color-text)', opacity: 0.8 }} title="Sign In">
              <User className="w-5 h-5" />
            </Link>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setIsMobileUserDropdownOpen(!isMobileUserDropdownOpen)}
                className="p-2 rounded-lg transition-all hover:scale-110" 
                title="Account"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-900" />
                </div>
              </button>

              {/* Mobile User Dropdown Menu */}
              {isMobileUserDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMobileUserDropdownOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-xl shadow-xl z-50 border border-gray-700 overflow-hidden">
                    {/* User Info Header */}
                    <div className="p-4 bg-gray-900 border-b border-gray-700">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="font-medium text-white truncate">{auth.user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{auth.user.email}</p>
                    </div>

                    {/* Dashboard Navigation Items */}
                    {auth.user.role !== 1 && (
                      <div className="py-2">
                        <Link
                          to="/user/dashboard?tab=overview"
                          onClick={() => setIsMobileUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>📊 Overview</span>
                        </Link>
                        <Link
                          to="/user/dashboard?tab=orders"
                          onClick={() => setIsMobileUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>📦 My Orders</span>
                        </Link>
                        <Link
                          to="/user/dashboard?tab=addresses"
                          onClick={() => setIsMobileUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>📍 Addresses</span>
                        </Link>
                        <Link
                          to="/user/dashboard?tab=rewards"
                          onClick={() => setIsMobileUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>🎁 Rewards</span>
                        </Link>
                        <Link
                          to="/user/dashboard?tab=settings"
                          onClick={() => setIsMobileUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>⚙️ Settings</span>
                        </Link>
                      </div>
                    )}

                    {/* Admin Dashboard Link */}
                    {auth.user.role === 1 && (
                      <div className="py-2">
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsMobileUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>🏢 Admin Dashboard</span>
                        </Link>
                      </div>
                    )}

                    {/* Sign Out */}
                    <div className="border-t border-gray-700">
                      <button
                        onClick={() => {
                          handleSignout();
                          setIsMobileUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors w-full"
                      >
                        <User className="w-4 h-4" />
                        <span>🚪 Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeMobileMenu}
        />

        {/* Menu Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-80 bg-gray-900 shadow-xl transform transition-transform duration-300 overflow-y-auto ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <div className="w-28 flex items-center justify-center rounded-lg overflow-hidden">
                <img src="/brand.png" alt="Attars Club Logo" className="w-28 object-contain logo-adaptive" />
              </div>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-white hover:text-yellow-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Links */}
          <div className="py-4">
            {auth && auth.user && auth.user.role === 1 ? (
              // Admin Mobile Navigation
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/designs"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Designs
                </Link>
                <Link
                  to="/admin/products"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Products
                </Link>
                <Link
                  to="/admin/product-types"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Product Types
                </Link>
                <Link
                  to="/admin/categories"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Categories
                </Link>
                <Link
                  to="/admin/orders"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Orders
                </Link>
                <Link
                  to="/admin/analytics"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Analytics
                </Link>
              </>
            ) : (
              // Customer Mobile Navigation
              <>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Home
                </Link>
                
                {/* Dynamic Mobile Menu Content */}
                {mobileDataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-400 mr-3" />
                    <span className="text-gray-400">Loading menu...</span>
                  </div>
                ) : (
                  <>
                    {/* Shop by Products Section */}
                    <div className="border-t border-gray-800">
                      <button
                        onClick={() => toggleMobileSection('products')}
                        className="w-full flex items-center justify-between px-6 py-4 text-white hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-blue-400" />
                          <span className="font-semibold">Shop Products</span>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                            {mobileProductTypes.length}
                          </span>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            expandedMobileSection === 'products' ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${
                        expandedMobileSection === 'products' ? 'max-h-96' : 'max-h-0'
                      }`}>
                        <div className="px-3 mt-2 pb-4 space-y-2">
                          {mobileProductTypes.length === 0 ? (
                            <div className="text-center py-4">
                              <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No products available</p>
                            </div>
                          ) : (
                            mobileProductTypes.map((product) => (
                              <div
                                key={product._id}
                                onClick={() => handleMobileNavigation(`/shop?type=${product._id}`)}
                                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer group"
                              >
                                <span className="text-lg group-hover:scale-110 transition-transform">
                                  {getMobileProductTypeIcon(product.displayName || product.name)}
                                </span>
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">
                                    {product.displayName || product.name}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                          <div 
                            onClick={() => handleMobileNavigation('/shop')}
                            className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer group mt-3"
                          >
                            <span className="text-blue-300 text-sm font-medium">View All Products</span>
                            <ChevronRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shop by Categories Section */}
                    <div className="border-t border-gray-800">
                      <button
                        onClick={() => toggleMobileSection('categories')}
                        className="w-full flex items-center justify-between px-6 py-4 text-white hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Tags className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold">Shop Categories</span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                            {mobileCategoryTree.length}
                          </span>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            expandedMobileSection === 'categories' ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${
                        expandedMobileSection === 'categories' ? 'max-h-[600px]' : 'max-h-0'
                      }`}>
                        <div className="px-3 mt-2 pb-4 space-y-2 overflow-y-auto">
                          {mobileCategoryTree.length === 0 ? (
                            <div className="text-center py-4">
                              <Tags className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No categories available</p>
                            </div>
                          ) : (
                            mobileCategoryTree.map((category) => (
                              <div key={category._id} className="space-y-1">
                                {/* Main Category */}
                                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group">
                                  {/* Category Info - Clickable to navigate */}
                                  <div 
                                    onClick={() => handleMobileNavigation(`/shop?category=${category._id}`)}
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                  >
                                    <span className="text-lg group-hover:scale-110 transition-transform">
                                      {getMobileCategoryIcon(category.name)}
                                    </span>
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">
                                        {category.name}
                                      </span>
                                      {category.subcategories && category.subcategories.length > 0 && (
                                        <p className="text-xs text-gray-400">
                                          {category.subcategories.length} subcategories
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Subcategory Toggle Button - Only show if subcategories exist */}
                                  {category.subcategories && category.subcategories.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMobileCategory(category._id);
                                      }}
                                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                                    >
                                      <ChevronDown 
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                          expandedMobileCategory === category._id ? 'rotate-180' : ''
                                        }`} 
                                      />
                                    </button>
                                  )}
                                </div>
                                
                                {/* Collapsible Subcategories */}
                                {category.subcategories && category.subcategories.length > 0 && (
                                  <div className={`overflow-hidden transition-all duration-300 ${
                                    expandedMobileCategory === category._id ? 'max-h-96' : 'max-h-0'
                                  }`}>
                                    <div className="ml-1 pt-2 pb-1">
                                      {/* 2-Column Grid for Subcategories */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {category.subcategories.map((subcategory: any) => (
                                          <div
                                            key={subcategory._id}
                                            onClick={() => handleMobileNavigation(`/shop?category=${category._id}&subcategory=${subcategory._id}`)}
                                            className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors cursor-pointer group"
                                          >
                                            <span className="text-sm group-hover:scale-105 transition-transform">
                                              {getMobileCategoryIcon(subcategory.name)}
                                            </span>
                                            <span className="text-xs text-gray-300 group-hover:text-yellow-300 transition-colors truncate">
                                              {subcategory.name}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {/* View All Link */}
                                      <div
                                        onClick={() => handleMobileNavigation(`/shop?category=${category._id}`)}
                                        className="flex items-center justify-center gap-2 p-2 mt-2 text-purple-300 hover:text-purple-200 transition-colors cursor-pointer"
                                      >
                                        <span className="text-xs font-medium">View All in {category.name}</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                          <div 
                            onClick={() => handleMobileNavigation('/shop')}
                            className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors cursor-pointer group mt-3"
                          >
                            <span className="text-purple-300 text-sm font-medium">View All Categories</span>
                            <ChevronRight className="w-4 h-4 text-purple-300 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <Link
                  to="/customize"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  🎨 Custom Design
                </Link>
                
                <button
                  onClick={() => {
                    handleRandomSurprise();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left px-6 py-3 text-purple-400 hover:bg-gray-800 hover:text-purple-300 transition-colors font-semibold"
                >
                  ✨ Surprise Me!
                </button>
              </>
            )}

            {/* Mobile User Section */}
            <div className="mt-6 px-6 pt-6 border-t border-gray-800">
              {!auth ? (
                <Link
                  to="/signin"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 py-3 text-white hover:text-yellow-400 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </Link>
              ) : (
                <>
                  <div className="flex items-center space-x-3 mb-4 text-white">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{auth.user.name || 'User'}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignout();
                      closeMobileMenu();
                    }}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setIsMobileSearchOpen(false)}
        />

        {/* Search Modal */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gray-900 shadow-xl transform transition-transform duration-300 ${
            isMobileSearchOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          {/* Search Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">Search Products</h3>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-white hover:text-yellow-400 transition-colors rounded-lg hover:bg-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4">
            <SearchInput 
              placeholder="Search for anime, designs, products..."
              className="w-full"
              showSuggestions={true}
              isMobile={true}
              autoFocus={true}
              onSearch={() => setIsMobileSearchOpen(false)}
            />
          </div>

          {/* Quick Links */}
          <div className="px-4 pb-4">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Quick Search</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  navigate('/shop?search=anime');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors text-left"
              >
                <span className="text-lg mb-1 block">🎌</span>
                <span className="text-sm font-medium">Anime</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  navigate('/shop?search=oversized');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors text-left"
              >
                <span className="text-lg mb-1 block">👕</span>
                <span className="text-sm font-medium">Oversized</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  navigate('/shop?search=custom');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors text-left"
              >
                <span className="text-lg mb-1 block">🎨</span>
                <span className="text-sm font-medium">Custom</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  navigate('/shop');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors text-left"
              >
                <span className="text-lg mb-1 block">🛍️</span>
                <span className="text-sm font-medium">All Products</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        .animate-bounce {
          animation: bounce 0.6s;
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
      
      {/* Cart Drawer - Only render for non-admin users */}
      {!isAdmin && <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}

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
                        Base ₹499 + Design ₹{randomSelection.design.price || 150}
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
    </>
  );
};

export default Header;
