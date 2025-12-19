# Attribution Tracking System - Complete Guide

## 🎯 Overview

Your attribution tracking system captures how users find your website and links their journey to eventual purchases. This is critical for understanding which marketing campaigns drive sales.

---

## 📊 How Attribution Works

### 1. **User Arrives from Ad** (With Attribution Data)

When a user clicks your Meta/Facebook ad:

```
Ad Click → Landing Page
https://attars.club/shop?fbclid=IwAR2xyz...&utm_source=facebook&utm_campaign=summer_sale
```

**What Happens:**
- ✅ `fbclid` parameter captured (Facebook Click ID)
- ✅ `utm_source=facebook` captured
- ✅ `utm_campaign=summer_sale` captured
- ✅ Data stored in localStorage for 30 days
- ✅ Session ID generated

**Stored Attribution Data:**
```javascript
{
  fbclid: "IwAR2xyz...",
  utm_source: "facebook",
  utm_campaign: "summer_sale",
  utm_medium: "cpc",
  landing_page: "https://attars.club/shop",
  referrer: "facebook.com",
  first_visit_time: 1734567890000,
  traffic_type: "paid",
  ad_platform: "meta",
  session_id: "session_1734567890_abc123"
}
```

---

### 2. **User Browses Products** (Attribution Persists)

User navigates:
```
Shop → Product Detail → Cart → Checkout
```

**What Happens:**
- ✅ Attribution data stays in localStorage
- ✅ Each page view includes session context
- ✅ All events (ViewContent, AddToCart, InitiateCheckout) fire with eventID
- ✅ Attribution window: 30 days (configurable)

**Key Tracking Events:**
```
PageView → ViewContent → AddToCart → InitiateCheckout → Purchase
```

---

### 3. **User Completes Purchase** (Attribution Sent to Meta)

**Purchase Event with Full Attribution:**
```javascript
// Event Data Sent to Meta Pixel
{
  // Order Details
  value: 1299,
  currency: "INR",
  transaction_id: "order_abc123",
  content_ids: ["prod_1", "prod_2"],
  
  // Attribution Context (NEW!)
  eventID: "evt_1734567890_xyz789",
  external_id: "user_123",
  utm_campaign: "summer_sale",
  utm_source: "facebook",
  utm_medium: "cpc",
  fbclid: "IwAR2xyz...",  // Already tracked by Meta via cookie
  
  // Enhanced Data
  affiliation: "Attars Fashion",
  payment_method: "COD",
  shipping: 0,
  discount_amount: 100
}
```

---

## 🔄 Attribution Models

### Current Model: **Last Click** (Default)

The system uses **last-click attribution** by default, meaning the most recent traffic source gets credit for the sale.

**Example:**
1. Day 1: User clicks Facebook ad (fbclid=abc)
2. Day 3: User returns via Google search
3. Day 5: User returns directly and purchases

**Attribution:** Direct traffic gets credit (last click)

### Alternative: **First Click**

To switch to first-click attribution:

```typescript
// In AnalyticsContext.tsx
initializeAttribution({
  default_model: 'first_click',  // Change from 'last_click'
  click_through_window: 30
});
```

**With First Click:**
1. Day 1: User clicks Facebook ad (fbclid=abc) ← **Gets credit**
2. Day 3: User returns via Google search
3. Day 5: User returns directly and purchases

**Attribution:** Facebook ad gets credit (first click)

---

## 🎯 Traffic Source Classification

The system automatically classifies traffic:

### Paid Traffic (Ad Platforms)
- **Meta/Facebook:** Detected by `fbclid` or `utm_source=facebook`
- **Google Ads:** Detected by `gclid` or `utm_source=google`
- **TikTok Ads:** Detected by `ttclid` or `utm_source=tiktok`
- **Microsoft Ads:** Detected by `msclkid` or `utm_source=bing`

### Organic Traffic
- **Search Engines:** google.com, bing.com (without gclid)
- **Social Media:** facebook.com, instagram.com (without fbclid)
- **Direct:** User types URL directly or uses bookmark
- **Referral:** Other websites linking to you

---

## 📈 Event Deduplication (NEW!)

### Problem Without Deduplication:
If purchase event fires twice (page refresh, duplicate API call), Meta counts 2 sales:
```
Purchase #1: value=1299, transaction_id=order_abc
Purchase #2: value=1299, transaction_id=order_abc  ← DUPLICATE!
```
**Result:** ₹2598 revenue reported instead of ₹1299

### Solution: Event IDs
Each event now includes unique `eventID`:
```javascript
{
  eventID: "evt_1734567890_xyz789",  // Unique identifier
  value: 1299,
  transaction_id: "order_abc"
}
```

Meta Pixel recognizes duplicate eventIDs and counts only once.

---

## 🔗 External ID for User Matching

### What is external_id?

`external_id` links events to specific users across devices and sessions:

