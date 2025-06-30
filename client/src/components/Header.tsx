import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart } from 'lucide-react';
import { signout, isAutheticated } from '../auth/helper';
import { loadCart } from '../core/helper/cartHelper';
import { getWishlistCount } from '../core/helper/wishlistHelper';
import CartDrawer from './CartDrawer';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const auth = isAutheticated();
  const [cartCount, setCartCount] = useState(0);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    updateCartCount();
    // Listen for cart updates
    const interval = setInterval(updateCartCount, 1000);
    
    // Listen for custom cart update event
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const updateCartCount = () => {
    const cart = loadCart();
    const totalItems = cart.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  const handleCartUpdate = () => {
    updateCartCount();
    // Trigger animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 600);
  };

  const handleSignout = () => {
    signout(() => {
      navigate("/");
    });
  };

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
          <span className="text-gray-900 font-bold text-lg">👕</span>
        </div>
        <span className="text-xl font-bold text-white">AnimeShirt</span>
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <Link to="/" className="text-white hover:text-yellow-400 transition-colors">
          Home
        </Link>
        <Link to="/shop" className="text-white hover:text-yellow-400 transition-colors">
          Shop
        </Link>
        <Link to="/customize" className="text-white hover:text-yellow-400 transition-colors">
          Custom Design
        </Link>
        {auth && auth.user && auth.user.role === 0 && (
          <Link to="/user/dashboard" className="text-white hover:text-yellow-400 transition-colors">
            Dashboard
          </Link>
        )}
        {auth && auth.user && auth.user.role === 1 && (
          <Link to="/admin/dashboard" className="text-white hover:text-yellow-400 transition-colors">
            Admin
          </Link>
        )}
        <Link to="/contact" className="text-white hover:text-yellow-400 transition-colors">
          Contact
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Search className="w-5 h-5 text-white cursor-pointer hover:text-yellow-400 transition-colors" />
        <Link to="/wishlist" className="relative" title="Wishlist">
          <Heart className="w-5 h-5 text-white cursor-pointer hover:text-yellow-400 transition-colors" />
        </Link>
        <button onClick={() => setIsCartOpen(true)} className="relative">
          <ShoppingCart 
            className={`w-5 h-5 text-white cursor-pointer hover:text-yellow-400 transition-colors ${
              cartAnimation ? 'animate-bounce' : ''
            }`} 
          />
          {cartCount > 0 && (
            <span className={`absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
              cartAnimation ? 'animate-ping' : ''
            }`}>
              {cartCount}
            </span>
          )}
        </button>
        {!auth ? (
          <Link to="/signin">
            <User className="w-5 h-5 text-white cursor-pointer hover:text-yellow-400 transition-colors" />
          </Link>
        ) : (
          <div className="relative group">
            <User className="w-5 h-5 text-white cursor-pointer hover:text-yellow-400 transition-colors" />
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <Link
                to={auth.user.role === 1 ? "/admin/dashboard" : "/user/dashboard"}
                className="block px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-yellow-400 rounded-t-lg"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignout}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 hover:text-yellow-400 rounded-b-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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
      `}</style>
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default Header;
