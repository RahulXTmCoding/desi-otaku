# Meta Pixel Events Not Showing in Dashboard - Troubleshooting Guide

## Problem Summary
Events appear in **Test Events** tab but NOT in the main **Events Manager Dashboard**, even though purchases are happening from ads.

## Root Causes Identified

### 1. **CRITICAL: Pixel Configuration** ✅ FIXED
**Current Configuration:**
- **Pixel ID**: `1133467228701583` (verified and correct)
- **index.html**: ✅ Correct ID
- **.env.local**: ✅ Correct ID
- **Pixel Status**: ✅ Loaded and working (version 2.9.248)

**What was fixed:**
- Unified pixel ID across all configuration files
- Prevented duplicate initialization in [facebookPixel.ts](../client/src/utils/facebookPixel.ts)
- Added proper event interception for debugging

---

## Common Reasons Events Show in Test Events But Not Dashboard

### 2. **Test Event Code Still Active**
When you set up Test Events in Meta Events Manager, you get a test event code. If this is still active in production:
- Events go ONLY to Test Events tab
- They DON'T appear in main dashboard
- They DON'T contribute to ads optimization

**How to Check:**
1. Go to Events Manager → Your Pixel → Settings
2. Click "Test Events" tab
3. If you see "Test Mode Active", click "End Test Activity"
4. Ensure no test event codes are in your production code

**How to Verify in Code:**
```bash
# Search for test event codes in your codebase
grep -r "testEventCode\|test_event_code" client/src/
```

### 3. **Ad Blockers & Browser Privacy**
**What blocks events:**
- uBlock Origin, AdBlock Plus, Brave Browser
- Firefox Enhanced Tracking Protection (Strict Mode)
- Safari Intelligent Tracking Prevention (ITP)

**How to Test:**
1. Open your site in incognito/private mode
2. Disable all browser extensions
3. Open browser console (F12)
4. Run: `javascript:void(fbq('track', 'Purchase', {value: 100, currency: 'INR'}))` in URL bar
5. Check if Meta Pixel Helper shows the event

### 4. **Aggregated Event Measurement (AEM) Not Configured**
Since iOS 14.5+, Meta requires AEM configuration for events to be tracked properly.

**How to Find AEM (Multiple Paths):**

