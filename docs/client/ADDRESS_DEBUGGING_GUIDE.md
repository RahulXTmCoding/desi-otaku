# Address Management Debugging Guide

## Test the Simple Version

1. Navigate to `/checkout-test` in your browser
2. Open browser console (F12) to see debug logs
3. Check the console for any errors

## Common Issues and Solutions

### Issue 1: Cannot select different addresses
- **Check**: Are there console errors when clicking addresses?
- **Solution**: The click handler might be blocked by event propagation

### Issue 2: Buttons are disabled
- **Check**: Is `addressLoading` stuck on true?
- **Solution**: The loading state has a 5-second timeout to prevent this

### Issue 3: Saving button stuck
- **Check**: Console logs during save operation
- **Solution**: Check if validation is failing

## Quick Test Commands

```bash
# Test in development mode with mock data
npm run dev

# Navigate to:
http://localhost:5173/checkout-test

# Check browser console for:
- "Loading addresses..."
- "Address clicked:"
- "Save button clicked"
```

## Production Mode Test

To test with real backend:
1. Turn OFF test mode (toggle in header)
2. Sign in with a valid user
3. Navigate to `/checkout`

## Backend API Endpoints

The address management uses these endpoints:
- GET `/api/user/:userId/addresses` - Get all addresses
- POST `/api/user/:userId/addresses` - Add new address
- PUT `/api/user/:userId/addresses/:addressId` - Update address
- DELETE `/api/user/:userId/addresses/:addressId` - Delete address

## Debugging Steps

1. **Check Network Tab**:
   - Are API calls being made?
   - What's the response?

2. **Check Console**:
   - Any JavaScript errors?
   - Debug logs showing?

3. **Check State**:
   - Use React DevTools to inspect component state
   - Check if `addressLoading` is false
   - Check if `savedAddresses` has data

4. **Test Mock Functions**:
   ```javascript
   // In browser console:
   const { mockGetUserAddresses } = await import('./src/core/helper/addressHelper');
   const addresses = await mockGetUserAddresses();
   console.log(addresses);
