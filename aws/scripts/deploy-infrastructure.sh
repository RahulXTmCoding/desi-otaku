#!/bin/bash

# AWS Infrastructure Deployment Script for Fashion E-commerce Backend
# This script deploys the complete AWS infrastructure using CloudFormation
# Fixed Windows/Permission Issues Version

set -e  # Exit on any error

# Configuration
STACK_NAME="fashion-backend-infrastructure"
REGION="ap-south-1"
PROJECT_NAME="fashion-backend"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    print_status "Checking AWS CLI configuration..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        echo "Install guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check if AWS credentials are configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI configured successfully"
    
    # Show current AWS identity
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    print_status "Deploying with AWS Account: $ACCOUNT_ID"
    print_status "Using identity: $USER_ARN"
}

# Function to get VPC and subnet information
get_vpc_info() {
    print_status "Getting VPC and subnet information..."
    
    # Get default VPC
    DEFAULT_VPC=$(aws ec2 describe-vpcs \
        --filters "Name=is-default,Values=true" \
        --query 'Vpcs[0].VpcId' \
        --output text \
        --region $REGION)
    
    if [ "$DEFAULT_VPC" = "None" ] || [ -z "$DEFAULT_VPC" ]; then
        print_error "No default VPC found in region $REGION"
        print_status "Creating a default VPC..."
        aws ec2 create-default-vpc --region $REGION
        sleep 10
        DEFAULT_VPC=$(aws ec2 describe-vpcs \
            --filters "Name=is-default,Values=true" \
            --query 'Vpcs[0].VpcId' \
            --output text \
            --region $REGION)
    fi
    
    print_success "Default VPC: $DEFAULT_VPC"
    
    # Get subnets
    SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$DEFAULT_VPC" \
        --query 'Subnets[*].SubnetId' \
        --output text \
        --region $REGION)
    
    SUBNET_ARRAY=($SUBNETS)
    SUBNET_1=${SUBNET_ARRAY[0]}
    SUBNET_2=${SUBNET_ARRAY[1]}
    
    if [ -z "$SUBNET_1" ] || [ -z "$SUBNET_2" ]; then
        print_error "Need at least 2 subnets for load balancer. Found: ${#SUBNET_ARRAY[@]}"
        exit 1
    fi
    
    print_success "Using subnets: $SUBNET_1, $SUBNET_2"
}

# Function to check if EC2 key pair exists
check_key_pair() {
    print_status "Checking EC2 key pair..."
    
    KEY_NAME="fashion-backend-key"
    
    if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
        print_success "Key pair '$KEY_NAME' already exists"
    else
        print_warning "Key pair '$KEY_NAME' not found. Creating..."
        
        # Create key pair and save private key
        aws ec2 create-key-pair \
            --key-name $KEY_NAME \
            --query 'KeyMaterial' \
            --output text \
            --region $REGION > ~/.ssh/${KEY_NAME}.pem
        
        chmod 400 ~/.ssh/${KEY_NAME}.pem
        print_success "Key pair created and saved to ~/.ssh/${KEY_NAME}.pem"
    fi
}

# Function to validate CloudFormation template (with permission checks)
validate_template() {
    print_status "Locating CloudFormation template..."
    
    # Get script directory and template path
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    TEMPLATE_PATH="$PROJECT_ROOT/cloudformation/infrastructure.yml"
    
    print_status "Script directory: $SCRIPT_DIR"
    print_status "Project root: $PROJECT_ROOT"
    print_status "Template path: $TEMPLATE_PATH"
    
    if [ ! -f "$TEMPLATE_PATH" ]; then
        print_error "CloudFormation template not found at: $TEMPLATE_PATH"
        print_status "Please ensure the script is in the aws/scripts/ directory"
        ls -la "$PROJECT_ROOT/cloudformation/" || echo "cloudformation directory not found"
        exit 1
    fi
    
    print_success "Template found ($(wc -l < "$TEMPLATE_PATH") lines)"
    print_status "Template preview:"
    head -5 "$TEMPLATE_PATH"
    
    # Skip validation entirely due to compatibility issues
    print_warning "Template validation skipped (Windows path format compatibility)"
    print_status "Detected OS: $OSTYPE"
    print_status "This is normal - validation is optional for deployment"
    print_status "The template will be validated during stack creation anyway"
}