```javascript
// User logged in
{
  external_id: "user_123",  // Your internal user ID
  value: 1299
}
```

**Benefits:**
- ✅ Better cross-device attribution
- ✅ More accurate ROAS (Return on Ad Spend)
- ✅ Improved audience targeting
- ✅ Enhanced conversion API matching

**Privacy:** Hashed before sending to Meta for security.

---

## 🛠️ Code Implementation

### Attribution Capture (Automatic)

When user lands on site, `attribution.ts` automatically:

```typescript
// Extract from URL
const urlParams = new URLSearchParams(window.location.search);
const fbclid = urlParams.get('fbclid');
const utm_source = urlParams.get('utm_source');
const utm_campaign = urlParams.get('utm_campaign');

// Store in localStorage
localStorage.setItem('current_attribution', JSON.stringify({
  fbclid,
  utm_source,
  utm_campaign,
  landing_page: window.location.href,
  first_visit_time: Date.now(),
  traffic_type: 'paid',
  ad_platform: 'meta'
}));
```

### Attribution Retrieval on Purchase

When tracking purchase, `AnalyticsContext.tsx` retrieves attribution:

```typescript
const trackPurchase = (order) => {
  // Get attribution data
  const attributionManager = getAttributionManager();
  const attribution = attributionManager?.getCurrentAttribution();
  
  // Prepare attribution context
  const attributionContext = {
    external_id: order.user?.id || order.email,
    utm_campaign: attribution.utm_campaign,
    utm_source: attribution.utm_source,
    fbclid: attribution.fbclid,
    traffic_type: attribution.traffic_type
  };
  
  // Send to Meta Pixel with attribution
  metaPixel.trackPurchase(purchaseData, attributionContext);
};
```

---

## 📊 What Meta Pixel Sees

### Before (Without Attribution Integration):
```javascript
fbq('track', 'Purchase', {
  value: 1299,
  currency: 'INR',
  transaction_id: 'order_abc'
});
// Meta can only use fbclid from cookie
```

### After (With Attribution Integration):
```javascript
fbq('track', 'Purchase', {
  // Basic data
  value: 1299,
  currency: 'INR',
  transaction_id: 'order_abc',
  
  // Enhanced attribution (NEW!)
  eventID: 'evt_1734567890_xyz789',
  external_id: 'user_123',
  utm_campaign: 'summer_sale',
  utm_source: 'facebook',
  utm_medium: 'cpc',
  
  // Meta uses this to:
  // 1. Deduplicate events
  // 2. Link to user profile
  // 3. Attribute to correct campaign
  // 4. Calculate accurate ROAS
});
```

---

## 🧪 Testing Attribution

### Test Scenario 1: Facebook Ad Click

**URL:**
```
https://attars.club?fbclid=test123&utm_source=facebook&utm_campaign=test_campaign
```

**Expected Console Output:**
```
📊 Analytics Config: { enabled: true }
🔍 Attribution captured: { fbclid: "test123", utm_source: "facebook" }
```

**localStorage Check:**
```javascript
JSON.parse(localStorage.getItem('current_attribution'))
// Should show captured attribution data
```

### Test Scenario 2: Purchase Event

**After completing purchase:**
```
📤 Sending Purchase to Meta Pixel with attribution: {
  external_id: "user_123",
  utm_campaign: "test_campaign",
  utm_source: "facebook",
  fbclid: "test123",
  traffic_type: "paid",
  ad_platform: "meta"
}
Meta Pixel: Purchase tracked with attribution {
  eventID: "evt_1734567890_abc",
  value: 1299,
  transaction_id: "order_abc123",
  attribution: { ... }
}
```

---

## 🚀 Verification Checklist

### ✅ Attribution Capture Working:
- [ ] URL parameters captured (fbclid, utm_*)
- [ ] Data stored in localStorage
- [ ] Attribution persists across page navigation
- [ ] Console shows "Attribution captured" log

### ✅ Purchase Tracking Working:
- [ ] Purchase event fires with eventID
- [ ] Attribution data included in event
- [ ] external_id set to user ID or email
- [ ] Console shows "Purchase tracked with attribution"

### ✅ Meta Events Manager:
- [ ] Test Events show Purchase within 30 seconds
- [ ] Event includes eventID, external_id
- [ ] Parameter `utm_campaign` visible in event details
- [ ] No duplicate events (same eventID counted once)

---

## 🔧 Configuration Options

### Attribution Window (Default: 30 days)

```typescript
// Change click-through window
initializeAttribution({
  click_through_window: 30  // Days to remember attribution
});
```

**Use Cases:**
- **7 days:** Fast-moving sales, short consideration
- **30 days:** Standard e-commerce (current)
- **90 days:** High-value items, long consideration

### View-Through Window (Default: 1 day)

```typescript
initializeAttribution({
  view_through_window: 1  // Days for impression-based attribution
});
```

