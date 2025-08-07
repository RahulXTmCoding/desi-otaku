# GitHub Actions Deployment Setup Guide

## Issue Fix: Missing Vercel Secrets

The deployment error occurs because GitHub Actions can't find the required Vercel secrets. Here's how to fix it.

## Required GitHub Repository Secrets

You need to set up these 3 secrets in your GitHub repository:

1. **`VERCEL_TOKEN`** - Your personal Vercel access token
2. **`VERCEL_ORG_ID`** - Your Vercel organization/team ID  
3. **`VERCEL_PROJECT_ID`** - Your Vercel project ID

## Step 1: Get Your Vercel Token

### Method A: Vercel Dashboard
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Give it a name (e.g., "GitHub Actions")
4. Set expiration (recommend "No Expiration" for CI/CD)
5. Copy the generated token (starts with `vercel_`)

### Method B: Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Generate token
vercel --help
# Your token will be in ~/.vercel/auth.json
```

## Step 2: Get Project and Org IDs

### Option 1: From Vercel CLI
```bash
# Navigate to your project
cd client

# Link to Vercel project (if not already linked)
vercel link

# Get project info
vercel env ls

# This will show your project ID and org ID in the output
```

### Option 2: From .vercel folder
After running `vercel link`, check:
```bash
# Check the project configuration
cat client/.vercel/project.json
```

You'll see something like:
```json
{
  "orgId": "team_xxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxx"
}
```

### Option 3: From Vercel Dashboard URL
When you're in your project dashboard, the URL shows the IDs:
```
https://vercel.com/[org-id]/[project-name]/[project-id]
```

## Step 3: Add Secrets to GitHub Repository

1. **Go to your GitHub repository**
2. **Click "Settings" tab**
3. **Go to "Secrets and variables" → "Actions"**
4. **Click "New repository secret"**

Add these three secrets:

### Secret 1: VERCEL_TOKEN
```
Name: VERCEL_TOKEN
Value: vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
### Secret 2: VERCEL_ORG_ID  
```
Name: VERCEL_ORG_ID
Value: team_xxxxxxxxxx
```

### Secret 3: VERCEL_PROJECT_ID
```
Name: VERCEL_PROJECT_ID  
Value: prj_xxxxxxxxxx
```

## Step 4: Set Environment Variable in Vercel

Don't forget to set the API URL in Vercel:

1. **Go to Vercel project dashboard**
2. **Settings → Environment Variables**
3. **Add:**
   ```
   Name: VITE_API_URL
   Value: https://your-backend-domain.com/api
   Environment: Production
   ```

## Step 5: Test the Deployment

1. **Push to main branch** or **manually trigger workflow**
2. **Check GitHub Actions tab** for deployment status
3. **Verify** the deployment completes successfully

## Troubleshooting

### If you still get token errors:

1. **Verify secrets are set correctly:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - All three secrets should be listed



2. **Check token validity:**
   ```bash
   # Test your token locally
   vercel --token YOUR_TOKEN_HERE whoami
   ```

3. **Verify project linking:**
   ```bash
   cd client
   vercel link --token YOUR_TOKEN_HERE
   ```

### Common Issues:

- **Token expired**: Generate a new token
- **Wrong org/project ID**: Re-run `vercel link` to get correct IDs
- **Permissions**: Ensure your Vercel account has deploy permissions

## Alternative: Direct Vercel Deployment

If GitHub Actions continue to have issues, you can deploy directly:

```bash
# Deploy from local machine
cd client
vercel --prod
```

Or use Vercel's GitHub integration:
1. Go to Vercel dashboard
2. "Add New Project"
3. Import from GitHub
4. Vercel will handle deployments automatically

## Environment Variables Summary

After setup, your deployment will have access to:

- **Local Development**: `VITE_API_URL` from `.env.local`
- **Production**: `VITE_API_URL` from Vercel environment variables
- **GitHub Actions**: Uses Vercel tokens for automated deployment

The "No existing credentials found" error will be resolved once all three GitHub secrets are properly configured.
