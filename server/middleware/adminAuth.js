const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Simple admin check middleware that doesn't require userId in params
exports.requireAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET);
    
    // Find user and check admin status
    const user = await User.findById(decoded._id).select('role email name');
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    if (user.role !== 1) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: "Invalid token" });
  }
};
