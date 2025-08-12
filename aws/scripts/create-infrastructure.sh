#!/bin/bash

# =============================================================================
# AWS Infrastructure Creation Script
# Creates complete production infrastructure for Fashion E-commerce Backend
# =============================================================================

# Disable Git Bash path conversion on Windows to prevent /health becoming C:/Program Files/Git/health
export MSYS_NO_PATHCONV=1

# Parse command line arguments
CONTINUE_ON_ERROR=true
DEBUG=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --continue-on-error)
            CONTINUE_ON_ERROR=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--continue-on-error] [--debug]"
            exit 1
            ;;
    esac
done

# Set error handling based on flag
if [ "$CONTINUE_ON_ERROR" = false ]; then
    set -e  # Exit on any error (default behavior)
else
    echo "🔧 CONTINUE-ON-ERROR MODE: Script will not exit on errors"
fi

if [ "$DEBUG" = true ]; then
    set -x  # Print all commands
    echo "🐛 DEBUG MODE: All commands will be printed"
fi

# Configuration
PROJECT_NAME="fashion-backend"
ENVIRONMENT="production"
REGION="ap-south-1"
PORT="8000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global error tracking
ERRORS=()
WARNINGS=()

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { 
    echo -e "${YELLOW}[WARNING]${NC} $1"
    WARNINGS+=("$1")
}
log_error() { 
    echo -e "${RED}[ERROR]${NC} $1"
    ERRORS+=("$1")
}

# Function to handle command failures
handle_error() {
    local exit_code=$1
    local operation="$2"
    local continue_flag="$3"
    
    if [ $exit_code -ne 0 ]; then
        log_error "$operation failed with exit code $exit_code"
        if [ "$continue_flag" = true ]; then
            log_warning "Continuing despite error due to --continue-on-error flag"
            return 0
        else
            exit $exit_code
        fi
    fi
    return 0
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    # Check region
    aws configure set region $REGION
    log_success "Prerequisites checked"
}

# Get latest Amazon Linux AMI (ARM64 for Graviton)
get_latest_ami() {
    log_info "Getting latest Amazon Linux AMI (ARM64 for Graviton processors)..."
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-*" "Name=architecture,Values=arm64" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
        --output text)
    
    if [ "$AMI_ID" == "None" ] || [ -z "$AMI_ID" ]; then
        log_error "Could not find suitable ARM64 AMI"
        exit 1
    fi
    
    log_success "Using ARM64 AMI for Graviton: $AMI_ID"
}

