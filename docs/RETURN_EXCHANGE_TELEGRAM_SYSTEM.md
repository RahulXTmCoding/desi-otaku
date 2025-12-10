# Return/Exchange Telegram Notification System

## Overview
Added a comprehensive return and exchange request system that sends notifications via Telegram, similar to the order notification system.

## Features

### Backend Implementation

#### 1. Controller (`server/controllers/returnExchange.js`)
- `submitReturnExchangeRequest`: Handles return/exchange request submissions
- `getReturnPolicy`: Returns policy information (optional endpoint)

**Validations:**
- Order ID, name, email, phone, request type, and reason are required
- Email format validation
- Phone number validation (10 digits)
- Request type must be 'return' or 'exchange'

**Response:**
- Success: 200 with confirmation message
- Error: 400/500 with error details
- Graceful handling if Telegram fails (request still acknowledged)

#### 2. Telegram Service Update (`server/services/telegramService.js`)
Added new method: `sendReturnExchangeRequest(requestData)`

**Notification Format:**
```
🔄/🔁 RETURN/EXCHANGE REQUEST

📦 Order ID: [order-id]
⏰ Request Time: [timestamp]

👤/👨‍💼 Customer Info:
  Name, Email, Phone, User Type

📝 Request Details:
  Type, Reason

💬 Issue Description
📦 Product(s) affected

Action Required: Contact within 24 hours
```

#### 3. Routes (`server/routes/returnExchange.js`)
- `POST /api/return-exchange/submit` - Submit request
- `GET /api/return-exchange/policy` - Get policy info

#### 4. Integration (`server/app.js`)
Added route: `app.use("/api/return-exchange", returnExchangeRoutes)`

### Frontend Implementation

#### 1. Form Component (`client/src/components/ReturnExchangeForm.tsx`)

**Features:**
- Toggle between Return and Exchange request types
- Pre-fills user data if logged in
- Guest users can submit by providing details
- Real-time form validation
- Success/error feedback
- Loading states

**Form Fields:**
- Request Type (Return/Exchange) - button toggle
- Order ID * - text input with helper text
- Full Name * - auto-filled for logged-in users
- Email * - auto-filled for logged-in users
- Contact Number * - 10-digit validation
- Reason * - dropdown with common reasons
- Issue Description - textarea
- Product Details - optional text input

**Validation:**
- Order ID required
- Valid email format
- 10-digit phone number
- Reason selection required

**Common Reasons:**

*Returns:*
- Defective/faulty product
- Wrong size delivered
- Faulty print quality
- Damaged during shipping
- Wrong product delivered

*Exchanges:*
- Defective product - need replacement
- Wrong size delivered - need correct size
- Wrong size ordered - willing to pay delivery charges
- Damaged product - need exchange
- Print issue - need replacement

#### 2. Page Integration (`client/src/pages/ReturnPolicy.tsx`)
- Form added to Return Policy page
- Positioned after Important Information section
- Before the "Need Help?" contact buttons

## User Flow

### For Logged-In Users:
1. Navigate to Return Policy page
2. Scroll to "Submit Return/Exchange Request" form
3. Select request type (Return/Exchange)
4. Name and email pre-filled
5. Enter Order ID, phone, reason, and description
6. Click "Submit Request"
7. Receive confirmation with 24-hour response promise

### For Guest Users:
1. Same as above
2. Manually enter name and email
3. Rest of flow identical

## Telegram Notification Flow

1. User submits form
2. Backend validates data
3. Telegram notification sent to admin chat
4. Admin receives formatted message with:
   - Customer details
   - Order information
   - Issue description
   - Contact information
5. Admin can respond via email or phone within 24 hours

## Configuration

### Environment Variables Required:
```bash
TELEGRAM_NOTIFICATIONS_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
```

### Frontend Environment:
```bash
VITE_BACKEND_URL=http://localhost:8000  # or production URL
```

## API Endpoints

### POST /api/return-exchange/submit

**Request Body:**
```json
{
  "orderId": "674a1234567890abcd",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "requestType": "return",
  "reason": "Defective product",
  "issueDescription": "Print quality is poor",
  "productDetails": "Black oversized hoodie - Size L"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Return request submitted successfully. We will contact you within 24 hours.",
  "data": {
    "orderId": "674a1234567890abcd",
    "requestType": "return",
    "submittedAt": "2025-12-10T10:30:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

### GET /api/return-exchange/policy

**Response:**
```json
{
  "success": true,
  "data": {
    "returnWindow": 5,
    "conditions": [...],
    "exchangeInfo": {...},
    "contactEmail": "hello@attars.club",
    "processingTime": "24-48 hours"
  }
}
```

## Testing

### Manual Testing Steps:

1. **Test as Logged-in User:**
   - Login to account
   - Navigate to /return-policy
   - Fill form with valid order ID
   - Submit and verify Telegram notification

2. **Test as Guest:**
   - Logout or use incognito
   - Navigate to /return-policy
   - Fill all fields including name and email
   - Submit and verify notification

3. **Test Validations:**
   - Try submitting without required fields
   - Try invalid email format
   - Try invalid phone number (< 10 digits)
   - Verify error messages

4. **Test Both Request Types:**
   - Submit return request
   - Submit exchange request
   - Verify different emojis and formatting in Telegram

5. **Test Telegram Integration:**
   - Check Telegram message format
   - Verify all customer details included
   - Verify contact information correct
   - Test with Telegram disabled (should still work)

## Benefits

1. **Instant Notifications:** Admin gets real-time alerts
2. **Organized Data:** Formatted messages easy to read
3. **Quick Response:** Contact info readily available
4. **User Friendly:** Simple form, clear instructions
5. **Flexible:** Works for both logged-in and guest users
6. **Graceful Degradation:** Works even if Telegram fails
7. **Validation:** Ensures data quality before submission

## Future Enhancements

1. Add image upload for defect photos
2. Store requests in database for tracking
3. Add status tracking for users
4. Email confirmation to customer
5. SMS notification option
6. Admin dashboard for request management
7. Auto-response templates
8. Integration with order management system

## Notes

- Telegram notification is non-blocking (doesn't fail if Telegram is down)
- All data validated before database/Telegram
- User gets immediate feedback regardless of Telegram status
- Phone numbers accepted with or without formatting
- Order ID format flexible (any string accepted)
- Form resets after successful submission
- Success message auto-closes after 3 seconds

## File Changes Summary

**New Files:**
- `server/controllers/returnExchange.js`
- `server/routes/returnExchange.js`
- `client/src/components/ReturnExchangeForm.tsx`
- `docs/RETURN_EXCHANGE_TELEGRAM_SYSTEM.md` (this file)

**Modified Files:**
- `server/services/telegramService.js` (added sendReturnExchangeRequest method)
- `server/app.js` (added route registration)
- `client/src/pages/ReturnPolicy.tsx` (added form component)

## Support

For issues or questions:
- Check Telegram bot status: Test endpoint at `/api/telegram/test`
- Verify environment variables configured
- Check server logs for errors
- Ensure CORS allows frontend domain
