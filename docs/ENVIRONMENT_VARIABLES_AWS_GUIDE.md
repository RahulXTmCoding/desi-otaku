# 🔐 Environment Variables Management - AWS Deployment

## 🎯 How Backend Environment Variables Work

In the AWS spot instance deployment, environment variables are managed through **GitHub Secrets** and automatically deployed to instances during launch.

---

## 📋 Environment Variable Flow

```
GitHub Secrets → GitHub Actions → EC2 Instance .env file → Node.js Application
```

### 1. GitHub Secrets (Source of Truth)
Your environment variables are stored securely in GitHub repository secrets.

### 2. GitHub Actions (Deployment Pipeline)
The workflow pulls secrets and injects them into the deployment process.

### 3. EC2 Instance (Runtime Environment)
Each instance gets a fresh `.env` file created during launch.

### 4. Node.js Application (Consumption)
Your app reads from the `.env` file as usual.

---

## 🔧 Setup Process

### Step 1: Add Secrets to GitHub Repository

Go to your repository → `Settings` → `Secrets and variables` → `Actions`

### Step 2: GitHub Actions Handles Deployment

The workflow automatically:
1. Pulls all secrets from GitHub
2. Creates a secure `.env` file on each EC2 instance
3. Injects variables during the deployment process

**In `.github/workflows/deploy-aws-backend.yml`:**
```yaml
# Create environment file from secrets
cat > .env << EOF2
NODE_ENV=production
PORT=3000
DATABASE=${{ secrets.MONGODB_CONNECTION_STRING }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
RAZORPAY_KEY_ID=${{ secrets.RAZORPAY_KEY_ID }}
RAZORPAY_KEY_SECRET=${{ secrets.RAZORPAY_KEY_SECRET }}
BREVO_API_KEY=${{ secrets.BREVO_API_KEY }}
MSG91_API_KEY=${{ secrets.MSG91_API_KEY }}
# Add any additional variables here
EOF2
```

### Step 3: Instance Startup Process

Every time a new instance launches (including spot replacements):
1. **UserData script runs** during instance initialization
2. **Fresh .env file created** with latest environment variables
3. **PM2 starts application** with proper environment
4. **Health checks verify** everything is working

---

## 🔄 Environment Variable Updates

### For New Variables:
1. **Add to GitHub Secrets** in repository settings
2. **Update GitHub Actions workflow** to include the new variable
3. **Push code changes** → triggers deployment
4. **New instances get updated environment** automatically

### Example: Adding a New Variable
```bash
# 1. Add to GitHub Secrets
NEW_API_KEY=your-new-api-key

# 2. Update .github/workflows/deploy-aws-backend.yml
NEW_API_KEY=${{ secrets.NEW_API_KEY }}

# 3. Push changes
git add .github/workflows/deploy-aws-backend.yml
git commit -m "feat: add new API key environment variable"
git push origin main
```

---

## 📁 Current Environment Variables (From Your .env)

Based on your existing `server/.env`, here are the variables to configure:

## 🛡️ Security Features

### 1. Secure Storage
- ✅ **GitHub Secrets encrypted** at rest and in transit
- ✅ **No environment variables** in code repository
- ✅ **No plaintext secrets** in CloudFormation templates

### 2. Runtime Security
- ✅ **Fresh .env files** created on each instance
- ✅ **Secrets never logged** in deployment output
- ✅ **Instance isolation** prevents cross-contamination

### 3. Access Control
- ✅ **Repository-level access** controls who can view/edit secrets
- ✅ **Environment-specific** secrets (production, staging)
- ✅ **Audit trail** of secret modifications

---

## 🔍 Verification & Debugging

### Check Environment Variables on Instance
```bash
# SSH into EC2 instance
ssh -i ~/.ssh/fashion-backend-key.pem ec2-user@instance-ip

# Check if .env file exists
ls -la /opt/app/server/.env

# Verify environment variables are loaded (don't log sensitive values)
pm2 logs fashion-backend | grep -i "DB CONNECTED"

# Check PM2 environment
pm2 show fashion-backend
```

### Health Check Verification
```bash
# Your health endpoint shows environment status
curl http://your-alb-dns/health

# Response includes:
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2025-01-08T21:47:00.000Z",
  "uptime": 3600
}
```

---

## 🚨 Common Issues & Solutions

### Problem: "Database connection failed"
```bash
# Check if MongoDB connection string is correct in GitHub Secrets
# Verify the secret name matches what's used in GitHub Actions
# Check CloudWatch logs for specific error messages
```

### Problem: "JWT secret not found"
```bash
# Ensure JWT_SECRET is added to GitHub Secrets
# Verify it's at least 32 characters long
# Check the secret is being injected in GitHub Actions workflow
```

### Problem: Environment variables not updating
```bash
# New variables require a fresh deployment
# Push a commit to trigger new instance launch
# Old instances won't automatically get new variables
```

---

## 🔄 Migration from Current Setup

### If you're currently using Render:
1. **Export current environment variables** from Render dashboard
2. **Add all variables to GitHub Secrets** (one by one)
3. **Test deployment** to AWS with a staging environment first
4. **Switch frontend API endpoint** once verified

### Environment Variable Mapping:
```bash
# Render Environment → GitHub Secrets
DATABASE → MONGODB_CONNECTION_STRING
JWT_SECRET → JWT_SECRET  
RAZORPAY_KEY_ID → RAZORPAY_KEY_ID
# ... and so on
```

---

## 🎯 Best Practices

### 1. Secret Naming Convention
```bash
# Use descriptive, uppercase names
MONGODB_CONNECTION_STRING  ✅
DATABASE                   ❌ (too generic)

# Group related secrets
RAZORPAY_KEY_ID           ✅
RAZORPAY_KEY_SECRET       ✅
```

### 2. Environment Separation
```bash
# Use environment-specific secrets if needed
MONGODB_CONNECTION_STRING_PROD
MONGODB_CONNECTION_STRING_STAGING
```

### 3. Regular Rotation
```bash
# Rotate sensitive secrets regularly
# Update in GitHub Secrets → redeploy automatically
# Old instances get new secrets on next deployment
```

---

## 🚀 Next Steps

1. **Export your current environment variables** from existing setup
2. **Add all secrets to GitHub repository** settings
3. **Test the deployment** with the complete environment
4. **Monitor the health endpoint** to verify everything works
5. **Set up monitoring alerts** for environment-related issues

The AWS deployment makes environment variable management much more secure and automated than traditional setups!
