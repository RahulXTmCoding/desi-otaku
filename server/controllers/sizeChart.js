const SizeChartTemplate = require("../models/sizeChartTemplate");

// Get all size chart templates
exports.getAllSizeCharts = async (req, res) => {
  try {
    const { gender, active } = req.query;
    const query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }
    
    if (gender && gender !== 'all') {
      query.$or = [{ gender: gender }, { gender: 'unisex' }];
    }
    
    const sizeCharts = await SizeChartTemplate.find(query).sort('order name');
    res.json(sizeCharts);
  } catch (error) {
    console.error("Error fetching size charts:", error);
    res.status(500).json({ error: "Failed to fetch size charts" });
  }
};

// Get single size chart by ID
exports.getSizeChartById = async (req, res) => {
  try {
    const sizeChart = await SizeChartTemplate.findById(req.params.id);
    if (!sizeChart) {
      return res.status(404).json({ error: "Size chart not found" });
    }
    res.json(sizeChart);
  } catch (error) {
    console.error("Error fetching size chart:", error);
    res.status(500).json({ error: "Failed to fetch size chart" });
  }
};

// Get size chart by slug
exports.getSizeChartBySlug = async (req, res) => {
  try {
    const sizeChart = await SizeChartTemplate.findOne({ slug: req.params.slug });
    if (!sizeChart) {
      return res.status(404).json({ error: "Size chart not found" });
    }
    res.json(sizeChart);
  } catch (error) {
    console.error("Error fetching size chart:", error);
    res.status(500).json({ error: "Failed to fetch size chart" });
  }
};

// Create new size chart template (Admin only)
exports.createSizeChart = async (req, res) => {
  try {
    const {
      name,
      displayTitle,
      description,
      gender,
      headers,
      measurements,
      measurementGuide,
      note,
      order
    } = req.body;

    // Validate required fields
    if (!name || !displayTitle) {
      return res.status(400).json({ error: "Name and display title are required" });
    }

    // Check if name already exists
    const existingChart = await SizeChartTemplate.findOne({ name });
    if (existingChart) {
      return res.status(400).json({ error: "Size chart with this name already exists" });
    }

    const sizeChart = new SizeChartTemplate({
      name,
      displayTitle,
      description,
      gender: gender || 'unisex',
      headers: headers || [],
      measurements: measurements || [],
      measurementGuide: measurementGuide || [],
      note,
      order: order || 0
    });

    await sizeChart.save();
    res.status(201).json(sizeChart);
  } catch (error) {
    console.error("Error creating size chart:", error);
    res.status(500).json({ error: "Failed to create size chart" });
  }
};

// Update size chart template (Admin only)
exports.updateSizeChart = async (req, res) => {
  try {
    const {
      name,
      displayTitle,
      description,
      gender,
      headers,
      measurements,
      measurementGuide,
      note,
      isActive,
      order
    } = req.body;

    const sizeChart = await SizeChartTemplate.findById(req.params.id);
    if (!sizeChart) {
      return res.status(404).json({ error: "Size chart not found" });
    }

    // Check if new name conflicts with existing
    if (name && name !== sizeChart.name) {
      const existingChart = await SizeChartTemplate.findOne({ name });
      if (existingChart) {
        return res.status(400).json({ error: "Size chart with this name already exists" });
      }
      sizeChart.name = name;
      // Reset slug to regenerate
      sizeChart.slug = undefined;
    }

    if (displayTitle !== undefined) sizeChart.displayTitle = displayTitle;
    if (description !== undefined) sizeChart.description = description;
    if (gender !== undefined) sizeChart.gender = gender;
    if (headers !== undefined) sizeChart.headers = headers;
    if (measurements !== undefined) sizeChart.measurements = measurements;
    if (measurementGuide !== undefined) sizeChart.measurementGuide = measurementGuide;
    if (note !== undefined) sizeChart.note = note;
    if (isActive !== undefined) sizeChart.isActive = isActive;
    if (order !== undefined) sizeChart.order = order;

    await sizeChart.save();
    res.json(sizeChart);
  } catch (error) {
    console.error("Error updating size chart:", error);
    res.status(500).json({ error: "Failed to update size chart" });
  }
};

// Delete size chart template (Admin only)
exports.deleteSizeChart = async (req, res) => {
  try {
    const sizeChart = await SizeChartTemplate.findById(req.params.id);
    if (!sizeChart) {
      return res.status(404).json({ error: "Size chart not found" });
    }

    await SizeChartTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: "Size chart deleted successfully" });
  } catch (error) {
    console.error("Error deleting size chart:", error);
    res.status(500).json({ error: "Failed to delete size chart" });
  }
};

// Toggle size chart active status (Admin only)
exports.toggleSizeChartStatus = async (req, res) => {
  try {
    const sizeChart = await SizeChartTemplate.findById(req.params.id);
    if (!sizeChart) {
      return res.status(404).json({ error: "Size chart not found" });
    }

    sizeChart.isActive = !sizeChart.isActive;
    await sizeChart.save();
    
    res.json({ 
      message: `Size chart ${sizeChart.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: sizeChart.isActive 
    });
  } catch (error) {
    console.error("Error toggling size chart status:", error);
    res.status(500).json({ error: "Failed to toggle size chart status" });
  }
};

// Get active size charts for dropdown (public)
exports.getSizeChartsForDropdown = async (req, res) => {
  try {
    const { gender } = req.query;
    const query = { isActive: true };
    
    if (gender && gender !== 'all') {
      query.$or = [{ gender: gender }, { gender: 'unisex' }];
    }
    
    const sizeCharts = await SizeChartTemplate.find(query)
      .select('_id name displayTitle gender')
      .sort('order name');
      
    res.json(sizeCharts);
  } catch (error) {
    console.error("Error fetching size charts for dropdown:", error);
    res.status(500).json({ error: "Failed to fetch size charts" });
  }
};
