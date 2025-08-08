const Product = require('../models/product');
const redisService = require('../services/redisService');

// Get similar products using optimized staged approach with Redis caching
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;
    
    // Generate cache key for this request
    const cacheKey = `similar:${productId}:${limit}`;
    
    // Try to get from Redis cache first
    let cachedData = null;
    if (redisService.isAvailable()) {
      try {
        cachedData = await redisService.get(cacheKey);
        if (cachedData) {
          console.log(`✅ Cache HIT for similar products: ${productId}`);
          return res.json({
            ...cachedData,
            cached: true,
            cacheHit: true
          });
        }
      } catch (cacheError) {
        console.log('⚠️ Cache read error, falling back to database:', cacheError.message);
      }
    }
    
    console.log(`💾 Cache MISS for similar products: ${productId}, querying database...`);
    
    // Get current product with only needed fields
    const currentProduct = await Product.findById(productId)
      .select('category productType price tags')
      .lean();
    
    if (!currentProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    let similarProducts = [];
    const usedIds = [currentProduct._id];
    
    // Common query conditions
    const baseQuery = {
      _id: { $nin: usedIds },
      isActive: true,
      isDeleted: false,
      totalStock: { $gt: 0 }
    };

    // Common projection for performance
    const projection = {
      name: 1,
      price: 1,
      description: 1,
      category: 1,
      productType: 1,
      totalStock: 1,
      sold: 1,
      tags: 1,
      sizeStock: 1,
      createdAt: 1
    };

    // Stage 1: Same category products (highest priority)
    if (currentProduct.category && similarProducts.length < limit) {
      const sameCategoryProducts = await Product.find({
        ...baseQuery,
        category: currentProduct.category
      })
      .select(projection)
      .populate('category', 'name')
      .populate('productType', 'name')
      .sort({
        // Prioritize same product type
        productType: currentProduct.productType ? -1 : 1,
        sold: -1,
        createdAt: -1
      })
      .limit(limit)
      .lean();

      // Add with high similarity scores
      sameCategoryProducts.forEach(product => {
        let score = 50; // Base score for same category
        
        // Bonus for same product type
        if (product.productType && currentProduct.productType && 
            product.productType._id.toString() === currentProduct.productType.toString()) {
          score += 30;
        }
        
        // Bonus for similar price (within 25%)
        if (Math.abs(product.price - currentProduct.price) <= currentProduct.price * 0.25) {
          score += 20;
        }
        
        // Bonus for matching tags (simplified)
        if (product.tags && currentProduct.tags) {
          const matchingTags = product.tags.filter(tag => 
            currentProduct.tags.includes(tag)
          ).length;
          score += Math.min(matchingTags * 5, 15);
        }

        product.similarityScore = score;
        similarProducts.push(product);
        usedIds.push(product._id);
      });
    }

    // Stage 2: Same product type from other categories (if needed)
    if (currentProduct.productType && similarProducts.length < limit) {
      const sameTypeProducts = await Product.find({
        ...baseQuery,
        _id: { $nin: usedIds },
        productType: currentProduct.productType,
        category: { $ne: currentProduct.category }
      })
      .select(projection)
      .populate('category', 'name')
      .populate('productType', 'name')
      .sort({ sold: -1, createdAt: -1 })
      .limit(limit - similarProducts.length)
      .lean();

      // Add with medium similarity scores
      sameTypeProducts.forEach(product => {
        let score = 30; // Base score for same product type
        
        // Bonus for similar price
        if (Math.abs(product.price - currentProduct.price) <= currentProduct.price * 0.3) {
          score += 15;
        }

        product.similarityScore = score;
        similarProducts.push(product);
        usedIds.push(product._id);
      });
    }

    // Stage 3: Popular products from any category (final fallback)
    if (similarProducts.length < limit) {
      const popularProducts = await Product.find({
        ...baseQuery,
        _id: { $nin: usedIds }
      })
      .select(projection)
      .populate('category', 'name')
      .populate('productType', 'name')
      .sort({ sold: -1, createdAt: -1 })
      .limit(limit - similarProducts.length)
      .lean();

      // Add with low similarity scores
      popularProducts.forEach(product => {
        product.similarityScore = 10; // Base score for popular products
        similarProducts.push(product);
      });
    }

    // Sort by similarity score and limit results
    similarProducts.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
    similarProducts = similarProducts.slice(0, limit);
    
    // Prepare response data
    const responseData = {
      products: similarProducts,
      total: similarProducts.length,
      cached: false,
      cacheHit: false
    };
    
    // Cache the results for future requests (1 hour TTL)
    if (redisService.isAvailable() && similarProducts.length > 0) {
      try {
        const cacheSuccess = await redisService.set(cacheKey, responseData, 3600); // 1 hour TTL
        if (cacheSuccess) {
          console.log(`💾 Cached similar products for: ${productId}`);
        }
      } catch (cacheError) {
        console.log('⚠️ Cache write error:', cacheError.message);
      }
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      error: 'Failed to fetch similar products'
    });
  }
};
