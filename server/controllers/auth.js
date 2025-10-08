const User = require("../models/user");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
//const expressJwt = require("express-jwt");
const { expressjwt: expressJwt } = require("express-jwt");
const emailService = require("../services/emailService");

exports.signup = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }
  
  const user = new User(req.body);
  
  try {
    const savedUser = await user.save();
    
    // Send welcome email (don't wait for it)
    emailService.sendWelcomeEmail(savedUser).catch(err => {
      console.error("Failed to send welcome email:", err);
    });

    res.json({
      name: savedUser.name,
      email: savedUser.email,
      id: savedUser._id,
    });
  } catch (err) {
    console.error("Signup error:", err);
    
    // ✅ IMPROVED: Provide specific error messages
    if (err.code === 11000) {
      // Duplicate key error (email already exists)
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        error: `${field === 'email' ? 'Email' : field} already exists. Please use a different ${field}.`,
        code: 'DUPLICATE_EMAIL'
      });
    }
    
    if (err.name === 'ValidationError') {
      // Mongoose validation error
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        error: validationErrors[0],
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        error: "Invalid data format provided",
        code: 'CAST_ERROR'
      });
    }
    
    // Generic fallback with more details for debugging
    return res.status(400).json({
      error: "Unable to create user account. Please try again.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: 'DATABASE_ERROR'
    });
  }
};

exports.signin = async (req, res) => {
  //Destructuring
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        error: "USER email does not exists",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "Email and password does not match",
      });
    }
    
    //create token with 2 week expiry
    const expiresIn = '14d'; // 2 weeks
    const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn });

    // Calculate expiry timestamp for frontend (2 weeks in milliseconds)
    const expiryTime = Date.now() + (14 * 24 * 60 * 60 * 1000);

    //Put token into cookie
    res.cookie("token", token, { expire: new Date() + 999 });

    //Send respond to frontend
    const { _id, name, role } = user;

    return res.json({ 
      token, 
      expiryTime, // Include expiry timestamp for frontend
      user: { _id, name, email: user.email, role } 
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({
      error: "An error occurred during signin",
    });
  }
};

exports.signOut = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "User signOut Successfully",
  });
};

//Protected routes
exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
});

//Custom middlewares

exports.isAuthenticated = (req, res, next) => {
  let checker = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!checker) {
    return res.status(403).json({
      error: "Access Denied!!",
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "You are not Admin, Access Denied!!",
    });
  }
  next();
};
