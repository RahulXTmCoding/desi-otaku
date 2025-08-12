# Complete Hybrid Deployment Guide 🚀

## Overview

This guide walks you through the **secure hybrid deployment approach** where:
- **CloudFormation** handles infrastructure (VPC, ALB, ASG) 
- **GitHub Secrets** store ALL sensitive data securely
- **GitHub Actions** deploys your application with complete environment

Your backend will support **ALL services**: Payments, Email, SMS, Shipping, OAuth, and Caching! 🎉

---

## 🎯 **What You'll Get**

✅ **Production Infrastructure** - Auto Scaling, Load Balancer, Spot Instances  
✅ **Complete Backend** - All 31 environment variables configured  
✅ **Zero Secrets in Code** - Everything secure in GitHub  
✅ **Auto Deployments** - Push to main = automatic deployment  
✅ **High Availability** - Multi-AZ with automatic failover  
✅ **Cost Optimized** - ~$21/month with 80% spot instance savings  

---

## 📋 **Prerequisites**

- [x] AWS Account with billing configured
- [x] GitHub repository for your project  
- [x] MongoDB Atlas database
- [x] Razorpay account (for payments)
- [x] Brevo account (for emails)
- [x] Basic understanding of AWS and GitHub

---

## 🚀 **Phase 1: Infrastructure Setup (One-time)**

### **Step 1: Create EC2 Key Pair**

```bash
# Option A: AWS Console
1. Go to AWS Console → EC2 → Key Pairs
2. Click "Create key pair"
3. Name: "fashion-backend-key"
4. Type: RSA, Format: .pem
5. Download and save securely

# Option B: AWS CLI
aws ec2 create-key-pair \
  --key-name fashion-backend-key \
  --query 'KeyMaterial' \
  --output text > fashion-backend-key.pem
chmod 400 fashion-backend-key.pem
```

### **Step 2: Validate CloudFormation Template**

```bash
# Clone your repository
git clone https://github.com/RahulXTmCoding/desi-otaku.git
cd desi-otaku

# Validate the template  
aws cloudformation validate-template \
  --template-body file://aws/cloudformation/infrastructure.yml \
  --region ap-south-1

# Should return: ✅ "Valid template"
```

### **Step 3: Deploy Infrastructure Stack**

```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name fashion-backend-infrastructure \
  --template-body file://aws/cloudformation/infrastructure.yml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=fashion-backend-key \
    ParameterKey=MinInstances,ParameterValue=1 \
    ParameterKey=MaxInstances,ParameterValue=4 \
    ParameterKey=DesiredInstances,ParameterValue=2 \
    ParameterKey=ApplicationPort,ParameterValue=8000 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1

# Monitor deployment (takes ~15 minutes)
aws cloudformation describe-stacks \
  --stack-name fashion-backend-infrastructure \
  --region ap-south-1 \
  --query 'Stacks[0].StackStatus'
```

### **Step 4: Get Infrastructure Details**

```bash
# Get Load Balancer URL (your backend will be accessible here)
aws cloudformation describe-stacks \
  --stack-name fashion-backend-infrastructure \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text

# Example output: http://fashion-backend-production-alb-123456789.ap-south-1.elb.amazonaws.com
```

---

## 🔐 **Phase 2: GitHub Secrets Setup**

### **Step 1: Prepare Your Secrets**

Use the **[Complete GitHub Secrets Setup Guide](GITHUB_SECRETS_COMPLETE_SETUP.md)** to gather all required credentials.

**Critical Secrets (Must Have):**
```bash
DATABASE=mongodb+srv://user:pass@cluster.mongodb.net/dbname
SECRET=your-super-secret-jwt-key
CLIENT_URL=https://your-frontend-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
BREVO_API_KEY=your-brevo-api-key
REDIS_URL=your-redis-url
EC2_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
```

### **Step 2: Add Secrets to GitHub**

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret from your list

**Quick validation script:**
```bash
# Test that critical secrets are set (run this in GitHub Actions)
echo "Checking secrets..."
if [ -z "$DATABASE" ]; then echo "❌ DATABASE missing"; fi
if [ -z "$SECRET" ]; then echo "❌ SECRET missing"; fi
if [ -z "$CLIENT_URL" ]; then echo "❌ CLIENT_URL missing"; fi
# Add more checks...
```

---

## 🎯 **Phase 3: Application Deployment**

### **Step 1: Test the Deployment Workflow**

Your deployment will happen automatically when you push to the `main` branch, but you can also trigger it manually:

1. Go to your GitHub repository
2. **Actions** → **Deploy Production Backend with Complete Environment**
3. **Run workflow** → **Use workflow from: main**
4. Click **"Run workflow"**

### **Step 2: Monitor Deployment**

The workflow will:
- ✅ Validate all required secrets are present
- ✅ Find running instances in your Auto Scaling Group
- ✅ Deploy code to each instance
- ✅ Set up complete environment (all 31+ variables)
- ✅ Start application with PM2
- ✅ Perform health checks
- ✅ Report success/failure

### **Step 3: Verify Deployment**

```bash
# Get your load balancer URL from CloudFormation output
ALB_URL="http://your-alb-url.elb.amazonaws.com"

# Test health endpoint
curl $ALB_URL/health
# Should return: {"status":"healthy","timestamp":"...","service":"fashion-backend"}

# Test a protected API endpoint
curl $ALB_URL/api/products
# Should return product data or authentication requirement
```

