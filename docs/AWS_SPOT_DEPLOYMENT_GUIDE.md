# 🚀 AWS Spot Instance Deployment Guide
## Ultra-Cost-Effective Fashion E-commerce Backend

**Total Monthly Cost: ~$16.94 (70% savings over on-demand)**
- 2x t4g.micro spot instances: $2.44/month
- Application Load Balancer: $14.50/month
- **Your $100 credit covers ~6 months completely!**

---

## 📋 Prerequisites

### AWS Account Setup
1. **AWS Account** with free tier + $100 credit
2. **Default VPC** in Mumbai region (ap-south-1)
3. **EC2 Key Pair** for SSH access
4. **MongoDB Atlas** account (or external MongoDB)

### Local Requirements
- AWS CLI v2 installed
- Git repository on GitHub
- Basic AWS knowledge

---

## 🛠️ Step 1: Initial AWS Configuration

### 1.1 Create EC2 Key Pair
```bash
# Create key pair in Mumbai region
aws ec2 create-key-pair \
  --key-name fashion-backend-key \
  --region ap-south-1 \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/fashion-backend-key.pem

# Set proper permissions
chmod 400 ~/.ssh/fashion-backend-key.pem
```

### 1.2 Get Default VPC and Subnet IDs
```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text --region ap-south-1)

echo "Default VPC ID: $VPC_ID"

# Get subnet IDs
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].[SubnetId,AvailabilityZone]' \
  --output table --region ap-south-1
```

### 1.3 Update CloudFormation Template
Edit `aws/cloudformation/infrastructure.yml`:
```yaml
# Replace these lines with your actual values:
Subnets:
  - subnet-your-subnet-1  # Replace with actual subnet ID
  - subnet-your-subnet-2  # Replace with actual subnet ID
VpcId: vpc-your-vpc-id    # Replace with actual VPC ID
```

---

## 🚀 Step 2: Deploy Infrastructure

### 2.1 Deploy CloudFormation Stack
```bash
# Deploy the infrastructure
aws cloudformation create-stack \
  --stack-name fashion-backend-infrastructure \
  --template-body file://aws/cloudformation/infrastructure.yml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=fashion-backend-key \
    ParameterKey=GitHubRepository,ParameterValue=https://github.com/yourusername/yourrepo.git \
    ParameterKey=MongoDBConnectionString,ParameterValue="your-mongodb-connection-string" \
    ParameterKey=JWTSecret,ParameterValue="your-jwt-secret" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1

# Wait for stack creation (takes ~10-15 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name fashion-backend-infrastructure \
  --region ap-south-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name fashion-backend-infrastructure \
  --query 'Stacks[0].Outputs' \
  --region ap-south-1
```

### 2.2 Verify Deployment
```bash
# Get Load Balancer DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name fashion-backend-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text --region ap-south-1)

echo "🌐 Load Balancer URL: http://$ALB_DNS"
echo "🏥 Health Check: http://$ALB_DNS/health"
```

---

## 🔧 Step 3: GitHub Secrets Configuration

### 3.1 Required GitHub Secrets
In your GitHub repository settings → Secrets and variables → Actions:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Application Environment Variables
MONGODB_CONNECTION_STRING=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key

# Optional: Additional secrets
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
BREVO_API_KEY=your-email-api-key
MSG91_API_KEY=your-sms-api-key
```

### 3.2 Environment Setup in GitHub
1. Go to `Settings` → `Environments`
2. Create `production` environment
3. Add protection rules (optional)
4. Add environment-specific secrets

---

## 🚀 Step 4: Automated Deployment

### 4.1 Trigger First Deployment
```bash
# Push to main branch triggers deployment
git add .
git commit -m "feat: add AWS spot instance deployment"
git push origin main

# Or trigger manual deployment
# Go to Actions tab → Deploy Backend to AWS → Run workflow
```

### 4.2 Monitor Deployment
1. **GitHub Actions**: Check workflow progress
2. **AWS Console**: Monitor Auto Scaling Group
3. **Health Check**: Visit ALB DNS + `/health`

### 4.3 Deployment Timeline
- **Instance Launch**: ~2-3 minutes
- **Application Setup**: ~3-5 minutes  
- **Health Checks**: ~2 minutes
- **Total**: ~8-10 minutes

---

## 📊 Step 5: Cost Monitoring Setup

### 5.1 CloudWatch Billing Alerts
```bash
# Create billing alarm for $50/month
aws cloudwatch put-metric-alarm \
  --alarm-name "FashionBackend-BillingAlarm" \
  --alarm-description "Alert when costs exceed $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --evaluation-periods 1 \
  --region us-east-1
```

### 5.2 Cost Optimization Checks
```bash
# Check spot instance savings
aws ec2 describe-spot-price-history \
  --instance-types t4g.micro \
  --product-descriptions "Linux/UNIX" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --region ap-south-1

# Monitor Auto Scaling Group metrics
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names fashion-backend-production-asg \
  --region ap-south-1
```

---

## 🔄 Step 6: Frontend API Configuration

### 6.1 Update Frontend Environment Variables
```javascript
// client/.env.production
VITE_API_URL=http://your-alb-dns-name.ap-south-1.elb.amazonaws.com
VITE_API_PROVIDER=aws

