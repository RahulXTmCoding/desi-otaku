# Checkout Address Fix & Testing Guide

## Issue: "Failed to save address" Error

This issue typically occurs when:
1. The cart is empty (checkout redirects back to cart)
2. The backend server is not running
3. The user is not in test mode for guest checkout

## Quick Fix Steps

### 0. Clear Bad Authentication Data (If Getting Infinite API Calls)
If you're seeing continuous API calls to `/api/user/mock-user-id/addresses`, run this in the browser console:
```javascript
localStorage.removeItem('jwt');
localStorage.removeItem('cart');
location.reload();
```

### 1. Enable Test Mode
Click the "Test Data" toggle in the header to enable test mode. This allows:
- Guest checkout without authentication
- Mock address saving
- Simulated payments

### 2. Add Test Items to Cart
Since the products are out of stock, use the browser console to add test items:

```javascript
// Open browser console (F12) and paste this:
const testItems = [
  {
    _id: 'test-1',
    name: 'Naruto Sage Mode T-Shirt',
    price: 599,
    quantity: 2,
    size: 'M',
    color: 'Black',
    colorValue: '#000000',
    image: '/api/placeholder/200/200'
  },
  {
    _id: 'test-2',
    name: 'Attack on Titan Wings T-Shirt',
    price: 699,
    quantity: 1,
    size: 'L',
    color: 'White',
    colorValue: '#FFFFFF',
    image: '/api/placeholder/200/200'
  }
];

localStorage.setItem('cart', JSON.stringify(testItems));
location.reload();
```

### 3. Ensure Backend is Running
Make sure the backend server is running:
```bash
cd server
npm start
```

## Testing the Complete Checkout Flow

### Step 1: Cart Setup
1. Open http://localhost:5174
2. Enable "Test Data" mode (toggle in header)
3. Run the test cart script above in console
4. Navigate to Cart → Should see 2 test items

### Step 2: Checkout - Address
1. Click "Proceed to Checkout"
2. Click "Add New Address" 
3. Fill the form:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - Address: 123 Test Street
   - **Pincode: 400001** (auto-fills Mumbai, Maharashtra)
   - Or try: 110001 (Delhi), 560001 (Bangalore)
4. Click "Save Address" → Should save instantly in test mode

### Step 3: Shipping Selection
1. Address should be selected automatically
2. Shipping options appear:
   - Standard: ₹60 (5-7 days)
   - Express: ₹120 (2-3 days)
   - **FREE shipping if order ≥ ₹1000** (your test order is ₹1897)
3. Select shipping method
4. Click "Continue to Review"

### Step 4: Order Review
1. Verify all details
2. Click "Continue to Payment"

### Step 5: Payment
1. Select "Razorpay" (recommended)
2. Click "Place Order"
3. In test mode: Payment simulated automatically
4. In production: Razorpay window opens

## Troubleshooting

### Issue: Address Still Won't Save
1. **Check Test Mode**: Must be ON for guest checkout
2. **Check Console**: Look for specific error messages
3. **Clear Cache**: 
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Issue: Infinite API Calls
If you see continuous API calls with 400 errors:
1. Clear authentication:
   ```javascript
   localStorage.removeItem('jwt');
   location.reload();
   ```
2. Enable Test Mode to avoid API calls
3. Use guest checkout (don't sign in)

### Issue: Checkout Redirects to Cart
- Cart might be empty. Re-run the test cart script.

### Issue: Payment Fails
- In test mode: Should auto-succeed
- In production: Check Razorpay credentials in server/.env

## Features Working Now

✅ **Guest Checkout** - No login required
✅ **Address Management** - Add/edit/delete addresses
✅ **Pincode Auto-fill** - Enter pincode → City/State filled
✅ **Free Shipping** - Orders above ₹1000
✅ **Multiple Payment Methods** - Razorpay integration
✅ **Order Confirmation** - Success page with details

## Test Pincodes for Auto-fill

| Pincode | City | State |
|---------|------|-------|
| 400001 | Mumbai | Maharashtra |
| 110001 | New Delhi | Delhi |
| 560001 | Bangalore | Karnataka |
| 700001 | Kolkata | West Bengal |
| 600001 | Chennai | Tamil Nadu |
| 500001 | Hyderabad | Telangana |

## Need Help?

1. Check browser console for errors
2. Ensure backend server is running
3. Try in incognito mode to avoid cache issues
4. Enable test mode for easier testing
