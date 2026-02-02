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
  Plus,
  Ruler
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { getProduct, getCategories, getCategoryTree, mockUpdateProduct } from "./helper/adminapicall";
import { updateProductWithImages } from "./helper/productApiHelper";
import { getAllProductTypes } from "./helper/productTypeApiCalls";
import { getSizeChartsForDropdown, SizeChartDropdownItem, getSizeChartById, SizeChartTemplate } from "./helper/sizeChartApiCalls";
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
  [key: string]: string;
}

// All available sizes including extended sizes
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL', 'Free'];
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

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
    mrp: "",
    seoTitle: "", // New SEO field
    metaDescription: "", // New SEO field
    slug: "", // New SEO field
    tags: "",
    customTags: "",
    productType: "",
    categories: [] as any[],
    productTypes: [] as any[],
    category: "",
    subcategory: "",
    loading: false,
    error: "",
    updatedProduct: "",
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
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isFreeSize, setIsFreeSize] = useState(false);
  
  // Gender and Size Chart state
  const [gender, setGender] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [imageDisplayMode, setImageDisplayMode] = useState<'contain' | 'cover'>('contain');
  const [sizeChart, setSizeChart] = useState<string>('');
  const [sizeChartOptions, setSizeChartOptions] = useState<SizeChartDropdownItem[]>([]);
  const [selectedSizeChartData, setSelectedSizeChartData] = useState<SizeChartTemplate | null>(null);

  const {
    name,
    description,
    price,
    seoTitle, // Destructure new SEO fields
    metaDescription,
    slug,
    tags,
    customTags,
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
          mrp: data.mrp || "",
          seoTitle: data.seoTitle || "", // Pre-populate SEO title
          metaDescription: data.metaDescription || "", // Pre-populate meta description
          slug: data.slug || "", // Pre-populate slug
          category: data.category._id,
          subcategory: data.subcategory?._id || data.subcategory || "",
          tags: data.tags ? data.tags.join(", ") : "",
          customTags: data.customTags ? data.customTags.join(", ") : "",
          productType: productTypeId,
          formData: new FormData(),
        }));

        // Set size stock
        if (data.sizeStock) {
          // Convert to string values for form inputs
          const stockObj: SizeStock = {};
          Object.keys(data.sizeStock).forEach(size => {
            stockObj[size] = String(data.sizeStock[size] || 0);
          });
          setSizeStock(stockObj);
        }

        // Set featured status
        setIsFeatured(data.isFeatured || false);
        setOriginalIsFeatured(data.isFeatured || false);
        
        // Set free size
        setIsFreeSize(data.isFreeSize || false);
        
        // Set gender and size chart
        setGender(data.gender || 'unisex');
        setImageDisplayMode(data.imageDisplayMode || 'contain');
        
        // Set size chart - if populated object, use it directly
        const sizeChartId = data.sizeChart?._id || data.sizeChart || '';
        setSizeChart(sizeChartId);
        
        // If we have the full populated sizeChart object, use it
        if (data.sizeChart && typeof data.sizeChart === 'object' && data.sizeChart._id) {
          setSelectedSizeChartData(data.sizeChart);
        } else if (sizeChartId) {
          // Otherwise fetch it
          getSizeChartById(sizeChartId)
            .then(chartData => {
              if (chartData && !chartData.error) setSelectedSizeChartData(chartData);
            })
            .catch(err => console.error('Error loading size chart:', err));
        }

        // Load existing images using the same logic as ProductGridItem
        const loadedImages: ImageItem[] = [];
        
        if (data.images && data.images.length > 0) {
          data.images.forEach((img: any, index: number) => {
            let imageUrl = '';
            
            // Use same logic as ProductGridItem for getting image URL
            if (img.url) {
              // Direct URL
              if (img.url.startsWith('http')) {
                imageUrl = img.url;
              } else if (img.url.startsWith('/api/')) {
                imageUrl = `${API}${img.url.substring(4)}`;
              } else {
                imageUrl = img.url;
              }
            } else {
              // Database image with index
              imageUrl = `${API}/product/image/${productId}/${index}`;
            }
            
            loadedImages.push({
              id: `existing-${index}`,
              preview: imageUrl,
              isPrimary: !!img.isPrimary,
              existingImage: true
            });
          });
        } else if (data.photoUrl) {
          // Handle legacy photoUrl
          let imageUrl = '';
          if (data.photoUrl.startsWith('http')) {
            imageUrl = data.photoUrl;
          } else if (data.photoUrl.startsWith('/api/')) {
            imageUrl = `${API}${data.photoUrl.substring(4)}`;
          } else {
            imageUrl = data.photoUrl;
          }
          
          loadedImages.push({
            id: 'legacy-1',
            preview: imageUrl,
            isPrimary: true,
            existingImage: true
          });
        } else {
          // Fallback to old photo endpoint for backward compatibility
          loadedImages.push({
            id: 'legacy-1',
            preview: `${API}/product/image/${productId}`,
            isPrimary: true,
            existingImage: true
          });
        }
        
        // Ensure at least one image is primary
        const hasPrimary = loadedImages.some(img => img.isPrimary);
        if (!hasPrimary && loadedImages.length > 0) {
          loadedImages[0].isPrimary = true;
        }
        
        setImages(loadedImages);
        
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
        const [categoriesData, categoryTreeData, typesData, sizeChartsData] = await Promise.all([
          getCategories(),
          getCategoryTree(),
          getAllProductTypes(true),
          getSizeChartsForDropdown()
        ]);
        
        if (categoriesData.error) {
          setValues((prev) => ({ ...prev, error: categoriesData.error }));
        } else {
          setValues((prev) => ({
            ...prev,
            categories: categoriesData,
            productTypes: Array.isArray(typesData) ? typesData : [],
          }));
          
          // Set hierarchical category data
          if (categoryTreeData && !categoryTreeData.error) {
            setCategoryTree(categoryTreeData);
          }
          
          // Set size chart options
          if (Array.isArray(sizeChartsData)) {
            setSizeChartOptions(sizeChartsData);
          }
        }
      } catch (err) {
        setValues((prev) => ({ ...prev, error: "Failed to load data" }));
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
      // Filter subcategories by gender too
      const filteredSubcategories = selectedCategory.subcategories.filter((sub: any) => 
        !sub.genders || sub.genders.length === 0 || sub.genders.includes(gender)
      );
      setAvailableSubcategories(filteredSubcategories);
    } else {
      setAvailableSubcategories([]);
    }
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (selectedSubcategoryId: string) => {
    setValues({ ...values, subcategory: selectedSubcategoryId });
  };

  // Handle gender change - reset category and product type selections only if user explicitly changes gender
  const handleGenderChange = (newGender: 'men' | 'women' | 'unisex') => {
    if (newGender !== gender) {
      setGender(newGender);
      // Reset selections when gender changes
      setSelectedMainCategory("");
      setAvailableSubcategories([]);
      setValues({ ...values, category: "", subcategory: "", productType: "" });
      setSizeChart(''); // Reset size chart too
    }
  };

  // Filter categories by gender
  const filteredCategoryTree = categoryTree.filter((cat: any) => {
    // If category has no genders field or empty genders array, show it for all
    if (!cat.genders || cat.genders.length === 0) return true;
    // Otherwise, check if category includes the selected gender
    return cat.genders.includes(gender);
  });

  // Filter product types by gender
  const filteredProductTypes = productTypes.filter((type: any) => {
    // If product type has no genders field or empty genders array, show it for all
    if (!type.genders || type.genders.length === 0) return true;
    // Otherwise, check if product type includes the selected gender
    return type.genders.includes(gender);
  });

  useEffect(() => {
    if (productId) {
      preload(productId);
    }
  }, [productId, isTestMode]);

  // Initialize hierarchical category state when data is loaded
  useEffect(() => {
    if (categoryTree.length > 0 && category) {
      // Find the main category for the product's category
      let mainCategoryId = category;
      let subcategoryId = values.subcategory;
      
      // Check if the category is actually a subcategory
      for (const mainCat of categoryTree) {
        if (mainCat.subcategories) {
          const foundSubcat = mainCat.subcategories.find((sub: any) => sub._id === category);
          if (foundSubcat) {
            // The product's category is actually a subcategory
            mainCategoryId = mainCat._id;
            subcategoryId = category;
            break;
          }
        }
      }
      
      // Set the main category
      setSelectedMainCategory(mainCategoryId);
      
      // Find and set available subcategories
      const selectedCategory = categoryTree.find(cat => cat._id === mainCategoryId);
      if (selectedCategory && selectedCategory.subcategories) {
        setAvailableSubcategories(selectedCategory.subcategories);
      }
      
      // Update values if needed
      if (mainCategoryId !== category || subcategoryId !== values.subcategory) {
        setValues(prev => ({
          ...prev,
          category: mainCategoryId,
          subcategory: subcategoryId || ""
        }));
      }
    }
  }, [categoryTree, category, values.subcategory]);

  const addImage = () => {
    if (imageInputType === 'url' && imageUrl) {
      // Check if there's already a primary image
      const hasPrimary = images.some(img => img.isPrimary);
      const newImage: ImageItem = {
        id: Date.now().toString(),
        url: imageUrl,
        preview: imageUrl,
        isPrimary: !hasPrimary
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
            isPrimary: !hasPrimary && index === 0
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
    
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === id
    }));
    
    setImages(updatedImages);
  };

  const handleSizeStockChange = (size: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeStock({
      ...sizeStock,
      [size]: e.target.value
    });
  };

  // Handle size chart selection change - fetch full size chart data
  const handleSizeChartChange = async (chartId: string) => {
    setSizeChart(chartId);
    
    if (!chartId) {
      setSelectedSizeChartData(null);
      // Reset to default sizes
      if (!isFreeSize) {
        setSizeStock({ S: "0", M: "0", L: "0", XL: "0", XXL: "0" });
      }
      return;
    }
    
    try {
      const chartData = await getSizeChartById(chartId);
      if (chartData && !chartData.error) {
        setSelectedSizeChartData(chartData);
        
        // Initialize sizeStock with sizes from the chart's measurements
        if (chartData.measurements && chartData.measurements.length > 0) {
          const newSizeStock: SizeStock = {};
          chartData.measurements.forEach((m: any) => {
            if (m.size) {
              // Preserve existing stock values if they exist
              newSizeStock[m.size] = sizeStock[m.size] || "0";
            }
          });
          setSizeStock(newSizeStock);
        }
      }
    } catch (error) {
      console.error('Error fetching size chart:', error);
    }
  };

  // Get sizes to display based on selected size chart or default
  const getDisplaySizes = (): string[] => {
    if (isFreeSize) return ['Free'];
    if (selectedSizeChartData?.measurements && selectedSizeChartData.measurements.length > 0) {
      return selectedSizeChartData.measurements.map((m: any) => m.size).filter(Boolean);
    }
    // Default sizes if no size chart selected
    return DEFAULT_SIZES;
  };

  // Track original featured status to detect changes
  const [originalIsFeatured, setOriginalIsFeatured] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId || !user || !token) return;
    
    setValues({ ...values, error: "", loading: true });

    try {
      // Prepare product data
      const productData: any = {
        name,
        description,
        price,
        mrp: values.mrp,
        seoTitle, // Include new SEO fields
        metaDescription,
        slug,
        category,
        tags,
        customTags,
        productType,
        sizeStock,
        gender, // Add gender field
        imageDisplayMode, // Add image display mode
        sizeChart: sizeChart || null, // null means use fallback
        isFreeSize // Add free size flag
      };
      
      // Only include subcategory if it has a value
      if (values.subcategory && values.subcategory.trim() !== '') {
        productData.subcategory = values.subcategory;
      }
      
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
          // Check if featured status has changed and update it
          if (isFeatured !== originalIsFeatured) {
            try {
              const featuredResponse = await fetch(`${API}/product/${productId}/toggle-featured/${user._id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!featuredResponse.ok) {
                console.warn('Failed to update featured status, but product updated successfully');
              }
            } catch (featuredError) {
              console.warn('Error updating featured status:', featuredError);
              // Don't fail the whole operation for this
            }
          }
          
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
                <div className="space-y-3">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={!imageUrl}
                    className="w-full px-4 py-3 bg-yellow-400 disabled:bg-gray-600 text-gray-900 disabled:text-gray-400 rounded-lg font-medium transition-colors"
                  >
                    Add URL Image
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

          {/* SEO Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SEO Title <span className="text-gray-500 text-xs">(for search engines)</span>
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={handleChange("seoTitle")}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
              placeholder="Catchy title for search results (max 60 characters)"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              Appears in search engine results and browser tabs. Keep it concise and descriptive.
            </p>
          </div>

          {/* Meta Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Meta Description <span className="text-gray-500 text-xs">(for search engines)</span>
            </label>
            <textarea
              value={metaDescription}
              onChange={handleChange("metaDescription")}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all resize-none"
              placeholder="Brief summary of the product for search engines (max 160 characters)"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              A short, compelling summary that appears under the SEO title in search results.
            </p>
          </div>

          {/* Slug */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL Slug <span className="text-gray-500 text-xs">(unique, URL-friendly identifier)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={handleChange("slug")}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
              placeholder="e.g., premium-anime-tshirt-naruto"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically generated from product name if left empty. Must be unique.
            </p>
          </div>

          {/* Gender Selection - FIRST to filter categories and product types */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              👤 Gender Category <span className="text-xs text-yellow-400">(Changing this will reset category & type selections)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['men', 'women', 'unisex'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGenderChange(g)}
                  className={`p-4 rounded-lg border-2 transition-all text-sm font-medium ${
                    gender === g
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                      : 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  {g === 'men' && '👨 Men'}
                  {g === 'women' && '👩 Women'}
                  {g === 'unisex' && '🔄 Unisex'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Categories and product types will be filtered based on your selection
            </p>
          </div>

          {/* Product Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Product Type {filteredProductTypes.length === 0 && <span className="text-orange-400 text-xs">(No types for {gender})</span>}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProductTypes.length > 0 ? (
                filteredProductTypes?.map((type) => (
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

          {/* Image Display Mode Selection */}
          <div className="mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Image Display Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['contain', 'cover'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setImageDisplayMode(mode)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      imageDisplayMode === mode
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    {mode === 'contain' && '📐 Contain (Full Image)'}
                    {mode === 'cover' && '🖼️ Cover (Fill & Crop)'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Contain shows the full image, Cover fills the container (may crop)
              </p>
            </div>
          </div>

          {/* Size Chart Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Ruler className="inline w-4 h-4 mr-1" />
              Size Chart (Optional)
            </label>
            <select
              value={sizeChart}
              onChange={(e) => handleSizeChartChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white appearance-none cursor-pointer"
            >
              <option value="">Use Default (from Product Type)</option>
              {sizeChartOptions
                .filter(sc => sc.gender === gender || sc.gender === 'unisex')
                .map((sc) => (
                  <option key={sc._id} value={sc._id}>
                    {sc.displayTitle} ({sc.gender})
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the default size chart for the selected product type
            </p>
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
                  <option value="">Select Main Category {filteredCategoryTree.length === 0 ? `(No categories for ${gender})` : ''}</option>
                  {filteredCategoryTree.map((mainCat: any) => (
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

          {/* Free Size Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300">Free Size Product</label>
                <p className="text-xs text-gray-500 mt-1">Enable if this product doesn't require size selection (e.g., accessories, bags)</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFreeSize(!isFreeSize);
                  if (!isFreeSize) {
                    // When enabling free size, reset sizeStock to just Free
                    setSizeStock({ Free: sizeStock.Free || "0" });
                  } else {
                    // When disabling, restore default sizes
                    setSizeStock({ S: "0", M: "0", L: "0", XL: "0", XXL: "0" });
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isFreeSize ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isFreeSize ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Size-based Stock */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {isFreeSize ? 'Stock (Free Size)' : 'Stock by Size'}
            </label>
            {isFreeSize ? (
              // Free size - single stock input
              <div className="max-w-[150px]">
                <label className="block text-xs text-gray-400 mb-1">Free Size Stock</label>
                <input
                  type="number"
                  value={sizeStock.Free || "0"}
                  onChange={(e) => setSizeStock({ ...sizeStock, Free: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white text-center"
                  placeholder="0"
                  min="0"
                />
              </div>
            ) : (
              // Regular sizes - dynamic based on size chart
              <>
                {selectedSizeChartData && (
                  <p className="text-xs text-yellow-400 mb-2">
                    Showing sizes from: {selectedSizeChartData.displayTitle || selectedSizeChartData.name}
                  </p>
                )}
                <div className={`grid gap-3 ${getDisplaySizes().length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
                  {getDisplaySizes().map((size) => (
                    <div key={size} className="text-center">
                      <label className="block text-xs text-gray-400 mb-1">{size}</label>
                      <input
                        type="number"
                        value={sizeStock[size] || "0"}
                        onChange={handleSizeStockChange(size)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white text-center"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
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

          {/* Custom Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Tags (comma separated)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={values.customTags}
                onChange={handleChange("customTags")}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                placeholder="new arrival, best seller, limited edition"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Custom tags are displayed on the product card</p>
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
                    ✨ This product is featured and will appear on the home page
                  </p>
                </div>
              )}
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