// client/.env.staging (optional)
VITE_API_URL=http://your-alb-dns-name.ap-south-1.elb.amazonaws.com
VITE_API_PROVIDER=aws
```

### 6.2 API Switching Logic (Optional)
```javascript
// client/src/config/api.js
const getApiUrl = () => {
  const provider = import.meta.env.VITE_API_PROVIDER || 'aws';
  
  const urls = {
    aws: import.meta.env.VITE_API_URL_AWS,
    render: import.meta.env.VITE_API_URL_RENDER
  };
  
  return urls[provider] || urls.aws;
};

export const API_BASE_URL = getApiUrl();
```

---

## 🛡️ Step 7: Security & Monitoring

### 7.1 SSH Access to Instances
```bash
# Get instance IP
INSTANCE_IP=$(aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names fashion-backend-production-asg \
  --query 'AutoScalingGroups[0].Instances[0].InstanceId' \
  --output text --region ap-south-1 | \
  xargs aws ec2 describe-instances \
  --instance-ids stdin \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text --region ap-south-1)

# SSH into instance
ssh -i ~/.ssh/fashion-backend-key.pem ec2-user@$INSTANCE_IP
```

### 7.2 Application Logs
```bash
# On EC2 instance
sudo pm2 logs fashion-backend
sudo tail -f /var/log/pm2/combined.log

# Check spot termination service
sudo journalctl -u pm2-root -f
```

### 7.3 CloudWatch Metrics
- **CPUUtilization**: Auto-scaling trigger
- **NetworkIn/Out**: Traffic monitoring  
- **TargetResponseTime**: Performance tracking
- **HealthyHostCount**: Instance health

---

## 🔄 Step 8: Operations & Maintenance

### 8.1 Zero-Downtime Deployments
Every `git push` to main automatically:
1. Creates new launch template version
2. Triggers rolling instance refresh
3. Maintains 50% healthy instances
4. Validates health checks
5. Completes deployment

### 8.2 Scaling Operations
```bash
# Manual scaling during sales
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name fashion-backend-production-asg \
  --desired-capacity 4 \
  --honor-cooldown \
  --region ap-south-1

# Reset to normal after sales
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name fashion-backend-production-asg \
  --desired-capacity 2 \
  --region ap-south-1
```

### 8.3 Spot Instance Monitoring
```bash
# Check spot termination warnings
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names fashion-backend-production-asg \
  --query 'AutoScalingGroups[0].Instances[*].[InstanceId,LifecycleState,HealthStatus]' \
  --region ap-south-1
```

---

## 📈 Step 9: Performance Optimization

### 9.1 Database Connection Optimization
```javascript
// server/config/database.js
const mongoOptions = {
  maxPoolSize: 5,        // Limit connections for t4g.micro
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
};
```

### 9.2 Memory Optimization
```javascript
// server/ecosystem.config.js
{
  max_memory_restart: '800M',  // Restart if > 800MB
  node_args: '--max-old-space-size=896'  // Node.js heap limit
}
```

---

## 🚨 Step 10: Troubleshooting

### 10.1 Common Issues

**Health Check Failing**
```bash
# Check application logs
ssh -i ~/.ssh/fashion-backend-key.pem ec2-user@instance-ip
sudo pm2 status
sudo pm2 logs fashion-backend
```

**Spot Instance Termination**
```bash
# Check termination history
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name fashion-backend-production-asg \
  --region ap-south-1
```

**High Costs**
```bash
# Check running instances
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names fashion-backend-production-asg \
  --region ap-south-1

# Scale down if needed
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name fashion-backend-production-asg \
  --desired-capacity 1 \
  --region ap-south-1
```

### 10.2 Emergency Procedures

**Complete Infrastructure Reset**
```bash
# Delete CloudFormation stack (will delete all resources)
aws cloudformation delete-stack \
  --stack-name fashion-backend-infrastructure \
  --region ap-south-1

# Redeploy from scratch
# (Follow deployment steps again)
```

**Switch to Render Backup**
```javascript
// Emergency: Update frontend to use Render
// client/.env.production
VITE_API_URL=https://your-render-app.onrender.com
VITE_API_PROVIDER=render
```

---

## 📊 Expected Performance & Costs

### Monthly Cost Breakdown
```
🔹 ALB (Load Balancer):     $14.50
🔹 2x t4g.micro spots:      $2.44
🔹 Data Transfer (15GB):    $0.00 (free)
🔹 CloudWatch (basic):     $0.00 (free)
───────────────────────────────────
💰 Total:                  $16.94/month

💳 Your $100 Credit Timeline:
   - Months 1-6: $0 (fully covered)
   - Month 7+: $16.94/month
```

### Performance Expectations
```
🚀 Instance Performance:    2 vCPU, 1GB RAM each
📊 Concurrent Users:        500-1000+ (with 2 instances)
🌐 Response Time:           <100ms (Mumbai region)
⚡ Auto-scaling:           1-6 instances based on load
🛡️ Availability:          99.5%+ (multi-AZ, auto-healing)
```

---

## 🎉 Success! Your Ultra-Low-Cost AWS Infrastructure is Ready

**What You've Achieved:**
✅ **70% cost savings** over traditional hosting  
✅ **Enterprise-grade infrastructure** with auto-scaling  
✅ **Spot termination handling** for zero customer impact  
✅ **Automated deployments** via GitHub Actions  
✅ **Professional monitoring** and health checks  
✅ **Mumbai region optimization** for Indian customers  

**Next Steps:**
1. 🚀 Deploy your fashion backend 
2. 📊 Monitor costs and performance
3. 🎯 Scale during fashion sales events
4. 💰 Enjoy massive cost savings while growing your business!

Your fashion empire now runs on ultra-cost-effective, enterprise-grade AWS infrastructure! 🎊
