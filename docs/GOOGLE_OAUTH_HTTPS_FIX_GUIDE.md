# Google OAuth HTTPS Fix Guide

## ✅ Issue Fixed: Production OAuth Callback URLs

**Problem**: Google OAuth was generating HTTP callback URLs instead of HTTPS in production, causing authentication failures.

**Solution Implemented**: Dynamic callback URL configuration based on environment.

## ✅ Code Changes Made

### 1. Environment Variables Updated (`server/.env`)
```bash
# Environment URLs (automatically detected)
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

# Production URLs (used when NODE_ENV=production)
PRODUCTION_CLIENT_URL=https://attars.club
PRODUCTION_BACKEND_URL=https://backend.attars.club
```

### 2. Passport.js Configuration (`server/config/passport.js`)
- ✅ Google Strategy: Dynamic callback URL based on `NODE_ENV`
- ✅ Facebook Strategy: Dynamic callback URL based on `NODE_ENV`
- ✅ Development: Uses `http://localhost:8000`
- ✅ Production: Uses `https://backend.attars.club`

### 3. Express Configuration (`server/app.js`)
- ✅ Trust proxy settings for HTTPS detection
- ✅ HTTPS redirection middleware for production
- ✅ Secure session configuration

## 🔧 Required: Google Console Configuration

**IMPORTANT**: You need to update your Google OAuth app configuration:

### Step 1: Access Google Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID for web application

### Step 2: Update Authorized Redirect URIs
Add these URLs to your **Authorized redirect URIs**:

```
✅ Production (REQUIRED):
https://backend.attars.club/api/auth/google/callback

✅ Development (Keep existing):
http://localhost:8000/api/auth/google/callback
```

### Step 3: Save Changes
- Click **Save** in Google Console
- Changes may take a few minutes to propagate

## 🚀 Deployment Requirements

### For Production Deployment:
1. **Set Environment Variable**:
   ```bash
   NODE_ENV=production
   ```

2. **Verify HTTPS is working**:
   - Ensure your load balancer/reverse proxy is configured for HTTPS
   - SSL certificate should be properly installed
   - Test: `https://backend.attars.club/health` should work

## 🧪 Testing

### Production OAuth Flow:
1. Deploy with `NODE_ENV=production`
2. Visit: `https://attars.club`
3. Click "Sign in with Google"
4. Should redirect to: `https://backend.attars.club/api/auth/google/callback`
5. Verify successful authentication

### Development OAuth Flow:
1. Run locally with `NODE_ENV=Dev` (or undefined)
2. Visit: `http://localhost:5173`
3. Click "Sign in with Google"
4. Should redirect to: `http://localhost:8000/api/auth/google/callback`

## 🔍 Debugging

### Check Current Callback URL:
```javascript
// In passport.js, the callback URL will be:
console.log('OAuth Callback URL:', 
  process.env.NODE_ENV === 'production' 
    ? `${process.env.PRODUCTION_BACKEND_URL}/api/auth/google/callback`
    : `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/google/callback`
);
```

### Common Issues:
1. **Still getting HTTP**: Check `NODE_ENV=production` is set
2. **404 on callback**: Verify Google Console URLs match exactly
3. **SSL errors**: Ensure HTTPS is properly configured on your server

## ✅ Security Features Added

1. **HTTPS Enforcement**: Automatic redirect from HTTP to HTTPS in production
2. **Secure Sessions**: Session cookies marked as secure in production
3. **Proxy Trust**: Proper proxy configuration for load balancers
4. **Environment Separation**: Clear separation between dev and prod URLs

## 📋 Next Steps

1. **Update Google Console** (Required immediately)
2. **Deploy with NODE_ENV=production**
3. **Test OAuth flow in production**
4. **Verify HTTPS callbacks are working**

Your Google OAuth HTTPS issue should now be completely resolved! 🎉
