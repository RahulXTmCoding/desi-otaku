import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Tag,
  DollarSign,
  Save,
  Link,
  Palette,
  Hash
} from 'lucide-react';
import { isAutheticated } from "../auth/helper";
import { createDesign, mockCreateDesign } from "./helper/designapicall";
import { getCategories } from "./helper/adminapicall";
import { useDevMode } from "../context/DevModeContext";

const AddDesign = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();

  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;

  const [values, setValues] = useState<{
    name: string;
    description: string;
    price: string;
    image: string | File;
    imageUrl: string;
    category: string;
    tags: string;
    placements: string[];
    loading: boolean;
    error: string;
    createdDesign: string;
    formData: FormData;
  }>({
    name: "",
    description: "",
    price: "",
    image: "",
    imageUrl: "",
    category: "other",
    tags: "",
    placements: ["front"],
    loading: false,
    error: "",
    createdDesign: "",
    formData: new FormData(),
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file');
  const [categories, setCategories] = useState<any[]>([]);

  const {
    name,
    description,
    price,
    imageUrl,
    category,
    tags,
    placements,
    loading,
    error,
    createdDesign,
    formData,
  } = values;

  // Load categories from backend
  useEffect(() => {
    loadCategories();
  }, [isTestMode]);

  const loadCategories = () => {
    getCategories()
      .then((data: any) => {
        if (data && !data.error) {
          setCategories(data);
          // Set default category if available
          if (data.length > 0 && !category) {
            setValues(prev => ({ ...prev, category: data[0]._id }));
          }
        }
      })
      .catch((err) => console.log("Error loading categories:", err));
  };

  const placementOptions = [
    { value: 'front', label: 'Front' },
    { value: 'back', label: 'Back' },
    { value: 'left-sleeve', label: 'Left Sleeve' },
    { value: 'right-sleeve', label: 'Right Sleeve' },
    { value: 'pocket', label: 'Pocket' }
  ];

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !token) return;
    
    setValues({ ...values, error: "", loading: true });

    // Set form data
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("category", category);
    formData.set("tags", tags);
    formData.set("placements", placements.join(','));

    // If using URL, add it to formData
    if (imageInputType === 'url' && imageUrl) {
      formData.set('imageUrl', imageUrl);
    }

    if (isTestMode) {
      // Mock create in test mode
      mockCreateDesign(formData).then((data: any) => {
        setValues({
          ...values,
          name: "",
          description: "",
          price: "",
          tags: "",
          loading: false,
          createdDesign: name,
        });
        setTimeout(() => {
          navigate('/admin/designs');
        }, 2000);
      });
    } else {
      // Real backend create
      createDesign(user._id, token, formData).then((data: any) => {
        if (data.error) {
          setValues({ ...values, error: data.error, loading: false });
        } else {
          setValues({
            ...values,
            name: "",
            description: "",
            price: "",
            tags: "",
            loading: false,
            createdDesign: data.name,
          });
          setTimeout(() => {
            navigate('/admin/designs');
          }, 2000);
        }
      });
    }
  };

  const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (name === "image" && event.target instanceof HTMLInputElement && event.target.files) {
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
      if (name !== "imageUrl") {
        formData.set(name, value);
      }
      setValues({ ...values, [name]: value });
      
      // If entering URL, update preview
      if (name === "imageUrl" && value) {
        setPreviewImage(value);
      }
    }
  };

  const handlePlacementChange = (placement: string) => {
    if (placements.includes(placement)) {
      setValues({
        ...values,
        placements: placements.filter(p => p !== placement)
      });
    } else {
      setValues({
        ...values,
        placements: [...placements, placement]
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
            <Palette className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Add New Design</h1>
          <p className="text-gray-400">Create a new design for customers to choose</p>
          {isTestMode && (
            <p className="text-yellow-400 text-sm mt-2">
              🧪 Test Mode: Changes won't persist
            </p>
          )}
        </div>

        {/* Success Message */}
        {createdDesign && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{createdDesign} created successfully! Redirecting...</p>
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
              Design Image
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
                  onChange={handleChange("image")}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-64 bg-gray-700 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-600 transition-colors overflow-hidden"
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-400">Click to upload design image</p>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 3MB</p>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={handleChange("imageUrl")}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all mb-4"
                  placeholder="https://example.com/design.jpg"
                />
                {imageUrl && (
                  <div className="w-full h-64 bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/300/350';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Design Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Design Name
            </label>
            <input
              type="text"
              value={name}
              onChange={handleChange("name")}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
              placeholder="Cool Anime Design"
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
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all resize-none"
              placeholder="Describe the design..."
            />
          </div>

          {/* Category and Price Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                  <option value="">Select a category</option>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option value="other">Other</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Price (₹)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={price}
                  onChange={handleChange("price")}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 text-white placeholder-gray-400 transition-all"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Extra cost for this design</p>
            </div>
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
                placeholder="anime, naruto, cool, trending"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tags help customers find this design</p>
          </div>

          {/* Placement Options */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Available Placements
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {placementOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={placements.includes(option.value)}
                    onChange={() => handlePlacementChange(option.value)}
                    className="w-4 h-4 text-yellow-400 bg-gray-600 border-gray-500 rounded focus:ring-yellow-400"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
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
                  Creating Design...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Design
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
          <h3 className="font-semibold mb-3">Design Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Use high-quality images (recommended 1000x1000px minimum)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Transparent PNG files work best for t-shirt designs</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Add relevant tags to improve search visibility</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5"></div>
              <span>Consider copyright when uploading anime/gaming designs</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddDesign;
