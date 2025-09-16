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
    const googleEmail = profile.emails[0].value;
    
    // 1. Check if user already has Google account linked
    const existingGoogleUser = await User.findOne({ googleId: profile.id });
    if (existingGoogleUser) {
      return done(null, existingGoogleUser);
    }
    
    // 2. Check if there's an existing account with this email (guest or regular account)
    const existingEmailUser = await User.findOne({ email: googleEmail });
    if (existingEmailUser) {
      // Link Google account to existing user (convert guest to Google user)
      existingEmailUser.googleId = profile.id;
      existingEmailUser.oauthProvider = 'google';
      existingEmailUser.oauthId = profile.id;
      
      // Update name if the existing account doesn't have a full name
      if (!existingEmailUser.name || existingEmailUser.name.length < 3) {
        existingEmailUser.name = profile.displayName;
      }
      
      // Mark as no longer auto-created since user is now actively using the account
      if (existingEmailUser.autoCreated) {
        existingEmailUser.autoCreated = false;
      }
      
      await existingEmailUser.save();
      
      console.log(`✅ Linked Google account to existing user: ${googleEmail} (was guest: ${existingEmailUser.autoCreated})`);
      return done(null, existingEmailUser);
    }
    
    // 3. Create new user if no existing account found
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: googleEmail,
      oauthProvider: 'google',
      oauthId: profile.id,
      autoCreated: false
    });
    await newUser.save();
    
    console.log(`✅ Created new Google user: ${googleEmail}`);
    done(null, newUser);
  } catch (error) {
    console.error('Google OAuth error:', error);
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
    const facebookEmail = profile.emails[0].value;
    
    // 1. Check if user already has Facebook account linked
    const existingFacebookUser = await User.findOne({ facebookId: profile.id });
    if (existingFacebookUser) {
      return done(null, existingFacebookUser);
    }
    
    // 2. Check if there's an existing account with this email (guest or regular account)
    const existingEmailUser = await User.findOne({ email: facebookEmail });
    if (existingEmailUser) {
      // Link Facebook account to existing user (convert guest to Facebook user)
      existingEmailUser.facebookId = profile.id;
      existingEmailUser.oauthProvider = 'facebook';
      existingEmailUser.oauthId = profile.id;
      
      // Update name if the existing account doesn't have a full name
      if (!existingEmailUser.name || existingEmailUser.name.length < 3) {
        existingEmailUser.name = profile.displayName;
      }
      
      // Mark as no longer auto-created since user is now actively using the account
      if (existingEmailUser.autoCreated) {
        existingEmailUser.autoCreated = false;
      }
      
      await existingEmailUser.save();
      
      console.log(`✅ Linked Facebook account to existing user: ${facebookEmail} (was guest: ${existingEmailUser.autoCreated})`);
      return done(null, existingEmailUser);
    }
    
    // 3. Create new user if no existing account found
    const newUser = new User({
      facebookId: profile.id,
      name: profile.displayName,
      email: facebookEmail,
      oauthProvider: 'facebook',
      oauthId: profile.id,
      autoCreated: false
    });
    await newUser.save();
    
    console.log(`✅ Created new Facebook user: ${facebookEmail}`);
    done(null, newUser);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    done(error, false);
  }
}));
