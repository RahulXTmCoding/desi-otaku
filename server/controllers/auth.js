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
    return res.status(400).json({
      err: "Not able to store it in DB",
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
    
    //create token
    const token = jwt.sign({ _id: user._id }, process.env.SECRET);

    //Put token into cookie
    res.cookie("token", token, { expire: new Date() + 999 });

    //Send respond to frontend
    const { _id, name, role } = user;

    return res.json({ token, user: { _id, name, email: user.email, role } });
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
