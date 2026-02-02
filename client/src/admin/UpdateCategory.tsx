import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, FolderPlus, CheckCircle, AlertCircle, Folder, Loader2 } from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getCategory, updateCategory } from "./helper/adminapicall";
import { getMainCategories } from "../core/helper/coreapicalls";

interface Category {
  _id: string;
  name: string;
  parentCategory?: string | null;
  level?: number;
  icon?: string;
  genders?: string[];
  isActive?: boolean;
}

const UpdateCategory = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [name, setName] = useState("");
  const [parentCategory, setParentCategory] = useState<string>("");
  const [icon, setIcon] = useState("📁");
  const [genders, setGenders] = useState<string[]>(['men', 'women', 'unisex']);
  const [isActive, setIsActive] = useState(true);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const auth = isAutheticated();

  const categoryIcons = [
    "📁", "🎯", "🌟", "🔥", "⚡", "🎨", "🎮", "🎵", 
    "📸", "🎬", "🍕", "☕", "🏆", "💎", "🚀", "🌈"
  ];

  useEffect(() => {
    loadData();
  }, [categoryId]);

  const loadData = async () => {
    setPageLoading(true);
    try {
      // Load main categories for parent selection
      const categoriesData = await getMainCategories();
      if (categoriesData && !categoriesData.error) {
        setMainCategories(categoriesData);
      }

      // Load current category data
      if (categoryId) {
        const categoryData = await getCategory(categoryId);
        if (categoryData && !categoryData.error) {
          setName(categoryData.name || "");
          setParentCategory(categoryData.parentCategory || "");
          setIcon(categoryData.icon || "📁");
          setGenders(categoryData.genders || ['men', 'women', 'unisex']);
          setIsActive(categoryData.isActive !== false);
        } else {
          setError(true);
        }
      }
    } catch (err) {
      setError(true);
    } finally {
      setPageLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(false);
    setSuccess(false);
    setLoading(true);

    if (!name.trim()) {
      setError(true);
      setLoading(false);
      return;
    }

    const categoryData = {
      name,
      parentCategory: parentCategory || null,
      icon,
      genders,
      isActive
    };

    if (auth && auth.user && auth.token && categoryId) {
      try {
        const data = await updateCategory(categoryId, auth.user._id, auth.token, categoryData);
        setLoading(false);
        if (data.error) {
          setError(true);
        } else {
          setSuccess(true);
          setTimeout(() => {
            navigate('/admin/categories');
          }, 1500);
        }
      } catch (err) {
        setLoading(false);
        setError(true);
      }
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate('/admin/categories')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Categories
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <Folder className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Update Category</h1>
          <p className="text-gray-400">Edit category details</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400">Category updated successfully! Redirecting...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">Failed to update category. Please try again.</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setParentCategory("")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  !parentCategory 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <Folder className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="font-medium">Main Category</p>
                <p className="text-xs text-gray-400 mt-1">Top-level category</p>
              </button>
              <button
                type="button"
                onClick={() => setParentCategory(mainCategories[0]?._id || "")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  parentCategory 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <FolderPlus className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="font-medium">Subcategory</p>
                <p className="text-xs text-gray-400 mt-1">Under existing category</p>
              </button>
            </div>

            {parentCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Category
                </label>
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white"
                >
                  {mainCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                placeholder="Category name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
                {categoryIcons.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`p-3 rounded-lg border-2 transition-all text-2xl ${
                      icon === emoji
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Available For Genders
              </label>
              <div className="flex gap-4">
                {[
                  { id: 'men', label: 'Men', icon: '👔' },
                  { id: 'women', label: 'Women', icon: '👗' },
                  { id: 'unisex', label: 'Unisex', icon: '👕' }
                ].map((gender) => (
                  <label key={gender.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genders.includes(gender.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGenders([...genders, gender.id]);
                        } else {
                          setGenders(genders.filter(g => g !== gender.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-lg">{gender.icon}</span>
                    <span className="text-gray-300">{gender.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                />
                <span className="text-gray-300">Active (visible to customers)</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Update Category
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateCategory;
