const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
const { 
  getAdminProducts, 
  getProductStats, 
  bulkUpdateProducts, 
  exportProducts 
} = require("../controllers/productAdmin");

// Admin product management routes
router.get("/admin/products", requireAdmin, getAdminProducts);
router.get("/admin/products/stats", requireAdmin, getProductStats);
router.put("/admin/products/bulk", requireAdmin, bulkUpdateProducts);
router.get("/admin/products/export", requireAdmin, exportProducts);

module.exports = router;
