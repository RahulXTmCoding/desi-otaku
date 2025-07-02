# Email Templates Guide

All email templates use the website's dark theme with yellow accents to maintain brand consistency.

## Design System
- **Background**: #1F2937 (Dark gray)
- **Primary Color**: #FCD34D (Yellow)
- **Text**: White on dark background
- **Footer**: #111827 (Darker gray)
- **Buttons**: Yellow with dark text

## Available Email Templates

### 1. Welcome Email
**Trigger**: New user registration  
**Function**: `sendWelcomeEmail(user)`

Features:
- Welcome message
- 10% off coupon code
- Feature highlights
- CTA to start shopping

### 2. Order Confirmation
**Trigger**: Successful order placement  
**Function**: `sendOrderConfirmation(order, user)`

Features:
- Order details and ID
- Itemized product list
- Total with shipping
- Shipping address
- Track order button

### 3. Order Confirmation + Account Created (NEW)
**Trigger**: Guest user completes order  
**Function**: `sendOrderConfirmationWithAccount(order, user, accountCreated)`

Features:
- All order confirmation details
- Account creation notification
- Password setup instructions
- Combined CTA button

### 4. Auto Account Creation (NEW)
**Trigger**: Account auto-created for guest  
**Function**: `sendAutoAccountCreationEmail(user, order)`

Features:
- Account creation notification
- Email/order details
- Password setup button
- Account benefits list
- Next steps guide

### 5. Shipping Update
**Trigger**: Order shipped  
**Function**: `sendShippingUpdate(order, user)`

Features:
- Tracking information
- AWB/Carrier details
- Delivery address
- Estimated delivery
- Track package button

### 6. Password Reset
**Trigger**: Password reset request  
**Function**: `sendPasswordResetEmail(user, resetToken)`

Features:
- Reset link (1-hour expiry)
- Security warnings
- Reset button
- Direct link fallback

### 7. Order Status Update
**Trigger**: Order status change  
**Function**: `sendOrderStatusUpdate(order, user, oldStatus)`

Features:
- Status change visualization
- Order details
- Status-specific messaging
- View order button

### 8. Inventory Alert (Admin)
**Trigger**: Low/Out of stock  
**Function**: `sendInventoryAlert(admin, product, alertType)`

Features:
- Alert type (low/out of stock)
- Product details
- Size-wise inventory table
- Recommended actions
- Manage inventory button

## Email Configuration

### Environment Variables
```env
# Email Service Provider
EMAIL_SERVICE=gmail # Options: gmail, sendgrid, ethereal

# Gmail Config
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SendGrid Config
SENDGRID_API_KEY=your-sendgrid-api-key

# From Address
EMAIL_FROM=Anime T-Shirt Shop <noreply@animetshirt.com>
```

### Testing Emails
```javascript
const emailService = require('./services/emailService');

// Test email functionality
await emailService.sendTestEmail('test@example.com');

// Test specific template
await emailService.sendWelcomeEmail({
  name: 'Test User',
  email: 'test@example.com'
});
```

## Email Flow for Guest Checkout

1. **Guest places order** → 
2. **Account auto-created** → 
3. **Combined confirmation email sent** → 
4. **User clicks "Set Password"** → 
5. **Password reset email sent** → 
6. **User sets password** → 
7. **Can track order**

## Best Practices

1. **Consistent Branding**: All emails use dark theme matching website
2. **Clear CTAs**: Yellow buttons stand out
3. **Mobile Responsive**: 600px max width
4. **Fallback Text**: Important info in plain text too
5. **Tracking**: Include order IDs in subject lines

## Preview Examples

### Dark Theme Elements
- Header: Yellow (#FCD34D) background
- Body: Dark gray (#1F2937) background
- Text: White for contrast
- Buttons: Yellow with dark text
- Info boxes: Slightly lighter gray (#374151)
- Footer: Darker gray (#111827)

### Visual Hierarchy
1. Bold header with emoji
2. Personalized greeting
3. Key information in boxes
4. Clear CTA buttons
5. Additional details
6. Footer with links

## Integration Example

```javascript
// In order controller after successful payment
if (isGuestUser) {
  // Auto-create account
  const tempPassword = generateTempPassword();
  const newUser = await createUser({
    name: shippingInfo.fullName,
    email: shippingInfo.email,
    password: tempPassword
  });
  
  // Send combined email
  await emailService.sendOrderConfirmationWithAccount(
    order, 
    newUser, 
    true // accountCreated flag
  );
} else {
  // Regular order confirmation
  await emailService.sendOrderConfirmation(order, user);
}
```

## Email Template Maintenance

1. **Update styles** in emailService.js inline CSS
2. **Test rendering** in multiple email clients
3. **Keep templates** under 102KB for Gmail
4. **Use web-safe fonts** (Arial, sans-serif)
5. **Include alt text** for images (when added)
