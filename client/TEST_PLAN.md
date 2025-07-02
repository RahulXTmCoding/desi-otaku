# Comprehensive Testing Plan for Custom T-Shirt Shop

## 🧪 Testing Environment Setup

1. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd server && npm start
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

2. **Access URLs:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

3. **Test Mode Toggle:**
   - Use the gear icon (⚙️) in header to toggle between Test Mode and Backend Mode
   - Test Mode uses mock data and doesn't require backend

## 📧 Test Accounts

### For Test Mode (No Backend Required):
When in Test Mode, you can use ANY credentials - the system will accept them:
- **Admin Testing**: Use email `admin@test.com` with any password
- **User Testing**: Use email `user@test.com` with any password

### For Backend Mode (Requires MongoDB):
If you have the backend running with MongoDB:

**🔐 Admin Account:**
- Email: `admin@tshirtshop.com`
- Password: `admin123`
- Role: Admin (can access admin dashboard)

**👤 User Account:**
- Email: `user@tshirtshop.com`
- Password: `user123`
- Role: Regular customer

**👤 Additional User:**
- Email: `john@example.com`
- Password: `john123`
- Role: Regular customer

### Creating Test Users (Backend Mode):
1. Make sure MongoDB is running
2. Run: `cd server && node seedUsers.js`
3. The script will create the test users automatically

**Note:** For quick testing without backend setup, use Test Mode!

---

## 📋 Test Flow 1: Admin Product & Variant Management

### 1.1 Create Admin Account (if needed)
1. Go to `/signup`
2. Create account with role "Admin" (if backend supports)
3. Sign in at `/signin`

### 1.2 Create Product
1. Navigate to Admin Dashboard (`/admin/dashboard`)
2. Click "Manage Products" → "Add New Product"
3. Fill product details:
   - Name: "Naruto Anime T-Shirt"
   - Description: "Exclusive Naruto design printed on premium cotton"
   - Price: 599
   - Category: Select existing or create new
   - Stock: 100
   - Image: Upload or provide URL
4. Click "Create Product"
5. **Verify:** Success message appears

### 1.3 Configure Product Variants
1. In Manage Products, find your product
2. Click the palette icon (🎨) next to the product
3. **Test Variant Configuration:**
   
   a) **Add Images for Each Color:**
   - Black: Add URL for black t-shirt image
   - White: Add URL for white t-shirt image
   - Red: Add URL for red t-shirt image
   - Navy: Add URL for navy t-shirt image
   
   b) **Enable/Disable Colors:**
   - Enable: Black, White, Red
   - Disable: Navy, Gray, Others
   
   c) **Set Stock Levels:**
   ```
   Black:  S(10), M(25), L(∞), XL(15), XXL(5)
   White:  S(0),  M(30), L(25), XL(∞),  XXL(10)
   Red:    S(5),  M(15), L(0),  XL(5),  XXL(0)
   ```
   
   d) **Test Quick Actions:**
   - Click ∞ button to set all sizes to infinity
   - Click 0 button to set all sizes to zero
   - Edit individual stock by clicking numbers

4. Click "Save Variants"
5. **Verify:** Success message appears

---

## 📋 Test Flow 2: Customer Product Experience

### 2.1 Product Listing Page
1. Navigate to Shop (`/shop`)
2. **Verify:**
   - Products display with images
   - Prices show correctly
   - "Add to Cart" buttons work
   - Out of stock products show disabled state

### 2.2 Product Detail Page
1. Click on the product you created
2. **Test Color Selection:**
   - Only enabled colors (Black, White, Red) should appear
   - Clicking each color should update the main image
   - Selected color should have yellow border

3. **Test Size Availability:**
   - Select Black: Size S should be available
   - Select White: Size S should show "Out" badge
   - Select Red: Size L should show "Out" badge
   - Infinity stock sizes should always be available

4. **Test Dynamic Content:**
   - Rating shows (default 4.5 or custom)
   - Sold count shows only if > 5 sales
   - Features tab shows custom or default features
   - Care instructions show custom or defaults

5. **Test Share Button:**
   - Click Share button
   - On mobile: Native share dialog should appear
   - On desktop: Should show "Link copied!" alert

6. **Test Add to Cart:**
   - Select Black color, Size M
   - Set quantity to 2
   - Click "Add to Cart"
   - **Verify:** Success message appears
   - Check cart icon shows updated count

---

## 📋 Test Flow 3: Cart Management

### 3.1 Cart Drawer (Header Cart Icon)
1. Click cart icon in header
2. **Verify Cart Drawer:**
   - Shows product with correct color/size
   - Shows variant image (black t-shirt)
   - Quantity controls work (+/- buttons)
   - Price updates with quantity
   - Shipping shows:
     - FREE for orders ≥ ₹1000
     - ₹99 for orders < ₹1000
   - Total includes shipping

3. **Test Multiple Variants:**
   - Go back to product page
   - Add White/Large
   - Add Red/Medium
   - Open cart drawer
   - **Verify:** Each variant shows as separate item

