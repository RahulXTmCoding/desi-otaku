# Shiprocket Testing Setup Guide

## Important: Shiprocket doesn't have a sandbox mode!

Unlike payment gateways, Shiprocket requires a real account even for testing. Here's how to test safely without incurring charges:

## 1. Create a Test Account

### Step 1: Sign Up
1. Go to https://app.shiprocket.in/register
2. Use your real email and phone number
3. Complete the signup process

### Step 2: Initial Setup (No KYC Required for Testing)
1. **Company Details**: You can use test/dummy company details initially
2. **Pickup Address**: Add a test pickup location
3. **Bank Details**: Skip for now (not needed for testing)

## 2. Testing Without Charges

### Option A: API Testing Only (Recommended)
```javascript
// In your shiprocket service, add a TEST_MODE flag
const TEST_MODE = process.env.NODE_ENV !== 'production';

// Modify your shiprocket service to simulate responses in test mode
async function createOrder(orderData) {
  if (TEST_MODE) {
    // Return simulated response
    return {
      order_id: 'TEST_' + Date.now(),
      shipment_id: 'SHIP_TEST_' + Date.now(),
      status: 'NEW',
      status_code: 1,
      awb_code: null,
      courier_company_id: null,
      courier_name: null
    };
  }
  
  // Real API call for production
  // ... existing code
}
```

### Option B: Real API Testing (Cancel Before Shipping)
1. Create real orders through API
2. **IMPORTANT**: Cancel them immediately before assigning AWB
3. No charges apply if cancelled before shipping label generation

## 3. Update Your Test Environment

### Update .env for Safe Testing:
```env
# Shiprocket Testing Configuration
NODE_ENV=development
SHIPROCKET_EMAIL=your_real_email@example.com
SHIPROCKET_PASSWORD=your_password

# Test Mode Flag
SHIPROCKET_TEST_MODE=true

# Test Pickup Location
PICKUP_PINCODE=110001
PICKUP_NAME=Test Warehouse
PICKUP_PHONE=9999999999
```

## 4. Modified Shiprocket Service for Testing

Update your `server/services/shiprocket.js`:

```javascript
const axios = require('axios');

const TEST_MODE = process.env.SHIPROCKET_TEST_MODE === 'true';

class ShiprocketService {
  constructor() {
    this.token = null;
    this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
  }

  async authenticate() {
    if (TEST_MODE) {
      console.log('🧪 Shiprocket Test Mode: Simulating authentication');
      this.token = 'TEST_TOKEN_' + Date.now();
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      });
      
      this.token = response.data.token;
      return this.token;
    } catch (error) {
      throw new Error('Shiprocket authentication failed');
    }
  }

  async checkServiceability(pincode, weight, cod) {
    if (TEST_MODE) {
      console.log('🧪 Test Mode: Simulating serviceability check');
      // Simulate common pincodes as serviceable
      const serviceablePincodes = ['110001', '400001', '560001', '600001', '700001'];
      return {
        available: serviceablePincodes.includes(pincode),
        courier_companies: [
          { courier_company_id: 1, courier_name: 'Test Courier', rate: 50 }
        ]
      };
    }

    // Real API call
    // ... existing code
  }

  async calculateShipping(pickup_postcode, delivery_postcode, weight, cod) {
    if (TEST_MODE) {
      console.log('🧪 Test Mode: Simulating shipping calculation');
      // Simulate shipping rates
      const baseRate = 50;
      const distanceRate = Math.abs(parseInt(delivery_postcode) - parseInt(pickup_postcode)) * 0.001;
      const weightRate = parseFloat(weight) * 10;
      
      return {
        available_courier_companies: [{
          courier_company_id: 1,
          courier_name: 'Test Express',
          rate: Math.round(baseRate + distanceRate + weightRate),
          estimated_delivery_days: 3
        }]
      };
    }

    // Real API call
    // ... existing code
  }

  async createOrder(orderData) {
    if (TEST_MODE) {
      console.log('🧪 Test Mode: Simulating order creation');
      return {
        order_id: 'TEST_ORD_' + Date.now(),
        shipment_id: 'TEST_SHIP_' + Date.now(),
        status: 'NEW',
        status_code: 1,
        onboarding_completed_now: true,
        awb_code: null,
        courier_company_id: null,
        courier_name: null
      };
    }

    // Real API call
    // ... existing code
  }
}

module.exports = new ShiprocketService();
```

## 5. Testing Checklist

### Safe Testing Steps:
1. **Enable Test Mode**: Set `SHIPROCKET_TEST_MODE=true` in .env
2. **Test Order Flow**:
   - Add products to cart
   - Enter delivery address
   - Check shipping rates (simulated)
   - Complete payment
   - Verify order creation (simulated)

3. **Backend Testing**:
   ```bash
   # Run the test script
   cd server
   node testCheckout.js
   
   # Output should show:
   # 🧪 Shiprocket Test Mode: Simulating authentication
   # ✅ Shiprocket authentication successful
   # 🧪 Test Mode: Simulating serviceability check
   # ✅ Pincode serviceability: Available
   ```

## 6. Production Preparation

### Before Going Live:
1. **Complete KYC**: Upload real business documents
2. **Add Bank Details**: For COD remittance
3. **Verify Pickup Address**: Real warehouse location
4. **Recharge Wallet**: Add funds for shipping
5. **Remove Test Mode**: Set `SHIPROCKET_TEST_MODE=false`

### Production .env:
```env
NODE_ENV=production
SHIPROCKET_TEST_MODE=false
SHIPROCKET_EMAIL=business@yourdomain.com
SHIPROCKET_PASSWORD=secure_password
```

## 7. Common Test Scenarios

### Test Different Shipping Scenarios:
```javascript
// Local delivery (same city)
const local = { from: "110001", to: "110002" };

// Zone delivery (nearby state)  
const zonal = { from: "110001", to: "201301" };

// National delivery (far state)
const national = { from: "110001", to: "560001" };

// Metro to metro
const metro = { from: "110001", to: "400001" };
```

## Important Notes:
- Shiprocket charges are based on actual shipments
- You're only charged when AWB (shipping label) is generated
- Test orders can be cancelled before AWB generation
- Always use TEST_MODE for development to avoid accidental charges
