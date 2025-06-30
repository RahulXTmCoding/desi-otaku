import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { getWishlist, removeFromWishlist, clearWishlist } from '../core/helper/wishlistHelper';
import { addItemToCart } from '../core/helper/cartHelper';
import Base from '../core/Base';

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

              const isOutOfStock = product.stock === 0;
              const isRemoving = removingItem === product._id;
              const isAddingToCart = addingToCart === product._id;

              return (
                <div
                  key={product._id}
                  className="bg-gray-800 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-700">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={getImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </Link>

                    {/* Out of Stock Badge */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="px-4 py-2 bg-red-500 text-white font-semibold rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Added Date */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gray-900/80 text-xs rounded-full">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link 
                      to={`/product/${product._id}`}
                      className="block hover:text-yellow-400 transition-colors"
                    >
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price and Actions */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-yellow-400">
                          ${product.price}
                        </span>
                        {product.category && (
                          <span className="text-sm text-gray-400">
                            {product.category.name}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock || isAddingToCart}
                          className={`flex-1 px-4 py-2 rounded-full transition-all flex items-center justify-center gap-2 ${
                            isOutOfStock
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : isAddingToCart
                              ? 'bg-green-500 text-white'
                              : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isAddingToCart ? 'Added!' : 'Add to Cart'}
                        </button>
                        
                        <button
                          onClick={() => handleRemoveItem(product._id)}
                          disabled={isRemoving}
                          className="p-2 bg-gray-700 hover:bg-red-600 rounded-full transition-colors group/remove"
                          title="Remove from wishlist"
                        >
                          {isRemoving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 group-hover/remove:text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Base>
  );
};

export default Wishlist;
