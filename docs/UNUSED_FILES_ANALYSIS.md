# Unused Files Analysis - Custom T-Shirt Shop

## Frontend (Client) - Unused Files

### Duplicate/Old Version Components
1. **User Dashboard Versions** (Multiple versions exist, only UserDashBoardEnhanced is used):
   - `client/src/pages/UserDashBoard.tsx` (duplicate in pages folder)
   - `client/src/user/UserDashBoard.tsx` (old version)
   - `client/src/user/UserDashBoardEnhanced_Part1.tsx` (partial/old version)
   - `client/src/user/UserDashBoardComplete.tsx` (old complete version)

2. **Checkout Components** (Multiple versions, only CheckoutFixed is used):
   - `client/src/pages/Checkout.tsx` (old version)
   - `client/src/pages/CheckoutOptimized.tsx` (old version)
   - `client/src/pages/CheckoutSimple.tsx` (old version)
   - `client/src/components/checkout/AddressSection.tsx` (old version)
   - `client/src/components/checkout/AddressSectionFixed.tsx` (old version)
   - `client/src/components/checkout/ShippingMethod.tsx` (old version)

3. **Shop Page Versions** (Multiple versions, only ShopWithBackendFilters is used):
   - `client/src/pages/Shop.tsx` (old version)
   - `client/src/pages/ShopOptimized.tsx` (old version)

4. **T-Shirt Preview Components** (Multiple similar components):
   - `client/src/components/SimpleTShirtPreview.tsx` (possibly unused)
   - `client/src/components/RealTShirtPreview.tsx` (possibly unused)
   - `client/src/components/PhotoRealisticPreview.tsx` (possibly unused)
   - `client/src/components/RealisticTShirtPreview.tsx` (possibly unused)

5. **Order Detail Duplicate**:
   - `client/src/pages/OrderDetail.tsx` (duplicate in pages folder)

6. **Cart Component**:
   - `client/src/core/Cart.tsx` (old version, new one is in pages)

7. **Home Component**:
   - `client/src/core/Home.tsx` (old version, imported from core in App.tsx)

8. **Payment Component**:
   - `client/src/core/Paymentb.tsx` (not used in routes)

9. **Signin Page**:
   - `client/src/pages/Signin.tsx` (duplicate, using user/Signin.tsx)

10. **Admin Components** (Not used in routes):
    - `client/src/admin/AnalyticsDashboard.tsx` (Analytics.tsx is used instead)
    - `client/src/admin/ReviewSettings.tsx` (imported but no route exists)
    - `client/src/admin/ManageProductImages.tsx` (not in routes)
    - `client/src/admin/ManageProductVariants.tsx` (ProductVariantsPage is used instead)

11. **User Profile**:
    - `client/src/user/UserProfile.tsx` (imported but route uses undefined component)

12. **TypeScript Configuration Files** (if using JavaScript):
    - `client/src/App.tsx` (not used, pages/App.tsx is used)
    - `client/src/index.tsx` (if main.tsx is entry point)

13. **Unused Test/Utility Files**:
    - `client/src/utils/testCart.ts`
    - `client/src/utils/testCustomDesign.ts`
    - `client/src/utils/clearAuth.ts`

### Documentation Files (Can be kept for reference)
- `client/TEST_PLAN.md`
- `client/ROUTING_GUIDE.md`
- `client/ADDRESS_DEBUGGING_GUIDE.md`
- `client/ADMIN_GUIDE.md`

## Backend (Server) - Unused Files

### Test Scripts (Not part of production)
1. **All test files** (These are development/testing scripts):
   - `server/testConnection.js`
   - `server/testCart.js`
   - `server/testCartCustomDesignData.js`
   - `server/testCartToOrder.js`
   - `server/testCheckout.js`
   - `server/testCustomizationFlow.js`
   - `server/testCustomOrder.js`
   - `server/testCustomOrderData.js`
   - `server/testDesignFiltering.js`
   - `server/testDesignImages.js`
   - `server/testFullDesignFlow.js`
   - `server/testGuestCheckout.js`
   - `server/testMultiDesign.js`
   - `server/testNewOrderCreation.js`
   - `server/testOrderCreation.js`
   - `server/testOrderData.js`
   - `server/testOrderFix.test.js`
   - `server/testOrderImage.js`
   - `server/testProductPhotoUrl.js`
   - `server/testProductTypeFilter.js`
   - `server/testProductTypes.js`
   - `server/testSimpleOrder.js`
   - `server/testSoftDelete.js`
   - `server/testUrlDesigns.js`
   - `server/testUserOrders.js`
   - `server/testZoroOrder.js`
   - `server/testAddresses.js`
   - `server/testAnalyticsWithCustomDesigns.js`
   - `server/testRazorpayExports.js`

