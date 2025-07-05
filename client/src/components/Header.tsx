import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, X, Sparkles, Palette } from 'lucide-react';
import { signout, isAutheticated } from '../auth/helper';
import { useCart } from '../context/CartContext';
import { getWishlistCount } from '../core/helper/wishlistHelper';
import CartDrawer from './CartDrawer';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const auth = isAutheticated();
  const { getItemCount, syncCart } = useCart();
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(0);

  const cartCount = getItemCount();

  useEffect(() => {
    // Trigger animation when cart count changes
    if (cartCount !== prevCartCount && cartCount > prevCartCount) {
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 600);
    }
    setPrevCartCount(cartCount);
  }, [cartCount, prevCartCount]);

  const handleSignout = async () => {
    // Clear cart context on logout
    await syncCart();
    signout(() => {
      navigate("/");
    });
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="relative z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-lg">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-white hover:text-yellow-400 transition-all hover:scale-110"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo - Link to dashboard for admin, home for others */}
        <Link to={auth && auth.user && auth.user.role === 1 ? "/admin/dashboard" : "/"} className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
              <span className="text-gray-900 font-bold text-xl">👕</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                AnimeShirt
              </span>
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-xs text-gray-400 -mt-1">Custom Anime Designs</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {auth && auth.user && auth.user.role === 1 ? (
            // Admin Navigation
            <>
              <Link to="/admin/dashboard" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Dashboard</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/designs" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Designs</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/products" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Products</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/product-types" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Types</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/categories" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Categories</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/orders" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Orders</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/admin/analytics" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Analytics</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </>
          ) : (
            // Customer Navigation
            <>
              <Link to="/" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Home</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/shop" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Shop</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/customize" className="relative group">
                <div className="relative px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-full font-semibold transform group-hover:scale-105 transition-all shadow-lg">
                  <Palette className="inline-block w-4 h-4 mr-1" />
                  Custom Design
                  <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              </Link>
              <Link to="/contact" className="relative text-white/90 hover:text-white transition-all group">
                <span className="relative z-10">Contact</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </>
          )}
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Only show wishlist and cart for non-admin users */}
          {(!auth || !auth.user || auth.user.role !== 1) && (
            <>
              <Link to="/wishlist" className="relative p-2 text-white/80 hover:text-white hover:bg-gray-800 rounded-lg transition-all" title="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2 text-white/80 hover:text-white hover:bg-gray-800 rounded-lg transition-all group"
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
                <span className="text-sm font-medium text-white hidden md:block">
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

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
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
          className={`absolute left-0 top-0 h-full w-64 bg-gray-900 shadow-xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">👕</span>
              </div>
              <span className="text-xl font-bold text-white">AnimeShirt</span>
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
                <Link
                  to="/shop"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Shop
                </Link>
                <Link
                  to="/customize"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Custom Design
                </Link>
                <Link
                  to="/contact"
                  onClick={closeMobileMenu}
                  className="block px-6 py-3 text-white hover:bg-gray-800 hover:text-yellow-400 transition-colors"
                >
                  Contact
                </Link>
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
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