### 3.2 Cart Page (`/cart`)
1. Click "View Cart" or navigate to `/cart`
2. **Verify Same Features:**
   - All items display correctly
   - Each shows its variant image
   - Stock-based quantity limits work
   - Shipping calculation matches drawer

---

## 📋 Test Flow 4: Custom Design Flow

### 4.1 Navigate to Customize
1. Click "Customize" in header or go to `/customize`

### 4.2 Test Design Creation
1. **Upload Design:**
   - Click upload area
   - Select an image (anime character preferred)
   - **Verify:** Design appears on t-shirt preview

2. **Test T-Shirt Preview:**
   - Change colors using color selector
   - **Verify:** T-shirt color updates in real-time
   - Design stays in place on different colors

3. **Test Design Controls:**
   - Move design around canvas
   - Resize using corner handles
   - Use position presets (Center, Chest)
   - Test zoom controls

4. **Add to Cart:**
   - Select size
   - Click "Add to Cart"
   - **Verify:** Success message

### 4.3 Verify Custom Design in Cart
1. Open cart drawer
2. **Find Custom Item:**
   - Should show "Custom Design" as name
   - Shows selected color and size
   - Preview shows t-shirt with design
   - Price includes design cost

---

## 📋 Test Flow 5: Stock Management Testing

### 5.1 Test Stock Depletion
1. As admin, set a product variant to low stock:
   - Black/Small: 2 units

2. As customer:
   - Add 2 Black/Small to cart
   - Complete order (if checkout implemented)
   - Return to product page
   - **Verify:** Black/Small now shows "Out" badge

### 5.2 Test Infinity Stock
1. Add item with ∞ stock to cart
2. Set quantity to 999
3. **Verify:** No stock warnings appear

---

## 📋 Test Flow 6: Edge Cases

### 6.1 Empty States
1. **Empty Cart:**
   - Clear all items from cart
   - **Verify:** "Cart is empty" message
   - "Continue Shopping" button works

2. **No Variants:**
   - Create product without variants
   - **Verify:** Default colors appear on product page

### 6.2 Error Handling
1. **Invalid Product:**
   - Navigate to `/product/invalid-id`
   - **Verify:** Error message and back button

2. **Network Issues:**
   - Switch to backend mode
   - Stop backend server
   - Try to load products
   - **Verify:** Error messages appear

---

## 📋 Test Flow 7: Responsive Design

### 7.1 Mobile Testing
1. Open browser DevTools (F12)
2. Toggle device toolbar
3. Select iPhone or Android device
4. **Test All Pages:**
   - Navigation hamburger menu
   - Product grid (2 columns)
   - Cart drawer (full width)
   - Custom designer (touch controls)

### 7.2 Tablet Testing
1. Select iPad or tablet size
2. **Verify:**
   - Product grid (3 columns)
   - Side-by-side layouts work
   - All interactions smooth

---

## ✅ Checklist Summary

### Admin Features
- [ ] Product creation with image
- [ ] Variant management (images, stock)
- [ ] Enable/disable colors
- [ ] Set infinity stock
- [ ] Bulk stock operations

### Customer Features
- [ ] View products with variants
- [ ] Color selection updates image
- [ ] Size availability by variant
- [ ] Add to cart with variants
- [ ] Cart shows correct images
- [ ] Shipping calculations
- [ ] Share functionality

### Custom Design
- [ ] Upload and position design
- [ ] T-shirt color preview
- [ ] Add custom design to cart
- [ ] Preview in cart

### Stock Management
- [ ] Stock decreases on order
- [ ] Out of stock handling
- [ ] Infinity stock works
- [ ] Low stock warnings

### User Experience
- [ ] Responsive on all devices
- [ ] Error messages clear
- [ ] Loading states smooth
- [ ] Success feedback visible

---

## 🐛 Common Issues to Check

1. **Images Not Loading:**
   - Check image URLs are accessible
   - Verify CORS settings if using external URLs

2. **Variants Not Showing:**
   - Ensure variants are saved in admin
   - Check browser console for errors

3. **Cart Calculations Wrong:**
   - Verify quantity * price math
   - Check shipping threshold (₹1000)

4. **Mobile Layout Issues:**
   - Test touch interactions
   - Verify drawer/modal behavior

---

## 📊 Performance Checks

1. **Page Load Times:**
   - Product list < 2 seconds
   - Product detail < 1 second
   - Image loading progressive

2. **Interaction Response:**
   - Cart updates instant
   - Color changes immediate
   - No lag on design canvas

---

## 🎯 Success Criteria

The implementation is successful when:
1. Admin can manage products and variants efficiently
2. Customers see accurate stock and images
3. Cart calculations are always correct
4. Custom designs work smoothly
5. Mobile experience is flawless
6. No console errors during normal use

---

## 📝 Notes

- Test in both Test Mode and Backend Mode
- Try different browsers (Chrome, Firefox, Safari)
- Test with slow network (DevTools → Network → Slow 3G)
- Check accessibility with keyboard navigation