# Create VPC and networking
create_vpc() {
    log_info "Creating VPC and networking..."
    
    # Check if VPC already exists
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-vpc" \
        --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")
    
    if [ "$VPC_ID" == "None" ]; then
        # Create VPC
        VPC_ID=$(aws ec2 create-vpc \
            --cidr-block 10.0.0.0/16 \
            --query 'Vpc.VpcId' --output text)
        
        aws ec2 create-tags \
            --resources $VPC_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-vpc
        
        # Enable DNS hostnames
        aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
        
        log_success "Created VPC: $VPC_ID"
    else
        log_warning "VPC already exists: $VPC_ID"
    fi
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-igw" \
        --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || echo "None")
    
    if [ "$IGW_ID" == "None" ]; then
        IGW_ID=$(aws ec2 create-internet-gateway \
            --query 'InternetGateway.InternetGatewayId' --output text)
        
        aws ec2 create-tags \
            --resources $IGW_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-igw
        
        aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
        
        log_success "Created Internet Gateway: $IGW_ID"
    else
        log_warning "Internet Gateway already exists: $IGW_ID"
    fi
    
    # Get availability zones
    AZ1=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[0].ZoneName' --output text)
    AZ2=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[1].ZoneName' --output text)
    
    # Create subnets
    SUBNET1_ID=$(aws ec2 describe-subnets \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-subnet-1" \
        --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
    
    if [ "$SUBNET1_ID" == "None" ]; then
        SUBNET1_ID=$(aws ec2 create-subnet \
            --vpc-id $VPC_ID \
            --cidr-block 10.0.1.0/24 \
            --availability-zone $AZ1 \
            --query 'Subnet.SubnetId' --output text)
        
        aws ec2 create-tags \
            --resources $SUBNET1_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-subnet-1
        
        aws ec2 modify-subnet-attribute --subnet-id $SUBNET1_ID --map-public-ip-on-launch
        
        log_success "Created Subnet 1: $SUBNET1_ID"
    else
        log_warning "Subnet 1 already exists: $SUBNET1_ID"
    fi
    
    SUBNET2_ID=$(aws ec2 describe-subnets \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-subnet-2" \
        --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
    
    if [ "$SUBNET2_ID" == "None" ]; then
        SUBNET2_ID=$(aws ec2 create-subnet \
            --vpc-id $VPC_ID \
            --cidr-block 10.0.2.0/24 \
            --availability-zone $AZ2 \
            --query 'Subnet.SubnetId' --output text)
        
        aws ec2 create-tags \
            --resources $SUBNET2_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-subnet-2
        
        aws ec2 modify-subnet-attribute --subnet-id $SUBNET2_ID --map-public-ip-on-launch
        
        log_success "Created Subnet 2: $SUBNET2_ID"
    else
        log_warning "Subnet 2 already exists: $SUBNET2_ID"
    fi
    
    # Create route table
    RT_ID=$(aws ec2 describe-route-tables \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-rt" \
        --query 'RouteTables[0].RouteTableId' --output text 2>/dev/null || echo "None")
    
    if [ "$RT_ID" == "None" ]; then
        RT_ID=$(aws ec2 create-route-table \
            --vpc-id $VPC_ID \
            --query 'RouteTable.RouteTableId' --output text)
        
        aws ec2 create-tags \
            --resources $RT_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-rt
        
        # Create route to internet gateway
        aws ec2 create-route \
            --route-table-id $RT_ID \
            --destination-cidr-block 0.0.0.0/0 \
            --gateway-id $IGW_ID
        
        # Associate with subnets
        aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $RT_ID
        aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $RT_ID
        
        log_success "Created Route Table: $RT_ID"
    else
        log_warning "Route Table already exists: $RT_ID"
    fi
}

# Create security groups
create_security_groups() {
    log_info "Creating security groups..."
    
    # ALB Security Group
    ALB_SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-alb-sg" \
        --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")
    
    if [ "$ALB_SG_ID" == "None" ]; then
        ALB_SG_ID=$(aws ec2 create-security-group \
            --group-name ${PROJECT_NAME}-${ENVIRONMENT}-alb-sg \
            --description "ALB Security Group" \
            --vpc-id $VPC_ID \
            --query 'GroupId' --output text)
        
        aws ec2 create-tags \
            --resources $ALB_SG_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-alb-sg
        
        # ALB rules
        aws ec2 authorize-security-group-ingress \
            --group-id $ALB_SG_ID \
            --protocol tcp --port 80 --cidr 0.0.0.0/0
        
        aws ec2 authorize-security-group-ingress \
            --group-id $ALB_SG_ID \
            --protocol tcp --port 443 --cidr 0.0.0.0/0
        
        log_success "Created ALB Security Group: $ALB_SG_ID"
    else
        log_warning "ALB Security Group already exists: $ALB_SG_ID"
    fi
    
    # Instance Security Group
    INSTANCE_SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-instance-sg" \
        --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")
    
    if [ "$INSTANCE_SG_ID" == "None" ]; then
        INSTANCE_SG_ID=$(aws ec2 create-security-group \
            --group-name ${PROJECT_NAME}-${ENVIRONMENT}-instance-sg \
            --description "Instance Security Group" \
            --vpc-id $VPC_ID \
            --query 'GroupId' --output text)
        
        aws ec2 create-tags \
            --resources $INSTANCE_SG_ID \
            --tags Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-instance-sg
        
        # Instance rules - No SSH needed for modern deployment
        aws ec2 authorize-security-group-ingress \
            --group-id $INSTANCE_SG_ID \
            --protocol tcp --port $PORT --source-group $ALB_SG_ID
        
        log_success "Created Instance Security Group: $INSTANCE_SG_ID"
    else
        log_warning "Instance Security Group already exists: $INSTANCE_SG_ID"
    fi
}

