# Razorpay Integration Guide

## Current Status ✅
Razorpay has been successfully integrated into the custom t-shirt shop with the following features:

### Backend Integration
- ✅ Razorpay controller with all payment endpoints
- ✅ Proper authentication and error handling
- ✅ Mock mode for testing without credentials
- ✅ Lazy loading to ensure environment variables are loaded
- ✅ Working with your test credentials

### Frontend Integration
- ✅ Razorpay as primary payment method
- ✅ Complete checkout flow
- ✅ Proper error handling
- ✅ Test mode support

## Your Razorpay Test Credentials
```
Key ID: rzp_test_Kyg3gt19W0rOHC
Key Secret: 9vJ2XtqXaCC1qQIP5XSl9GPE
```

## Testing the Integration

### Method 1: Test Mode (Easiest)
1. Enable Test Mode using the toggle in the header
2. Go to checkout and select Razorpay
3. Place order - payment will be simulated

### Method 2: Live Razorpay Test
1. Make sure server is running (`cd server && npm start`)
2. Sign in to your account
3. Add items to cart
4. Go to checkout
5. Fill shipping details
6. Select "Razorpay" payment method
7. Click "Place Order"
8. Razorpay checkout will open with test mode

### Test Payment Methods in Razorpay

**Test Cards:**
- Success: `4111 1111 1111 1111`
- Failure: `5267 3181 8797 5449`

**Test UPI:**
- Success: `success@razorpay`
- Failure: `failure@razorpay`

**Test Wallets:**
- Use any phone number with OTP: `111111`

## Payment Flow

1. **Order Creation**: Server creates Razorpay order
2. **Checkout Modal**: Razorpay modal opens with all payment options
3. **Payment Processing**: User completes payment
4. **Verification**: Server verifies payment signature
5. **Order Confirmation**: Order saved to database

## Troubleshooting

### If you see "Authentication failed"
- Check that server has restarted after adding credentials
- Verify credentials in `.env` file
- Make sure there are no extra spaces in credentials

### If Razorpay modal doesn't open
- Check browser console for errors
- Ensure Razorpay script is loaded
- Try refreshing the page

## Production Setup

1. Get production keys from Razorpay Dashboard
2. Update `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```
3. Set up webhook for real-time updates
4. Test thoroughly before going live

## Features Implemented

- ✅ Multiple payment methods (Cards, UPI, Wallets, NetBanking)
- ✅ Automatic payment capture
- ✅ Payment verification
- ✅ Error handling and fallbacks
- ✅ Test mode for development
- ✅ Webhook support (ready for production)

## Security Notes

- Never expose `RAZORPAY_KEY_SECRET` on frontend
- Always verify payment signature on backend
- Use HTTPS in production
- Enable webhook signature verification in production
