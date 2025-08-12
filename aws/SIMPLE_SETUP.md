# Simple AWS Setup - Single EC2 Instance

Instead of the complex CloudFormation template, here's a super simple way to get your fashion backend running on AWS in 10 minutes.

## 🚀 Quick Setup (Total Cost: ~$3.50/month)

### Step 1: Launch EC2 Instance
1. **Go to AWS Console** → EC2 → Launch Instance
2. **Choose AMI**: Amazon Linux 2 (Free tier eligible)
3. **Instance Type**: t2.micro (Free tier - $0/month for 12 months, then $8.50/month)
4. **Key Pair**: Create new or use existing
5. **Security Group**: Create new with these rules:
   - SSH (22) - Your IP only
   - HTTP (80) - Anywhere (0.0.0.0/0)
   - Custom TCP (3000) - Anywhere (0.0.0.0/0)
6. **Storage**: 8 GB (Free tier)
7. **Launch**

### Step 2: Connect & Setup (5 minutes)
```bash
# Connect to your instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2
sudo npm install -g pm2

# Clone your repo
git clone https://github.com/RahulXTmCoding/desi-otaku.git
cd desi-otaku/server

# Install dependencies
npm install --production

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
EOF

# Start application
pm2 start app.js --name fashion-backend
pm2 save
pm2 startup
```

### Step 3: Setup Domain (Optional)
1. **Get instance public IP** from AWS Console
2. **Test**: Visit `http://your-ip:3000/health`
3. **Domain**: Point your domain to the IP address

## 💰 Total Monthly Cost
- **t2.micro**: $8.50/month (FREE for first 12 months)
- **8 GB Storage**: $0.80/month
- **Data Transfer**: ~$1/month
- **Total**: ~$3.50/month (after free tier)

## 🎯 Benefits of Simple Setup
- ✅ **Works immediately** - No complex CloudFormation
- ✅ **Easy debugging** - Direct SSH access
- ✅ **Cost effective** - Under $4/month
- ✅ **Scalable later** - Can upgrade when needed
- ✅ **No Windows path issues** - Everything runs on Linux

## 🔧 Quick Commands
```bash
# View logs
pm2 logs fashion-backend

# Restart app
pm2 restart fashion-backend

# Update code
cd desi-otaku && git pull && pm2 restart fashion-backend

# Monitor performance
pm2 monit
```

## 🚀 Alternative: Use Railway (Even Simpler!)

If you want even simpler, use Railway.app:

1. **Go to** [railway.app](https://railway.app)
2. **Connect GitHub** repo
3. **Deploy** - Done in 30 seconds!
4. **Cost**: $5/month, includes database
5. **Domain**: Automatic HTTPS domain provided

Railway will:
- ✅ Auto-deploy from GitHub
- ✅ Handle environment variables
- ✅ Provide HTTPS domain
- ✅ Scale automatically
- ✅ Zero configuration needed

## 🤔 Which Should You Choose?

### Choose **Railway** if:
- You want zero configuration
- You don't mind $5/month
- You want automatic deployments

### Choose **EC2** if:
- You want to learn AWS
- You want lowest cost (~$3.50/month)
- You need full control

Both will get your backend online in under 10 minutes!