**Option A - Via Events Manager:**
1. Go to [Events Manager](https://business.facebook.com/events_manager2)
2. Click on your pixel `1133467228701583`
3. Look in the left sidebar for "Aggregated Event Measurement"
   - If not visible, you may need to verify your domain first (see #5 below)

**Option B - Via Business Settings:**
1. Go to [Business Settings](https://business.facebook.com/settings)
2. Click "Data Sources" → "Pixels"
3. Select your pixel `1133467228701583`
4. Click "Settings" → Look for "Aggregated Event Measurement"

**Option C - Direct Link:**
- Go directly to: `https://business.facebook.com/events_manager2/list/pixel/1133467228701583/aem`

**If AEM Tab is Not Visible:**
- You may need to verify your domain first (see section #5)
- OR your pixel might not have iOS traffic yet (Meta auto-enables AEM when needed)
- You can still track events without AEM, but iOS 14.5+ users will be limited

**If You Can Access AEM, Configure:**
1. Click "Configure Web Events"
2. Add domain: `attars.club` (must be verified)
3. Set event priorities (top 8 only):
   - Priority 1: Purchase
   - Priority 2: InitiateCheckout
   - Priority 3: AddToCart
   - Priority 4: AddPaymentInfo
   - Priority 5: ViewContent
   - Priority 6: Search
   - Priority 7: CompleteRegistration
   - Priority 8: PageView

### 5. **Domain Verification Not Complete**
**Check Domain Verification:**
1. Business Settings → Brand Safety → Domains
2. Verify `attars.club` is listed and verified
3. If not verified, follow Meta's domain verification process

### 6. **Pixel Not Active / Restricted**
**Check Pixel Status:**
1. Events Manager → Your Pixel → Overview
2. Look for any warnings or restrictions
3. Status should be "Active" (green)

### 7. **Events Data Processing Delay**
Meta can take **20 minutes to 24 hours** to process events for dashboard display.

**What shows immediately:**
- Test Events (real-time)
- Pixel Helper extension (real-time)

**What has delay:**
- Events Manager dashboard
- Ads Manager attribution
- Custom conversions

---

## Verification Steps

### Step 1: Verify Pixel is Loading
Open your website and run in browser console:
```javascript
// Check if pixel loaded
console.log('Pixel loaded:', typeof fbq !== 'undefined');
console.log('Pixel version:', fbq?.version);
console.log('Pixel loaded status:', fbq?.loaded);
```

### Step 2: Test Event Firing
```javascript
// Test a purchase event
fbq('track', 'Purchase', {
  value: 100,
  currency: 'INR',
  content_ids: ['test_123'],
  content_type: 'product'
});
```

Check:
1. ✅ Meta Pixel Helper shows the event (green checkmark)
2. ✅ Test Events tab shows the event within seconds
3. ⏱️ Events Manager dashboard shows it within 20 mins - 24 hours

### Step 3: Check Network Requests
1. Open DevTools → Network tab
2. Filter for: `facebook.com`
3. Look for requests to `tr?id=1133467228701583`
4. Click the request and check:
   - Status should be `200 OK`
   - Event data should be in query params

### Step 4: Use Meta Pixel Helper Extension
**Install:** [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper)

**What it shows:**
- ✅ Pixel found and loaded
- ✅ Events being fired with data
- ❌ Any errors or warnings

### Step 5: Check Meta Events Manager
1. Go to Events Manager
2. Click your Pixel
3. Click "Overview" tab
4. Check "Events Received in the Last 20 Minutes"
5. Click "Test Events" tab
6. Activity should show recent events

---

## Using the Diagnostics Script

### Option 1: Run in Browser Console
1. Copy contents of `client/public/pixel-diagnostics.js`
2. Open your website
3. Open browser console (F12)
4. Paste and run the script
5. Review the diagnostic output

### Option 2: Include in HTML (Development Only)
Add to index.html before closing `</body>`:
```html
<!-- REMOVE IN PRODUCTION -->
<script src="/pixel-diagnostics.js"></script>
```

### Option 3: Bookmarklet
Create a bookmark with this URL:
```javascript
javascript:(function(){var script=document.createElement('script');script.src='https://attars.club/pixel-diagnostics.js';document.head.appendChild(script);})();
```

---

## Expected Timeline for Dashboard Updates

| Metric | Update Time |
|--------|-------------|
| Test Events | Real-time (< 30 seconds) |
| Pixel Helper | Real-time (instant) |
| Events Manager - Overview | 20 mins - 2 hours |
| Events Manager - Dashboard | 2 - 24 hours |
| Ads Manager Attribution | 24 - 72 hours |
| Custom Audiences | 24 - 48 hours |

---

## Final Checklist

Before considering pixel broken, verify:

- [ ] **Test Event mode is OFF** in Events Manager
- [ ] **Same Pixel ID** in both HTML and .env.local
- [ ] **Ad blocker disabled** when testing
- [ ] **Domain verified** in Business Settings
- [ ] **AEM configured** with event priorities
- [ ] **Pixel status is "Active"** in Events Manager
- [ ] **Waited at least 24 hours** for dashboard to update
- [ ] **Meta Pixel Helper** shows events firing correctly
- [ ] **Network requests** show 200 OK responses to facebook.com/tr
- [ ] **Browser console** shows no errors related to fbq

---

## Still Not Working?

### Check These Advanced Issues:

1. **Conversion API Not Matching**
   - If using Conversion API (server-side), events must match browser events
   - Use `event_id` to deduplicate browser and server events

2. **iOS 14.5+ Privacy**
   - Users who opt out of tracking won't send events
   - AEM helps aggregate this data, but individual events are lost

3. **Cookie Consent**
   - If using cookie banner, ensure Meta Pixel fires AFTER consent
   - Check if pixel is being blocked by consent management

4. **CSP Headers**
   - Content Security Policy may block Meta scripts
   - Check browser console for CSP violation errors

5. **VPN/Proxy**
   - Some VPNs block Meta tracking domains
   - Test without VPN

---

## Support Resources

- **Meta Business Help Center**: https://www.facebook.com/business/help
- **Pixel Troubleshooting**: https://www.facebook.com/business/help/742478679120153
- **AEM Documentation**: https://www.facebook.com/business/help/331612538028890
- **Meta Pixel Helper**: https://chrome.google.com/webstore/detail/meta-pixel-helper

---

## Contact Meta Support

If issue persists after checking everything:
1. Go to Events Manager
2. Click "Help" in bottom-left
3. Select "Get Started"
4. Choose "Pixel & SDK" → "Event Setup Issues"
5. Provide:
   - Pixel ID: `1133467228701583`
   - Issue: "Events show in Test Events but not Dashboard"
   - Steps already taken (from this document)

---

**Last Updated**: December 19, 2025  
**Pixel ID**: 1133467228701583  
**Changes Applied**: Fixed pixel ID consistency, added AEM access instructions
