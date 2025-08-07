# Vercel Deployment Guide

## Environment Variable Setup

The deployment error `Environment Variable "VITE_API_URL" references Secret "vite_api_url", which does not exist` has been fixed by removing the problematic configuration from `vercel.json`.

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to your Vercel project dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Navigate to your project

2. **Access Environment Variables**
   - Go to **Settings** tab
   - Click **Environment Variables** in the sidebar

3. **Add the API URL variable**
   ```
   Name: VITE_API_URL
   Value: https://your-backend-domain.com/api
   Environment: Production (or All)
   ```

4. **Save and redeploy**
   - Click **Save**
   - Trigger a new deployment

### Method 2: Vercel CLI

```bash
# Set environment variable via CLI
vercel env add VITE_API_URL production
# Enter your production API URL when prompted: https://your-backend-domain.com/api

# List current environment variables
vercel env ls

# Redeploy with new environment variables
vercel --prod
```

## Updated File Structure

The deployment configuration has been simplified:

```json
// client/vercel.json (updated)
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist", 
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Removed problematic section:**
```json
// This was causing the error - now removed
"env": {
  "VITE_API_URL": "@vite_api_url"
}
```

## Environment Variable Values

### For Production Deployment
```bash
VITE_API_URL=https://your-production-api.com/api
```

### For Preview/Staging
```bash
VITE_API_URL=https://staging-api.your-domain.com/api
```

### For Development (local only)
```bash
# client/.env.local
VITE_API_URL=http://localhost:8000/api
```

## Deployment Steps

1. **Remove old environment variables** (if any exist in Vercel dashboard)
2. **Add the new `VITE_API_URL` variable** with your backend URL
3. **Deploy again** - the error should be gone
4. **Verify** the deployment works correctly

## Troubleshooting

### If you still get environment variable errors:

1. **Clear Vercel cache:**
   ```bash
   vercel --prod --force
   ```

2. **Check environment variable name** is exactly: `VITE_API_URL`

3. **Verify the URL format** includes `/api` at the end

4. **Check deployment logs** in Vercel dashboard for other errors

### Common Backend URLs:
- Railway: `https://your-app.railway.app/api`
- Heroku: `https://your-app.herokuapp.com/api`
- Custom domain: `https://api.yourdomain.com/api`
- Self-hosted: `https://your-server-ip/api`

## Testing the Fix

After setting up the environment variable:

1. **Check build logs** - should not mention missing secrets
2. **Test the deployed app** - API calls should work
3. **Verify in browser console** - no network errors

The deployment should now work without the "Secret does not exist" error.
