# Deployment Guide for AnimeShirt E-commerce Platform

This guide will help you deploy the AnimeShirt platform for free using Vercel (frontend) and Render (backend).

## Prerequisites
- GitHub account
- Vercel account (free)
- Render account (free)
- MongoDB Atlas account (free tier)

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account

### Step 2: Import Project
1. Click "Add New Project"
2. Import your GitHub repository
3. Select the `client` folder as the root directory
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`

### Step 3: Environment Variables
Add these environment variables in Vercel dashboard:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

## Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `animeshirt-backend`
   - Root Directory: `server`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

### Step 3: Environment Variables
Add these environment variables in Render dashboard:
```
NODE_ENV=production
PORT=8000
DATABASE=mongodb+srv://your-mongodb-connection-string
SECRET=your-jwt-secret
BRAINTREE_MERCHANT_ID=your-braintree-merchant-id
BRAINTREE_PUBLIC_KEY=your-braintree-public-key
BRAINTREE_PRIVATE_KEY=your-braintree-private-key
STRIPE_SECRET_KEY=your-stripe-secret-key (optional)
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SHIPROCKET_EMAIL=your-shiprocket-email
SHIPROCKET_PASSWORD=your-shiprocket-password
```

### Step 4: Deploy
Click "Create Web Service" and wait for deployment.

## MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free tier

### Step 2: Create Cluster
1. Create a new cluster (free tier)
2. Choose cloud provider and region

### Step 3: Configure Access
1. Add database user
2. Add IP whitelist (0.0.0.0/0 for anywhere access)
3. Get connection string

### Step 4: Connect
Use the connection string in your backend environment variables.

## GitHub Actions Setup

### Step 1: Get Vercel Token
1. Go to Vercel dashboard → Settings → Tokens
2. Create new token
3. Copy the token

### Step 2: Get Render Deploy Hook
1. Go to Render dashboard → Your service → Settings
2. Find "Deploy Hook"
3. Copy the URL

### Step 3: Add GitHub Secrets
In your GitHub repository → Settings → Secrets, add:
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
RENDER_DEPLOY_HOOK_URL=your-render-deploy-hook-url
```

## Post-Deployment Steps

### 1. Update Frontend API URL
Update `client/src/backend.tsx`:
```typescript
export const API = process.env.NODE_ENV === "production" 
  ? "https://your-backend-url.onrender.com/api"
  : "http://localhost:8000/api";
```

### 2. Configure CORS
Update `server/app.js` to allow your frontend URL:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### 3. Test Deployment
1. Visit your frontend URL
2. Test user registration/login
3. Test product browsing
4. Test cart and checkout flow

## Free Tier Limitations

### Vercel (Frontend)
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

### Render (Backend)
- Free instance spins down after 15 minutes of inactivity
- 750 hours/month free
- Automatic HTTPS

### MongoDB Atlas
- 512MB storage
- Shared RAM
- Good for development/small projects

## Upgrading for Production

When ready for production, consider:
1. Render paid plan ($7/month) for always-on backend
2. MongoDB Atlas dedicated cluster
3. Custom domain names
4. CDN for images (Cloudinary free tier)

## Troubleshooting

### Frontend Issues
- Check Vercel build logs
- Verify environment variables
- Check browser console for errors

### Backend Issues
- Check Render logs
- Verify MongoDB connection
- Test API endpoints with Postman

### Common Issues
1. **CORS errors**: Update CORS configuration
2. **API connection failed**: Check API URL in frontend
3. **Database connection failed**: Check MongoDB whitelist
4. **Build failed**: Check Node version compatibility

## Support
For issues, check:
- Vercel documentation
- Render documentation
- MongoDB Atlas documentation
- Project GitHub issues