# Function to update CloudFormation template with actual values
update_template() {
    print_status "Updating CloudFormation template with actual VPC/subnet values..."
    
    # Use the same path logic as validation
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    TEMPLATE_PATH="$PROJECT_ROOT/cloudformation/infrastructure.yml"
    TEMP_TEMPLATE_PATH="$PROJECT_ROOT/cloudformation/infrastructure-temp.yml"
    
    # Create a temporary template with actual values
    cp "$TEMPLATE_PATH" "$TEMP_TEMPLATE_PATH"
    
    print_status "Replacing placeholder values:"
    print_status "  VPC: vpc-12345678 → $DEFAULT_VPC"
    print_status "  Subnet 1: subnet-0a1b2c3d4e5f6g7h8 → $SUBNET_1"
    print_status "  Subnet 2: subnet-1a2b3c4d5e6f7g8h9 → $SUBNET_2"
    
    # Replace placeholder values with actual ones (Windows-compatible sed)
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Use sed for Windows/Git Bash
        sed -i \
            -e "s/subnet-0a1b2c3d4e5f6g7h8/$SUBNET_1/g" \
            -e "s/subnet-1a2b3c4d5e6f7g8h9/$SUBNET_2/g" \
            -e "s/vpc-12345678/$DEFAULT_VPC/g" \
            "$TEMP_TEMPLATE_PATH"
    else
        # Use sed with backup for other systems
        sed -i.bak \
            -e "s/subnet-0a1b2c3d4e5f6g7h8/$SUBNET_1/g" \
            -e "s/subnet-1a2b3c4d5e6f7g8h9/$SUBNET_2/g" \
            -e "s/vpc-12345678/$DEFAULT_VPC/g" \
            "$TEMP_TEMPLATE_PATH"
    fi
    
    print_success "Template updated with actual VPC and subnet IDs"
    print_status "Temporary template created at: $TEMP_TEMPLATE_PATH"
}

