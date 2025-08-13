const express = require("express");
const router = express.Router();
const {
  getDesignById,
  createDesign,
  getDesign,
  designImage,
  deleteDesign,
  updateDesign,
  getAllDesigns,
  getPopularDesigns,
  getFeaturedDesigns,
  getDesignsByCategory,
  getDesignsByTag,
  getAllTags,
  toggleLikeDesign,
  getRandomDesign
} = require("../controllers/design");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

// Params
router.param("userId", getUserById);
router.param("designId", getDesignById);

// Create routes
router.post(
  "/design/create/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createDesign
);

// Read routes
router.get("/design/:designId", getDesign);
router.get("/design/image/:designId", designImage);

// Update route
router.put(
  "/design/:designId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateDesign
);

// Delete route
router.delete(
  "/design/:designId/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteDesign
);

// Listing routes
router.get("/designs", getAllDesigns);
router.get("/designs/popular", getPopularDesigns);
router.get("/designs/featured", getFeaturedDesigns);
router.get("/designs/random", getRandomDesign); // OPTIMIZED: Single random design
router.get("/designs/category/:category", getDesignsByCategory);
router.get("/designs/tag/:tag", getDesignsByTag);
router.get("/designs/tags", getAllTags);

// Like/unlike design
router.put("/design/:designId/like", toggleLikeDesign);

module.exports = router;
