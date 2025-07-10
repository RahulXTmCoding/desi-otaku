const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
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
  callbackURL: '/api/auth/facebook/callback',
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