# Create IAM role
create_iam_role() {
    log_info "Creating IAM role..."
    
    ROLE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-ec2-role"
    sleep 10
    # Check if role exists
    if aws iam get-role --role-name $ROLE_NAME &>/dev/null; then
        log_warning "IAM role already exists: $ROLE_NAME"
        sleep 10
    else
        # Trust policy - use current directory instead of /tmp for Windows compatibility
        cat > ./trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

        # Create role
        sleep 5
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document file://trust-policy.json
        sleep 5
        # Attach policies
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
        sleep 5
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
        sleep 5
        
        # Create custom policy for Parameter Store access
        cat > ./parameter-store-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": [
                "arn:aws:ssm:${REGION}:*:parameter/${PROJECT_NAME}/${ENVIRONMENT}/*"
            ]
        }
    ]
}
EOF
        
        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name "ParameterStoreAccess" \
            --policy-document file://parameter-store-policy.json
        sleep 5
        log_success "Created IAM role: $ROLE_NAME"
    fi
    
    # Create instance profile
    PROFILE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-instance-profile"
    
    if aws iam get-instance-profile --instance-profile-name $PROFILE_NAME &>/dev/null; then
        log_warning "Instance profile already exists: $PROFILE_NAME"
    else
        aws iam create-instance-profile --instance-profile-name $PROFILE_NAME
        aws iam add-role-to-instance-profile \
            --instance-profile-name $PROFILE_NAME \
            --role-name $ROLE_NAME
        
        log_success "Created instance profile: $PROFILE_NAME"
        
        # Wait for instance profile to be ready
        log_info "Waiting for instance profile to be available..."
        sleep 10
    fi
}

