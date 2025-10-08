const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { signOut, signup, signin, isSignedIn } = require("../controllers/auth");
const passport = require("passport");
const jwt = require('jsonwebtoken');

router.post(
  "/signup",
  [
    check("name", "Name should be at least 3 char").isLength({ min: 3 }),
    check("email", "Email is required").isEmail(),
    check("password", "Password should be at least 7 char").isLength({
      min: 7,
    }),
  ],
  signup
);

router.post(
  "/signin",
  [
    check("email", "Email is required").isEmail(),
    check("password", "Password is required").isLength({
      min: 7,
    }),
  ],
  signin
);
router.get("/signout", signOut);
// Google Auth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// ✅ FIXED: Google OAuth callback with proper GET method and Passport flow
router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` 
  }),
  (req, res) => {
    try {
      // Generate JWT token with 2-week expiry (consistent with regular signin)
      const expiresIn = '14d'; // 2 weeks
      const token = jwt.sign(
        { 
          _id: req.user._id,
          email: req.user.email,
          role: req.user.role || 0
        }, 
        process.env.SECRET, 
        { expiresIn }
      );
      
      // Calculate expiry timestamp for frontend (2 weeks in milliseconds)
      const expiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000);
      
      // Redirect to frontend with token and expiry time
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const userData = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role || 0
      };
      
      res.redirect(`${clientUrl}/auth-success?token=${token}&expiryTime=${expiryTime}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

// Keep the POST route for client-side OAuth (alternative method)
router.post('/auth/google/callback', (req, res) => {
    const { token } = req.body;
    // Here you would typically verify the token with Google, but for now we'll just decode it
    const decoded = jwt.decode(token);
    
    // Create JWT token with 2-week expiry (consistent with regular signin)
    const expiresIn = '14d'; // 2 weeks
    const appToken = jwt.sign({ _id: decoded.sub }, process.env.SECRET, { expiresIn });
    
    // Calculate expiry timestamp for frontend (2 weeks in milliseconds)
    const expiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000);
    
    // Find or create user
    // Then create a new JWT for your app
    res.json({ 
        token: appToken, 
        expiryTime, // Include expiry timestamp for frontend
        user: { _id: decoded.sub, name: decoded.name, email: decoded.email, role: 0 } 
    });
});

// Facebook Auth Routes
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.post('/auth/facebook/callback', (req, res) => {
    const { accessToken, userID } = req.body;
    
    // Create JWT token with 2-week expiry (consistent with regular signin)
    const expiresIn = '14d'; // 2 weeks
    const appToken = jwt.sign({ _id: userID }, process.env.SECRET, { expiresIn });
    
    // Calculate expiry timestamp for frontend (2 weeks in milliseconds)
    const expiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000);
    
    // Here you would typically verify the token with Facebook
    // Find or create user
    // Then create a new JWT for your app
    res.json({ 
        token: appToken, 
        expiryTime, // Include expiry timestamp for frontend
        user: { _id: userID, name: req.body.name, email: req.body.email, role: 0 } 
    });
});

module.exports = router;
