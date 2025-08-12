# ⚡ Quick AWS Deployment Commands

## 🚀 One-Command Infrastructure Setup

```bash
# Deploy AWS infrastructure (run this first!)
chmod +x aws/scripts/deploy-infrastructure.sh && ./aws/scripts/deploy-infrastructure.sh
```

## 📋 What This Solves

❌ **Error:** "Auto Scaling Group not found. Please deploy infrastructure first."  
✅ **Solution:** This script creates the Auto Scaling Group and all required AWS resources.

## ⏱️ Timeline

- **Script Runtime:** 10-15 minutes
- **Total Setup:** 25 minutes (including GitHub Secrets)
- **Monthly Cost:** $16.94 (covered by your $100 AWS credit for 6 months)

## 🎯 After Infrastructure Deployment

### 1. Set GitHub Secrets (5 minutes)
```bash
# Copy your environment variables to GitHub Secrets
# See: docs/COMPLETE_ENV_MIGRATION_GUIDE.md
```

### 2. Deploy Application (10 minutes)
```bash
# Push code to trigger automatic deployment
git add .
git commit -m "feat: deploy to AWS with spot instances"
git push origin main
```

### 3. Monitor & Test
- **GitHub Actions:** Monitor deployment progress
- **Application:** Test at the ALB URL provided by the script
- **Health Check:** Verify `/health` endpoint responds

## 🛠️ Prerequisites

```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Configure AWS credentials
aws configure
```

## 🔍 Verification Commands

```bash
# Check if infrastructure exists
aws cloudformation describe-stacks --stack-name fashion-backend-infrastructure --region ap-south-1

# Check Auto Scaling Group
aws autoscaling describe-auto-scaling-groups --region ap-south-1 | grep fashion-backend

# Check Load Balancer
aws elbv2 describe-load-balancers --region ap-south-1 | grep fashion-backend
```

## 🚨 Troubleshooting

### Common Issues:
- **Permission denied:** Run `chmod +x aws/scripts/deploy-infrastructure.sh`
- **AWS CLI not found:** Install AWS CLI first
- **Credentials error:** Run `aws configure` with your access keys
- **Region error:** Script uses ap-south-1 (Mumbai) by default

### Emergency Cleanup:
```bash
aws cloudformation delete-stack --stack-name fashion-backend-infrastructure --region ap-south-1
```

---

**🎉 After running this script, your GitHub Actions will work perfectly!**
