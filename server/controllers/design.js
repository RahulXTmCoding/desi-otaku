const Design = require("../models/design");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

// Get design by ID

exports.getDesignById = async (req, res, next, id) => {
  try {
    const design = await Design.findById(id).exec();
    if (!design) {
      return res.status(400).json({
        error: "Design not found",
      });
    }
    req.design = design;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Design not found",
    });
  }
};

// Create new design
exports.createDesign = async (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  
  form.parse(req, async (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem uploading image",
      });
    }

    try {
      // Destructure fields - handle formidable v3 format
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
      const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
      const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags;
      const price = Array.isArray(fields.price) ? fields.price[0] : fields.price;
      const imageUrl = Array.isArray(fields.imageUrl) ? fields.imageUrl[0] : fields.imageUrl;
      const placements = Array.isArray(fields.placements) ? fields.placements[0] : fields.placements;

      // Validation
      if (!name || !category) {
        return res.status(400).json({
          error: "Name and category are required",
        });
      }

      // Create design object
      const designData = {
        name,
        description,
        category,
        price: price ? parseFloat(price) : 0,
        imageUrl
      };

      let design = new Design(designData);

      // Handle tags
      if (tags) {
        design.tags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }

      // Handle placements
      if (placements) {
        design.placements = placements.split(',').map(p => p.trim());
      }

      // Handle file upload
      if (file.image) {
        const imageFile = Array.isArray(file.image) ? file.image[0] : file.image;
        
        if (imageFile.size > 3000000) {
          return res.status(400).json({
            error: "File size too large",
          });
        }
        
        design.image.data = fs.readFileSync(imageFile.filepath || imageFile.path);
        design.image.contentType = imageFile.mimetype || imageFile.type;
      }

      // Save to DB
      const savedDesign = await design.save();
      res.json(savedDesign);
    } catch (error) {
      console.error("Error creating design:", error);
      return res.status(400).json({
        error: "Failed to create design",
      });
    }
  });
};

// Get single design
exports.getDesign = (req, res) => {
  req.design.image = undefined; // Remove image data for faster response
  
  // Increment view count
  Design.findByIdAndUpdate(
    req.design._id,
    { $inc: { 'popularity.views': 1 } },
    { new: false }
  ).exec();

  return res.json(req.design);
};

// Get design image
exports.designImage = (req, res, next) => {
  if (req.design.image.data) {
    res.set("Content-Type", req.design.image.contentType);
    return res.send(req.design.image.data);
  }
  next();
};

// Update design
exports.updateDesign = async (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  
  form.parse(req, async (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "Problem uploading image",
      });
    }

    try {
      // Update design
      let design = req.design;
      
      // Handle formidable v3 format
      const fieldsToUpdate = {};
      for (const key in fields) {
        fieldsToUpdate[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      }
      
      design = _.extend(design, fieldsToUpdate);

      // Handle tags update
      const tags = fieldsToUpdate.tags;
      if (tags) {
        design.tags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }

      // Handle placements update
      const placements = fieldsToUpdate.placements;
      if (placements) {
        design.placements = placements.split(',').map(p => p.trim());
      }

      // Handle file upload
      if (file.image) {
        const imageFile = Array.isArray(file.image) ? file.image[0] : file.image;
        
        if (imageFile.size > 3000000) {
          return res.status(400).json({
            error: "File size too large",
          });
        }
        
        design.image.data = fs.readFileSync(imageFile.filepath || imageFile.path);
        design.image.contentType = imageFile.mimetype || imageFile.type;
      }

      // Save to DB
      const updatedDesign = await design.save();
      res.json(updatedDesign);
    } catch (error) {
      console.error("Error updating design:", error);
      return res.status(400).json({
        error: "Update failed",
      });
    }
  });
};

// Delete design
exports.deleteDesign = async (req, res) => {
  try {
    let design = req.design;
    // Use deleteOne instead of deprecated remove method
    await Design.deleteOne({ _id: design._id });
    
    res.json({
      message: "Design deleted successfully",
      deletedDesign: design,
    });
  } catch (err) {
    console.error("Error deleting design:", err);
    return res.status(400).json({
      error: "Failed to delete design",
    });
  }
};

