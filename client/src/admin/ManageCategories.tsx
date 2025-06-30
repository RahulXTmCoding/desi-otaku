import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, Edit, Plus, List, AlertCircle } from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getCategories, deleteCategory, mockDeleteCategory } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { mockCategories } from "../data/mockData";

interface Category {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

const ManageCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isTestMode } = useDevMode();
  const auth = isAutheticated();

  const preload = () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      setTimeout(() => {
        setCategories(mockCategories);
        setLoading(false);
      }, 500);
    } else {
      // Use real backend
      getCategories().then((data: any) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCategories(data);
        }
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    preload();
  }, [isTestMode]);

  const deleteThisCategory = (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      if (isTestMode) {
        mockDeleteCategory(categoryId).then(() => {
          setCategories(categories.filter(cat => cat._id !== categoryId));
        });
      } else if (auth && auth.user && auth.token) {
        deleteCategory(categoryId, auth.user._id, auth.token).then((data: any) => {
          if (data.error) {
            console.log(data.error);
          } else {
            preload();
          }
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Manage Categories</h1>
          <div className="flex gap-4">
            <Link 
              to="/admin/create/category" 
              className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </Link>
            <Link 
              to="/admin/dashboard" 
              className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Categories Stats */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <List className="w-8 h-8 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold">{categories.length}</h2>
              <p className="text-gray-400">Total Categories</p>
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-4">No categories found</p>
              <Link 
                to="/admin/create/category" 
                className="text-yellow-400 hover:text-yellow-300"
              >
                Create your first category
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {categories.map((category, index) => (
                    <tr 
                      key={category._id} 
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-medium">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/category/update/${category._id}`}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteThisCategory(category._id)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mode Indicator */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {isTestMode ? (
            <p>Test Mode: Using mock data</p>
          ) : (
            <p>Backend Mode: Connected to server</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
