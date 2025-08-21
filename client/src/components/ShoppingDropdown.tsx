 import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Shirt, Package, Star, Zap, Sparkles, Heart, Shield, Crown, TrendingUp, Flame } from 'lucide-react';

interface ShoppingDropdownProps {
  onLinkClick?: () => void;
}

const ShoppingDropdown: React.FC<ShoppingDropdownProps> = ({ onLinkClick }) => {
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [isAnimeDropdownOpen, setIsAnimeDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const closeDropdowns = () => {
    setIsProductsDropdownOpen(false);
    setIsAnimeDropdownOpen(false);
    onLinkClick?.();
  };

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

  // Enhanced product categories with icons and descriptions
  const productCategoriesStructure = [
    {
      title: "T-SHIRTS",
      icon: <Shirt className="w-6 h-6" />,
      color: "from-blue-500 to-purple-500",
      description: "Premium quality cotton tees",
      featured: true,
      items: [
        { name: "Printed T-shirt", link: "/shop?type=6866c0feb7d12a687483eff3", badge: "Popular", icon: "🎨" },
        { name: "Oversized T-shirt", link: "/shop?type=6866c0feb7d12a687483eff9", badge: "Trending", icon: "👕" },
        { name: "Plain T-shirt", link: "/shop?type=68a6bf8e30db6bf0b3cbb3ac", icon: "✨" }
      ]
    },
    {
      title: "WINTER WEAR",
      icon: <Package className="w-6 h-6" />,
      color: "from-cyan-500 to-blue-500",
      description: "Cozy and warm apparel",
      featured: true,
      items: [
        { name: "Hoodies", link: "/shop?type=6866c0feb7d12a687483eff7", badge: "Hot", icon: "🔥" },
        // { name: "Sweatshirts", link: "/shop?category=sweatshirt", icon: "❄️" }
      ]
    }
  ];

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

  // Popular anime categories with emojis and colors
  const animeCategories = [
    { name: "Naruto", link: "/shop?category=68644353659ea7d89d2a0427", popular: true, emoji: "🦊", color: "from-orange-400 to-yellow-500" },
    { name: "One Piece", link: "/shop?category=one-piece", popular: true, emoji: "☠️", color: "from-blue-400 to-cyan-500" },
    { name: "Dragon Ball", link: "/shop?category=dragon-ball", popular: true, emoji: "🐉", color: "from-orange-500 to-red-500" },
    { name: "Attack on Titan", link: "/shop?category=attack-on-titan", popular: true, emoji: "⚔️", color: "from-gray-600 to-red-600" },
    { name: "My Hero Academia", link: "/shop?category=my-hero-academia", popular: true, emoji: "💪", color: "from-green-400 to-blue-500" },
    { name: "Demon Slayer", link: "/shop?category=demon-slayer", popular: true, emoji: "🌊", color: "from-blue-500 to-purple-500" },
    { name: "Death Note", link: "/shop?category=death-note", emoji: "📓" },
    { name: "Tokyo Ghoul", link: "/shop?category=tokyo-ghoul", emoji: "👹" },
    { name: "Jujutsu Kaisen", link: "/shop?category=jujutsu-kaisen", emoji: "👻" },
    { name: "Hunter x Hunter", link: "/shop?category=hunter-x-hunter", emoji: "🎯" },
    { name: "Fullmetal Alchemist", link: "/shop?category=fullmetal-alchemist", emoji: "⚗️" },
    { name: "One Punch Man", link: "/shop?category=one-punch-man", emoji: "👊" }
  ];

  return (
    <>
      {/* Shop by Products Dropdown */}
      <div 
        className="relative group"
        onMouseEnter={() => {
          setIsProductsDropdownOpen(true);
          setIsAnimeDropdownOpen(false);
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
        
        {/* Products Dropdown - Optimized for current inventory */}
        <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 w-[500px] lg:w-[600px] ${
          isProductsDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
        }`}>
          <div className="p-6">
            {/* Main Categories - Centered Layout */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {productCategoriesStructure.map((category, index) => (
                <div key={index} className="group/category">
                  {/* Category Header Card */}
                  <div className={`bg-gradient-to-br ${category.color} p-5 rounded-xl mb-4 transform group-hover/category:scale-105 transition-all duration-300 shadow-lg`}>
                    <div className="flex items-center gap-3 text-white mb-2">
                      {category.icon}
                      <h3 className="font-bold text-lg uppercase tracking-wide">
                        {category.title}
                      </h3>
                    </div>
                    <p className="text-sm text-white/90">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Category Items */}
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        onClick={() => handleNavigation(item.link)}
                        className="group/item flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover/item:text-yellow-600 dark:group-hover/item:text-yellow-400 transition-colors">
                            {item.name}
                          </span>
                        </div>
                        {item.badge && (
                          <span className="text-xs px-2 py-1 bg-yellow-400 text-gray-900 rounded-full font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Access Section */}
            {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Quick Access</h4>
              <div className="grid grid-cols-3 gap-4">
                {featuredItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.link}
                    onClick={closeDropdowns}
                    className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${item.color} p-4 transform hover:scale-105 transition-all duration-300`}
                  >
                    <div className="relative z-10 text-white">
                      <div className="mb-2">{item.icon}</div>
                      <h5 className="font-bold text-sm mb-1">{item.name}</h5>
                      <p className="text-xs opacity-90">{item.description}</p>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500"></div>
                  </Link>
                ))}
              </div>
            </div> */}
            
            {/* Footer Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Free shipping on orders over ₹999</span>
              </div>
              <Link
                to="/shop"
                onClick={closeDropdowns}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-6 py-2.5 rounded-full font-semibold hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg"
              >
                View All Products
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Shop by Anime Dropdown */}
      <div 
        className="relative group"
        onMouseEnter={() => {
          setIsAnimeDropdownOpen(true);
          setIsProductsDropdownOpen(false);
        }}
        onMouseLeave={() => setIsAnimeDropdownOpen(false)}
      >
        <button className="flex items-center gap-1 relative transition-all group" style={{ color: 'var(--color-text)', opacity: 0.9 }}>
          <span className="relative z-10">
            <span className="hidden xl:inline">SHOP BY ANIME</span>
            <span className="xl:hidden">ANIME</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAnimeDropdownOpen ? 'rotate-180' : ''}`} />
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
        </button>
        
        {/* Anime Dropdown */}
        <div className={`absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 w-[600px] lg:w-[700px] ${
          isAnimeDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
        }`}>
          <div className="p-8">
            {/* Popular Anime Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Popular Anime</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {animeCategories.filter(anime => anime.popular).map((anime, index) => (
                  <div
                    key={index}
                    onClick={() => handleNavigation(anime.link)}
                    className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${anime.color || 'from-gray-100 to-gray-200'} p-4 transform hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer`}
                  >
                    <div className="relative z-10">
                      <div className="text-3xl mb-2">{anime.emoji}</div>
                      <span className="text-sm font-bold text-white drop-shadow-lg">
                        {anime.name}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* More Anime Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">More Anime</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {animeCategories.filter(anime => !anime.popular).map((anime, index) => (
                  <div
                    key={index}
                    onClick={() => handleNavigation(anime.link)}
                    className="group flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{anime.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                      {anime.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm">Official licensed merchandise</span>
              </div>
              <Link
                to="/shop"
                onClick={closeDropdowns}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2.5 rounded-full font-semibold hover:from-purple-400 hover:to-blue-400 transition-all transform hover:scale-105 shadow-lg"
              >
                Browse All Anime
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShoppingDropdown;
