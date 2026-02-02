const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

// Column definition schema - defines what columns exist in the chart
const columnDefinitionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  key: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  unit: {
    type: String,
    default: 'inches',
    enum: ['inches', 'cm', 'mm', 'none']
  },
  order: {
    type: Number,
    default: 0
  },
  isRequired: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Size row schema - stores measurements for each size
const sizeRowSchema = new Schema({
  size: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  // Dynamic measurements stored as key-value pairs
  // Key corresponds to column.key, value is the measurement
  measurements: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  }
}, { _id: true });

const sizeChartTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    // Display title shown to customers
    displayTitle: {
      type: String,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    // URL-friendly slug
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    // Gender this size chart applies to
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      default: 'unisex'
    },
    // Simple headers array for frontend compatibility
    headers: [{
      key: { type: String, required: true },
      label: { type: String, required: true }
    }],
    // Simple measurements array for frontend compatibility
    measurements: [{
      type: Schema.Types.Mixed
    }],
    // Measurement guide instructions
    measurementGuide: [{
      part: { type: String },
      instruction: { type: String }
    }],
    // Additional notes
    note: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    // Display order
    order: {
      type: Number,
      default: 0
    },
    // Category this template belongs to (optional)
    category: {
      type: ObjectId,
      ref: "Category",
      default: null
    },
    // Product type this template is for (optional)
    productType: {
      type: ObjectId,
      ref: "ProductType",
      default: null
    },
    // Custom columns - fully flexible
    columns: [columnDefinitionSchema],
    // Available sizes with their measurements
    sizes: [sizeRowSchema],
    // Predefined size options for quick selection
    availableSizeOptions: {
      type: [String],
      default: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    },
    // Default measurement unit for new columns
    defaultUnit: {
      type: String,
      default: 'inches',
      enum: ['inches', 'cm', 'mm', 'none']
    },
    // Whether this is a system default template
    isDefault: {
      type: Boolean,
      default: false
    },
    // Template status
    isActive: {
      type: Boolean,
      default: true
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    // Created by
    createdBy: {
      type: ObjectId,
      ref: "User",
      default: null
    },
    // Notes for admin reference
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

// Indexes
sizeChartTemplateSchema.index({ isDeleted: 1, isActive: 1 });
sizeChartTemplateSchema.index({ isDeleted: 1, productType: 1 });
sizeChartTemplateSchema.index({ isDeleted: 1, category: 1 });
sizeChartTemplateSchema.index({ name: "text", description: "text" });

// Pre-save hook to generate column keys and slug
sizeChartTemplateSchema.pre('save', function(next) {
  // Auto-generate slug from name if not provided
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  // Auto-generate keys for columns if not provided
  if (this.columns && this.columns.length > 0) {
    this.columns.forEach((col, index) => {
      if (!col.key) {
        col.key = col.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
      }
      if (col.order === undefined || col.order === null) {
        col.order = index;
      }
    });
  }
  
  // Auto-set order for sizes if not provided
  if (this.sizes && this.sizes.length > 0) {
    this.sizes.forEach((size, index) => {
      if (size.order === undefined || size.order === null) {
        size.order = index;
      }
    });
  }
  
  next();
});

// Methods

// Add a new column
sizeChartTemplateSchema.methods.addColumn = function(columnData) {
  const key = columnData.key || columnData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
  
  // Check if column with same key exists
  const existingColumn = this.columns.find(col => col.key === key);
  if (existingColumn) {
    return { success: false, message: 'Column with this key already exists' };
  }
  
  const newColumn = {
    name: columnData.name,
    key: key,
    unit: columnData.unit || this.defaultUnit,
    order: columnData.order !== undefined ? columnData.order : this.columns.length,
    isRequired: columnData.isRequired || false
  };
  
  this.columns.push(newColumn);
  return { success: true, column: newColumn };
};

// Remove a column by key
sizeChartTemplateSchema.methods.removeColumn = function(columnKey) {
  const columnIndex = this.columns.findIndex(col => col.key === columnKey);
  if (columnIndex === -1) {
    return { success: false, message: 'Column not found' };
  }
  
  // Remove column
  this.columns.splice(columnIndex, 1);
  
  // Remove corresponding measurements from all sizes
  this.sizes.forEach(size => {
    if (size.measurements && size.measurements.has(columnKey)) {
      size.measurements.delete(columnKey);
    }
  });
  
  return { success: true };
};

// Update column
sizeChartTemplateSchema.methods.updateColumn = function(columnKey, updates) {
  const column = this.columns.find(col => col.key === columnKey);
  if (!column) {
    return { success: false, message: 'Column not found' };
  }
  
  if (updates.name) column.name = updates.name;
  if (updates.unit) column.unit = updates.unit;
  if (updates.order !== undefined) column.order = updates.order;
  if (updates.isRequired !== undefined) column.isRequired = updates.isRequired;
  
  return { success: true, column };
};

// Reorder columns
sizeChartTemplateSchema.methods.reorderColumns = function(columnKeys) {
  columnKeys.forEach((key, index) => {
    const column = this.columns.find(col => col.key === key);
    if (column) {
      column.order = index;
    }
  });
  
  // Sort columns by order
  this.columns.sort((a, b) => a.order - b.order);
  return { success: true };
};

// Add a new size row
sizeChartTemplateSchema.methods.addSize = function(sizeData) {
  const existingSize = this.sizes.find(s => s.size === sizeData.size);
  if (existingSize) {
    return { success: false, message: 'Size already exists' };
  }
  
  const newSize = {
    size: sizeData.size,
    order: sizeData.order !== undefined ? sizeData.order : this.sizes.length,
    measurements: new Map(Object.entries(sizeData.measurements || {}))
  };
  
  this.sizes.push(newSize);
  return { success: true, size: newSize };
};

// Remove a size row
sizeChartTemplateSchema.methods.removeSize = function(sizeName) {
  const sizeIndex = this.sizes.findIndex(s => s.size === sizeName);
  if (sizeIndex === -1) {
    return { success: false, message: 'Size not found' };
  }
  
  this.sizes.splice(sizeIndex, 1);
  return { success: true };
};

// Update measurements for a size
sizeChartTemplateSchema.methods.updateSizeMeasurements = function(sizeName, measurements) {
  const size = this.sizes.find(s => s.size === sizeName);
  if (!size) {
    return { success: false, message: 'Size not found' };
  }
  
  // Update or add measurements
  Object.entries(measurements).forEach(([key, value]) => {
    size.measurements.set(key, value);
  });
  
  return { success: true, size };
};

// Get formatted chart data for display
sizeChartTemplateSchema.methods.getFormattedChart = function() {
  const sortedColumns = [...this.columns].sort((a, b) => a.order - b.order);
  const sortedSizes = [...this.sizes].sort((a, b) => a.order - b.order);
  
  return {
    name: this.name,
    description: this.description,
    columns: sortedColumns.map(col => ({
      name: col.name,
      key: col.key,
      unit: col.unit
    })),
    rows: sortedSizes.map(size => {
      const row = { size: size.size };
      sortedColumns.forEach(col => {
        row[col.key] = size.measurements.get(col.key) || '-';
      });
      return row;
    })
  };
};

// Clone template
sizeChartTemplateSchema.methods.cloneTemplate = function(newName) {
  const clonedData = {
    name: newName || `${this.name} (Copy)`,
    description: this.description,
    category: this.category,
    productType: this.productType,
    columns: this.columns.map(col => ({
      name: col.name,
      key: col.key,
      unit: col.unit,
      order: col.order,
      isRequired: col.isRequired
    })),
    sizes: this.sizes.map(size => ({
      size: size.size,
      order: size.order,
      measurements: new Map(size.measurements)
    })),
    availableSizeOptions: [...this.availableSizeOptions],
    defaultUnit: this.defaultUnit,
    isDefault: false,
    isActive: true
  };
  
  return clonedData;
};

// Static method to get default columns
sizeChartTemplateSchema.statics.getDefaultColumns = function(type = 'tshirt') {
  const columnSets = {
    tshirt: [
      { name: 'Chest', key: 'chest', unit: 'inches', order: 0 },
      { name: 'Length', key: 'length', unit: 'inches', order: 1 },
      { name: 'Shoulder', key: 'shoulder', unit: 'inches', order: 2 },
      { name: 'Sleeve Length', key: 'sleeve_length', unit: 'inches', order: 3 }
    ],
    pants: [
      { name: 'Waist', key: 'waist', unit: 'inches', order: 0 },
      { name: 'Hip', key: 'hip', unit: 'inches', order: 1 },
      { name: 'Inseam', key: 'inseam', unit: 'inches', order: 2 },
      { name: 'Length', key: 'length', unit: 'inches', order: 3 }
    ],
    generic: [
      { name: 'Measurement 1', key: 'measurement_1', unit: 'inches', order: 0 },
      { name: 'Measurement 2', key: 'measurement_2', unit: 'inches', order: 1 }
    ]
  };
  
  return columnSets[type] || columnSets.generic;
};

module.exports = mongoose.model("SizeChartTemplate", sizeChartTemplateSchema);
