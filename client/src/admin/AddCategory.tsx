import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, FolderPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { createCategory, mockCreateCategory } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";

const AddCategory = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const auth = isAutheticated();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(false);
    setName(event.target.value);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(false);
    setSuccess(false);
    setLoading(true);

    if (!name.trim()) {
      setError(true);
      setLoading(false);
      return;
    }

    if (isTestMode) {
      // Use mock function
      mockCreateCategory({ name }).then((data: any) => {
        setLoading(false);
        if (data.error) {
          setError(true);
        } else {
          setError(false);
          setSuccess(true);
          setName("");
          // Reset success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000);
        }
      });
    } else if (auth && auth.user && auth.token) {
      // Use real backend
      createCategory(auth.user._id, auth.token, { name }).then((data: any) => {
        setLoading(false);
        if (data.error) {
          setError(true);
        } else {
          setError(false);
          setSuccess(true);
          setName("");
          // Reset success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <FolderPlus className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create New Category</h1>
          <p className="text-gray-400">Add a new category for organizing your products</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400">Category created successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">Failed to create category. Please try again.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                placeholder="For example: Summer, Anime, Limited Edition"
                autoFocus
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                Choose a descriptive name for your category
              </p>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5" />
                    Create Category
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="font-semibold mb-3">Tips for Categories</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Use clear, descriptive names that customers will understand</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Categories help organize products and improve navigation</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Consider your target audience when naming categories</span>
            </li>
          </ul>
        </div>

        {/* Mode Indicator */}
        <div className="mt-6 text-center text-xs text-gray-500">
          {isTestMode ? (
            <p>Test Mode: Categories will be created locally</p>
          ) : (
            <p>Backend Mode: Categories will be saved to database</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
