# Render Backend Deployment Setup Guide

## Issue Fix: Missing Render Deploy Hook URL

The deployment error `URL rejected: Malformed input to a URL function` occurs because the `RENDER_DEPLOY_HOOK_URL` secret is missing from your GitHub repository.

## Step-by-Step Setup

### 1. Create a Render Web Service

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   ```
   Name: custom-tshirt-shop-backend
   Environment: Node
   Region: Choose your preferred region
   Branch: main
   Root Directory: server
   Build Command: npm install
   Start Command: npm start
   ```

### 2. Get the Deploy Hook URL

1. **In your Render service dashboard**, go to **"Settings"**
2. **Scroll down to "Deploy Hook"**
3. **Click "Create Deploy Hook"**
4. **Copy the generated URL** (looks like: `https://api.render.com/deploy/srv-xxx?key=xxx`)

### 3. Add the Secret to GitHub

1. **Go to your GitHub repository**
2. **Click "Settings" tab**
3. **Go to "Secrets and variables" → "Actions"**
4. **Click "New repository secret"**
5. **Add the secret:**
   ```
   Name: RENDER_DEPLOY_HOOK_URL
   Value: https://api.render.com/deploy/srv-xxx?key=xxx
   ```

### 4. Configure Environment Variables in Render

In your Render service dashboard, go to **"Environment"** and add:

```bash
# Database
DATABASE=mongodb+srv://your-mongodb-connection-string

# JWT Secret
JWT_SECRET=your-jwt-secret

# Razorpay Keys
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Email Service (optional)
EMAIL_SERVICE=brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Your App Name

# Other environment variables
CLIENT_URL=https://your-frontend-domain.vercel.app
PORT=10000
```

## Updated Workflow Features

The backend deployment workflow now includes:

### ✅ Error Checking
```bash
if [ -z "$RENDER_DEPLOY_HOOK_URL" ]; then
  echo "❌ RENDER_DEPLOY_HOOK_URL secret is not set"
  exit 1
fi
```

### ✅ Better Logging
```bash
echo "🚀 Triggering Render deployment..."
response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$RENDER_DEPLOY_HOOK_URL")
```

### ✅ Response Validation
```bash
if [ "$response" -eq 200 ] || [ "$response" -eq 201 ]; then
  echo "✅ Deployment triggered successfully"
else
  echo "❌ Deployment failed with HTTP status: $response"
  exit 1
fi
```

## Render Service Configuration

### Build Settings
```bash
Build Command: npm install
Start Command: npm start
```

### Environment
```bash
Node Version: 18.x
Auto-Deploy: Yes (when main branch changes)
```

### Health Check
```bash
Health Check Path: /api (or your API health endpoint)
```

## Troubleshooting

### If deployment fails:

1. **Check Render service logs:**
   - Go to your service dashboard
   - Click "Logs" tab
   - Look for error messages

2. **Verify environment variables:**
   - Ensure all required env vars are set in Render
   - Check MongoDB connection string
   - Verify API keys

3. **Check GitHub Actions logs:**
   - Go to GitHub repo → Actions tab
   - Click on the failed workflow
   - Check the "Deploy to Render" step

### Common Issues:

- **Empty deploy hook URL**: Secret not set in GitHub
- **Invalid URL format**: Copy the complete URL from Render
- **Service not found**: Verify the service ID in the URL
- **Permission denied**: Regenerate the deploy hook in Render

## Testing the Setup

### 1. Test Local Backend
```bash
cd server
npm install
npm start
# Should start without errors
```

### 2. Test Deploy Hook Manually
```bash
curl "https://api.render.com/deploy/srv-xxx?key=xxx"
# Should return: {"message": "Deploy triggered"}
```

### 3. Test Full Deployment
- Push to main branch
- Check GitHub Actions for successful deployment
- Verify backend service starts in Render dashboard

## Integration with Frontend

Once your backend is deployed on Render, update your frontend environment variable:

```bash
# In Vercel dashboard
VITE_API_URL=https://your-backend-service.onrender.com/api
```

## Security Notes

⚠️ **Important:**
- Never commit deploy hook URLs to code
- Regenerate deploy hooks if compromised
- Use environment variables for all secrets
- Enable auto-deploy only for main branch

The "URL rejected: Malformed input" error will be resolved once you add the `RENDER_DEPLOY_HOOK_URL` secret to your GitHub repository.
