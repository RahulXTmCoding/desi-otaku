import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Star, Move, Image as ImageIcon } from 'lucide-react';
import { API } from '../backend';
import { isAutheticated } from '../auth/helper';

interface ManageProductImagesProps {
  productId: string;
  productName: string;
}

const ManageProductImages: React.FC<ManageProductImagesProps> = ({ productId, productName }) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      const response = await fetch(`${API}/product/${productId}/images`);
      const data = await response.json();
      
      if (response.ok) {
        setImages(data.images || []);
      }
    } catch (err) {
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      alert('Please provide an image URL');
      return;
    }

    setUploading(true);
    
    try {
      const response = await fetch(`${API}/product/${productId}/images/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          url: imageUrl,
          caption: imageCaption,
          isPrimary: images.length === 0
        })
      });

      if (response.ok) {
        await loadImages();
        setImageUrl('');
        setImageCaption('');
        alert('Image added successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add image');
      }
    } catch (err) {
      console.error('Error adding image:', err);
      alert('Failed to add image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`${API}/product/${productId}/images/${imageId}/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadImages();
        alert('Image deleted successfully');
      } else {
        alert('Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const response = await fetch(`${API}/product/${productId}/images/${imageId}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isPrimary: true })
      });

      if (response.ok) {
        await loadImages();
        alert('Primary image updated');
      } else {
        alert('Failed to update primary image');
      }
    } catch (err) {
      console.error('Error updating primary image:', err);
      alert('Failed to update primary image');
    }
  };

  const handleUpdateOrder = async (imageId: string, newOrder: number) => {
    try {
      const response = await fetch(`${API}/product/${productId}/images/${imageId}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ order: newOrder })
      });

      if (response.ok) {
        await loadImages();
      } else {
        alert('Failed to update image order');
      }
    } catch (err) {
      console.error('Error updating image order:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading images...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-6">
        Manage Product Images - {productName}
      </h3>

      {/* Add Image Form */}
      <form onSubmit={handleAddImage} className="mb-8 bg-gray-700 rounded-lg p-4">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Add New Image
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Caption (optional)</label>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Front view of the t-shirt"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
            />
          </div>
          
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Adding...' : 'Add Image'}
          </button>
        </div>
      </form>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={image._id}
            className={`relative bg-gray-700 rounded-lg overflow-hidden ${
              image.isPrimary ? 'ring-2 ring-yellow-400' : ''
            }`}
          >
            {/* Image */}
            <div className="aspect-square overflow-hidden">
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.caption || `Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-600">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Image Info */}
            <div className="p-3">
              {image.caption && (
                <p className="text-sm text-gray-300 mb-2">{image.caption}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Order: {image.order + 1}</span>
                {image.isPrimary && (
                  <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded-full font-semibold">
                    Primary
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1">
              {!image.isPrimary && (
                <button
                  onClick={() => handleSetPrimary(image._id)}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Set as primary"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              
              {index > 0 && (
                <button
                  onClick={() => handleUpdateOrder(image._id, image.order - 1)}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Move up"
                >
                  <Move className="w-4 h-4 rotate-180" />
                </button>
              )}
              
              {index < images.length - 1 && (
                <button
                  onClick={() => handleUpdateOrder(image._id, image.order + 1)}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Move down"
                >
                  <Move className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => handleDeleteImage(image._id)}
                className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          No images added yet. Add your first image above.
        </p>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-700 rounded-lg">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• The first image added will automatically be set as primary</li>
          <li>• Click the star icon to set a different primary image</li>
          <li>• Use the arrow buttons to reorder images</li>
          <li>• Primary image will be shown as the main product image</li>
          <li>• All images will be available in the product gallery</li>
        </ul>
      </div>
    </div>
  );
};

export default ManageProductImages;