Users who **saw** ad but didn't click can still be attributed if they purchase within 1 day.

---

## 📝 Common Issues & Solutions

### Issue 1: Attribution Not Captured

**Symptoms:**
- localStorage empty
- No fbclid/utm parameters in console

**Solutions:**
1. Check URL has parameters: `?fbclid=...&utm_source=...`
2. Verify attribution manager initialized
3. Check console for errors
4. Ensure localStorage not blocked

### Issue 2: Purchase Not Attributed to Ad

**Symptoms:**
- Purchase shows in Events Manager
- No campaign attribution in Ads Manager

**Solutions:**
1. Verify fbclid in URL when user lands
2. Check attribution persists in localStorage
3. Ensure attributionContext passed to trackPurchase
4. Wait 24-48 hours for Meta to process
5. Check if Test Events mode is still on

### Issue 3: Duplicate Purchases

**Symptoms:**
- Same order counted twice
- Revenue inflated in reports

**Solutions:**
1. ✅ eventID now auto-generated (prevents duplicates)
2. Check OrderConfirmation page doesn't call trackPurchase twice
3. Verify navigation state clears after tracking
4. Use React.StrictMode fix (prevent double render)

---

## 📚 Key Concepts Summary

| Concept | Purpose | Example |
|---------|---------|---------|
| **fbclid** | Facebook Click ID - Links click to ad | `IwAR2xyz...` |
| **UTM Parameters** | Campaign tracking codes | `utm_source=facebook` |
| **eventID** | Unique event identifier for deduplication | `evt_1734567890_xyz` |
| **external_id** | User identifier for cross-device matching | `user_123` |
| **Attribution Window** | How long to remember traffic source | 30 days |
| **Traffic Type** | Classification of visitor source | paid/organic/direct |
| **Ad Platform** | Which ad network drove traffic | meta/google/tiktok |

---

## 🎯 Best Practices

### 1. **Always Use UTM Parameters**

When creating ads, include:
```
https://attars.club/shop?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale&utm_content=ad1
```

### 2. **Use Consistent Naming**

**Good:**
```
utm_campaign=summer_sale_2024
utm_campaign=winter_sale_2024
```

**Bad:**
```
utm_campaign=SummerSale
utm_campaign=summer-sale
utm_campaign=sale_summer
```

### 3. **Test Before Launching**

1. Create test ad with tracking parameters
2. Click ad and verify attribution captured
3. Complete test purchase
4. Check Events Manager for attribution data
5. Verify eventID and external_id present

### 4. **Monitor Dashboard**

Regular checks:
- Daily: Test Events tab (immediate feedback)
- Weekly: Events Manager (all events)
- Monthly: Ads Manager (campaign ROAS)

---

## 🔍 Debug Commands

### Check Attribution in Browser Console:

```javascript
// View current attribution
JSON.parse(localStorage.getItem('current_attribution'))

// Check analytics config
window.analyticsConfig

// Get attribution manager
const manager = getAttributionManager();
manager.getDebugInfo()

// Check if from ads
manager.isAttributedTraffic()  // true if fbclid/utm present

// Get campaign name
manager.getCampaignName()  // "summer_sale"
```

---

## ✅ What Changed (Latest Update)

### Before:
- ❌ Attribution captured but NOT sent with events
- ❌ No eventID (duplicate counting possible)
- ❌ No external_id (poor cross-device matching)
- ❌ Purchase event had basic data only

### After:
- ✅ Attribution data passed to Meta Pixel events
- ✅ eventID auto-generated for deduplication
- ✅ external_id set from user ID or email
- ✅ Purchase includes full attribution context
- ✅ Console logs show attribution data flow

---

## 🚀 Next Steps

1. **Restart Dev Server:**
   ```bash
   cd client
   npm run dev
   ```

2. **Test Attribution:**
   - Visit: `http://localhost:5173?fbclid=test123&utm_source=facebook`
   - Check console for attribution logs
   - Complete test purchase
   - Verify attribution in console output

3. **Deploy to Production:**
   ```bash
   npm run build
   # Deploy to Vercel/your platform
   ```

4. **Verify in Meta:**
   - Open Events Manager
   - Check Test Events for Purchase
   - Look for eventID, external_id parameters
   - Verify utm_campaign appears in event details

5. **Monitor Results:**
   - Wait 24-48 hours for data processing
   - Check Ads Manager for attributed purchases
   - Review ROAS (Return on Ad Spend)
   - Optimize campaigns based on attribution data

---

## 📞 Support

**Attribution not working?**
1. Check browser console for errors
2. Verify localStorage has attribution data
3. Test with fbclid parameter in URL
4. Wait 24-48 hours for Meta processing
5. End Test Events mode if still active

**Still need help?**
- Review Meta Pixel Helper Chrome extension
- Check Events Manager troubleshooting
- Verify domain ownership in Business Settings
- Contact Meta support with eventID for specific events
