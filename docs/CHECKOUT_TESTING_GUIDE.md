# Checkout Flow Testing Guide

## 🧪 Complete Testing Setup for Payment & Shipping

### 1. Braintree Payment Testing

#### Local Development Setup:
1. **Get Sandbox Credentials**:
   - Sign up at https://www.braintreepayments.com/sandbox
   - Go to Settings → API Keys
   - Copy your sandbox credentials

2. **Update .env file**:
   ```env
   # Braintree SANDBOX credentials (for testing)
   BRAINTREE_MERCHANT_ID=your_sandbox_merchant_id
   BRAINTREE_PUBLIC_KEY=your_sandbox_public_key
   BRAINTREE_PRIVATE_KEY=your_sandbox_private_key
   ```

3. **Test Credit Cards**:
   ```
   # Successful transactions
   Visa: 4111111111111111
   Mastercard: 5555555555554444
   Discover: 6011111111111117
   
   # Declined transactions
   Visa (Processor Declined): 4000111111111115
   Mastercard (Insufficient Funds): 5105105105105100
   
   # All test cards use:
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVV (e.g., 123)
   ```

### 2. Shiprocket Testing

#### Sandbox Setup:
1. **Create Test Account**:
   - Sign up at https://app.shiprocket.in/register
   - Use sandbox/test mode initially

2. **Update .env for Testing**:
   ```env
   # Shiprocket TEST credentials
   SHIPROCKET_EMAIL=your_email@example.com
   SHIPROCKET_PASSWORD=your_password
   
   # Test pickup location
   PICKUP_PINCODE=110001
   ```

3. **Test Shipping Flow**:
   ```javascript
   // Test pincode pairs for different scenarios
   const testScenarios = {
     local: { from: "110001", to: "110002" },      // Same city
     zonal: { from: "110001", to: "400001" },      // Different state
     national: { from: "110001", to: "600001" },   // Far distance
     metro: { from: "110001", to: "700001" }        // Metro cities
   };
   ```

### 3. Complete Local Testing Workflow

#### Step 1: Environment Setup
```bash
# Backend (.env)
DATABASE=mongodb://localhost:27017/tshirt_test
BRAINTREE_MERCHANT_ID=sandbox_merchant_id
BRAINTREE_PUBLIC_KEY=sandbox_public_key
BRAINTREE_PRIVATE_KEY=sandbox_private_key
SHIPROCKET_EMAIL=test@example.com
SHIPROCKET_PASSWORD=testpassword
EMAIL_SERVICE=development  # Uses Ethereal Email
```

#### Step 2: Test User Creation
```bash
# Run the seed script to create test users
cd server
node seedUsers.js

# Test accounts created:
# Admin: admin@example.com / admin123
# User: user@example.com / user123
```

#### Step 3: Testing Checklist

**Frontend Flow:**
- [ ] Add products to cart
- [ ] View cart with correct calculations
- [ ] Apply coupon codes (if implemented)
- [ ] Fill shipping address
- [ ] Select shipping method
- [ ] Calculate shipping charges
- [ ] Process payment
- [ ] Receive order confirmation

**Backend Validations:**
- [ ] Cart validation
- [ ] Address validation
- [ ] Pincode serviceability check
- [ ] Payment processing
- [ ] Order creation
- [ ] Email notification
- [ ] Shiprocket order creation

### 4. Testing Script

Run the test script to verify connections:
```bash
cd server
node testCheckout.js
```

### 5. Manual Testing Steps

#### Step 1: Start Servers
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Step 2: Create Test Order
1. **Login as test user**: user@example.com / user123
2. **Add products**: Go to Shop → Add 2-3 products
3. **Go to Cart**: Verify total calculations
4. **Proceed to Checkout**:
   - Fill test address
   - Use pincode: 110001 (Delhi)
   - Verify shipping charges appear

#### Step 3: Test Payment
1. **Select Payment Method**: Credit/Debit Card
2. **Use Test Card**:
   ```
   Card: 4111111111111111
   Expiry: 12/25
   CVV: 123
   Name: Test User
   ```
3. **Complete Payment**
4. **Verify Order Confirmation**

### 6. Quick Test Commands

```bash
# Test all services
cd server && node testCheckout.js

# Test specific service
node -e "require('./services/emailService').sendTestEmail('test@test.com')"

# Check Shiprocket pincode
node -e "require('./services/shiprocket').checkServiceability('110001', '1', '500')"
```

### 7. Common Issues & Solutions

**Payment Issues:**
- "Invalid merchant ID" → Check Braintree credentials
- "Transaction declined" → Use correct test card numbers
- "Gateway timeout" → Check internet connection

**Shipping Issues:**
- "Invalid credentials" → Update Shiprocket login
- "Pincode not serviceable" → Try major city pincodes
- "Rate calculation failed" → Check weight/dimensions

**Email Issues:**
- "Authentication failed" → Check email credentials
- "Connection timeout" → Allow less secure apps (Gmail)
- "Template not found" → Check email template paths

### 8. Production Deployment

#### Environment Variables (Production):
```env
# Production Database
DATABASE=mongodb+srv://production_url

# Braintree Production
BRAINTREE_MERCHANT_ID=production_merchant_id
BRAINTREE_PUBLIC_KEY=production_public_key
BRAINTREE_PRIVATE_KEY=production_private_key

# Shiprocket Production
SHIPROCKET_EMAIL=business@yourdomain.com
SHIPROCKET_PASSWORD=secure_password

# Email Production (SendGrid recommended)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Pre-launch Checklist:
- [ ] All test payments successful
- [ ] Shiprocket KYC completed
- [ ] Email domain verified
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Error logging configured
- [ ] Backup system ready

### 9. Quick Reference

**Test Cards:**
- Success: 4111111111111111
- Decline: 4000111111111115
- Insufficient: 5105105105105100

**Test Pincodes:**
- Delhi: 110001
- Mumbai: 400001
- Bangalore: 560001
- Chennai: 600001

**Test Users:**
- Admin: admin@example.com / admin123
- User: user@example.com / user123

**Support Links:**
- Braintree Sandbox: https://sandbox.braintreegateway.com
- Shiprocket Dashboard: https://app.shiprocket.in
- Email Testing: https://ethereal.email