# Create Launch Template
create_launch_template() {
    log_info "Creating launch template..."
    
    TEMPLATE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-lt"
    
    # Check if template exists
    if aws ec2 describe-launch-templates --launch-template-names $TEMPLATE_NAME &>/dev/null; then
        log_warning "Launch template already exists: $TEMPLATE_NAME"
        return
    fi
    
    # Verify required variables are set
    if [ -z "$AMI_ID" ] || [ -z "$INSTANCE_SG_ID" ] || [ -z "$PROFILE_NAME" ]; then
        log_error "Required variables not set: AMI_ID=$AMI_ID, INSTANCE_SG_ID=$INSTANCE_SG_ID, PROFILE_NAME=$PROFILE_NAME"
        exit 1
    fi
    
    log_info "Using AMI: $AMI_ID"
    log_info "Using Security Group: $INSTANCE_SG_ID"
    log_info "Using Instance Profile: $PROFILE_NAME"
    
    # User data script - Enhanced with auto-deployment capability
    cat > ./user-data.sh << 'EOF'
#!/bin/bash
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Create log directory
mkdir -p /var/log/pm2
chown ec2-user:ec2-user /var/log/pm2

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Function to get parameter from Parameter Store
get_parameter() {
    local param_name=$1
    aws ssm get-parameter --name "/fashion-backend/production/$param_name" --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo ""
}

# Function to deploy application
deploy_application() {
    echo "🚀 Starting application deployment..."
    
    cd /opt/app
    
    # Stop any existing processes
    pm2 delete all || true
    
    # Remove old application if exists
    rm -rf current
    
    # Clone application from GitHub
    echo "⬇️ Cloning application from GitHub..."
    git clone https://github.com/RahulXTmCoding/desi-otaku.git current
    
    if [ ! -d "current/server" ]; then
        echo "❌ Server directory not found in repository"
        return 1
    fi
    
    cd current/server
    
    # Install dependencies
    echo "📚 Installing dependencies..."
    npm install --production --silent
    
    # Verify app.js exists
    if [ ! -f "app.js" ]; then
        echo "❌ app.js not found!"
        return 1
    fi
    
    # Create environment file from Parameter Store
    echo "🔐 Setting up environment variables..."
    cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=8000
ENV_EOF
    
    # Get environment variables from Parameter Store
    DATABASE=$(get_parameter "DATABASE")
    SECRET=$(get_parameter "SECRET")
    CLIENT_URL=$(get_parameter "CLIENT_URL")
    RAZORPAY_KEY_ID=$(get_parameter "RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET=$(get_parameter "RAZORPAY_KEY_SECRET")
    BREVO_API_KEY=$(get_parameter "BREVO_API_KEY")
    BREVO_SENDER_EMAIL=$(get_parameter "BREVO_SENDER_EMAIL")
    MSG91_AUTH_KEY=$(get_parameter "MSG91_AUTH_KEY")
    REDIS_URL=$(get_parameter "REDIS_URL")
    
    # Add environment variables to .env file
    [ -n "$DATABASE" ] && echo "DATABASE=$DATABASE" >> .env
    [ -n "$SECRET" ] && echo "SECRET=$SECRET" >> .env
    [ -n "$CLIENT_URL" ] && echo "CLIENT_URL=$CLIENT_URL" >> .env
    [ -n "$RAZORPAY_KEY_ID" ] && echo "RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID" >> .env
    [ -n "$RAZORPAY_KEY_SECRET" ] && echo "RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET" >> .env
    [ -n "$BREVO_API_KEY" ] && echo "BREVO_API_KEY=$BREVO_API_KEY" >> .env
    [ -n "$BREVO_SENDER_EMAIL" ] && echo "BREVO_SENDER_EMAIL=$BREVO_SENDER_EMAIL" >> .env
    [ -n "$MSG91_AUTH_KEY" ] && echo "MSG91_AUTH_KEY=$MSG91_AUTH_KEY" >> .env
    [ -n "$REDIS_URL" ] && echo "REDIS_URL=$REDIS_URL" >> .env
    
    # Secure the .env file
    chmod 600 .env
    
    # Create PM2 ecosystem config
    cat > ecosystem.config.js << 'ECOSYSTEM_EOF'
module.exports = {
  apps: [{
    name: 'fashion-backend',
    script: './app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: '/var/log/pm2/err.log',
    out_file: '/var/log/pm2/out.log',
    log_file: '/var/log/pm2/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '800M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
ECOSYSTEM_EOF
    
    # Start application with PM2
    echo "🚀 Starting application..."
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "✅ Application deployed successfully!"
    pm2 list
    
    return 0
}

# Try to deploy application if parameters exist, otherwise start health check
if aws ssm get-parameter --name "/fashion-backend/production/DATABASE" --with-decryption &>/dev/null; then
    echo "🔍 Found application parameters, deploying application..."
    if deploy_application; then
        echo "✅ Application deployment completed successfully"
    else
        echo "⚠️ Application deployment failed, starting health check server"
        # Fall back to health check server
        cd /opt/app
        
        cat > health-check.js << 'HEALTH_EOF'
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ready-for-deployment', 
    timestamp: new Date().toISOString(),
    service: 'fashion-backend-infrastructure',
    architecture: 'ARM64-Graviton',
    note: 'Waiting for application deployment via GitHub Actions'
  });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});
HEALTH_EOF

        npm init -y
        npm install express
        pm2 start health-check.js --name temp-health-check
        pm2 save
    fi
else
    echo "⏳ No application parameters found, starting health check server..."
    cd /opt/app
    
    cat > health-check.js << 'HEALTH_EOF'
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ready-for-deployment', 
    timestamp: new Date().toISOString(),
    service: 'fashion-backend-infrastructure',
    architecture: 'ARM64-Graviton',
    note: 'Waiting for environment variables via GitHub Actions'
  });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});
HEALTH_EOF

    npm init -y
    npm install express
    pm2 start health-check.js --name temp-health-check
    pm2 save
fi

