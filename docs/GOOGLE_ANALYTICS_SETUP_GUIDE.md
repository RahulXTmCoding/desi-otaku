# Google Analytics 4 (GA4) Setup Guide for Desi Otaku

## Overview
This guide walks you through setting up Google Analytics 4 for your e-commerce website to track user behavior, conversions, and sales.

## Step 1: Create Google Analytics Account

1. **Go to Google Analytics**
   - Visit: https://analytics.google.com
   - Sign in with your Google account

2. **Create New Property**
   - Click "Admin" (gear icon)
   - Click "Create Property"
   - Enter property name: "Desi Otaku"
   - Select India timezone (GMT+05:30)
   - Select Indian Rupee (INR) as currency

3. **Configure Data Stream**
   - Choose "Web" platform
   - Enter website URL: https://desiotaku.com
   - Enter stream name: "Desi Otaku Website"
   - Click "Create stream"

4. **Get Your Measurement ID**
   - You'll see a Measurement ID like: `G-XXXXXXXXXX`
   - Copy this ID - you'll need it!

## Step 2: Update Your Website Code

### 2.1 Update the Measurement ID

1. Open `client/src/utils/analytics.ts`
2. Replace the placeholder with your actual ID:
   ```typescript
   export const GA_MEASUREMENT_ID = 'G-YOUR_ACTUAL_ID'; // Replace with your ID
   ```

3. Open `client/index.html`
4. Replace both instances of `G-XXXXXXXXXX` with your actual ID:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ACTUAL_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-YOUR_ACTUAL_ID');
   </script>
   ```

## Step 3: Implement Analytics Tracking

### 3.1 Track Page Views in App.tsx

Add this to your `client/src/pages/App.tsx`:

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageview } from '../utils/analytics';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    pageview(location.pathname + location.search);
  }, [location]);

  // rest of your component...
}
```

### 3.2 Track Product Views

In `client/src/pages/ProductDetail.tsx`, add:

```typescript
import { trackEcommerce } from '../utils/analytics';

// In your component where product loads:
useEffect(() => {
  if (product) {
    trackEcommerce.viewItem(product);
  }
}, [product]);
```

### 3.3 Track Add to Cart

In your cart functions (e.g., `ProductGridItem.tsx`):

```typescript
import { trackEcommerce } from '../utils/analytics';

const handleAddToCart = async (product) => {
  // Your existing add to cart logic
  await addToCart(product);
  
  // Track the event
  trackEcommerce.addToCart(product);
};
```

### 3.4 Track Purchases

In `client/src/pages/OrderConfirmation.tsx` or after successful payment:

```typescript
import { trackEcommerce } from '../utils/analytics';

// After order is confirmed:
trackEcommerce.purchase(order);
```

### 3.5 Track User Actions

For login (`client/src/user/Signin.tsx`):
```typescript
import { trackUserEngagement } from '../utils/analytics';

// After successful login:
trackUserEngagement.login('email');
```

For signup (`client/src/user/Signup.tsx`):
```typescript
import { trackUserEngagement } from '../utils/analytics';

// After successful signup:
trackUserEngagement.signUp('email');
```

## Step 4: Configure E-commerce Settings in GA4

1. **Enable E-commerce Reporting**
   - In GA4, go to Admin → Data display → E-commerce settings
   - Toggle on "Enable e-commerce"

2. **Configure Enhanced E-commerce**
   - Go to Admin → Data Streams → click your web stream
   - Click "Configure tag settings"
   - Enable "Enhanced measurement"

3. **Set Up Conversions**
   - Go to Admin → Events
   - Find "purchase" event
   - Toggle "Mark as conversion"
   - Also mark these as conversions:
     - `add_to_cart`
     - `begin_checkout`
     - `sign_up`

## Step 5: Create Custom Reports

### 5.1 E-commerce Overview
- Go to Reports → Monetization → E-commerce purchases
- View metrics like:
  - Total revenue
  - Average order value
  - Product performance
  - Cart abandonment rate

### 5.2 User Acquisition
- Go to Reports → Acquisition → User acquisition
- See where your traffic comes from:
  - Organic search
  - Social media
  - Direct traffic
  - Referrals

### 5.3 Product Performance
- Create custom report:
  - Dimension: Item name
  - Metrics: Items viewed, Items added to cart, Items purchased, Item revenue
  - Filter by date range

## Step 6: Set Up Goals & Audiences

### 6.1 Create Audiences
1. Go to Admin → Audiences
2. Create segments like:
   - **High-Value Customers**: Users who purchased > ₹2000
   - **Cart Abandoners**: Added to cart but didn't purchase
   - **Anime Fans**: Viewed anime category products
   - **Repeat Customers**: Made 2+ purchases

### 6.2 Set Up Alerts
1. Go to Admin → Custom alerts
2. Create alerts for:
   - Daily revenue drops > 20%
   - Conversion rate changes
   - Traffic spikes/drops

## Step 7: Test Your Implementation

### 7.1 Use GA4 DebugView
1. Install Google Analytics Debugger Chrome extension
2. Go to GA4 → Admin → DebugView
3. Browse your website with the debugger on
4. Verify events are firing correctly

### 7.2 Test E-commerce Flow
1. View a product → Check `view_item` event
2. Add to cart → Check `add_to_cart` event
3. Go to checkout → Check `begin_checkout` event
4. Complete test purchase → Check `purchase` event

## Step 8: Advanced Features

### 8.1 Google Ads Integration
- Link GA4 with Google Ads for remarketing
- Create audiences for ad targeting
- Import conversions to Google Ads

### 8.2 BigQuery Export
- For advanced analysis, export to BigQuery
- Run SQL queries on your analytics data
- Create custom dashboards

### 8.3 Server-Side Tracking
- For sensitive data, implement Measurement Protocol
- Track server-side events (refunds, cancellations)

## Common Issues & Solutions

### Issue: Events not showing up
- Check if GA blocker extensions are disabled
- Verify Measurement ID is correct
- Check browser console for errors
- Wait 24-48 hours for data to appear

### Issue: E-commerce data missing
- Ensure product object has all required fields
- Verify currency is set to INR
- Check if enhanced e-commerce is enabled

### Issue: Duplicate page views
- Make sure GA script is only included once
- Check if React is rendering twice in dev mode

## Maintenance Checklist

### Weekly
- [ ] Check for tracking errors
- [ ] Review conversion rates
- [ ] Monitor site speed metrics

### Monthly
- [ ] Review user acquisition channels
- [ ] Analyze product performance
- [ ] Check goal completions
- [ ] Update audiences

### Quarterly
- [ ] Audit tracking implementation
- [ ] Review and optimize conversions
- [ ] Create performance reports
- [ ] Plan improvements based on data

## Privacy & Compliance

1. **Update Privacy Policy**
   - Mention Google Analytics usage
   - Explain data collection
   - Provide opt-out options

2. **Cookie Consent**
   - Implement cookie banner
   - Allow users to opt-out
   - Respect user preferences

3. **Data Retention**
   - Set appropriate data retention period
   - Default is 2 months for events

## Resources

- [GA4 Documentation](https://support.google.com/analytics)
- [GA4 E-commerce Guide](https://support.google.com/analytics/answer/9612929)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 API](https://developers.google.com/analytics/devguides/reporting/data/v1)

## Next Steps

1. Complete the GA4 setup
2. Implement tracking on all key pages
3. Test thoroughly with DebugView
4. Create custom dashboards
5. Set up automated reports
6. Train team on using GA4 data

Remember: Good analytics = Better decisions = More sales! 📊
