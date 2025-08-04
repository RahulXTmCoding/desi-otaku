# 🚀 Auto-Deploy Setup Guide for AOV Features

## ✅ What We Just Fixed

### **1. Bulletproof .gitignore**
- ✅ Protects ALL .env files (server/.env, client/.env, etc.)
- ✅ Prevents accidental commit of sensitive data
- ✅ Covers build artifacts, logs, cache, OS files
- ✅ Industry-standard security setup

### **2. Auto-Deploy Workflows**
- ✅ **Before**: Only deployed when specific folders changed
- ✅ **Now**: BOTH frontend + backend deploy on EVERY push to main
- ✅ Simple workflow: `git push` → Everything deploys automatically

## 🔧 Required GitHub Secrets Setup

You need these secrets in your GitHub repo for auto-deployment:

### **Frontend (Vercel) Secrets:**
```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id  
VERCEL_PROJECT_ID=your-vercel-project-id
```

### **Backend (Render) Secrets:**
```
RENDER_DEPLOY_HOOK_URL=your-render-deploy-hook-url
```

## 📋 Step-by-Step Setup Process

### **Step 1: Set Up Vercel (Frontend)**

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Your Project**
   - Click "Add New Project"
   - Import your GitHub repo
   - Set root directory to `client`
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Get Vercel Secrets**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and get project info
   vercel login
   cd client
   vercel link
   vercel env ls
   ```

4. **Add Environment Variables in Vercel**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `VITE_API_URL=https://your-backend.onrender.com/api`

### **Step 2: Set Up Render (Backend)**

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Configure:
     - Name: `your-shop-backend`
     - Root Directory: `server`
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add Environment Variables in Render**
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE=mongodb+srv://your-mongodb-connection
   SECRET=your-jwt-secret-key
   BRAINTREE_MERCHANT_ID=your-braintree-merchant-id
   BRAINTREE_PUBLIC_KEY=your-braintree-public-key
   BRAINTREE_PRIVATE_KEY=your-braintree-private-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Get Deploy Hook**
   - Go to Render dashboard → Your service → Settings
   - Copy the "Deploy Hook" URL

### **Step 3: Set Up MongoDB Atlas (Database)**

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for free tier

2. **Create Cluster**
   - Create new cluster (free tier)
   - Choose region closest to you

3. **Configure Access**
   - Database Access → Add user
   - Network Access → Add IP (0.0.0.0/0 for anywhere)
   - Get connection string

### **Step 4: Add GitHub Secrets**

1. **Go to your GitHub repository**
2. **Settings → Secrets and variables → Actions**
3. **Add these secrets:**

   ```
   VERCEL_TOKEN=vxxxxxxxxxxxxxxxxxxxxxxxxx
   VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxx
   VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxx
   RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
   ```

## 🎯 Testing Your Auto-Deploy

### **Test the Auto-Deploy Workflow:**

1. **Make a small change**
   ```bash
   # Add a comment or update README
   echo "# AOV Features Added" >> README.md
   ```

2. **Commit and push**
   ```bash
   git add .
   git commit -m "Test auto-deploy with AOV features"
   git push origin main
   ```

3. **Watch deployments**
   - Go to GitHub → Your repo → Actions
   - You should see BOTH workflows running:
     - ✅ "Deploy Frontend to Vercel"
     - ✅ "Deploy Backend to Render"

4. **Verify deployment success**
   - Both workflows should complete successfully
   - Frontend: Available at your Vercel URL
   - Backend: Available at your Render URL

## 🧪 Testing Your Live AOV Features

### **1. Test Quantity Discount Badges**
```bash
1. Visit your live frontend URL
2. Look at product cards on home page
3. ✅ See blue "Bulk Discounts" badges
4. Should show: "2+ items: 10% off", "3+ items: 15% off"
```

### **2. Test Free Shipping Progress Tracker**
```bash
1. Add products to cart (any amount)
2. Go to checkout → Fill shipping → Step 2: Review
3. ✅ See shipping progress bar above discounts
4. Should show progress toward ₹999 free shipping
```

### **3. Test Loyalty Multipliers**
```bash
1. Complete an order worth ₹1000+
2. ✅ See "2X points earned!" on confirmation
3. Check user dashboard for bonus points
```

## 🔍 Troubleshooting

### **If Deployments Fail:**

1. **Check GitHub Actions logs**
   - Go to Actions tab in your repo
   - Click on failed workflow
   - Check error messages

2. **Common Issues:**
   - ❌ Missing GitHub secrets
   - ❌ Wrong Vercel project ID
   - ❌ Invalid Render deploy hook
   - ❌ Environment variables not set

3. **Verify secrets are set**
   - GitHub → Settings → Secrets → Actions
   - All 4 secrets should be present

### **If AOV Features Don't Work:**

1. **Check browser console**
   - F12 → Console tab
   - Look for API errors

2. **Check backend logs**
   - Render dashboard → Your service → Logs
   - Look for AOV service initialization

3. **Test API endpoints**
   ```bash
   # Test quantity discounts API
   curl https://your-backend.onrender.com/api/aov/quantity-discounts
   
   # Should return discount tiers
   ```

## 🎉 Success Checklist

### **✅ Deployment Setup Complete:**
- [ ] .gitignore protects all sensitive files
- [ ] GitHub Actions deploy both frontend + backend
- [ ] All GitHub secrets configured
- [ ] Vercel project connected and deploying
- [ ] Render service connected and deploying
- [ ] MongoDB Atlas database connected

### **✅ AOV Features Live:**
- [ ] Quantity discount badges visible on product cards
- [ ] Shipping progress tracker working in checkout
- [ ] Loyalty multipliers calculating bonus points
- [ ] All APIs responding correctly
- [ ] Mobile-responsive design working

## 🚀 Your New Workflow

```bash
# From now on, deploying is this simple:
git add .
git commit -m "Add new feature"
git push origin main

# Result: Both frontend and backend deploy automatically!
# Your AOV features (and any future changes) go live in ~5 minutes
```

## 💡 Pro Tips

1. **Monitor deployments** in GitHub Actions tab
2. **Check Render logs** if backend issues occur
3. **Use Vercel preview** URLs for testing before production
4. **Keep environment variables updated** as you add features
5. **Test locally first** before pushing to main

---

**🎉 Congratulations! Your AOV-enhanced anime t-shirt shop is now set up for automatic deployment!**

Every `git push` will deploy your latest features, and your new AOV system will help boost your average order values immediately! 🚀