# Set up PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo "✅ Instance setup completed - ready for SSH-free deployment!"
EOF

    # Encode user data (compatible across different systems)
    if command -v base64 >/dev/null 2>&1; then
        if base64 --help 2>&1 | grep -q "\-w"; then
            USER_DATA=$(base64 -w 0 ./user-data.sh)
        else
            USER_DATA=$(base64 ./user-data.sh | tr -d '\n')
        fi
    else
        log_error "base64 command not found"
        exit 1
    fi
    
    # Create launch template data in current directory to avoid JSON formatting issues
    cat > ./launch-template-data.json << EOF
{
    "ImageId": "${AMI_ID}",
    "InstanceType": "t4g.micro",
    "SecurityGroupIds": ["${INSTANCE_SG_ID}"],
    "IamInstanceProfile": {"Name": "${PROFILE_NAME}"},
    "UserData": "${USER_DATA}",
    "TagSpecifications": [{
        "ResourceType": "instance",
        "Tags": [
            {"Key": "Name", "Value": "${PROJECT_NAME}-${ENVIRONMENT}-graviton-instance"},
            {"Key": "Environment", "Value": "${ENVIRONMENT}"},
            {"Key": "Project", "Value": "${PROJECT_NAME}"},
            {"Key": "Architecture", "Value": "ARM64-Graviton"}
        ]
    }],
    "Monitoring": {"Enabled": true}
}
EOF
    
    log_info "Creating launch template with JSON file..."
    # Create launch template with Graviton instances
    aws ec2 create-launch-template \
        --launch-template-name $TEMPLATE_NAME \
        --launch-template-data file://launch-template-data.json
    
    if [ $? -eq 0 ]; then
        log_success "Created launch template: $TEMPLATE_NAME"
    else
        log_error "Failed to create launch template"
        log_info "Launch template data:"
        cat ./launch-template-data.json
        exit 1
    fi
}

# Create Application Load Balancer
create_load_balancer() {
    log_info "Creating Application Load Balancer..."
    
    ALB_NAME="${PROJECT_NAME}-${ENVIRONMENT}-alb"
    
    # Check if ALB exists
    ALB_ARN=$(aws elbv2 describe-load-balancers \
        --names $ALB_NAME \
        --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || echo "None")
    
    if [ "$ALB_ARN" == "None" ]; then
        ALB_ARN=$(aws elbv2 create-load-balancer \
            --name $ALB_NAME \
            --subnets $SUBNET1_ID $SUBNET2_ID \
            --security-groups $ALB_SG_ID \
            --query 'LoadBalancers[0].LoadBalancerArn' --output text)
        
        log_success "Created ALB: $ALB_ARN"
    else
        log_warning "ALB already exists: $ALB_ARN"
    fi
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns $ALB_ARN \
        --query 'LoadBalancers[0].DNSName' --output text)
    
    # Create target group
    TG_NAME="${PROJECT_NAME}-${ENVIRONMENT}-tg"
    
    TG_ARN=$(aws elbv2 describe-target-groups \
        --names $TG_NAME \
        --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "None")
    
    if [ "$TG_ARN" == "None" ]; then
        # Disable Git Bash path conversion for this command
        MSYS_NO_PATHCONV=1 TG_ARN=$(aws elbv2 create-target-group \
            --name $TG_NAME \
            --protocol HTTP \
            --port $PORT \
            --vpc-id $VPC_ID \
            --health-check-path /health \
            --health-check-interval-seconds 30 \
            --health-check-timeout-seconds 5 \
            --healthy-threshold-count 2 \
            --unhealthy-threshold-count 3 \
            --query 'TargetGroups[0].TargetGroupArn' --output text)
        
        log_success "Created Target Group: $TG_ARN"
    else
        log_warning "Target Group already exists: $TG_ARN"
    fi
    
    # Create listener
    LISTENER_ARN=$(aws elbv2 describe-listeners \
        --load-balancer-arn $ALB_ARN \
        --query 'Listeners[0].ListenerArn' --output text 2>/dev/null || echo "None")
    
    if [ "$LISTENER_ARN" == "None" ]; then
        aws elbv2 create-listener \
            --load-balancer-arn $ALB_ARN \
            --protocol HTTP \
            --port 80 \
            --default-actions Type=forward,TargetGroupArn=$TG_ARN
        
        log_success "Created ALB Listener"
    else
        log_warning "ALB Listener already exists"
    fi
}

