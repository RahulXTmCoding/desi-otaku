import React, { useState, useEffect } from 'react';
import { isAutheticated } from '../auth/helper';
import { 
  getAllProductTypes, 
  createProductType, 
  updateProductType, 
  deleteProductType,
  updateProductTypeOrder 
} from './helper/productTypeApiCalls';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProductType {
  _id: string;
  name: string;
  slug: string;
  displayName: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

const ManageProductTypes: React.FC = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '📦',
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const auth = isAutheticated();
  const user = auth && auth.user;
  const token = auth && auth.token;

  useEffect(() => {
    loadProductTypes();
  }, []);

  const loadProductTypes = async () => {
    try {
      const data = await getAllProductTypes();
      if (Array.isArray(data)) {
        setProductTypes(data);
      }
    } catch (err) {
      toast.error('Failed to load product types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.displayName) {
      toast.error('Name and Display Name are required');
      return;
    }

    try {
      const typeData = {
        ...formData,
        metaKeywords: formData.metaKeywords 
          ? formData.metaKeywords.split(',').map(k => k.trim()).filter(k => k)
          : []
      };

      if (isEditing) {
        const result = await updateProductType(isEditing, user._id, token, typeData);
        if (!result.error) {
          toast.success('Product type updated successfully');
          setIsEditing(null);
          loadProductTypes();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createProductType(user._id, token, typeData);
        if (!result.error) {
          toast.success('Product type created successfully');
          setIsCreating(false);
          loadProductTypes();
        } else {
          toast.error(result.error);
        }
      }

      resetForm();
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (type: ProductType) => {
    setIsEditing(type._id);
    setFormData({
      name: type.name,
      displayName: type.displayName,
      description: type.description || '',
      icon: type.icon,
      isActive: type.isActive,
      metaTitle: type.metaTitle || '',
      metaDescription: type.metaDescription || '',
      metaKeywords: type.metaKeywords?.join(', ') || ''
    });
  };

  const handleDelete = async (typeId: string) => {
    if (!window.confirm('Are you sure you want to delete this product type?')) {
      return;
    }

    try {
      const result = await deleteProductType(typeId, user._id, token);
      if (!result.error) {
        toast.success('Product type deleted successfully');
        loadProductTypes();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to delete product type');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedItem === null || draggedItem === dropIndex) return;

    const reorderedTypes = [...productTypes];
    const [draggedType] = reorderedTypes.splice(draggedItem, 1);
    reorderedTypes.splice(dropIndex, 0, draggedType);

    // Update order values
    const updatedTypes = reorderedTypes.map((type, index) => ({
      ...type,
      order: index
    }));

    setProductTypes(updatedTypes);
    setDraggedItem(null);

    // Save new order to backend
    try {
      const orderData = updatedTypes.map((type, index) => ({
        _id: type._id,
        order: index
      }));
      
      await updateProductTypeOrder(user._id, token, orderData);
      toast.success('Order updated successfully');
    } catch (err) {
      toast.error('Failed to update order');
      loadProductTypes(); // Reload original order
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      icon: '📦',
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: ''
    });
    setIsEditing(null);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400">Manage Product Types</h1>
          {!isCreating && !isEditing && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Product Type
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? 'Edit Product Type' : 'Create New Product Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name*</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="e.g., T-Shirt"
                    disabled={!!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name*</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="e.g., Classic T-Shirt"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="e.g., 👕 or icon class"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  rows={3}
                  placeholder="Brief description of this product type"
                />
              </div>

              {/* SEO Fields */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-medium mb-3">SEO Settings (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Meta Description</label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Meta Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      placeholder="tshirt, apparel, clothing"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 font-semibold"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product Types List */}
        <div className="space-y-4">
          {productTypes.map((type, index) => (
            <div
              key={type._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-move"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-gray-500" />
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{type.displayName}</h3>
                    <p className="text-sm text-gray-400">
                      Name: {type.name} | Slug: {type.slug}
                    </p>
                    {type.description && (
                      <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    type.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {type.isActive ? (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productTypes.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No product types found</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors font-semibold"
            >
              Create Your First Product Type
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProductTypes;
