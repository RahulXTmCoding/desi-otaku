const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? `${process.env.PRODUCTION_BACKEND_URL}/api/auth/google/callback`
    : `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      // You might want to handle profile picture as well
      // photo: profile.photos[0].value
    });
    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, false);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? `${process.env.PRODUCTION_BACKEND_URL}/api/auth/facebook/callback`
    : `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'photos', 'email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ facebookId: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const newUser = new User({
      facebookId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      // photo: profile.photos[0].value
    });
    await newUser.save();
    done(null, newUser);
  } catch (error) {
    done(error, false);
  }
}));
