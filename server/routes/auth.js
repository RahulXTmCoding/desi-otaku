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
router.get("/testroute", isSignedIn, (req, res) => {
  return res.json(req.auth);
});

// Google Auth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// ✅ FIXED: Google OAuth callback with proper GET method and Passport flow
router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` 
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { 
          _id: req.user._id,
          email: req.user.email,
          role: req.user.role || 0
        }, 
        process.env.SECRET, 
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role || 0
      }))}`);
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
    // Find or create user
    // Then create a new JWT for your app
    const appToken = jwt.sign({ _id: decoded.sub }, process.env.SECRET, { expiresIn: '1h' });
    res.json({ token: appToken, user: { _id: decoded.sub, name: decoded.name, email: decoded.email, role: 0 } });
});

// Facebook Auth Routes
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.post('/auth/facebook/callback', (req, res) => {
    const { accessToken, userID } = req.body;
    // Here you would typically verify the token with Facebook
    // Find or create user
    // Then create a new JWT for your app
    const appToken = jwt.sign({ _id: userID }, process.env.SECRET, { expiresIn: '1h' });
    res.json({ token: appToken, user: { _id: userID, name: req.body.name, email: req.body.email, role: 0 } });
});

module.exports = router;
