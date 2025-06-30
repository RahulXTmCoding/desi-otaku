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
  Filter
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getProducts, deleteProduct, mockDeleteProduct } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { mockProducts } from "../data/mockData";

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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  useEffect(() => {
    preload();
  }, [isTestMode]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

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
                {loading ? 'Loading...' : `Total ${products.length} products in your store`}
              </p>
            </div>
            <Link
              to="/admin/create/product"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </Link>
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
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
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
                    <th className="text-left px-6 py-4 text-gray-400 font-medium">Stock</th>
                    <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product._id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
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
                      <td className="px-6 py-4">
                        <span className={`${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
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
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
                              >
                                Confirm
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
                              className="p-2 bg-gray-700 hover:bg-red-500/20 rounded-lg transition-colors group"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4 group-hover:text-red-400" />
                            </button>
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
          <h3 className="font-semibold mb-3">Product Management Tips</h3>
          <ul className="space-y-2 text-sm text-gray-400">
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
              <span>Use high-quality images to showcase your products effectively</span>
            </li>
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
