# Razorpay COD Setup Requirements & Troubleshooting

## 🚨 **Why COD Might Not Appear**

COD (Cash on Delivery) in Razorpay has specific requirements that must be met:

### **1. Account Level Requirements**
- COD must be **enabled in your Razorpay Dashboard** first
- Go to: Dashboard → Settings → Payment Methods → Enable COD
- Your account must be **KYC verified** and **activated**
- COD is **NOT available in test mode** - only in live mode

### **2. Order Requirements**
- COD typically has **minimum order limits** (usually ₹100+)
- **Delivery pincode verification** - COD not available in all areas
- **Customer phone number** must be valid and verified

### **3. Current Issue: Test Mode**
**The main issue is that we're testing in development mode.** Razorpay's COD feature:
- ✅ Shows in **LIVE/Production mode**
- ❌ Does **NOT show in TEST mode**

## 🔧 **Correct Implementation Steps**

### **Step 1: Enable COD in Razorpay Dashboard**
1. Log into your **Live Razorpay Dashboard** (not test)
2. Go to **Settings** → **Payment Methods**
3. Enable **COD (Cash on Delivery)**
4. Set your COD configuration:
   - Minimum order value (e.g., ₹100)
   - Maximum order value (e.g., ₹50,000)
   - Allowed delivery areas/pincodes

### **Step 2: Update Frontend Configuration**
```javascript
// In razorpayHelper.tsx - COD configuration
const razorpayOptions = {
  key: key_id,
  amount: amount,
  currency: currency || 'INR',
  order_id: order_id,
  
  // ✅ CORRECT COD configuration
  method: {
    cod: true,          // Enable COD
    card: true,         // Enable Cards
    upi: true,          // Enable UPI
    wallet: true,       // Enable Wallets
    netbanking: true    // Enable NetBanking
  },
  
  // ✅ COD-specific settings
  cod: {
    amount_payable: 0   // For pure COD (0 advance payment)
  },
  
  prefill: {
    name: prefill?.name || '',
    email: prefill?.email || '',
    contact: prefill?.phone || ''  // REQUIRED for COD
  },
  
  handler: function(response) {
    // Handle both online payment AND COD selection
    console.log('Payment/COD Response:', response);
    onSuccess(response);
  }
};
```

### **Step 3: Backend COD Support**
Ensure your backend can handle COD orders:

```javascript
// In your order creation API
if (paymentMethod === 'cod') {
  // Create order with COD status
  const order = {
    ...orderData,
    paymentStatus: 'pending',
    paymentMethod: 'cod',
    codAmount: finalAmount,
    // No payment_id for COD initially
  };
}
```

## 🧪 **Testing COD Properly**

### **Method 1: Live Mode Testing (Recommended)**
1. Switch to **Live Razorpay keys**
2. Place a **real test order** with small amount
3. Verify COD appears in payment options
4. Cancel the order before delivery

### **Method 2: Simulate COD in Test Mode**
Since COD doesn't show in test mode, create a custom COD button:

```javascript
// Add alongside Razorpay button in PaymentSection
<button
  onClick={() => handleCODOrder()}
  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
>
  📦 Cash on Delivery (₹{finalAmount})
</button>

const handleCODOrder = async () => {
  // Direct COD order creation (bypassing Razorpay)
  const orderData = {
    ...standardOrderData,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    codAmount: finalAmount
  };
  
  const result = await createOrder(orderData);
  if (result.success) {
    navigate('/order-confirmation', { state: { orderId: result.orderId } });
  }
};
```

## 🎯 **Production Deployment Steps**

### **1. Enable COD in Dashboard**
- Log into **Live Razorpay Dashboard**
- Enable COD with your business requirements
- Set minimum/maximum order values
- Configure delivery pincodes

### **2. Update Environment Variables**
```bash
# Use LIVE Razorpay keys for COD testing
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
```

### **3. Deploy & Test**
- Deploy to production with live keys
- Test COD with real order (small amount)
- Verify COD appears in payment options
- Test the complete COD flow

## 🔍 **Troubleshooting COD Issues**

### **If COD Still Doesn't Appear:**

1. **Check Razorpay Dashboard:**
   - Is COD enabled for your account?
   - Are you using live keys (not test keys)?
   - Is your account fully activated?

2. **Check Order Requirements:**
   - Is order value above minimum COD limit?
   - Is delivery pincode supported for COD?
   - Is customer phone number provided?

3. **Check Browser Console:**
   ```javascript
   // Add debugging to see available payment methods
   console.log('Razorpay options:', razorpayOptions);
   console.log('Available methods:', razorpayOptions.method);
   ```

## 💡 **Alternative: Custom COD Button**

If Razorpay COD isn't suitable, keep a separate COD button:

```javascript
const PaymentMethods = () => (
  <div className="space-y-4">
    {/* Razorpay for online payments */}
    <button
      onClick={() => initializeRazorpay()}
      className="w-full bg-blue-500 text-white py-3 rounded-lg"
    >
      💳 Online Payment (Cards, UPI, Wallets) - 5% Off
    </button>
    
    {/* Separate COD button */}
    <button
      onClick={() => handleDirectCOD()}
      className="w-full bg-green-500 text-white py-3 rounded-lg"
    >
      📦 Cash on Delivery (₹{finalAmount})
    </button>
  </div>
);
```

## 🎉 **Expected Result**

Once properly configured, customers will see:
- **Online Payment Options**: Cards, UPI, Wallets, NetBanking (with 5% discount)
- **COD Option**: Cash on Delivery (in the same Razorpay modal)

The key is ensuring you're testing in **live mode** with **COD enabled** in your Razorpay dashboard!
