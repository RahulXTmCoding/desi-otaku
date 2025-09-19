#!/bin/bash

# Zero-Downtime Deployment Testing Script
# Run this script during deployment to verify no downtime occurs

echo "🧪 Zero-Downtime Deployment Testing Script"
echo "=========================================="

# Configuration
ALB_DNS=""
TEST_DURATION=1800  # 30 minutes (covers full deployment)
LOG_FILE="deployment-test-$(date +%Y%m%d-%H%M%S).log"
FAILED_REQUESTS=0
TOTAL_REQUESTS=0
START_TIME=$(date +%s)

# Get ALB DNS from user input
read -p "Enter your Load Balancer DNS (e.g., fashion-backend-production-alb-123456.ap-south-1.elb.amazonaws.com): " ALB_DNS

if [ -z "$ALB_DNS" ]; then
    echo "❌ Load Balancer DNS is required!"
    exit 1
fi

echo "🎯 Testing endpoint: http://$ALB_DNS/health"
echo "⏱️ Test duration: $TEST_DURATION seconds (30 minutes)"
echo "📝 Log file: $LOG_FILE"
echo ""

# Initialize log file
echo "Zero-Downtime Deployment Test - $(date)" > "$LOG_FILE"
echo "Endpoint: http://$ALB_DNS/health" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"

# Test function
test_endpoint() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local response
    local http_code
    local response_time
    
    # Make request with timeout
    response=$(curl -s -w "%{http_code}:%{time_total}" -m 5 "http://$ALB_DNS/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        http_code=$(echo "$response" | tail -c 10 | cut -d: -f1)
        response_time=$(echo "$response" | tail -c 10 | cut -d: -f2)
        
        if [ "$http_code" = "200" ]; then
            echo "✅ [$timestamp] HTTP $http_code - ${response_time}s"
            echo "[$timestamp] SUCCESS: HTTP $http_code - ${response_time}s" >> "$LOG_FILE"
        else
            echo "⚠️ [$timestamp] HTTP $http_code - ${response_time}s"
            echo "[$timestamp] WARNING: HTTP $http_code - ${response_time}s" >> "$LOG_FILE"
            ((FAILED_REQUESTS++))
        fi
    else
        echo "❌ [$timestamp] REQUEST FAILED"
        echo "[$timestamp] ERROR: Request failed" >> "$LOG_FILE"
        ((FAILED_REQUESTS++))
    fi
    
    ((TOTAL_REQUESTS++))
}

# Cleanup function
cleanup() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local success_rate=$(( (TOTAL_REQUESTS - FAILED_REQUESTS) * 100 / TOTAL_REQUESTS ))
    
    echo ""
    echo "🏁 Test Summary"
    echo "==============="
    echo "⏱️ Duration: ${duration} seconds"
    echo "📊 Total requests: $TOTAL_REQUESTS"
    echo "❌ Failed requests: $FAILED_REQUESTS"
    echo "✅ Success rate: ${success_rate}%"
    
    if [ $FAILED_REQUESTS -eq 0 ]; then
        echo "🎉 ZERO DOWNTIME ACHIEVED! 🎉"
        echo "✅ No failed requests during deployment"
    elif [ $FAILED_REQUESTS -lt 5 ]; then
        echo "⚠️ MINIMAL DOWNTIME (${FAILED_REQUESTS} failures)"
        echo "💡 Consider fine-tuning deployment settings"
    else
        echo "❌ DOWNTIME DETECTED (${FAILED_REQUESTS} failures)"
        echo "🔧 Review deployment configuration"
    fi
    
    echo ""
    echo "📝 Detailed log saved to: $LOG_FILE"
    
    # Save summary to log
    echo "" >> "$LOG_FILE"
    echo "=== TEST SUMMARY ===" >> "$LOG_FILE"
    echo "Duration: ${duration} seconds" >> "$LOG_FILE"
    echo "Total requests: $TOTAL_REQUESTS" >> "$LOG_FILE"
    echo "Failed requests: $FAILED_REQUESTS" >> "$LOG_FILE"
    echo "Success rate: ${success_rate}%" >> "$LOG_FILE"
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🚀 Starting zero-downtime test..."
echo "💡 Press Ctrl+C to stop the test early"
echo ""

# Main testing loop
while [ $(($(date +%s) - START_TIME)) -lt $TEST_DURATION ]; do
    test_endpoint
    sleep 2  # Test every 2 seconds
done

# Test completed naturally
cleanup
