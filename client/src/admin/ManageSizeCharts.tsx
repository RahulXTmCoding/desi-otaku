import React, { useState, useEffect } from 'react';
import { isAutheticated } from '../auth/helper';
import { 
  getAllSizeCharts, 
  createSizeChart, 
  updateSizeChart, 
  deleteSizeChart,
  toggleSizeChartStatus,
  SizeChartTemplate,
  SizeChartMeasurement,
  SizeChartHeader,
  MeasurementGuide
} from './helper/sizeChartApiCalls';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Eye,
  EyeOff,
  Ruler,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';

// Default headers by gender
const defaultHeaders = {
  men: [
    { key: 'size', label: 'Size' },
    { key: 'chest', label: 'Chest (inches)' },
    { key: 'length', label: 'Length (inches)' },
    { key: 'shoulder', label: 'Shoulder (inches)' }
  ],
  women: [
    { key: 'size', label: 'Size' },
    { key: 'bust', label: 'Bust (inches)' },
    { key: 'waist', label: 'Waist (inches)' },
    { key: 'hip', label: 'Hip (inches)' },
    { key: 'length', label: 'Length (inches)' }
  ],
  unisex: [
    { key: 'size', label: 'Size' },
    { key: 'chest', label: 'Chest (inches)' },
    { key: 'length', label: 'Length (inches)' },
    { key: 'shoulder', label: 'Shoulder (inches)' }
  ]
};

// Common measurement presets for quick add
const commonMeasurements = [
  { key: 'chest', label: 'Chest' },
  { key: 'length', label: 'Length' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'sleeve', label: 'Sleeve' },
  { key: 'bust', label: 'Bust' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'neck', label: 'Neck' },
  { key: 'arm_hole', label: 'Arm Hole' },
  { key: 'bottom_width', label: 'Bottom Width' }
];

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL'];