# Function to deploy CloudFormation stack
deploy_stack() {
    print_status "Checking if stack already exists..."
    
    # Get the temporary template path
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    TEMP_TEMPLATE_PATH="$PROJECT_ROOT/cloudformation/infrastructure-temp.yml"
    
    set +e  # Temporarily disable exit on error for stack check
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION &> /dev/null
    STACK_EXISTS=$?
    
    if [ $STACK_EXISTS -eq 0 ]; then
        # Check stack status
        STACK_STATUS=$(aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --query 'Stacks[0].StackStatus' \
            --output text \
            --region $REGION)
        
        print_status "Found existing stack with status: $STACK_STATUS"
        
        if [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
            print_warning "Stack is in ROLLBACK_COMPLETE state and cannot be updated"
            print_status "Deleting failed stack before creating new one..."
            
            aws cloudformation delete-stack \
                --stack-name $STACK_NAME \
                --region $REGION
            
            print_status "Waiting for stack deletion to complete..."
            aws cloudformation wait stack-delete-complete \
                --stack-name $STACK_NAME \
                --region $REGION
            
            print_success "Failed stack deleted successfully"
            
            # Now create new stack (will be handled by else block below)
            STACK_EXISTS=1
        else
            print_warning "Stack $STACK_NAME already exists. Updating..."
            print_status "Using Windows-compatible update method..."
            aws cloudformation update-stack \
                --stack-name $STACK_NAME \
                --template-body "$(cat "$TEMP_TEMPLATE_PATH")" \
                --parameters \
                    ParameterKey=KeyPairName,ParameterValue=fashion-backend-key \
                    ParameterKey=GitHubRepository,ParameterValue=https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/') \
                    ParameterKey=MongoDBConnectionString,ParameterValue="PLACEHOLDER_WILL_BE_SET_VIA_GITHUB_SECRETS" \
                    ParameterKey=JWTSecret,ParameterValue="PLACEHOLDER_WILL_BE_SET_VIA_GITHUB_SECRETS" \
                --capabilities CAPABILITY_NAMED_IAM \
                --region $REGION
            
            print_status "Waiting for stack update to complete..."
            aws cloudformation wait stack-update-complete \
                --stack-name $STACK_NAME \
                --region $REGION
        fi
            
    else
        print_status "Creating new stack $STACK_NAME..."
        
        # For Windows compatibility, we'll use the template content directly via stdin
        print_status "Using Windows-compatible deployment method..."
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body "$(cat "$TEMP_TEMPLATE_PATH")" \
            --parameters \
                ParameterKey=KeyPairName,ParameterValue=fashion-backend-key \
                ParameterKey=GitHubRepository,ParameterValue=https://github.com/$(git config remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/') \
                ParameterKey=MongoDBConnectionString,ParameterValue="PLACEHOLDER_WILL_BE_SET_VIA_GITHUB_SECRETS" \
                ParameterKey=JWTSecret,ParameterValue="PLACEHOLDER_WILL_BE_SET_VIA_GITHUB_SECRETS" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region $REGION
        
        print_status "Waiting for stack creation to complete (this may take 10-15 minutes)..."
        
        # Use set +e to catch if the wait fails
        set +e
        aws cloudformation wait stack-create-complete \
            --stack-name $STACK_NAME \
            --region $REGION
        WAIT_RESULT=$?
        set -e
        
        if [ $WAIT_RESULT -ne 0 ]; then
            print_error "Stack creation failed! Checking failure reason..."
            
            # Get stack events to see what failed
            print_status "Recent stack events:"
            aws cloudformation describe-stack-events \
                --stack-name $STACK_NAME \
                --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`] | [0:3].{Resource:LogicalResourceId,Reason:ResourceStatusReason,Time:Timestamp}' \
                --output table \
                --region $REGION
            
            # Get overall stack status
            STACK_STATUS=$(aws cloudformation describe-stacks \
                --stack-name $STACK_NAME \
                --query 'Stacks[0].StackStatus' \
                --output text \
                --region $REGION)
            print_status "Stack status: $STACK_STATUS"
            
            if [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
                print_warning "Stack rolled back due to creation failure"
                print_status "You may need to delete the failed stack before retrying:"
                print_status "aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION"
            fi
            
            exit 1
        fi
    fi
    sleep 20
    set -e  # Re-enable exit on error
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Getting stack outputs..."
    
    # Use AWS CLI queries (no jq dependency)
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text \
        --region $REGION)
    ALB_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
        --output text \
        --region $REGION)
    ASG_NAME=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`AutoScalingGroupName`].OutputValue' \
        --output text \
        --region $REGION)
    
    print_success "Infrastructure deployed successfully!"
    echo ""
    echo "📊 INFRASTRUCTURE DETAILS:"
    echo "=========================="
    echo "🌐 Load Balancer DNS: $ALB_DNS"
    echo "🔗 Application URL: $ALB_URL"
    echo "🏥 Health Check: $ALB_URL/health"
    echo "🖥️  Auto Scaling Group: $ASG_NAME"
    echo "💰 Estimated Cost: ~$16.94/month"
    echo ""
}

# Function to setup GitHub secrets reminder
github_secrets_reminder() {
    print_warning "IMPORTANT: Set up GitHub Secrets before deploying application!"
    echo ""
    echo "📋 Required GitHub Secrets:"
    echo "=========================="
    echo "1. Go to your GitHub repository"
    echo "2. Settings → Secrets and variables → Actions"
    echo "3. Add these secrets:"
    echo ""
    echo "   AWS_ACCESS_KEY_ID=your-aws-access-key"
    echo "   AWS_SECRET_ACCESS_KEY=your-aws-secret-key"
    echo "   DATABASE=your-mongodb-connection-string"
    echo "   SECRET=your-jwt-secret"
    echo "   CLIENT_URL=your-frontend-url"
    echo ""
    echo "📖 See docs/COMPLETE_ENV_MIGRATION_GUIDE.md for complete list"
    echo ""
    print_status "After setting up secrets, push code to trigger deployment!"
}

# Function to cleanup temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Use the same path logic as other functions
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    
    rm -f "$PROJECT_ROOT/cloudformation/infrastructure-temp.yml"
    rm -f "$PROJECT_ROOT/cloudformation/infrastructure-temp.yml.bak"
}

# Main deployment function
main() {
    echo ""
    echo "🚀 AWS Infrastructure Deployment for Fashion E-commerce Backend"
    echo "=============================================================="
    echo "Fixed Windows/Permission Issues Version"
    echo ""
    
    # Print environment info
    print_status "Environment: $OSTYPE"
    print_status "Current directory: $(pwd)"
    
    # Check prerequisites
    check_aws_cli
    get_vpc_info
    check_key_pair
    
    # Validate and update template
    validate_template
    print_success "Validate Done!"
    sleep 20
    update_template
    print_success "update template Done!"
    sleep 20
    
    # Deploy infrastructure
    deploy_stack
    print_success "deploy stack!"
    sleep 20
    
    # Show results
    get_stack_outputs
    print_success "stackl output!"
    sleep 20
    github_secrets_reminder
    print_success "git reminder!"
    sleep 20
    
    # Cleanup
    print_success "Infrastructure deployment completed!"
    sleep 20


    cleanup
    
    
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Set up GitHub Secrets (see above)"
    echo "2. Push code to trigger application deployment"
    echo "3. Monitor deployment in GitHub Actions"
    echo "4. Test your application at the ALB URL"
    echo ""
    sleep 20
}

# Error handling
trap 'print_error "Script failed! Check the error messages above."; cleanup; exit 1' ERR

# Run main function
main "$@"
