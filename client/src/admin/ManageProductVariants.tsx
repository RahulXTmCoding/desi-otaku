import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Package,
  Infinity,
  Edit2,
  Save,
  Copy
} from 'lucide-react';
import { API } from '../backend';
import { isAutheticated } from '../auth/helper';

interface ProductVariantsProps {
  productId: string;
  productName: string;
}

interface Variant {
  color: string;
  colorValue: string;
  image: string;
  enabled: boolean;
  stock: {
    S: number | 'infinity';
    M: number | 'infinity';
    L: number | 'infinity';
    XL: number | 'infinity';
    XXL: number | 'infinity';
  };
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Navy', value: '#1E3A8A' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Green', value: '#059669' },
  { name: 'Yellow', value: '#FCD34D' },
  { name: 'Purple', value: '#7C3AED' }
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const ManageProductVariants: React.FC<ProductVariantsProps> = ({ productId, productName }) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingStock, setEditingStock] = useState<{ color: string; size: string } | null>(null);
  const [tempStock, setTempStock] = useState<string>('');
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    try {
      const response = await fetch(`${API}/product/${productId}/variants`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.variants && data.variants.length > 0) {
          setVariants(data.variants);
        } else {
          // Initialize with default colors if no variants exist
          initializeDefaultVariants();
        }
      }
    } catch (err) {
      console.error('Failed to load variants:', err);
      initializeDefaultVariants();
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultVariants = () => {
    const defaultVariants = COLORS.map(color => ({
      color: color.name,
      colorValue: color.value,
      image: '',
      enabled: false,
      stock: {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0
      }
    }));
    setVariants(defaultVariants);
  };

  const handleImageUpload = async (color: string, imageUrl: string) => {
    setVariants(prev => prev.map(v => 
      v.color === color ? { ...v, image: imageUrl } : v
    ));
  };

  const toggleVariant = (color: string) => {
    setVariants(prev => prev.map(v => 
      v.color === color ? { ...v, enabled: !v.enabled } : v
    ));
  };

  const handleStockEdit = (color: string, size: string) => {
    const variant = variants.find(v => v.color === color);
    if (variant) {
      const currentStock = variant.stock[size as keyof typeof variant.stock];
      setTempStock(currentStock === 'infinity' ? 'infinity' : currentStock.toString());
      setEditingStock({ color, size });
    }
  };

  const saveStockValue = (color: string, size: string) => {
    const value = tempStock === 'infinity' ? 'infinity' : parseInt(tempStock) || 0;
    
    setVariants(prev => prev.map(v => 
      v.color === color 
        ? { 
            ...v, 
            stock: { 
              ...v.stock, 
              [size]: value 
            } 
          } 
        : v
    ));
    
    setEditingStock(null);
    setTempStock('');
  };

  const setAllSizesToInfinity = (color: string) => {
    setVariants(prev => prev.map(v => 
      v.color === color 
        ? { 
            ...v, 
            stock: {
              S: 'infinity',
              M: 'infinity',
              L: 'infinity',
              XL: 'infinity',
              XXL: 'infinity'
            }
          } 
        : v
    ));
  };

  const setAllSizesToZero = (color: string) => {
    setVariants(prev => prev.map(v => 
      v.color === color 
        ? { 
            ...v, 
            stock: {
              S: 0,
              M: 0,
              L: 0,
              XL: 0,
              XXL: 0
            }
          } 
        : v
    ));
  };

  const copyStockFromColor = (fromColor: string, toColor: string) => {
    const fromVariant = variants.find(v => v.color === fromColor);
    if (fromVariant) {
      setVariants(prev => prev.map(v => 
        v.color === toColor 
          ? { ...v, stock: { ...fromVariant.stock } } 
          : v
      ));
    }
  };

  const saveVariants = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`${API}/product/${productId}/variants/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ variants })
      });

      if (response.ok) {
        alert('Variants saved successfully!');
      } else {
        alert('Failed to save variants');
      }
    } catch (err) {
      console.error('Error saving variants:', err);
      alert('Failed to save variants');
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (stock: number | 'infinity') => {
    if (stock === 'infinity') return 'text-green-400';
    if (stock === 0) return 'text-red-400';
    if (stock < 10) return 'text-yellow-400';
    return 'text-white';
  };

  const getStockDisplay = (stock: number | 'infinity') => {
    if (stock === 'infinity') return '∞';
    return stock.toString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading variants...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-yellow-400" />
        Manage Product Variants - {productName}
      </h3>

      {/* Variants Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4">Color</th>
              <th className="text-left py-3 px-4">Image</th>
              <th className="text-center py-3 px-4">Active</th>
              <th className="text-center py-3 px-4">S</th>
              <th className="text-center py-3 px-4">M</th>
              <th className="text-center py-3 px-4">L</th>
              <th className="text-center py-3 px-4">XL</th>
              <th className="text-center py-3 px-4">XXL</th>
              <th className="text-center py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.color} className="border-b border-gray-700">
                {/* Color */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-600"
                      style={{ backgroundColor: variant.colorValue }}
                    />
                    <span>{variant.color}</span>
                  </div>
                </td>

                {/* Image */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {variant.image ? (
                      <>
                        <img
                          src={variant.image}
                          alt={`${variant.color} variant`}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <input
                          type="url"
                          value={variant.image}
                          onChange={(e) => handleImageUpload(variant.color, e.target.value)}
                          className="text-xs bg-gray-700 px-2 py-1 rounded"
                          placeholder="Image URL"
                        />
                      </>
                    ) : (
                      <input
                        type="url"
                        onChange={(e) => handleImageUpload(variant.color, e.target.value)}
                        className="text-sm bg-gray-700 px-3 py-1 rounded"
                        placeholder="Add image URL"
                      />
                    )}
                  </div>
                </td>

                {/* Active Toggle */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleVariant(variant.color)}
                    className={`p-2 rounded-lg transition-colors ${
                      variant.enabled
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {variant.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>

                {/* Stock for each size */}
                {SIZES.map((size) => (
                  <td key={size} className="py-3 px-4 text-center">
                    {editingStock?.color === variant.color && editingStock?.size === size ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempStock}
                          onChange={(e) => setTempStock(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveStockValue(variant.color, size);
                            if (e.key === 'Escape') setEditingStock(null);
                          }}
                          className="w-16 px-2 py-1 bg-gray-700 rounded text-sm"
                          placeholder="∞"
                          autoFocus
                        />
                        <button
                          onClick={() => saveStockValue(variant.color, size)}
                          className="p-1 bg-green-500 rounded hover:bg-green-600"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStockEdit(variant.color, size)}
                        disabled={!variant.enabled}
                        className={`px-3 py-1 rounded hover:bg-gray-700 transition-colors ${
                          !variant.enabled ? 'opacity-50 cursor-not-allowed' : ''
                        } ${getStockStatus(variant.stock[size as keyof typeof variant.stock])}`}
                      >
                        {getStockDisplay(variant.stock[size as keyof typeof variant.stock])}
                      </button>
                    )}
                  </td>
                ))}

                {/* Actions */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAllSizesToInfinity(variant.color)}
                      disabled={!variant.enabled}
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-50"
                      title="Set all sizes to infinity"
                    >
                      <Infinity className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAllSizesToZero(variant.color)}
                      disabled={!variant.enabled}
                      className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:opacity-50"
                      title="Set all sizes to 0"
                    >
                      0
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-400">∞</span>
          <span className="text-gray-400">= Unlimited (Made to Order)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400">0</span>
          <span className="text-gray-400">= Out of Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">1-9</span>
          <span className="text-gray-400">= Low Stock</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveVariants}
        disabled={saving}
        className="mt-6 px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Variants
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-700 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          Instructions:
        </h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Upload an image for each color variant of your t-shirt</li>
          <li>• Toggle the "Active" button to enable/disable a color variant</li>
          <li>• Click on stock numbers to edit them - use "∞" for unlimited stock</li>
          <li>• Use action buttons to quickly set all sizes to infinity or zero</li>
          <li>• Only active variants will be shown to customers</li>
          <li>• Stock will automatically update when orders are placed</li>
        </ul>
      </div>
    </div>
  );
};

export default ManageProductVariants;