2. **Setup/Migration Scripts** (One-time use):
   - `server/seed.js`
   - `server/seedOrders.js`
   - `server/seedProductTypes.js`
   - `server/seedUsers.js`
   - `server/setupProductTypes.js`
   - `server/setupTestData.js`
   - `server/migrateProductTypes.js`
   - `server/addIndexes.js`

3. **Utility Scripts** (One-time use):
   - `server/clearOrders.js`
   - `server/fixPaymentStatus.js`
   - `server/checkOrderPaymentStatus.js`
   - `server/checkProductTypes.js`
   - `server/updateProcessingOrdersToPaid.js`

4. **TypeScript Files** (if using JavaScript):
   - `server/index.ts`
   - `server/controllers/productController.ts`
   - `server/controllers/userController.ts`
   - `server/models/Product.ts`
   - `server/models/User.ts`
   - `server/routes/productRoutes.ts`
   - `server/routes/userRoutes.ts`

5. **Potentially Unused Controllers/Routes**:
   - `server/controllers/analyticsOptimized.js` (analytics.js is used)
   - `server/controllers/stripePayment.js` & `server/routes/stripePayment.js` (using Razorpay)
   - `server/controllers/productVariant.js` (no dedicated route, might be integrated)

### Documentation Files (Can be kept for reference)
- `server/PERFORMANCE_OPTIMIZATION_GUIDE.md`
- Various root level `.md` files for documentation

## Root Level Documentation (Can be kept for reference)
- `ADDRESS_MANAGEMENT_API.md`
- `CART_CUSTOM_DESIGN_FIX_SUMMARY.md`
- `CART_PERSISTENCE_IMPLEMENTATION.md`
- `CHECKOUT_ADDRESS_FIX.md`
- `CHECKOUT_TESTING_GUIDE.md`
- `CUSTOM_DESIGN_FIX_SUMMARY.md`
- `DEPLOYMENT.md`
- `EMAIL_TEMPLATES_GUIDE.md`
- `FRONT_BACK_DESIGN_FEATURE.md`
- `GUEST_CHECKOUT_BEST_PRACTICES.md`
- `GUEST_CHECKOUT_IMPLEMENTATION.md`
- `GUEST_ORDER_DATA_FLOW.md`
- `MONGODB_SETUP.md`
- `ORDER_DETAIL_FIX_SUMMARY.md`
- `PRODUCT_PHOTURL_FIX_SUMMARY.md`
- `RAZORPAY_INTEGRATION_GUIDE.md`
- `REAL_USER_TESTING_GUIDE.md`
- `SHIPROCKET_TESTING_SETUP.md`

## Recommendations

### High Priority for Removal (Duplicate/Old versions):
1. All duplicate user dashboard components
2. All old checkout component versions
3. All old shop page versions
4. Duplicate components in wrong folders
5. Test utility files in production code

### Medium Priority (Test files - keep in separate test folder):
1. All server test files (move to `server/tests/` folder)
2. All seed/setup scripts (move to `server/scripts/` folder)

### Low Priority (Documentation - organize better):
1. Move all `.md` files to a `docs/` folder
2. Keep them for reference but out of root directory

### Files to Investigate Further:
1. T-Shirt preview components - check which ones are actually used
2. TypeScript vs JavaScript files - ensure consistency
3. Admin components without routes - verify if they're imported elsewhere

## Summary Statistics
- **Frontend unused files**: ~35+ files
- **Backend test/utility files**: ~40+ files  
- **Documentation files**: ~20+ files
- **Total potentially unused**: ~95+ files

Note: Before deleting any files, ensure they are not dynamically imported or used in ways not visible in the routing files.
