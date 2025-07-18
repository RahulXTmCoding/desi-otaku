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
  Loader,
  Hash,
  Shirt,
  X,
  Plus
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getProduct, getCategories, mockUpdateProduct } from "./helper/adminapicall";
import { updateProductWithImages } from "./helper/productApiHelper";
import { getAllProductTypes } from "./helper/productTypeApiCalls";
import { useDevMode } from "../context/DevModeContext";
import { mockProducts, mockCategories } from "../data/mockData";
import { API } from "../backend";

interface ImageItem {
  id: string;
  url?: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
  existingImage?: boolean; // To track images already in DB
}

interface SizeStock {
  S: string;
  M: string;
  L: string;
  XL: string;
  XXL: string;
}

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
    tags: "",
    productType: "",
    categories: [] as any[],
    productTypes: [] as any[],
    category: "",
    loading: false,
    error: "",
    updatedProduct: "",
    formData: new FormData(),
  });

  const [sizeStock, setSizeStock] = useState<SizeStock>({
    S: "0",
    M: "0",
    L: "0",
    XL: "0",
    XXL: "0"
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState("");
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const {
    name,
    description,
    price,
    tags,
    productType,
    categories,
    productTypes,
    category,
    loading,
    error,
    updatedProduct,
    formData,
  } = values;

  const preload = async (productId: string) => {
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
          categories: mockCategories,
          formData: new FormData(),
        });
        // Set size stock from mock
        setSizeStock({
          S: "10",
          M: "15",
          L: "20",
          XL: "10",
          XXL: "5"
        });
        // Set a placeholder image
        setImages([{
          id: '1',
          preview: '/api/placeholder/300/350',
          isPrimary: true,
          existingImage: true
        }]);
      } else {
        setValues({ ...values, error: "Product not found" });
      }
      setIsLoadingProduct(false);
    } else {
      try {
        // Fetch from backend
        const data = await getProduct(productId);
        if (data.error) {
          setValues({ ...values, error: data.error });
          setIsLoadingProduct(false);
          return;
        }

        // Load categories and product types
        await preloadCategories();
        
        // Handle product type
        const productTypeId = data.productType?._id || data.productType || "";
        
        // Set values
        setValues(prev => ({
          ...prev,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category._id,
          tags: data.tags ? data.tags.join(", ") : "",
          productType: productTypeId,
          formData: new FormData(),
        }));

        // Set size stock
        if (data.sizeStock) {
          setSizeStock(data.sizeStock);
        }

        // Load existing images
        if (data.images && data.images.length > 0) {
          const existingImages = data.images.map((img: any, index: number) => ({
            id: `existing-${index}`,
            preview: img.url || `${API}/product/image/${productId}/${index}`,
            isPrimary: !!img.isPrimary, // Use the actual isPrimary value from the database
            existingImage: true
          }));
          
          // If no image is marked as primary, make the first one primary
          const hasPrimary = existingImages.some(img => img.isPrimary);
          if (!hasPrimary && existingImages.length > 0) {
            existingImages[0].isPrimary = true;
          }
          
          setImages(existingImages);
        } else {
          // Fallback to old photo endpoint for backward compatibility
          setImages([{
            id: 'legacy-1',
            preview: `${API}/product/image/${productId}`,
            isPrimary: true,
            existingImage: true
          }]);
        }
        
        setIsLoadingProduct(false);
      } catch (err) {
        setValues({ ...values, error: "Failed to load product" });
        setIsLoadingProduct(false);
      }
    }
  };

  const preloadCategories = async () => {
    if (isTestMode) {
      setValues((prev) => ({
        ...prev,
        categories: mockCategories,
      }));
    } else {
      try {
        const [categoriesData, typesData] = await Promise.all([
          getCategories(),
          getAllProductTypes(true)
        ]);
        
        if (categoriesData.error) {
          setValues((prev) => ({ ...prev, error: categoriesData.error }));
        } else {
          setValues((prev) => ({
            ...prev,
            categories: categoriesData,
            productTypes: Array.isArray(typesData) ? typesData : [],
          }));
        }
      } catch (err) {
        setValues((prev) => ({ ...prev, error: "Failed to load data" }));
      }
    }
  };

  useEffect(() => {
    if (productId) {
      preload(productId);
    }
  }, [productId, isTestMode]);

  const addImage = () => {
    if (imageInputType === 'url' && imageUrl) {
      // Check if there's already a primary image
      const hasPrimary = images.some(img => img.isPrimary);
      const newImage: ImageItem = {
        id: Date.now().toString(),
        url: imageUrl,
        preview: imageUrl,
        isPrimary: !hasPrimary // Only set as primary if no primary exists
      };
      setImages([...images, newImage]);
      setImageUrl("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => {
          // Check if there's already a primary image in the current state
          const hasPrimary = prev.some(img => img.isPrimary);
          const newImage: ImageItem = {
            id: Date.now().toString() + index,
            file: file,
            preview: reader.result as string,
            isPrimary: !hasPrimary && index === 0 // Only set as primary if no primary exists
          };
          return [...prev, newImage];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    const wasDeleted = images.find(img => img.id === id);
    const newImages = images.filter(img => img.id !== id);
    
    // If deleted image was primary and there are other images, make first one primary
    if (wasDeleted?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    setImages(newImages);
  };

  const setPrimaryImage = (id: string) => {
    console.log("Setting primary image:", id);
    console.log("Current images:", images);
    
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === id
    }));
    
    console.log("Updated images:", updatedImages);
    setImages(updatedImages);
  };

  const handleSizeStockChange = (size: keyof SizeStock) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeStock({
      ...sizeStock,
      [size]: e.target.value
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !user || !token) return;
    
    setValues({ ...values, error: "", loading: true });

    try {
      // Prepare product data
      const productData = {
        name,
        description,
        price,
        category,
        tags,
        productType,
        sizeStock
      };
      
      // Separate images by type
      const existingImages = images.filter(img => img.existingImage);
      const newUrlImages = images.filter(img => img.url && !img.existingImage);
      const newFileImages = images.filter(img => img.file && !img.existingImage);
      
      // Track which existing images to keep
      const existingImagesToKeep: number[] = [];
      existingImages.forEach((img) => {
        const originalIndex = parseInt(img.id.replace('existing-', ''));
        if (!isNaN(originalIndex)) {
          existingImagesToKeep.push(originalIndex);
        }
      });
      
      // Prepare URL images
      const urlImages = newUrlImages.map((img) => ({
        url: img.url!,
        isPrimary: img.isPrimary,
        order: images.indexOf(img)
      }));
      
      // Prepare file images
      const fileImages = newFileImages.map((img) => ({
        file: img.file!,
        isPrimary: img.isPrimary
      }));
      
      // Calculate primary image index
      const primaryImage = images.find(img => img.isPrimary);
      if (primaryImage) {
        let primaryIndex = -1;
        
        // If it's an existing image
        if (primaryImage.existingImage) {
          const originalIndex = parseInt(primaryImage.id.replace('existing-', ''));
          primaryIndex = existingImagesToKeep.indexOf(originalIndex);
        } 
        // If it's a new URL image
        else if (primaryImage.url) {
          primaryIndex = existingImagesToKeep.length + newUrlImages.findIndex(img => img.id === primaryImage.id);
        }
        // If it's a new file image
        else if (primaryImage.file) {
          primaryIndex = existingImagesToKeep.length + newUrlImages.length + newFileImages.findIndex(img => img.id === primaryImage.id);
        }
        
        if (primaryIndex !== -1) {
          (productData as any).primaryImageIndex = primaryIndex;
        }
      }
      
      console.log("=== Updating Product with JSON API ===");
      console.log("Product data:", productData);
      console.log("Existing images to keep:", existingImagesToKeep);
      console.log("New URL images:", urlImages.length);
      console.log("New file images:", fileImages.length);
      
      if (isTestMode) {
        // Mock update in test mode
        const data = await mockUpdateProduct(productId, new FormData());
        setValues({
          ...values,
          loading: false,
          updatedProduct: name,
        });
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      } else {
        // Use the new JSON-based API
        const data = await updateProductWithImages(
          productId,
          user._id,
          token,
          productData,
          existingImagesToKeep,
          urlImages,
          fileImages
        );
        
        if (data.error) {
          setValues({ ...values, error: data.error, loading: false });
        } else {
          setValues({
            ...values,
            loading: false,
            updatedProduct: data.name,
          });
          setTimeout(() => {
            navigate('/admin/products');
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setValues({ ...values, error: "Failed to update product", loading: false });
    }
  };

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setValues({ ...values, [name]: value });
  };

  const getTotalStock = () => {
    return Object.values(sizeStock).reduce((sum, stock) => sum + parseInt(stock || "0"), 0);
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
        {updatedProduct && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{updatedProduct} updated successfully! Redirecting...</p>
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
          {/* Product Images Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Product Images
            </label>
            
            {/* Display current images */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img 
                      src={img.preview} 
                      alt="Product" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded font-semibold">
                        Primary
                      </span>
                    )}
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(img.id)}
                          className="bg-yellow-400 text-gray-900 p-2 rounded-lg hover:bg-yellow-300 shadow-lg"
                          title="Set as primary image"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-lg"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Images */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-3">Add New Images</p>
              
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
                  Upload Files
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
                  Image URLs
                </button>
              </div>

              {imageInputType === 'file' ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-24 bg-gray-700 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-sm text-gray-400">Click to add more images</p>
                  </label>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={!imageUrl}
                    className="px-4 py-2 bg-yellow-400 disabled:bg-gray-600 text-gray-900 disabled:text-gray-400 rounded-lg font-medium transition-colors"
                  >
                    Add URL
                  </button>
                </div>
              )}
            </div>
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
              {productTypes.length > 0 ? (
                productTypes.map((type) => (
                  <button
                    key={type._id}
                    type="button"
                    onClick={() => setValues({ ...values, productType: type._id })}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      productType === type._id
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-2xl">{type.icon || '📦'}</span>
                    <span className="text-sm font-medium">{type.displayName}</span>
                  </button>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                  <Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Loading product types...</p>
                </div>
              )}
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

          {/* Size-based Stock */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Stock by Size
            </label>
            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(sizeStock) as Array<keyof SizeStock>).map((size) => (
                <div key={size} className="text-center">
                  <label className="block text-xs text-gray-400 mb-1">{size}</label>
                  <input
                    type="number"
                    value={sizeStock[size]}
                    onChange={handleSizeStockChange(size)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white text-center"
                    placeholder="0"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Total Stock: <span className="text-yellow-400 font-semibold">{getTotalStock()}</span> units
            </p>
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
              <span>You can add new images or remove existing ones</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Set one image as primary for the main display</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Update stock levels by size for accurate inventory</span>
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
