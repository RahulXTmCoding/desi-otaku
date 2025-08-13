const Product = require("../models/product");
const Category = require("../models/category");
const ProductType = require("../models/productType");

// Get all products with admin-specific filtering and pagination
exports.getAdminProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      stockStatus, // 'in-stock', 'low-stock', 'out-of-stock', 'all'
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = req.query;

    // Check if user is admin
    if (!req.user || req.user.role !== 1) {
      return res.status(403).json({
        error: "Access denied. Admin only."
      });
    }

    // Build base query
    let query = {};
    
    // Include/exclude deleted products
    if (includeDeleted === 'true') {
      // Include both active and deleted
    } else {
      query.isDeleted = { $ne: true };
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Product type filter
    if (req.query.productType && req.query.productType !== 'all') {
      query.productType = req.query.productType;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Stock filters
    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'out-of-stock':
          query.stock = 0;
          break;
        case 'low-stock':
          query.stock = { $gt: 0, $lte: 10 };
          break;
        case 'in-stock':
          query.stock = { $gt: 10 };
          break;
      }
    } else if (minStock !== undefined || maxStock !== undefined) {
      query.stock = {};
      if (minStock !== undefined) query.stock.$gte = parseInt(minStock);
      if (maxStock !== undefined) query.stock.$lte = parseInt(maxStock);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('productType', 'name displayName')
        .select('-photo -images.data') // Exclude binary data
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(), // Use lean for better performance
      Product.countDocuments(query)
    ]);

    // Add additional computed fields
    const enrichedProducts = products.map(product => {
      // Calculate stock status
      let stockStatus = 'in-stock';
      if (product.stock === 0) {
        stockStatus = 'out-of-stock';
      } else if (product.stock <= 10) {
        stockStatus = 'low-stock';
      }

      // Clean up images
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          order: img.order,
          caption: img.caption
        }));
      }

      return {
        ...product,
        stockStatus,
        isLowStock: product.stock <= 10 && product.stock > 0,
        isOutOfStock: product.stock === 0,
        totalValue: product.price * product.stock // For inventory value calculation
      };
    });

    // Calculate summary statistics
    const stats = {
      totalProducts: totalCount,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      avgPrice: 0
    };

    enrichedProducts.forEach(product => {
      if (product.stockStatus === 'in-stock') stats.inStock++;
      else if (product.stockStatus === 'low-stock') stats.lowStock++;
      else if (product.stockStatus === 'out-of-stock') stats.outOfStock++;
      
      stats.totalValue += product.totalValue;
    });

    if (totalCount > 0) {
      stats.avgPrice = enrichedProducts.reduce((sum, p) => sum + p.price, 0) / totalCount;
    }

    res.json({
      products: enrichedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalProducts: totalCount,
        hasMore: skip + products.length < totalCount,
        itemsPerPage: parseInt(limit)
      },
      stats,
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        stockStatus,
        sortBy,
        sortOrder
      }
    });

  } catch (err) {
    console.error('Admin products error:', err);
    return res.status(500).json({
      error: "Failed to fetch products",
      details: err.message
    });
  }
};

// Get product stats for dashboard
exports.getProductStats = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 1) {
      return res.status(403).json({
        error: "Access denied. Admin only."
      });
    }

    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: {
              $cond: [{ $ne: ['$isDeleted', true] }, 1, 0]
            }
          },
          totalStock: { $sum: '$stock' },
          totalValue: {
            $sum: { $multiply: ['$price', '$stock'] }
          },
          avgPrice: { $avg: '$price' },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          },
          lowStock: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      totalStock: 0,
      totalValue: 0,
      avgPrice: 0,
      outOfStock: 0,
      lowStock: 0
    };

    // Get category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: { $arrayElemAt: ['$categoryInfo.name', 0] } },
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overview: result,
      categoryBreakdown: categoryBreakdown.map(cat => ({
        _id: cat._id,
        name: cat.categoryName || 'Uncategorized',
        count: cat.count,
        totalStock: cat.totalStock,
        totalValue: cat.totalValue
      }))
    });

  } catch (err) {
    console.error('Product stats error:', err);
    return res.status(500).json({
      error: "Failed to fetch product statistics",
      details: err.message
    });
  }
};

// Bulk update products
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    // Check if user is admin
    if (!req.user || req.user.role !== 1) {
      return res.status(403).json({
        error: "Access denied. Admin only."
      });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        error: "Product IDs array is required"
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "Updates object is required"
      });
    }

    // Validate allowed update fields
    const allowedFields = ['isActive', 'category', 'productType', 'tags', 'price', 'stock'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `Invalid update fields: ${invalidFields.join(', ')}`
      });
    }

    // Perform bulk update
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      updated: result.modifiedCount,
      matched: result.matchedCount,
      message: `Successfully updated ${result.modifiedCount} products`
    });

  } catch (err) {
    console.error('Bulk update error:', err);
    return res.status(500).json({
      error: "Failed to update products",
      details: err.message
    });
  }
};

// Export products to CSV
exports.exportProducts = async (req, res) => {
  try {
    const { includeDeleted = false } = req.query;

    // Check if user is admin
    if (!req.user || req.user.role !== 1) {
      return res.status(403).json({
        error: "Access denied. Admin only."
      });
    }

    const query = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('productType', 'name displayName')
      .select('-photo -images')
      .sort({ createdAt: -1 });

    // Create CSV content
    const csvData = [
      ['ID', 'Name', 'Description', 'Category', 'Product Type', 'Price', 'Stock', 'Sold', 'Status', 'Created Date']
    ];

    products.forEach(product => {
      csvData.push([
        product._id.toString(),
        product.name,
        product.description || '',
        product.category?.name || 'Uncategorized',
        product.productType?.displayName || product.productType?.name || 'Unknown',
        product.price,
        product.stock,
        product.sold || 0,
        product.isDeleted ? 'Deleted' : (product.isActive !== false ? 'Active' : 'Inactive'),
        new Date(product.createdAt).toLocaleDateString()
      ]);
    });

    const csvContent = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=products-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({
      error: "Failed to export products",
      details: err.message
    });
  }
};
