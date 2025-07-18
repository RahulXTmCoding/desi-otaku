import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Eye,
  Heart,
  TrendingUp,
  Tag,
  ChevronLeft,
  ChevronRight,
  Palette,
  Star,
  Loader
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getDesigns, deleteDesign, mockDeleteDesign } from "./helper/designapicall";
import { getCategories } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { API } from "../backend";

interface Design {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  price: number;
  popularity?: {
    views: number;
    likes: number;
    used: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
}

const ManageDesigns = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || "all");
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || "newest");
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, designId: "", designName: "" });
  const [categories, setCategories] = useState<any[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDesigns, setTotalDesigns] = useState(0);
  const itemsPerPage = 20;

  // Update URL params whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, sortBy, currentPage, setSearchParams]);

  // Load designs when filters change
  useEffect(() => {
    loadDesigns();
  }, [searchQuery, selectedCategory, sortBy, currentPage, isTestMode]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [isTestMode]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const loadCategories = () => {
    getCategories()
      .then((data: any) => {
        if (data && !data.error) {
          setCategories(data);
        }
      })
      .catch((err) => console.log("Error loading categories:", err));
  };

  const loadDesigns = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Build filters for backend
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      
      // Sort mapping
      let sortField = '_id';
      let sortOrder = 'desc';
      
      switch (sortBy) {
        case 'newest':
          sortField = 'createdAt';
          sortOrder = 'desc';
          break;
        case 'popular':
          sortField = 'popularity.used';
          sortOrder = 'desc';
          break;
        case 'name':
          sortField = 'name';
          sortOrder = 'asc';
          break;
        case 'price':
          sortField = 'price';
          sortOrder = 'desc';
          break;
      }
      
      filters.sortBy = sortField;
      filters.order = sortOrder;
      
      const data = await getDesigns(currentPage, itemsPerPage, filters);
      
      if (data && data.error) {
        setError(data.error);
        setDesigns([]);
      } else if (data && data.designs) {
        setDesigns(data.designs);
        setTotalDesigns(data.pagination?.totalDesigns || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (data && Array.isArray(data)) {
        // Old format - shouldn't happen with backend filtering
        setDesigns(data);
        setTotalDesigns(data.length);
        setTotalPages(1);
      } else {
        setDesigns([]);
      }
    } catch (err) {
      console.error("Error loading designs:", err);
      setError("Failed to load designs");
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!user || !token) return;

    try {
      const data = isTestMode
        ? await mockDeleteDesign(designId)
        : await deleteDesign(designId, user._id, token);

      if (data.error) {
        setError(data.error);
      } else {
        setDesigns(designs.filter(d => d._id !== designId));
        setDeleteModal({ isOpen: false, designId: "", designName: "" });
      }
    } catch (err) {
      console.error("Error deleting design:", err);
      setError("Failed to delete design");
    }
  };

  const getImageUrl = (design: Design) => {
    if (design.imageUrl?.startsWith('http')) {
      return design.imageUrl;
    }
    return `${API}/design/image/${design._id}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Palette className="w-8 h-8 text-yellow-400" />
              Manage Designs
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your design catalog for custom t-shirt printing
            </p>
          </div>
          <Link
            to="/admin/create/design"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Design
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="name">Name (A-Z)</option>
                <option value="price">Price (High to Low)</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center bg-gray-700 rounded-lg px-4 py-3">
              <span className="text-sm text-gray-300">
                {designs.length} of {totalDesigns} designs
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-16">
            <Palette className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No designs found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedCategory !== "all" 
                ? "Try adjusting your filters" 
                : "Start by adding your first design"}
            </p>
            {designs.length === 0 && (
              <Link
                to="/admin/create/design"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add First Design
              </Link>
            )}
          </div>
        ) : (
          /* Designs Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designs.map((design) => (
              <div
                key={design._id}
                className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-yellow-400 transition-all group"
              >
                {/* Design Image */}
                <div className="relative aspect-square bg-gray-700 overflow-hidden">
                  <img
                    src={getImageUrl(design)}
                    alt={design.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400?text=Design';
                    }}
                  />
                  
                  {/* Featured Badge */}
                  {design.isFeatured && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link
                      to={`/admin/update/design/${design._id}`}
                      className="p-3 bg-yellow-400 hover:bg-yellow-300 rounded-lg text-gray-900 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ 
                        isOpen: true, 
                        designId: design._id, 
                        designName: design.name 
                      })}
                      className="p-3 bg-red-500 hover:bg-red-400 rounded-lg text-white transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{design.name}</h3>
                  
                  {/* Category & Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm px-2 py-1 rounded bg-gray-600/20 text-gray-400">
                      {categories.find(c => c._id === design.category)?.name || 'Uncategorized'}
                    </span>
                    <span className="text-yellow-400 font-semibold">+₹{design.price}</span>
                  </div>

                  {/* Tags */}
                  {design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {design.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                      {design.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{design.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{design.popularity?.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{design.popularity?.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{design.popularity?.used || 0}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      design.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {design.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Delete Design</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "{deleteModal.designName}"? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, designId: "", designName: "" })}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteDesign(deleteModal.designId)}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Delete Design
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Indicator */}
        {isTestMode && (
          <div className="mt-8 text-center text-sm text-gray-500">
            🧪 Test Mode: Changes won't persist
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDesigns;
