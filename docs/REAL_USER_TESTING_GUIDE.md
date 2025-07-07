# Real User Testing Guide

## Setting Up Test Users

### 1. Seed Test Users in Database

First, make sure your MongoDB is running and then seed the test users:

```bash
cd server
node seedUsers.js
```

This will create the following test accounts:

### 📧 Test User Credentials

#### 🔐 Admin Account
- **Email**: `admin@tshirtshop.com`
- **Password**: `admin123`
- **Role**: Admin (can access admin dashboard)
- **Address**: 123 Admin Street, Mumbai, Maharashtra - 400001

#### 👤 Regular User Accounts

**User 1:**
- **Email**: `user@tshirtshop.com`
- **Password**: `user123`
- **Role**: Customer
- **Address**: 456 Customer Lane, Delhi, Delhi - 110001

**User 2:**
- **Email**: `john@example.com`
- **Password**: `john123`
- **Role**: Customer
- **Address**: 789 User Road, Bangalore, Karnataka - 560001

## Complete Testing Flow

### Step 1: Prepare for Testing

1. **Start Backend Server**:
   ```bash
   cd server
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd client
   npm run dev
   ```

3. **Clear Any Bad Data** (if needed):
   ```javascript
   // Run in browser console
   localStorage.clear();
   location.reload();
   ```

### Step 2: Add Products to Cart

Since products might be out of stock, add test items to cart:

```javascript
// Run in browser console (F12)
const testItems = [
  {
    _id: 'product-1',
    name: 'Naruto Sage Mode T-Shirt',
    price: 599,
    quantity: 2,
    size: 'M',
    color: 'Black',
    colorValue: '#000000',
    image: '/api/placeholder/200/200'
  },
  {
    _id: 'product-2',
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

### Step 3: Test Sign In

1. Go to **Sign In** page
2. Use one of the test credentials:
   - Regular user: `user@tshirtshop.com` / `user123`
   - Admin: `admin@tshirtshop.com` / `admin123`
3. You should be redirected to the appropriate dashboard

### Step 4: Test Checkout Flow

1. **Go to Cart** → Verify items are there
2. **Click "Proceed to Checkout"**
3. **Address Section**:
   - If signed in, you might see saved addresses
   - Add a new address or edit existing
   - Test pincode auto-fill: `400001`, `110001`, `560001`
4. **Shipping Method**:
   - Select Standard or Express
   - Note: FREE shipping on orders ≥ ₹1000
5. **Review Order** → Verify all details
6. **Payment**:
   - Select Razorpay
   - Click "Place Order"
   - Use Razorpay test cards

### Step 5: Test Admin Features

1. Sign in as admin: `admin@tshirtshop.com` / `admin123`
2. Access Admin Dashboard
3. Test features:
   - Manage Products
   - Manage Categories
   - View Orders
   - Analytics

## Razorpay Test Payment Details

When Razorpay opens, use these test credentials:

### Test Cards
- **Success**: `4111 1111 1111 1111`
- **Failure**: `5105 1051 0510 5100`
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)

### Test UPI
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

### Test Wallets
- **Phone**: Any 10-digit number
- **OTP**: `123456`

## Testing Different Scenarios

### 1. Guest Checkout (Not Signed In)
- Don't sign in
- Add items to cart
- Go to checkout
- Add address manually
- Complete payment

### 2. Returning Customer
- Sign in with `user@tshirtshop.com`
- Saved addresses should load
- Can add/edit/delete addresses
- Complete purchase

### 3. Address Management
- Sign in as any user
- Go to checkout
- Test all address features:
  - Add new address
  - Edit existing address
  - Delete address
  - Set default address

### 4. Free Shipping Test
- Add items worth < ₹1000 → Shows shipping charges
- Add items worth ≥ ₹1000 → FREE shipping

## Troubleshooting

### Issue: Can't Sign In
- Check if backend server is running
- Verify MongoDB is running
- Run `node seedUsers.js` to create users

### Issue: Addresses Not Saving
- Make sure you're signed in
- Check backend server logs
- Verify MongoDB connection

### Issue: Payment Fails
- Use correct Razorpay test credentials
- Check if Razorpay keys are configured in `.env`

## Quick Commands Reference

```bash
# Seed users
cd server && node seedUsers.js

# Start backend
cd server && npm start

# Start frontend
cd client && npm run dev

# Check MongoDB
mongo
> use test
> db.users.find()
```

## Notes

- Test Mode toggle is for mock data only
- For real flow testing, keep Test Mode OFF
- All test users have Indian addresses
- Pincode auto-fill works for major Indian cities
