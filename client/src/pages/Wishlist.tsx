import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { getWishlist, removeFromWishlist, clearWishlist } from '../core/helper/wishlistHelper';
import { addItemToCart } from '../core/helper/cartHelper';
import Base from '../core/Base';
import ProductGridItem from '../components/ProductGridItem';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    if (!userId || !token) {
      setLoading(false);
      return;
    }

    try {
      const result = await getWishlist(userId, token);
      setWishlist(result);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!userId || !token) return;

    setRemovingItem(productId);
    try {
      const result = await removeFromWishlist(userId, token, productId);
      if (!result.error) {
        // Reload wishlist
        await loadWishlist();
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    } finally {
      setRemovingItem(null);
    }
  };

  const handleClearWishlist = async () => {
    if (!userId || !token) return;
    
    if (!window.confirm('Are you sure you want to clear your wishlist?')) {
      return;
    }

    try {
      const result = await clearWishlist(userId, token);
      if (!result.error) {
        setWishlist({ ...wishlist, products: [] });
      }
    } catch (err) {
      console.error('Error clearing wishlist:', err);
    }
  };

  const handleAddToCart = (product: any) => {
    setAddingToCart(product._id);
    addItemToCart(product, () => {
      setAddingToCart(null);
    });
  };

  const handleAddAllToCart = () => {
    if (!wishlist || !wishlist.products) return;

    wishlist.products.forEach((item: any) => {
      if (item.product && item.product.stock > 0) {
        addItemToCart(item.product, () => {});
      }
    });

    alert('All available items added to cart!');
  };

  const getImageUrl = (product: any) => {
    if (product.photoUrl) return product.photoUrl;
    return `/api/product/photo/${product._id}`;
  };

  if (!auth) {
    return (
      <Base title="Wishlist">
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <Heart className="w-16 h-16 text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-gray-400 mb-8">You need to login to view your wishlist</p>
          <Link
            to="/signin"
            className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-full hover:bg-yellow-300 transition-colors"
          >
            Login Now
          </Link>
        </div>
      </Base>
    );
  }

  return (
    <Base title="My Wishlist">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-gray-400">
              {wishlist?.products?.length || 0} items in your wishlist
            </p>
          </div>
          
          {wishlist?.products?.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleAddAllToCart}
                className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-full hover:bg-yellow-300 transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add All to Cart
              </button>
              <button
                onClick={handleClearWishlist}
                className="px-6 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              >
                Clear Wishlist
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!wishlist?.products || wishlist.products.length === 0) && (
          <div className="text-center py-12">
            <Heart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-8">
              Start adding your favorite anime t-shirts to your wishlist!
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-full hover:bg-yellow-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        )}

        {/* Wishlist Grid */}
        {!loading && wishlist?.products?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.products.map((item: any) => {
              const product = item.product;
              if (!product) return null;

              return (
                <ProductGridItem
                  key={product._id}
                  product={product}
                  showWishlistButton={false}
                  showRemoveButton={true}
                  onRemove={handleRemoveItem}
                  isInWishlist={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </Base>
  );
};

export default Wishlist;
