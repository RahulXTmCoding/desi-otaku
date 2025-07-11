const Product = require('../models/product');

// Get similar products based on various criteria
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;
    
    // Get the current product details
    const currentProduct = await Product.findById(productId)
      .populate('category')
      .populate('productType')
      .lean();
    
    if (!currentProduct) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }
    
    // Calculate similarity scores for products using aggregation pipeline
    const pipeline = [
      {
        $match: {
          _id: { $ne: currentProduct._id },
          isActive: true,
          deleted: false,
          stock: { $gt: 0 } // Only show in-stock products
        }
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              // Same category: 50 points
              {
                $cond: {
                  if: { $eq: ['$category', currentProduct.category._id] },
                  then: 50,
                  else: 0
                }
              },
              // Same product type: 30 points
              {
                $cond: {
                  if: {
                    $eq: [
                      '$productType',
                      currentProduct.productType ? currentProduct.productType._id : null
                    ]
                  },
                  then: 30,
                  else: 0
                }
              },
              // Similar price range (within 20%): 20 points
              {
                $cond: {
                  if: {
                    $and: [
                      { $gte: ['$price', currentProduct.price * 0.8] },
                      { $lte: ['$price', currentProduct.price * 1.2] }
                    ]
                  },
                  then: 20,
                  else: 0
                }
              },
              // Matching tags: 10 points per tag (max 30)
              {
                $min: [
                  {
                    $multiply: [
                      {
                        $size: {
                          $ifNull: [
                            {
                              $setIntersection: [
                                { $ifNull: ['$tags', []] },
                                { $ifNull: [currentProduct.tags, []] }
                              ]
                            },
                            []
                          ]
                        }
                      },
                      10
                    ]
                  },
                  30
                ]
              },
              // Name similarity (contains similar words): up to 20 points
              {
                $let: {
                  vars: {
                    currentWords: {
                      $split: [{ $toLower: currentProduct.name }, ' ']
                    },
                    productWords: {
                      $split: [{ $toLower: '$name' }, ' ']
                    }
                  },
                  in: {
                    $min: [
                      {
                        $multiply: [
                          {
                            $size: {
                              $setIntersection: ['$$currentWords', '$$productWords']
                            }
                          },
                          5
                        ]
                      },
                      20
                    ]
                  }
                }
              }
            ]
          }
        }
      },
      // Sort by similarity score (descending) and then by popularity (sold count)
      {
        $sort: {
          similarityScore: -1,
          sold: -1,
          createdAt: -1
        }
      },
      // Limit results
      { $limit: limit },
      // Populate category and productType
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'producttypes',
          localField: 'productType',
          foreignField: '_id',
          as: 'productType'
        }
      },
      {
        $unwind: {
          path: '$productType',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project only necessary fields for performance
      {
        $project: {
          name: 1,
          price: 1,
          description: 1,
          category: 1,
          productType: 1,
          stock: 1,
          sold: 1,
          tags: 1,
          sizeStock: 1,
          sizeAvailability: 1,
          similarityScore: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];
    
    const similarProducts = await Product.aggregate(pipeline);
    
    // If we don't have enough similar products, get random products
    if (similarProducts.length < limit) {
      const remainingCount = limit - similarProducts.length;
      const existingIds = [
        currentProduct._id,
        ...similarProducts.map(p => p._id)
      ];
      
      const randomProducts = await Product.find({
        _id: { $nin: existingIds },
        isActive: true,
        deleted: false,
        stock: { $gt: 0 }
      })
        .populate('category')
        .populate('productType')
        .sort('-sold')
        .limit(remainingCount)
        .lean();
      
      similarProducts.push(...randomProducts);
    }
    
    res.json({
      products: similarProducts,
      total: similarProducts.length
    });
    
  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      error: 'Failed to fetch similar products'
    });
  }
};
