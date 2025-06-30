import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Package, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Tag,
  DollarSign,
  Archive,
  Save,
  Link,
  Image,
  Loader
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getProduct, updateProduct, getCategories, mockUpdateProduct } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";
import { mockProducts, mockCategories } from "../data/mockData";
import { API } from "../backend";

const UpdateProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const [values, setValues] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    photo: "",
    photoUrl: "",
    categories: [],
    category: "",
    loading: false,
    error: "",
    createdProduct: "",
    formData: new FormData(),
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');

  const {
    name,
    description,
    price,
    stock,
    photoUrl,
    categories,
    category,
    loading,
    error,
    createdProduct,
    formData,
  } = values;

  const preload = (productId: string) => {
    setIsLoadingProduct(true);
    
    if (isTestMode) {
      // Use mock data in test mode
      const mockProduct = mockProducts.find(p => p._id === productId);
      if (mockProduct) {
        setValues({
          ...values,
          name: mockProduct.name,
          description: mockProduct.description,
          price: mockProduct.price.toString(),
          category: mockProduct.category._id,
          stock: mockProduct.stock.toString(),
          categories: mockCategories,
          formData: new FormData(),
        });
        // Set current image - in test mode use placeholder
        setCurrentImage('/api/placeholder/300/350');
      } else {
        setValues({ ...values, error: "Product not found" });
      }
      setIsLoadingProduct(false);
    } else {
      // Fetch from backend
      getProduct(productId).then((data: any) => {
        if (data.error) {
          setValues({ ...values, error: data.error });
          setIsLoadingProduct(false);
        } else {
          preloadCategories();
          setValues({
            ...values,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category._id,
            stock: data.stock,
            formData: new FormData(),
          });
          // Set current image
          setCurrentImage(`${API}/product/photo/${productId}`);
          setIsLoadingProduct(false);
        }
      });
    }
  };

  const preloadCategories = () => {
    if (isTestMode) {
      setValues((prev) => ({
        ...prev,
        categories: mockCategories,
      }));
    } else {
      getCategories().then((data: any) => {
        if (data.error) {
          setValues((prev) => ({ ...prev, error: data.error }));
        } else {
          setValues((prev) => ({
            ...prev,
            categories: data,
          }));
        }
      });
    }
  };

  useEffect(() => {
    if (productId) {
      preload(productId);
    }
  }, [productId, isTestMode]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !user || !token) return;
    
    setValues({ ...values, error: "", loading: true });

    // If using URL, add it to formData
    if (imageInputType === 'url' && photoUrl) {
      formData.set('photoUrl', photoUrl);
    }

    if (isTestMode) {
      // Mock update in test mode
      mockUpdateProduct(productId, formData).then((data: any) => {
        setValues({
          ...values,
          loading: false,
          createdProduct: name,
        });
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      });
    } else {
      // Real backend update
      updateProduct(productId, user._id, token, formData).then((data: any) => {
        if (data.error) {
          setValues({ ...values, error: data.error, loading: false });
        } else {
          setValues({
            ...values,
            loading: false,
            createdProduct: data.name,
          });
          setTimeout(() => {
            navigate('/admin/products');
          }, 2000);
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

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Products
        </button>

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Update Product</h1>
          <p className="text-gray-400">Modify your product details</p>
          {isTestMode && (
            <p className="text-yellow-400 text-sm mt-2">
              🧪 Test Mode: Changes won't persist
            </p>
          )}
        </div>

        {/* Success Message */}
        {createdProduct && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{createdProduct} updated successfully! Redirecting...</p>
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
                onClick={() => setImageInputType('file')}
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
                onClick={() => setImageInputType('url')}
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
                  ) : currentImage ? (
                    <div className="relative w-full h-full">
                      <img src={currentImage} alt="Current" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-white mb-2 mx-auto" />
                          <p className="text-sm text-white">Click to change image</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-400">Click to upload product image</p>
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
                {(photoUrl || currentImage) && (
                  <div className="w-full h-64 bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={photoUrl || currentImage || ''} 
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
              Current image will be kept if no new image is provided
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
          <div className="mb-8">
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
                  Updating Product...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Product
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="font-semibold mb-3">Update Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Upload a new image file or provide an image URL to change the current image</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Leave image fields empty to keep the current product image</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Update stock levels regularly to maintain accurate inventory</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Price changes will apply to new orders only</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdateProduct;