---

## 🔄 **Phase 4: Continuous Deployment**

### **Automatic Deployments**

Every time you push code to the `main` branch:
1. GitHub Actions detects changes in `server/**`
2. Automatically deploys to your infrastructure
3. Zero downtime with rolling deployments
4. Health checks ensure everything works

### **Manual Deployments**

Trigger deployments anytime via GitHub Actions UI or API:

```bash
# Via GitHub CLI
gh workflow run "Deploy Production Backend with Complete Environment"

# Via curl (GitHub API)
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/RahulXTmCoding/desi-otaku/actions/workflows/deploy-production-complete.yml/dispatches \
  -d '{"ref":"main"}'
```

---

## 🛠️ **Phase 5: Testing & Validation**

### **Backend Services Test**

Test each service to ensure complete functionality:

```bash
# Test core API
curl $ALB_URL/api/health
curl $ALB_URL/api/products

# Test payment integration (Razorpay)
curl -X POST $ALB_URL/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"currency":"INR"}'

# Test email service (Brevo)
curl -X POST $ALB_URL/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test Email"}'

# Test SMS service (MSG91)
curl -X POST $ALB_URL/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919999999999","message":"Test SMS"}'

# Test Redis caching
curl $ALB_URL/api/test/cache

# Test MongoDB connection
curl $ALB_URL/api/test/database
```

### **Performance & Scaling Test**

```bash
# Load test with Apache Bench
ab -n 1000 -c 50 $ALB_URL/api/health

# Monitor Auto Scaling
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names fashion-backend-production-asg \
  --query 'AutoScalingGroups[0].Instances'

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Sum
```

---

## 📊 **Infrastructure Overview**

```mermaid
graph TB
    Internet[Internet] --> ALB[Application Load Balancer]
    ALB --> ASG[Auto Scaling Group<br/>1-4 instances]
    ASG --> EC2A[EC2 Instance A<br/>Node.js + PM2]
    ASG --> EC2B[EC2 Instance B<br/>Node.js + PM2]
    
    EC2A --> MongoDB[MongoDB Atlas]
    EC2A --> Redis[Redis Cloud]
    EC2B --> MongoDB
    EC2B --> Redis
    
    EC2A --> Razorpay[Razorpay API]
    EC2A --> Brevo[Brevo Email API]
    EC2A --> MSG91[MSG91 SMS API]
    
    GitHub[GitHub Actions] --> EC2A
    GitHub --> EC2B
    
    CloudWatch[CloudWatch Logs] --> EC2A
    CloudWatch --> EC2B
```

---

## 💰 **Cost Breakdown**

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| **EC2 Instances** | $3.00 | 2x t3.micro spot instances (80% savings) |
| **Application Load Balancer** | $16.20 | Standard ALB pricing |
| **CloudWatch Logs** | $1.00 | Basic logging |
| **Data Transfer** | $1.00 | Minimal outbound |
| **VPC/Networking** | $0.00 | Included with AWS |
| **Auto Scaling** | $0.00 | No additional charge |
| **Total Infrastructure** | **~$21.20/month** | Production-ready with HA |

**External Services:**
- MongoDB Atlas: $0 (512MB free tier)
- Redis Cloud: $0 (30MB free tier)  
- Razorpay: 2% transaction fee
- Brevo: $0 (300 emails/day free)
- MSG91: Pay per SMS

---

## 🔧 **Troubleshooting**

### **Common Issues**

**1. CloudFormation Stack Failed**
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name fashion-backend-infrastructure

# Common fixes:
# - Key pair doesn't exist in region
# - IAM permissions insufficient
# - Region not supported
```

**2. GitHub Actions Deployment Failed**
```bash
# Check secrets are set correctly
# Verify EC2 instances are running
# Check SSH connectivity
```

**3. Health Check Failing**
```bash
# SSH into instance
ssh -i fashion-backend-key.pem ec2-user@instance-ip

# Check PM2 status
pm2 list
pm2 logs

# Check application logs
tail -f /var/log/pm2/combined.log
```

**4. Application Not Starting**
```bash
# Check environment variables
cat /opt/app/current/server/.env

# Check for missing dependencies
cd /opt/app/current/server
npm install

# Manual start for debugging
node app.js
```

---

## 🎉 **Success! What You Now Have**

✅ **Production Infrastructure** - Auto Scaling, Load Balancing, Multi-AZ  
✅ **Complete Backend** - All services working (payments, email, SMS, etc.)  
✅ **Security** - No secrets in code, everything encrypted  
✅ **Auto Deployments** - Push to deploy automatically  
✅ **Monitoring** - CloudWatch logs and metrics  
✅ **Cost Optimized** - 80% savings with spot instances  
✅ **High Availability** - Automatic failover and scaling  

Your fashion e-commerce backend is now **enterprise-grade** and ready for production traffic! 🚀

## 📈 **Next Steps**

1. **Set up domain** and SSL certificate for your load balancer
2. **Configure monitoring alerts** in CloudWatch
3. **Set up database backups** in MongoDB Atlas
4. **Implement CI/CD testing** before deployments
5. **Scale up** as your traffic grows

Welcome to production! 🎊
