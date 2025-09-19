import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, Edit, Plus, List, AlertCircle, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getCategories, deleteCategory, mockDeleteCategory } from "./helper/adminapicall";
import { getCategoryTree } from "../core/helper/coreapicalls";
import { useDevMode } from "../context/DevModeContext";
import { mockCategories } from "../data/mockData";

interface Category {
  _id: string;
  name: string;
  parentCategory?: string | null;
  level?: number;
  icon?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  subcategories?: Category[];
}

// Recursive component for rendering category tree
const CategoryTreeItem: React.FC<{
  categories: Category[];
  expandedCategories: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  level: number;
}> = ({ categories, expandedCategories, onToggleExpand, onEdit, onDelete, level }) => {
  return (
    <>
      {categories.map(category => {
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        const isExpanded = expandedCategories.has(category._id);
        
        return (
          <div key={category._id} className="mb-2">
            <div 
              className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-700/50 transition-colors ${
                level > 0 ? 'ml-' + (level * 8) : ''
              }`}
              style={{ marginLeft: level > 0 ? `${level * 2}rem` : 0 }}
            >
              <div className="flex items-center gap-3">
                {hasSubcategories && (
                  <button
                    onClick={() => onToggleExpand(category._id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight 
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                )}
                {!hasSubcategories && <div className="w-5" />}
                
                <div className="text-yellow-400">
                  {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  {level > 0 && (
                    <p className="text-sm text-gray-400">Subcategory</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/category/update/${category._id}`}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onDelete(category._id)}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {hasSubcategories && isExpanded && (
              <CategoryTreeItem
                categories={category.subcategories!}
                expandedCategories={expandedCategories}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

const ManageCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isTestMode } = useDevMode();
  const auth = isAutheticated();

  const preload = async () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      setTimeout(() => {
        setCategories(mockCategories);
        setCategoryTree(mockCategories);
        setLoading(false);
      }, 500);
    } else {
      try {
        // Get all categories and category tree
        const [allCategories, tree] = await Promise.all([
          getCategories(),
          getCategoryTree()
        ]);
        
        if (allCategories.error) {
          setError(allCategories.error);
        } else {
          setCategories(allCategories);
          setCategoryTree(tree || []);
        }
      } catch (err) {
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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

        {/* Categories Tree */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          {categoryTree.length === 0 ? (
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
            <div className="p-6">
              <CategoryTreeItem 
                categories={categoryTree}
                expandedCategories={expandedCategories}
                onToggleExpand={toggleExpand}
                onEdit={(id) => window.location.href = `/admin/category/update/${id}`}
                onDelete={deleteThisCategory}
                level={0}
              />
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
