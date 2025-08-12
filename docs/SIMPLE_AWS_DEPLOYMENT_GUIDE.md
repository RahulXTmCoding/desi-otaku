# Simple AWS Deployment Guide 🚀

No more CloudFormation headaches! This guide uses simple CLI scripts for reliable deployment.

## 🎯 **Two-Phase Deployment**

### **Phase 1: Create Infrastructure (One-time)**
```bash
# Run once to create all AWS resources
./aws/scripts/create-infrastructure.sh
```

### **Phase 2: Deploy Code (Automatic)**
```bash
# Every time you push to main branch
git push origin main
```

---

## 🚀 **Quick Start (20 minutes)**

### **Step 1: Prerequisites**
```bash
# Install AWS CLI
# Configure credentials: aws configure
# Have GitHub repository ready
```

### **Step 2: Create Infrastructure**
```bash
# Make script executable
chmod +x aws/scripts/create-infrastructure.sh

# Run infrastructure creation
./aws/scripts/create-infrastructure.sh
```

**What this creates:**
- VPC with 2 subnets across availability zones
- Application Load Balancer for high availability  
- Auto Scaling Group (1-4 instances)
- Security Groups with proper firewall rules
- IAM roles and instance profiles
- Launch template with latest Amazon Linux

**Time:** ~10-15 minutes  
**Cost:** ~$21/month

### **Step 3: Set up GitHub Secrets**
Add these to GitHub repository (Settings → Secrets → Actions):

**Critical Secrets (Must Have):**
```
DATABASE=your-mongodb-connection-string
SECRET=your-jwt-secret
CLIENT_URL=https://your-frontend-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
BREVO_API_KEY=your-brevo-api-key
REDIS_URL=your-redis-connection-url
EC2_PRIVATE_KEY=your-ec2-private-key-content
```

**See complete list:** [docs/GITHUB_SECRETS_COMPLETE_SETUP.md](GITHUB_SECRETS_COMPLETE_SETUP.md)

### **Step 4: Deploy Your Code**
```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Deploy to AWS"
git push origin main
```

**GitHub Actions will:**
- Find your Auto Scaling Group instances
- Deploy code to all instances
- Set up all 31+ environment variables
- Start application with PM2
- Perform health checks
- Report success/failure

---

## ✅ **What You Get**

### **Infrastructure:**
✅ **Production-ready** - Load balancer, auto scaling, multi-AZ  
✅ **High availability** - Automatic failover across zones  
✅ **Cost optimized** - Uses efficient instance types  
✅ **Secure** - Proper security groups and IAM roles  
✅ **Monitored** - CloudWatch integration  

### **Application:**
✅ **Complete backend** - All services working  
✅ **Payments** - Razorpay & Braintree configured  
✅ **Email** - Brevo service configured  
✅ **SMS** - MSG91 service configured  
✅ **Caching** - Redis for performance  
✅ **Database** - MongoDB Atlas connection  
✅ **OAuth** - Google & Facebook login  

### **Deployment:**
✅ **Zero downtime** - Rolling deployments  
✅ **Automatic scaling** - 1-4 instances based on load  
✅ **Health monitoring** - Automatic recovery  
✅ **Easy rollbacks** - PM2 process management  

---

## 🌐 **Access Your Backend**

After infrastructure creation, you'll get:
```
http://your-alb-dns-name.ap-south-1.elb.amazonaws.com
```

**Test endpoints:**
- `/health` - Health check
- `/api/products` - Product API
- `/api/orders` - Orders API

---

## 🔧 **Common Commands**

### **Check Infrastructure Status**
```bash
# View Auto Scaling Group
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names fashion-backend-production-asg

# View Load Balancer
aws elbv2 describe-load-balancers \
  --names fashion-backend-production-alb

# View running instances
aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=fashion-backend" \
  --query 'Reservations[].Instances[].{ID:InstanceId,State:State.Name,IP:PublicIpAddress}'
```

### **Manual Deployment**
```bash
# Trigger deployment without code push
# GitHub → Actions → Deploy to AWS Backend Infrastructure → Run workflow
```

### **SSH to Instance**
```bash
# Get instance IP
INSTANCE_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=fashion-backend" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

# SSH to instance
ssh -i your-key.pem ec2-user@$INSTANCE_IP

# Check application logs
pm2 logs fashion-backend
```

---

## 🚨 **Troubleshooting**

### **Infrastructure Creation Failed**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check region
aws configure get region

# Re-run script (safe to run multiple times)
./aws/scripts/create-infrastructure.sh
```

### **Deployment Failed**
1. **Check GitHub Secrets** - Ensure all required secrets are set
2. **Check Infrastructure** - Verify Auto Scaling Group exists
3. **Check Instances** - Ensure instances are running
4. **Check Security Groups** - Verify SSH (port 22) access
5. **Check Application** - SSH to instance and check PM2 logs

### **Application Not Responding**
```bash
# SSH to instance
ssh -i your-key.pem ec2-user@$INSTANCE_IP

# Check PM2 status
pm2 list

# Check application logs
pm2 logs fashion-backend

# Restart application if needed
pm2 restart fashion-backend
```

---

## 💰 **Cost Breakdown**

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| **EC2 Instances** | $12-15 | 2x t3.micro instances |
| **Load Balancer** | $16 | Application Load Balancer |
| **Data Transfer** | $1-2 | Minimal usage |
| **VPC/Networking** | $0 | Included |
| **Total** | **~$21/month** | Production-ready |

**External Services:**
- MongoDB Atlas: $0 (free tier)
- Redis: $0 (free tier)
- Razorpay: 2% transaction fee
- Brevo: $0 (300 emails/day free)

---

## 🎉 **Success!**

Your fashion e-commerce backend is now:
- ✅ **Production-ready** with high availability
- ✅ **Auto-scaling** based on demand  
- ✅ **Cost-optimized** with efficient resources
- ✅ **Fully featured** with all services working
- ✅ **Automatically deployed** on every code push

**No more CloudFormation complexity - just simple, reliable deployment!** 🚀