# Create Auto Scaling Group
create_auto_scaling_group() {
    log_info "Creating Auto Scaling Group..."
    
    ASG_NAME="${PROJECT_NAME}-${ENVIRONMENT}-asg"
    
    # Check if required dependencies exist
    if [ -z "$TG_ARN" ] || [ "$TG_ARN" = "None" ]; then
        log_error "Cannot create ASG: Target Group ARN is missing or invalid: $TG_ARN"
        # return 1
    fi
    
    if [ -z "$SUBNET1_ID" ] || [ -z "$SUBNET2_ID" ]; then
        log_error "Cannot create ASG: Subnet IDs are missing: SUBNET1_ID=$SUBNET1_ID, SUBNET2_ID=$SUBNET2_ID"
        # return 1
    fi
    
    # Check if ASG exists or is pending deletion
    log_info "Checking Auto Scaling Group status..."
    ASG_STATUS=""
    
    # Try to get ASG details
    ASG_INFO=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --query 'AutoScalingGroups[0].[AutoScalingGroupName,Status]' --output text 2>/dev/null || echo "None None")
    ASG_EXISTS=$(echo $ASG_INFO | cut -f1)
    ASG_STATUS=$(echo $ASG_INFO | cut -f2)
    
    if [ "$ASG_EXISTS" != "None" ]; then
        if [ "$ASG_STATUS" = "Delete in progress" ]; then
            log_warning "Auto Scaling Group is pending deletion. Waiting for deletion to complete..."
            
            # Wait for deletion to complete
            MAX_WAIT=600  # 10 minutes
            WAIT_TIME=0
            SLEEP_INTERVAL=15
            
            while [ $WAIT_TIME -lt $MAX_WAIT ]; do
                if ! aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME &>/dev/null; then
                    log_success "Auto Scaling Group deletion completed"
                    break
                fi
                
                echo "⏳ Still waiting for ASG deletion... ($((WAIT_TIME/60))m $((WAIT_TIME%60))s elapsed)"
                sleep $SLEEP_INTERVAL
                WAIT_TIME=$((WAIT_TIME + SLEEP_INTERVAL))
            done
            
            if [ $WAIT_TIME -ge $MAX_WAIT ]; then
                log_error "Timeout waiting for Auto Scaling Group deletion. Please wait and try again later."
                log_info "💡 You can check deletion status with: aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME"
                return 1
            fi
        else
            log_warning "Auto Scaling Group already exists: $ASG_NAME (Status: $ASG_STATUS)"
            return 0
        fi
    fi
    
    log_info "Creating ASG with Target Group: $TG_ARN"
    log_info "Using subnets: $SUBNET1_ID, $SUBNET2_ID"
    
    # Create ASG
    if aws autoscaling create-auto-scaling-group \
        --auto-scaling-group-name $ASG_NAME \
        --launch-template "LaunchTemplateName=${PROJECT_NAME}-${ENVIRONMENT}-lt,Version=\$Latest" \
        --min-size 1 \
        --max-size 4 \
        --desired-capacity 2 \
        --target-group-arns $TG_ARN \
        --health-check-type ELB \
        --health-check-grace-period 300 \
        --vpc-zone-identifier "${SUBNET1_ID},${SUBNET2_ID}" \
        --tags "Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}-asg-instance,PropagateAtLaunch=true" \
               "Key=Environment,Value=${ENVIRONMENT},PropagateAtLaunch=true" \
               "Key=Project,Value=${PROJECT_NAME},PropagateAtLaunch=true"; then
        
        log_success "Created Auto Scaling Group: $ASG_NAME"
        
        # Create scaling policy
        if aws autoscaling put-scaling-policy \
            --policy-name "${ASG_NAME}-target-tracking-policy" \
            --auto-scaling-group-name $ASG_NAME \
            --policy-type TargetTrackingScaling \
            --target-tracking-configuration "{
                \"PredefinedMetricSpecification\": {
                    \"PredefinedMetricType\": \"ASGAverageCPUUtilization\"
                },
                \"TargetValue\": 70.0
            }"; then
            log_success "Created scaling policy"
        else
            log_error "Failed to create scaling policy"
        fi
    else
        log_error "Failed to create Auto Scaling Group"
        return 1
    fi
}

