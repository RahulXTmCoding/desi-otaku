import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Package, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Image,
  Tag,
  DollarSign,
  Archive,
  Link,
  Plus,
  Hash,
  Shirt
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { createaProduct, getCategories, mockCreateProduct } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { mockCategories } from "../data/mockData";

const AddProduct = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();

  const [values, setValues] = useState<{
    name: string;
    description: string;
    price: string;
    stock: string;
    photo: string | File;
    photoUrl: string;
    tags: string;
    productType: string;
    categories: any[];
    category: string;
    loading: boolean;
    error: string;
    createdProduct: string;
    getaRedirect: boolean;
    formData: FormData;
  }>({
    name: "",
    description: "",
    price: "",
    stock: "",
    photo: "",
    photoUrl: "",
    tags: "",
    productType: "t-shirt",
    categories: [],
    category: "",
    loading: false,
    error: "",
    createdProduct: "",
    getaRedirect: false,
    formData: new FormData(),
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');

  const {
    name,
    description,
    price,
    stock,
    photoUrl,
    tags,
    productType,
    categories,
    category,
    loading,
    error,
    createdProduct,
    formData,
  } = values;

  const productTypes = [
    { value: 't-shirt', label: 'T-Shirt', icon: '👔' },
    { value: 'vest', label: 'Vest', icon: '🦺' },
    { value: 'hoodie', label: 'Hoodie', icon: '🧥' },
    { value: 'oversized-tee', label: 'Oversized Tee', icon: '👕' },
    { value: 'acid-wash', label: 'Acid Wash', icon: '🎨' },
    { value: 'tank-top', label: 'Tank Top', icon: '🎽' },
    { value: 'long-sleeve', label: 'Long Sleeve', icon: '🥼' },
    { value: 'crop-top', label: 'Crop Top', icon: '👚' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const preload = () => {
    if (isTestMode) {
      setValues({ ...values, categories: mockCategories, formData: new FormData() });
    } else {
      getCategories().then((data: any) => {
        if (data.error) {
          setValues({ ...values, error: data.error });
        } else {
          setValues({ ...values, categories: data, formData: new FormData() });
        }
      });
    }
  };

  useEffect(() => {
    preload();
  }, [isTestMode]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !token) return;
    
    setValues({ ...values, error: "", loading: true });

    // Set all form data values
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("stock", stock);
    formData.set("category", category);
    formData.set("tags", tags);
    formData.set("productType", productType);

    // If using URL, add it to formData
    if (imageInputType === 'url' && photoUrl) {
      formData.set('photoUrl', photoUrl);
    }

    if (isTestMode) {
      // Mock create in test mode
      mockCreateProduct(formData).then((data: any) => {
        setValues({
          ...values,
          name: "",
          description: "",
          price: "",
          photo: "",
          photoUrl: "",
          stock: "",
          tags: "",
          loading: false,
          createdProduct: data.name,
          formData: new FormData(),
        });
        setPreviewImage(null);
        // Reset success message after 3 seconds
        setTimeout(() => {
          setValues(prev => ({ ...prev, createdProduct: "" }));
        }, 3000);
      });
    } else {
      // Real backend create
      createaProduct(user._id, token, formData).then((data: any) => {
        if (data.error) {
          setValues({ ...values, error: data.error, loading: false });
        } else {
          setValues({
            ...values,
            name: "",
            description: "",
            price: "",
            photo: "",
            photoUrl: "",
            stock: "",
            loading: false,
            createdProduct: data.name,
            formData: new FormData(),
          });
          setPreviewImage(null);
          // Reset success message after 3 seconds
          setTimeout(() => {
            setValues(prev => ({ ...prev, createdProduct: "" }));
          }, 3000);
        }
      });
    }
  };

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (name === "photo" && event.target instanceof HTMLInputElement && event.target.files) {
      const file = event.target.files[0];
      formData.set(name, file);
      setValues({ ...values, [name]: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const value = event.target.value;
      if (name !== "photoUrl") {
        formData.set(name, value);
      }
      setValues({ ...values, [name]: value });
      
      // If entering URL, update preview
      if (name === "photoUrl" && value) {
        setPreviewImage(value);
      }
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
            <Package className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
          <p className="text-gray-400">Create a new product for your store</p>
          {isTestMode && (
            <p className="text-yellow-400 text-sm mt-2">
              🧪 Test Mode: Products won't persist after refresh
            </p>
          )}
        </div>

        {/* Success Message */}
        {createdProduct && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{createdProduct} created successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={onSubmit} className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          {/* Image Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Product Image
            </label>
            
            {/* Image Input Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setImageInputType('file');
                  setPreviewImage(null);
                  setValues({ ...values, photoUrl: "" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  imageInputType === 'file'
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageInputType('url');
                  setPreviewImage(null);
                  // Clear file from formData when switching to URL
                  formData.delete('photo');
                  setValues({ ...values, photo: "" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  imageInputType === 'url'
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Link className="w-4 h-4" />
                Image URL
              </button>
            </div>

            {imageInputType === 'file' ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChange("photo")}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full h-64 bg-gray-700 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-600 transition-colors overflow-hidden"
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-400">Click to upload product image</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={handleChange("photoUrl")}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all mb-4"
                  placeholder="https://example.com/image.jpg"
                />
                {photoUrl && (
                  <div className="w-full h-64 bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={photoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/300/350';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {imageInputType === 'file' 
                ? 'Upload a high-quality image of your t-shirt design' 
                : 'Provide a direct link to your product image'}
            </p>
          </div>

          {/* Product Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={handleChange("name")}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={handleChange("description")}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all resize-none"
              placeholder="Describe your product..."
              required
            />
          </div>

          {/* Product Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Product Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {productTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setValues({ ...values, productType: type.value });
                    formData.set("productType", type.value);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    productType === type.value
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price and Category Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (₹)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={price}
                  onChange={handleChange("price")}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="599"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={category}
                  onChange={handleChange("category")}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Category</option>
                  {categories &&
                    categories.map((cate: any, index: number) => (
                      <option key={index} value={cate._id}>
                        {cate.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stock Quantity
            </label>
            <div className="relative">
              <Archive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={stock}
                onChange={handleChange("stock")}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                placeholder="100"
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={tags}
                onChange={handleChange("tags")}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                placeholder="summer, trendy, cotton, anime"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tags help customers find this product when searching</p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 text-gray-900 py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  Creating Product...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Product
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

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="font-semibold mb-3">Product Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Use high-quality images showing the t-shirt design clearly</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>You can upload an image file or provide a direct URL to the image</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Write detailed descriptions including material and fit information</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Set competitive prices based on your production costs</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Keep track of stock levels to avoid overselling</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