const ManageSizeCharts: React.FC = () => {
  const [sizeCharts, setSizeCharts] = useState<SizeChartTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnUnit, setNewColumnUnit] = useState('inches');
  
  const [formData, setFormData] = useState({
    name: '',
    displayTitle: '',
    description: '',
    gender: 'unisex' as 'men' | 'women' | 'unisex',
    headers: defaultHeaders.unisex as SizeChartHeader[],
    measurements: [{ size: 'S' }] as SizeChartMeasurement[],
    measurementGuide: [] as MeasurementGuide[],
    note: '',
    isActive: true,
    order: 0
  });

  const auth = isAutheticated();
  const user = auth && auth.user;
  const token = auth && auth.token;

  useEffect(() => {
    loadSizeCharts();
  }, []);

  const loadSizeCharts = async () => {
    try {
      const data = await getAllSizeCharts();
      if (Array.isArray(data)) {
        setSizeCharts(data);
      }
    } catch (err) {
      toast.error('Failed to load size charts');
    } finally {
      setLoading(false);
    }
  };

  const handleGenderChange = (gender: 'men' | 'women' | 'unisex') => {
    setFormData({
      ...formData,
      gender,
      headers: defaultHeaders[gender],
      // Reset measurements to match new headers
      measurements: (formData.measurements || []).map(m => ({
        size: m.size
      }))
    });
  };

  const handleHeaderToggle = (key: string, label: string) => {
    const headers = formData.headers || [];
    const existingIndex = headers.findIndex(h => h.key === key);
    if (existingIndex >= 0) {
      // Remove header if not 'size'
      if (key !== 'size') {
        setFormData({
          ...formData,
          headers: headers.filter(h => h.key !== key)
        });
      }
    } else {
      // Add header
      setFormData({
        ...formData,
        headers: [...headers, { key, label: `${label} (inches)` }]
      });
    }
  };

  // Add custom column
  const addCustomColumn = () => {
    if (!newColumnName.trim()) {
      toast.error('Please enter a column name');
      return;
    }
    
    const key = newColumnName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
    const headers = formData.headers || [];
    
    // Check if column already exists
    if (headers.some(h => h.key === key)) {
      toast.error('A column with this name already exists');
      return;
    }
    
    const unitLabel = newColumnUnit !== 'none' ? ` (${newColumnUnit})` : '';
    const newHeader: SizeChartHeader = {
      key,
      label: `${newColumnName.trim()}${unitLabel}`
    };
    
    setFormData({
      ...formData,
      headers: [...headers, newHeader]
    });
    
    setNewColumnName('');
    toast.success(`Added column: ${newColumnName}`);
  };

  // Remove a column
  const removeColumn = (key: string) => {
    if (key === 'size') {
      toast.error('Cannot remove the Size column');
      return;
    }
    
    const headers = formData.headers || [];
    const measurements = formData.measurements || [];
    
    // Remove from headers
    const newHeaders = headers.filter(h => h.key !== key);
    
    // Remove from all measurements
    const newMeasurements = measurements.map(m => {
      const { [key]: removed, ...rest } = m as any;
      return rest;
    });
    
    setFormData({
      ...formData,
      headers: newHeaders,
      measurements: newMeasurements
    });
    
    toast.success('Column removed');
  };

  const handleMeasurementChange = (index: number, key: string, value: string) => {
    const measurements = formData.measurements || [];
    const newMeasurements = [...measurements];
    newMeasurements[index] = { ...newMeasurements[index], [key]: value };
    setFormData({ ...formData, measurements: newMeasurements });
  };

  const addMeasurementRow = () => {
    const measurements = formData.measurements || [];
    const lastSize = measurements[measurements.length - 1]?.size || 'S';
    const lastSizeIndex = sizeOptions.indexOf(lastSize);
    const nextSize = sizeOptions[Math.min(lastSizeIndex + 1, sizeOptions.length - 1)];
    setFormData({
      ...formData,
      measurements: [...measurements, { size: nextSize }]
    });
  };

  const removeMeasurementRow = (index: number) => {
    const measurements = formData.measurements || [];
    if (measurements.length > 1) {
      setFormData({
        ...formData,
        measurements: measurements.filter((_, i) => i !== index)
      });
    }
  };

  const addMeasurementGuide = () => {
    setFormData({
      ...formData,
      measurementGuide: [...formData.measurementGuide, { part: '', instruction: '' }]
    });
  };

  const updateMeasurementGuide = (index: number, field: 'part' | 'instruction', value: string) => {
    const newGuide = [...formData.measurementGuide];
    newGuide[index] = { ...newGuide[index], [field]: value };
    setFormData({ ...formData, measurementGuide: newGuide });
  };

  const removeMeasurementGuide = (index: number) => {
    setFormData({
      ...formData,
      measurementGuide: formData.measurementGuide.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.displayTitle) {
      toast.error('Name and Display Title are required');
      return;
    }

    if (formData.measurements.length === 0) {
      toast.error('At least one size measurement is required');
      return;
    }

    try {
      const chartData = {
        ...formData,
        measurementGuide: formData.measurementGuide.filter(g => g.part && g.instruction)
      };

      if (isEditing) {
        const result = await updateSizeChart(isEditing, user._id, token, chartData);
        if (!result.error) {
          toast.success('Size chart updated successfully');
          setIsEditing(null);
          loadSizeCharts();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createSizeChart(user._id, token, chartData);
        if (!result.error) {
          toast.success('Size chart created successfully');
          setIsCreating(false);
          loadSizeCharts();
        } else {
          toast.error(result.error);
        }
      }

      resetForm();
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (chart: SizeChartTemplate) => {
    setIsEditing(chart._id);
    setIsCreating(false);
    setFormData({
      name: chart.name || '',
      displayTitle: chart.displayTitle || chart.name || '',
      description: chart.description || '',
      gender: chart.gender || 'unisex',
      headers: chart.headers || defaultHeaders.unisex,
      measurements: chart.measurements || [{ size: 'S' }],
      measurementGuide: chart.measurementGuide || [],
      note: chart.note || '',
      isActive: chart.isActive !== false,
      order: chart.order || 0
    });
  };

  const handleDuplicate = (chart: SizeChartTemplate) => {
    setIsCreating(true);
    setIsEditing(null);
    setFormData({
      name: `${chart.name || 'Chart'} (Copy)`,
      displayTitle: `${chart.displayTitle || chart.name || 'Chart'} (Copy)`,
      description: chart.description || '',
      gender: chart.gender || 'unisex',
      headers: chart.headers ? [...chart.headers] : defaultHeaders.unisex,
      measurements: chart.measurements ? chart.measurements.map(m => ({ ...m })) : [{ size: 'S' }],
      measurementGuide: chart.measurementGuide?.map(g => ({ ...g })) || [],
      note: chart.note || '',
      isActive: true,
      order: (chart.order || 0) + 1
    });
  };

  const handleDelete = async (chartId: string) => {
    if (!window.confirm('Are you sure you want to delete this size chart?')) {
      return;
    }

    try {
      const result = await deleteSizeChart(chartId, user._id, token);
      if (!result.error) {
        toast.success('Size chart deleted successfully');
        loadSizeCharts();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to delete size chart');
    }
  };

  const handleToggleStatus = async (chartId: string) => {
    try {
      const result = await toggleSizeChartStatus(chartId, user._id, token);
      if (!result.error) {
        toast.success(result.message);
        loadSizeCharts();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayTitle: '',
      description: '',
      gender: 'unisex',
      headers: defaultHeaders.unisex,
      measurements: [{ size: 'S' }],
      measurementGuide: [],
      note: '',
      isActive: true,
      order: 0
    });
    setIsEditing(null);
    setIsCreating(false);
  };

  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'men': return 'bg-blue-500/20 text-blue-400';
      case 'women': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-purple-500/20 text-purple-400';
    }
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
          <div>
            <h1 className="text-4xl font-bold text-yellow-400">Manage Size Charts</h1>
            <p className="text-gray-400 mt-2">Create and manage size chart templates for your products</p>
          </div>
          {!isCreating && !isEditing && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Size Chart
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-yellow-400" />
              {isEditing ? 'Edit Size Chart' : 'Create New Size Chart'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name*</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="e.g., Men's T-Shirt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Title*</label>
                  <input
                    type="text"
                    value={formData.displayTitle}
                    onChange={(e) => setFormData({ ...formData, displayTitle: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    placeholder="e.g., Men's T-Shirt Size Chart"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleGenderChange(e.target.value as 'men' | 'women' | 'unisex')}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
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
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  rows={2}
                  placeholder="Brief description of this size chart"
                />
              </div>

              {/* Measurement Columns Selection */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-medium mb-3">Measurement Columns</label>
                
                {/* Current Columns */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Current columns (click to remove):</p>
                  <div className="flex flex-wrap gap-2">
                    {(formData.headers || []).map(h => (
                      <div
                        key={h.key}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                          h.key === 'size' 
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                            : 'bg-yellow-400 text-gray-900 cursor-pointer hover:bg-yellow-300'
                        }`}
                        onClick={() => h.key !== 'size' && removeColumn(h.key)}
                      >
                        {h.label}
                        {h.key !== 'size' && <X className="w-3 h-3" />}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Add Common Measurements */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Quick add common measurements:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonMeasurements
                      .filter(mk => !(formData.headers || []).some(h => h.key === mk.key))
                      .map(mk => (
                        <button
                          key={mk.key}
                          type="button"
                          onClick={() => handleHeaderToggle(mk.key, mk.label)}
                          className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        >
                          + {mk.label}
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Add Custom Column */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Add custom column:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-sm"
                      placeholder="Column name (e.g., Arm Length)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColumn())}
                    />
                    <select
                      value={newColumnUnit}
                      onChange={(e) => setNewColumnUnit(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 text-sm"
                    >
                      <option value="inches">inches</option>
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="none">no unit</option>
                    </select>
                    <button
                      type="button"
                      onClick={addCustomColumn}
                      className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Size Measurements Table */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Size Measurements</label>
                  <button
                    type="button"
                    onClick={addMeasurementRow}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Size
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {(formData.headers || []).map(h => (
                          <th key={h.key} className="px-3 py-2 text-left font-medium text-gray-400">
                            {h.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.measurements || []).map((measurement, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          {(formData.headers || []).map(h => (
                            <td key={h.key} className="px-2 py-2">
                              {h.key === 'size' ? (
                                <select
                                  value={measurement.size}
                                  onChange={(e) => handleMeasurementChange(index, 'size', e.target.value)}
                                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded focus:border-yellow-400"
                                >
                                  {sizeOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={(measurement as any)[h.key] || ''}
                                  onChange={(e) => handleMeasurementChange(index, h.key, e.target.value)}
                                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded focus:border-yellow-400"
                                  placeholder="e.g., 36-38"
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => removeMeasurementRow(index)}
                              className="p-1 hover:bg-gray-700 rounded text-red-400"
                              disabled={(formData.measurements || []).length === 1}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Measurement Guide */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">How to Measure Guide (Optional)</label>
                  <button
                    type="button"
                    onClick={addMeasurementGuide}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Guide
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.measurementGuide.map((guide, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={guide.part}
                        onChange={(e) => updateMeasurementGuide(index, 'part', e.target.value)}
                        className="w-1/4 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400"
                        placeholder="Body Part"
                      />
                      <input
                        type="text"
                        value={guide.instruction}
                        onChange={(e) => updateMeasurementGuide(index, 'instruction', e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400"
                        placeholder="How to measure instruction"
                      />
                      <button
                        type="button"
                        onClick={() => removeMeasurementGuide(index)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-2">Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  rows={2}
                  placeholder="e.g., BIOWASH fabric may shrink slightly after first wash"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-700">
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

        {/* Size Charts List */}
        <div className="space-y-4">
          {sizeCharts?.map((chart) => (
            <div
              key={chart._id}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden"
            >
              {/* Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedChart(expandedChart === chart._id ? null : chart._id)}
              >
                <div className="flex items-center gap-4">
                  <Ruler className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h3 className="text-lg font-semibold">{chart.displayTitle || chart.name}</h3>
                    <p className="text-sm text-gray-400">
                      {chart.measurements?.length || 0} sizes • {Math.max((chart.headers?.length || 1) - 1, 0)} measurements
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGenderBadgeColor(chart.gender || 'unisex')}`}>
                    {(chart.gender || 'unisex').charAt(0).toUpperCase() + (chart.gender || 'unisex').slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    chart.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {chart.isActive ? (
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
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(chart); }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(chart); }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(chart._id); }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title={chart.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {chart.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(chart._id); }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {expandedChart === chart._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content - Preview Table */}
              {expandedChart === chart._id && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-700/50">
                          {(chart.headers || []).map(h => (
                            <th key={h.key} className="px-4 py-2 text-left font-medium text-gray-300">
                              {h.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(chart.measurements || []).map((m, idx) => (
                          <tr key={idx} className="border-b border-gray-700/30">
                            {(chart.headers || []).map(h => (
                              <td key={h.key} className="px-4 py-2 text-gray-400">
                                {(m as any)[h.key] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {chart.note && (
                    <p className="mt-3 text-sm text-yellow-400/80 italic">
                      Note: {chart.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {sizeCharts.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <Ruler className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No size charts found</p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors font-semibold"
            >
              Create Your First Size Chart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSizeCharts;
