import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Package, 
  Edit2, 
  Trash2, 
  Search,
  Plus,
  AlertCircle,
  Filter,
  Palette,
  Archive,
  RotateCcw,
  Trash
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getProducts, deleteProduct, mockDeleteProduct } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { mockProducts, getMockProductImage } from "../data/mockData";
import { API } from "../backend";

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  stock: number;
  sold: number;
}

const ManageProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const auth = isAutheticated();

  const preload = () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      setTimeout(() => {
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setLoading(false);
      }, 500);
    } else {
      // Use real backend
      getProducts().then((data: any) => {
        setLoading(false);
        if (data.error) {
          setError(data.error);
        } else {
          setProducts(data);
          setFilteredProducts(data);
        }
      });
    }
  };

  const loadDeletedProducts = () => {
    if (!isTestMode && auth && auth.user && auth.token) {
      setLoading(true);
      // Fetch deleted products from API
      fetch(`${API}/products/deleted/${auth.user._id}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${auth.token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setDeletedProducts(data.products || []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load deleted products');
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    if (viewMode === 'active') {
      preload();
    } else {
      loadDeletedProducts();
    }
  }, [isTestMode, viewMode]);

  useEffect(() => {
    let filtered = viewMode === 'active' ? products : deletedProducts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price filter
    if (priceFilter.min || priceFilter.max) {
      filtered = filtered.filter(product => {
        const min = priceFilter.min ? parseInt(priceFilter.min) : 0;
        const max = priceFilter.max ? parseInt(priceFilter.max) : Infinity;
        return product.price >= min && product.price <= max;
      });
    }

    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (stockFilter) {
          case 'in-stock':
            return product.stock > 10;
          case 'low-stock':
            return product.stock > 0 && product.stock <= 10;
          case 'out-of-stock':
            return product.stock === 0;
          default:
            return true;
        }
      });
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.category?._id === categoryFilter
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products, priceFilter, stockFilter, categoryFilter]);

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)));

  const deleteThisProduct = (productId: string) => {
    if (isTestMode) {
      mockDeleteProduct(productId).then(() => {
        setProducts(products.filter(p => p._id !== productId));
        setDeleteConfirm(null);
      });
    } else if (auth && auth.user && auth.token) {
      deleteProduct(productId, auth.user._id, auth.token).then((data: any) => {
        if (data.error) {
          setError(data.error);
        } else {
          preload();
          setDeleteConfirm(null);
        }
      });
    }
  };

  const permanentlyDeleteProduct = (productId: string) => {
    if (auth && auth.user && auth.token) {
      fetch(`${API}/product/permanent/${productId}/${auth.user._id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${auth.token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setDeletedProducts(deletedProducts.filter(p => p._id !== productId));
          setPermanentDeleteConfirm(null);
        }
      })
      .catch(err => setError('Failed to permanently delete product'));
    }
  };

  const restoreProduct = (productId: string) => {
    if (auth && auth.user && auth.token) {
      fetch(`${API}/product/restore/${productId}/${auth.user._id}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${auth.token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          loadDeletedProducts();
        }
      })
      .catch(err => setError('Failed to restore product'));
    }
  };

  const getProductImage = (product: Product) => {
    if (isTestMode) {
      return getMockProductImage(product._id);
    }
    if (product._id) {
      return `${API}/product/photo/${product._id}`;
    }
    return '/api/placeholder/50/50';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Products</h1>
              <p className="text-gray-400">
                {loading ? 'Loading...' : viewMode === 'active' 
                  ? `Total ${products.length} active products in your store`
                  : `${deletedProducts.length} deleted products`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('active')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'active'
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Active Products
                </button>
                <button
                  onClick={() => setViewMode('deleted')}
                  className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    viewMode === 'deleted'
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  Deleted
                </button>
              </div>
              {viewMode === 'active' && (
                <Link
                  to="/admin/create/product"
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add New Product
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white placeholder-gray-400"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters {showFilters ? '−' : '+'}
            </button>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceFilter.min}
                    onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                  <span className="text-gray-400 self-center">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceFilter.max}
                    onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock Status</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All Products</option>
                  <option value="in-stock">In Stock (10+)</option>
                  <option value="low-stock">Low Stock (1-10)</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={products.find(p => p.category?.name === cat)?.category._id || ''}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* Active Filters Display */}
          {(searchTerm || stockFilter !== 'all' || categoryFilter !== 'all' || priceFilter.min || priceFilter.max) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm flex items-center gap-2">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-yellow-300">×</button>
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm flex items-center gap-2">
                  Stock: {stockFilter}
                  <button onClick={() => setStockFilter('all')} className="hover:text-yellow-300">×</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm flex items-center gap-2">
                  Category: {categories.find(cat => products.find(p => p.category?.name === cat)?.category._id === categoryFilter) || categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="hover:text-yellow-300">×</button>
                </span>
              )}
              {(priceFilter.min || priceFilter.max) && (
                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm flex items-center gap-2">
                  Price: ₹{priceFilter.min || '0'} - ₹{priceFilter.max || '∞'}
                  <button onClick={() => setPriceFilter({ min: '', max: '' })} className="hover:text-yellow-300">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStockFilter('all');
                  setCategoryFilter('all');
                  setPriceFilter({ min: '', max: '' });
                }}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm hover:bg-gray-600"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <Package className="w-8 h-8 text-gray-400 animate-pulse" />
            </div>
            <p className="text-gray-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'No products found matching your search' : 'No products yet'}
            </p>
            {!searchTerm && (
              <Link
                to="/admin/create/product"
                className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
              >
                <Plus className="w-5 h-5" />
                Create your first product
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Product</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Category</th>
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Price</th>
                    {viewMode === 'active' && <th className="text-left px-6 py-4 text-gray-400 font-medium">Stock</th>}
                    <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product._id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                            <img 
                              src={getProductImage(product)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.parentElement?.querySelector('.fallback-icon');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <div className="fallback-icon hidden w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-400 truncate max-w-xs">
                              {product.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-yellow-400">₹{product.price}</span>
                      </td>
                      {viewMode === 'active' && (
                        <td className="px-6 py-4">
                          <span className={`${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                            {product.stock} units
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {viewMode === 'active' ? (
                            <>
                              <Link
                                to={`/admin/product/variants/${product._id}`}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                                title="Manage Variants"
                              >
                                <Palette className="w-4 h-4 group-hover:text-yellow-400" />
                              </Link>
                              <Link
                                to={`/admin/product/update/${product._id}`}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                                title="Edit Product"
                              >
                                <Edit2 className="w-4 h-4 group-hover:text-yellow-400" />
                              </Link>
                              {deleteConfirm === product._id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => deleteThisProduct(product._id)}
                                    className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium transition-colors"
                                  >
                                    Archive
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(product._id)}
                                  className="p-2 bg-gray-700 hover:bg-orange-500/20 rounded-lg transition-colors group"
                                  title="Archive Product"
                                >
                                  <Archive className="w-4 h-4 group-hover:text-orange-400" />
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => restoreProduct(product._id)}
                                className="p-2 bg-gray-700 hover:bg-green-500/20 rounded-lg transition-colors group"
                                title="Restore Product"
                              >
                                <RotateCcw className="w-4 h-4 group-hover:text-green-400" />
                              </button>
                              {permanentDeleteConfirm === product._id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => permanentlyDeleteProduct(product._id)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
                                  >
                                    Delete Forever
                                  </button>
                                  <button
                                    onClick={() => setPermanentDeleteConfirm(null)}
                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setPermanentDeleteConfirm(product._id)}
                                  className="p-2 bg-gray-700 hover:bg-red-500/20 rounded-lg transition-colors group"
                                  title="Delete Permanently"
                                >
                                  <Trash className="w-4 h-4 group-hover:text-red-400" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="font-semibold mb-3">
            {viewMode === 'active' ? 'Product Management Tips' : 'About Deleted Products'}
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {viewMode === 'active' ? (
              <>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
                  <span>Keep product information up to date for better customer experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
                  <span>Monitor stock levels to avoid out-of-stock situations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
                  <span>Archived products remain in orders and analytics for historical data</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
                  <span>Deleted products are hidden from your shop but preserved for order history</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
                  <span>Restore products to make them available in your shop again</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5"></div>
                  <span>Permanent deletion removes all data - this action cannot be undone</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Mode Indicator */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {isTestMode ? (
            <p>Test Mode: Using mock product data</p>
          ) : (
            <p>Backend Mode: Connected to server</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
