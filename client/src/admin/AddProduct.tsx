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
  Shirt,
  X,
  Move,
  Ruler
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { createaProduct, getCategories, getCategoryTree, mockCreateProduct } from "./helper/adminapicall";
import { getAllProductTypes } from "./helper/productTypeApiCalls";
import { useDevMode } from "../context/DevModeContext";
import { mockCategories } from "../data/mockData";
import { testMultiImageUpload } from "../utils/testMultiImageUpload";
import { debugFormData } from "../utils/debugFormData";
import { createProductWithImages } from "./helper/productApiHelper";

interface ImageItem {
  id: string;
  url?: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
}

interface SizeStock {
  S: string;
  M: string;
  L: string;
  XL: string;
  XXL: string;
}

const AddProduct = () => {
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();

  const [values, setValues] = useState({
    name: "",
    description: "",
    price: "",
    mrp: "",
    tags: "",
    productType: "",
    categories: [] as any[],
    productTypes: [] as any[],
    category: "",
    subcategory: "",
    loading: false,
    error: "",
    createdProduct: "",
    formData: new FormData(),
  });

  // Hierarchical category state
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [availableSubcategories, setAvailableSubcategories] = useState<any[]>([]);

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
  const [loadedImages, setLoadedImages] = useState<any[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

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
    createdProduct,
    formData,
  } = values;

  const preload = async () => {
    if (isTestMode) {
      setValues({ ...values, categories: mockCategories, formData: new FormData() });
    } else {
      try {
        const [categoriesData, categoryTreeData, typesData] = await Promise.all([
          getCategories(),
          getCategoryTree(),
          getAllProductTypes(true)
        ]);
        
        if (categoriesData.error) {
          setValues({ ...values, error: categoriesData.error });
        } else {
          setValues({ 
            ...values, 
            categories: categoriesData, 
            productTypes: Array.isArray(typesData) ? typesData : [],
            formData: new FormData() 
          });
          
          // Set hierarchical category data
          if (categoryTreeData && !categoryTreeData.error) {
            setCategoryTree(categoryTreeData);
          }
        }
      } catch (err) {
        setValues({ ...values, error: "Failed to load data" });
      }
    }
  };

  // Handle main category selection
  const handleMainCategoryChange = (selectedCategoryId: string) => {
    setSelectedMainCategory(selectedCategoryId);
    setValues({ ...values, category: selectedCategoryId, subcategory: "" });
    
    // Find selected category in tree and get its subcategories
    const selectedCategory = categoryTree.find(cat => cat._id === selectedCategoryId);
    if (selectedCategory && selectedCategory.subcategories) {
      setAvailableSubcategories(selectedCategory.subcategories);
    } else {
      setAvailableSubcategories([]);
    }
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (selectedSubcategoryId: string) => {
    setValues({ ...values, subcategory: selectedSubcategoryId });
  };

  useEffect(() => {
    preload();
  }, [isTestMode]);

  // Comprehensive image URL generation logic (same as ProductGridItem)
  const getImageUrl = (imageData: any, index: number = 0): string => {
    
    // Handle different image data structures
    let imageUrl = '';
    
    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } else if (imageData && typeof imageData === 'object') {
      // Handle array of image objects or single image object
      if (Array.isArray(imageData) && imageData.length > 0) {
        const imageItem = imageData[index] || imageData[0];
        imageUrl = imageItem?.url || imageItem?.preview || imageItem;
      } else {
        imageUrl = imageData.url || imageData.preview || imageData.photoUrl || imageData;
      }
    }
    
    
    if (!imageUrl) {
      return '/placeholder.png';
    }
    
    // Handle different URL types
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/api/')) {
      const processedUrl = `${import.meta.env.VITE_API_URL}${imageUrl.substring(4)}`;
      return processedUrl;
    } else if (imageUrl.startsWith('data:')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
      const processedUrl = `${import.meta.env.VITE_API_URL}${imageUrl}`;
      return processedUrl;
    } else {
      // Assume it's a relative path that needs API base
      const processedUrl = `${import.meta.env.VITE_API_URL}/${imageUrl}`;
      return processedUrl;
    }
  };

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


    const fileArray = Array.from(files);
    const newImages: ImageItem[] = new Array(fileArray.length);
    let loadedCount = 0;

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Check if there's already a primary image in the current state
        const hasPrimaryInCurrent = images.some(img => img.isPrimary);
        // Check if we've already set a primary in the new batch
        const hasPrimaryInBatch = newImages.some(img => img && img.isPrimary);
        
        const newImage: ImageItem = {
          id: Date.now().toString() + '_' + index, // Use underscore to make IDs more unique
          file: file,
          preview: reader.result as string,
          isPrimary: !hasPrimaryInCurrent && !hasPrimaryInBatch && index === 0 // Only first file is primary if no primary exists
        };
        newImages[index] = newImage; // Preserve order
        loadedCount++;
        
        // Once all files are loaded, update state once
        if (loadedCount === fileArray.length) {
          setImages(prev => {
            const updated = [...prev, ...newImages];
            return updated;
          });
        }
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
    setImages(images.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
  };

  const handleSizeStockChange = (size: keyof SizeStock) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeStock({
      ...sizeStock,
      [size]: e.target.value
    });
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !token) return;
    
    setValues({ ...values, error: "", loading: true });

    try {
      // Prepare product data
      const productData: any = {
        name,
        description,
        price,
        mrp: values.mrp,
        category,
        subcategory: values.subcategory, // Add subcategory field
        tags,
        productType,
        sizeStock
      };
      
      // Separate URL and file images
      const urlImages = [];
      const fileImages = [];
      
      images.forEach((img) => {
        if (img.url) {
          urlImages.push({
            url: img.url,
            isPrimary: img.isPrimary,
            order: images.indexOf(img)
          });
        } else if (img.file) {
          fileImages.push({
            file: img.file,
            isPrimary: img.isPrimary
          });
        }
      });
      
      // Calculate primary image index
      const primaryIndex = images.findIndex(img => img.isPrimary);
      if (primaryIndex !== -1) {
        productData.primaryImageIndex = primaryIndex;
      }
      
      
      // Use the new JSON-based API
      const data = await createProductWithImages(
        user._id,
        token,
        productData,
        urlImages,
        fileImages
      );
      
      if (data.error) {
        setValues({ ...values, error: data.error, loading: false });
      } else {
        // If featured toggle is enabled, set the product as featured
        if (isFeatured && !isTestMode) {
          try {
            const featuredResponse = await fetch(`${import.meta.env.VITE_API_URL}/product/${data._id}/toggle-featured/${user._id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!featuredResponse.ok) {
              console.warn('Failed to set product as featured, but product created successfully');
            }
          } catch (featuredError) {
            console.warn('Error setting featured status:', featuredError);
            // Don't fail the whole operation for this
          }
        }
        
        setValues({
          ...values,
          name: "",
          description: "",
          price: "",
          mrp: "",
          tags: "",
          category: "",
          subcategory: "",
          loading: false,
          createdProduct: data.name,
          formData: new FormData(),
        });
        setImages([]);
        setSizeStock({ S: "0", M: "0", L: "0", XL: "0", XXL: "0" });
        setIsFeatured(false); // Reset featured toggle
        // Reset hierarchical category state
        setSelectedMainCategory("");
        setAvailableSubcategories([]);
        setTimeout(() => {
          setValues(prev => ({ ...prev, createdProduct: "" }));
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setValues({ ...values, error: "Failed to create product", loading: false });
    }
  };

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setValues({ ...values, [name]: value });
  };

  const getTotalStock = () => {
    return Object.values(sizeStock).reduce((sum, stock) => sum + parseInt(stock || "0"), 0);
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
          {/* Debug button - only in development */}
          {import.meta.env.DEV && (
            <>
              <button
                type="button"
                onClick={() => testMultiImageUpload()}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg"
              >
                Test Multi-Image FormData
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Create test FormData with current images
                  const testFormData = new FormData();
                  testFormData.set("name", "Test Product");
                  testFormData.set("description", "Test Description");
                  
                  const fileImages = images.filter(img => img.file);
                  
                  fileImages.forEach((img, index) => {
                    if (img.file) {
                      testFormData.append("images", img.file);
                    }
                  });
                  
                  try {
                    const response = await fetch("http://localhost:3002/test-multi-upload", {
                      method: "POST",
                      body: testFormData
                    });
                    const result = await response.json();
                    alert(`Test server received ${result.imageCount} images. Check console for details.`);
                  } catch (error) {
                    console.error("Test failed:", error);
                    alert("Test failed. Make sure to run: node server/testMultiFileReceive.js");
                  }
                }}
                className="mt-2 ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
              >
                Test Current Images Upload
              </button>
            </>
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
          {/* Product Images Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Product Images
            </label>
            
            {/* Display current images */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {images.map((img, index) => {
                  
                  // Use comprehensive URL logic for displaying images
                  let displayUrl = '';
                  if (img.file) {
                    // For file uploads, use the preview (base64)
                    displayUrl = img.preview;
                  } else if (img.url) {
                    // For URL images, use the comprehensive URL logic
                    displayUrl = getImageUrl(img.url);
                  } else {
                    // Fallback to preview
                    displayUrl = img.preview || '/placeholder.png';
                  }
                  
                  return (
                    <div key={img.id} className="relative group">
                      <img 
                        src={displayUrl} 
                        alt="Product" 
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                      {img.isPrimary && (
                        <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded font-semibold">
                          Primary
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(img.id)}
                            className="bg-yellow-400 text-gray-900 p-2 rounded-lg hover:bg-yellow-300"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
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
                  className="flex flex-col items-center justify-center w-full h-32 bg-gray-700 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">Click to upload product images</p>
                  <p className="text-xs text-gray-500 mt-1">You can select multiple images</p>
                </label>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={addImage}
                  disabled={!imageUrl}
                  className="px-4 py-3 bg-yellow-400 disabled:bg-gray-600 text-gray-900 disabled:text-gray-400 rounded-lg font-medium transition-colors"
                >
                  Add URL
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Add multiple images of your product. Click the image icon to set any image as primary.
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

          {/* MRP and Selling Price Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                MRP (₹) <span className="text-gray-500 text-xs">Maximum Retail Price</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={values.mrp || ""}
                  onChange={handleChange("mrp")}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="1199"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Higher MRP creates better discount perception</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selling Price (₹) <span className="text-gray-500 text-xs">Customer pays this amount</span>
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
              {values.mrp && price && (
                <p className="text-xs text-green-400 mt-1">
                  Discount: ₹{parseInt(values.mrp) - parseInt(price)} ({Math.round(((parseInt(values.mrp) - parseInt(price)) / parseInt(values.mrp)) * 100)}% off)
                </p>
              )}
            </div>
          </div>

          {/* Two-Level Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Category Selection
            </label>
            
            {/* Main Category Dropdown */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-2">Main Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedMainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Main Category</option>
                  {categoryTree.map((mainCat: any) => (
                    <option key={mainCat._id} value={mainCat._id}>
                      {mainCat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategory Dropdown - Only show if main category selected and has subcategories */}
            {selectedMainCategory && availableSubcategories.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">
                  Subcategory <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <Archive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={values.subcategory}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white appearance-none cursor-pointer"
                  >
                    <option value="">No Subcategory (Main Category Only)</option>
                    {availableSubcategories.map((subCat: any) => (
                      <option key={subCat._id} value={subCat._id}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Selected Category Display */}
            {selectedMainCategory && (
              <div className="bg-gray-700/50 rounded-lg p-3 text-sm">
                <span className="text-gray-400">Selected: </span>
                <span className="text-yellow-400 font-medium">
                  {categoryTree.find(cat => cat._id === selectedMainCategory)?.name}
                </span>
                {values.subcategory && (
                  <>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="text-blue-400 font-medium">
                      {availableSubcategories.find(sub => sub._id === values.subcategory)?.name}
                    </span>
                  </>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              First select a main category (e.g., "Anime"), then optionally choose a subcategory (e.g., "Naruto") for better organization.
            </p>
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
          <div className="mb-6">
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

          {/* Featured Product Toggle */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Product Showcase
            </label>
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⭐</div>
                  <div>
                    <h4 className="font-medium text-white">Featured Product</h4>
                    <p className="text-sm text-gray-400">
                      Featured products appear prominently on the home page
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isFeatured 
                      ? 'bg-yellow-400' 
                      : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isFeatured ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {isFeatured && (
                <div className="mt-3 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                  <p className="text-sm text-yellow-400 font-medium">
                    ✨ This product will be featured and appear on the home page
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || images.length === 0}
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
              <span>Add multiple high-quality images showing your product from different angles</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Click the image icon on any image to set it as the primary display image</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Set stock levels for each size to manage inventory properly</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Write detailed descriptions including material and fit information</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Use relevant tags to improve product discoverability</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
