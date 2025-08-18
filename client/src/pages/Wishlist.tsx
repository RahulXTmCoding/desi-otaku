import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { getWishlist, removeFromWishlist, clearWishlist } from '../core/helper/wishlistHelper';
import { addItemToCart } from '../core/helper/cartHelper';
import Base from '../core/Base';
import ProductGridItem from '../components/ProductGridItem';
import { API } from '../backend';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    loadWishlist();
  }, [currentPage]);

  const loadWishlist = async () => {
    if (!userId || !token) {
      setLoading(false);
      return;
    }

    try {
      const result = await getWishlist(userId, token, { 
        page: currentPage, 
        limit: itemsPerPage 
      });
      
      if (result && !result.error) {
        // Handle paginated response
        if (result.pagination) {
          setWishlist({ products: result.products || [] });
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.totalItems);
          setHasNextPage(result.pagination.hasNextPage);
          setHasPreviousPage(result.pagination.hasPreviousPage);
        } else {
          // Handle legacy response format (all items)
          setWishlist(result);
          setTotalItems(result.products?.length || 0);
          setTotalPages(1);
          setHasNextPage(false);
          setHasPreviousPage(false);
        }
      }
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

  const handleAddToCart = async (product: any) => {
    if (!userId || !token) return;
    
    setAddingToCart(product._id);
    
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      size: 'M',
      color: 'Default',
      quantity: 1,
      isCustom: false,
      photoUrl: product.photoUrl || `${API}/product/image/${product._id}`
    };
    
    try {
      const result = await addItemToCart(userId, token, cartItem);
      if (!result.error) {
        // Success feedback could be added here
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleAddAllToCart = async () => {
    if (!wishlist || !wishlist.products || !userId || !token) return;

    for (const item of wishlist.products) {
      if (item.product && item.product.stock > 0) {
        const cartItem = {
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          size: 'M',
          color: 'Default',
          quantity: 1,
          isCustom: false,
          photoUrl: item.product.photoUrl || `${API}/product/image/${item.product._id}`
        };
        
        try {
          await addItemToCart(userId, token, cartItem);
        } catch (err) {
          console.error('Error adding to cart:', err);
        }
      }
    }

    alert('All available items added to cart!');
  };

  const getImageUrl = (product: any) => {
    if (product.photoUrl) return product.photoUrl;
    return `${API}/product/image/${product._id}`;
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
      <div className="w-[96%] md:w-[90%] mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-gray-400 text-sm md:text-base">
              {wishlist?.products?.length || 0} items in your wishlist
            </p>
          </div>
          
          {wishlist?.products?.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleClearWishlist}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors text-sm sm:text-base"
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
          <>
            {/* Items Count and Pagination Info */}
            {totalItems > 0 && (
              <div className="mb-4 text-sm text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
              </div>
            )}
            
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))', maxWidth: '1200px', justifyContent: 'start' }}>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-700 gap-4">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!hasPreviousPage}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      hasPreviousPage
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-yellow-400 text-gray-900 font-bold'
                              : 'bg-gray-700 hover:bg-gray-600 text-white'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!hasNextPage}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      hasNextPage
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Base>
  );
};

export default Wishlist;