# Generate outputs
generate_outputs() {
    log_info "Generating outputs..."
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names ${PROJECT_NAME}-${ENVIRONMENT}-alb \
        --query 'LoadBalancers[0].DNSName' --output text)
    
    # Get ASG name
    ASG_NAME="${PROJECT_NAME}-${ENVIRONMENT}-asg"
    
    # Create outputs file
    cat > aws/infrastructure-outputs.txt << EOF
Infrastructure Creation Complete!
================================

VPC ID: $VPC_ID
Subnet 1 ID: $SUBNET1_ID
Subnet 2 ID: $SUBNET2_ID
Load Balancer DNS: $ALB_DNS
Load Balancer URL: http://$ALB_DNS
Auto Scaling Group: $ASG_NAME
Target Group ARN: $TG_ARN
Instance Security Group: $INSTANCE_SG_ID

Next Steps:
===========
1. Set up GitHub Secrets (see docs/GITHUB_SECRETS_COMPLETE_SETUP.md)
2. Push code to main branch to trigger deployment
3. Access your application at: http://$ALB_DNS

Note: It may take 5-10 minutes for instances to be fully ready.
EOF

    log_success "Infrastructure outputs saved to aws/infrastructure-outputs.txt"
    
    echo ""
    echo "=========================================="
    echo "🎉 INFRASTRUCTURE CREATION COMPLETE! 🎉"
    echo "=========================================="
    echo ""
    echo "🌐 Your backend will be available at:"
    echo "   http://$ALB_DNS"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Set up GitHub Secrets"
    echo "   2. Push code to deploy"
    echo "   3. Test at http://$ALB_DNS/health"
    echo ""
    echo "💰 Estimated monthly cost: ~$15 (20% savings with ARM64 Graviton processors)"
    echo "=========================================="
}

# Show final summary
show_summary() {
    echo ""
    echo "=========================================="
    echo "📊 EXECUTION SUMMARY"
    echo "=========================================="
    
    if [ ${#ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
        echo "✅ All steps completed successfully!"
    else
        if [ ${#WARNINGS[@]} -gt 0 ]; then
            echo ""
            echo "⚠️  WARNINGS (${#WARNINGS[@]}):"
            for warning in "${WARNINGS[@]}"; do
                echo "   • $warning"
            done
        fi
        
        if [ ${#ERRORS[@]} -gt 0 ]; then
            echo ""
            echo "❌ ERRORS (${#ERRORS[@]}):"
            for error in "${ERRORS[@]}"; do
                echo "   • $error"
            done
            echo ""
            echo "💡 Check the logs above for detailed error information"
        fi
    fi
    
    echo ""
    echo "📋 Use these commands to debug:"
    echo "   # Check infrastructure status"
    echo "   aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names fashion-backend-production-asg"
    echo "   aws elbv2 describe-load-balancers --names fashion-backend-production-alb"
    echo "   aws ec2 describe-launch-templates --launch-template-names fashion-backend-production-lt"
    echo ""
    echo "🔧 To continue on errors, run:"
    echo "   ./aws/scripts/create-infrastructure.sh --continue-on-error"
    echo ""
    echo "🐛 For detailed debugging, run:"
    echo "   ./aws/scripts/create-infrastructure.sh --continue-on-error --debug"
    echo "=========================================="
}

# Main execution
main() {
    echo "=========================================="
    echo "🚀 AWS Infrastructure Creation Script"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    get_latest_ami
    create_vpc
    create_security_groups
    create_iam_role
    create_launch_template
    create_load_balancer
    sleep 10
    create_auto_scaling_group
    sleep 10
    generate_outputs
    
    # Show summary of any issues
    show_summary
    
    # Cleanup temp files
    rm -f ./trust-policy.json ./user-data.sh ./launch-template-data.json
    
    # Exit with error code if there were errors
    if [ ${#ERRORS[@]} -gt 0 ]; then
        exit 1
    fi
}

# Run main function
main "$@"