// Get all designs
exports.getAllDesigns = async (req, res) => {
  try {
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 20;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    let order = req.query.order ? req.query.order : "desc";
    let category = req.query.category;
    let tag = req.query.tag;
    let featured = req.query.featured;
    let search = req.query.search;

    // Build query
    let query = {};
    
    if (category && category !== 'all') {
      // Convert string ID to ObjectId if it's a valid ObjectId string
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        // If not a valid ObjectId, treat as category name (for backward compatibility)
        query.category = category;
      }
    }
    
    if (tag) {
      query.tags = tag.toLowerCase();
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [search.toLowerCase()] } }
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [designs, totalCount] = await Promise.all([
      Design.find(query)
        .select("-image")
        .populate("category", "name")  // Populate category name
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Design.countDocuments(query)
    ]);
      
    res.json({
      designs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalDesigns: totalCount,
        hasMore: skip + designs.length < totalCount
      }
    });
  } catch (err) {
    console.error("Error fetching designs:", err);
    return res.status(400).json({
      error: "No designs found",
    });
  }
};

// Get popular designs
exports.getPopularDesigns = async (req, res) => {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const designs = await Design.find()
      .select("-image")
      .sort({ 'popularity.used': -1, 'popularity.likes': -1 })
      .limit(limit)
      .exec();
      
    res.json(designs);
  } catch (err) {
    console.error("Error fetching popular designs:", err);
    return res.status(400).json({
      error: "No designs found",
    });
  }
};

// Get featured designs
exports.getFeaturedDesigns = async (req, res) => {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    
    const designs = await Design.find({ isFeatured: true })
      .select("-image")
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
      
    res.json(designs);
  } catch (err) {
    console.error("Error fetching featured designs:", err);
    return res.status(400).json({
      error: "No designs found",
    });
  }
};

// Get designs by category
exports.getDesignsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    let limit = req.query.limit ? parseInt(req.query.limit) : 20;
    
    const designs = await Design.find({ category })
      .select("-image")
      .sort({ 'popularity.used': -1 })
      .limit(limit)
      .exec();
      
    res.json(designs);
  } catch (err) {
    console.error("Error fetching designs by category:", err);
    return res.status(400).json({
      error: "No designs found",
    });
  }
};

// Get designs by tag
exports.getDesignsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    let limit = req.query.limit ? parseInt(req.query.limit) : 20;
    
    const designs = await Design.find({ tags: tag.toLowerCase() })
      .select("-image")
      .sort({ 'popularity.used': -1 })
      .limit(limit)
      .exec();
      
    res.json(designs);
  } catch (err) {
    console.error("Error fetching designs by tag:", err);
    return res.status(400).json({
      error: "No designs found",
    });
  }
};

// Get all unique tags
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Design.distinct("tags", {});
    res.json(tags);
  } catch (err) {
    console.error("Error fetching tags:", err);
    return res.status(400).json({
      error: "No tags found",
    });
  }
};

// Like/unlike design
exports.toggleLikeDesign = async (req, res) => {
  try {
    const { like } = req.body;
    const inc = like ? 1 : -1;
    
    const design = await Design.findByIdAndUpdate(
      req.design._id,
      { $inc: { 'popularity.likes': inc } },
      { new: true }
    ).select('popularity.likes');
    
    res.json({ likes: design.popularity.likes });
  } catch (err) {
    return res.status(400).json({
      error: "Failed to update likes",
    });
  }
};

// Get random design - OPTIMIZED for Surprise Me feature
exports.getRandomDesign = async (req, res) => {
  try {
    // Use MongoDB's $sample aggregation for true randomization
    const randomDesigns = await Design.aggregate([
      { 
        $match: { 
          isActive: { $ne: false } // Only active designs (handles undefined as true)
        } 
      },
      { $sample: { size: 1 } }, // Get 1 random design efficiently
      // Don't exclude any fields for random design - we need complete data for preview
      // The slight performance hit is acceptable for a single random design
    ]);
    
    if (randomDesigns.length === 0) {
      return res.status(404).json({
        error: "No designs available"
      });
    }
    
    const randomDesign = randomDesigns[0];
    
    // Optionally increment view count for analytics
    Design.findByIdAndUpdate(
      randomDesign._id,
      { $inc: { 'popularity.views': 1 } },
      { new: false }
    ).exec().catch(err => console.log('View count update failed:', err));
    
    res.json(randomDesign);
  } catch (err) {
    console.error("Error getting random design:", err);
    return res.status(400).json({
      error: "Failed to get random design"
    });
  }
};

// Update design usage count (when ordered)
exports.updateDesignUsage = async (designId) => {
  try {
    await Design.findByIdAndUpdate(
      designId,
      { $inc: { 'popularity.used': 1 } }
    );
  } catch (err) {
    console.error("Failed to update design usage:", err);
  }
};
