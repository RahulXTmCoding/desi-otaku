# 🚀 AWS Infrastructure Deployment Scripts

## Quick Start Guide

### Prerequisites
1. **AWS CLI installed** - [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **AWS credentials configured** - Run `aws configure`
3. **jq installed** - For JSON parsing (most systems have this)

### One-Command Deployment

```bash
# Make script executable and run
chmod +x aws/scripts/deploy-infrastructure.sh
./aws/scripts/deploy-infrastructure.sh
```

### What the Script Does

1. ✅ **Checks AWS CLI** configuration and credentials
2. ✅ **Gets VPC/subnet info** automatically from your account  
3. ✅ **Creates EC2 key pair** if it doesn't exist
4. ✅ **Updates CloudFormation template** with actual VPC/subnet IDs
5. ✅ **Deploys infrastructure** (Load Balancer + Auto Scaling Group + Spot Instances)
6. ✅ **Shows results** with URLs and next steps

### Expected Output

```
🚀 AWS Infrastructure Deployment for Fashion E-commerce Backend
==============================================================

[INFO] Checking AWS CLI configuration...
[SUCCESS] AWS CLI configured successfully
[INFO] Deploying with AWS Account: 123456789012
[INFO] Getting VPC and subnet information...
[SUCCESS] Default VPC: vpc-12345678
[SUCCESS] Using subnets: subnet-abc123, subnet-def456
[INFO] Checking EC2 key pair...
[SUCCESS] Key pair 'fashion-backend-key' already exists
[INFO] Validating CloudFormation template...
[SUCCESS] CloudFormation template is valid
[INFO] Creating new stack fashion-backend-infrastructure...
[INFO] Waiting for stack creation to complete (this may take 10-15 minutes)...
[SUCCESS] Infrastructure deployed successfully!

📊 INFRASTRUCTURE DETAILS:
==========================
🌐 Load Balancer DNS: fashion-backend-production-alb-123456789.ap-south-1.elb.amazonaws.com
🔗 Application URL: http://fashion-backend-production-alb-123456789.ap-south-1.elb.amazonaws.com
🏥 Health Check: http://fashion-backend-production-alb-123456789.ap-south-1.elb.amazonaws.com/health
🖥️  Auto Scaling Group: fashion-backend-production-asg
💰 Estimated Cost: ~$16.94/month
```

### After Infrastructure Deployment

1. **Set up GitHub Secrets** (see `docs/COMPLETE_ENV_MIGRATION_GUIDE.md`)
2. **Push code** to trigger application deployment
3. **Monitor deployment** in GitHub Actions
4. **Test application** at the ALB URL

### Troubleshooting

#### Error: "AWS CLI not found"
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### Error: "AWS credentials not configured"
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, region (ap-south-1), and output format (json)
```

#### Error: "jq command not found"
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Or modify script to use AWS CLI queries instead
```

#### Stack Already Exists
The script automatically detects and updates existing stacks, so you can run it multiple times safely.

### Manual Cleanup (if needed)

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name fashion-backend-infrastructure --region ap-south-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name fashion-backend-infrastructure --region ap-south-1
```

### Cost Monitoring

After deployment, monitor costs in AWS Console:
1. Go to **AWS Billing & Cost Management**
2. Set up **billing alerts** for $50/month
3. Monitor **Cost Explorer** regularly

### Security Notes

- ✅ Script uses your existing AWS credentials
- ✅ Creates secure VPC and security groups
- ✅ EC2 key pair stored in `~/.ssh/fashion-backend-key.pem`
- ✅ No sensitive data in CloudFormation template
- ✅ All secrets managed via GitHub Secrets

The script is designed to be **safe**, **idempotent**, and **error-resistant**!
