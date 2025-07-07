# Admin Guide - Custom T-Shirt Shop

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Test Accounts](#test-accounts)
3. [Product Management](#product-management)
4. [Variant Management](#variant-management)
5. [Stock Management](#stock-management)
6. [Common Workflows](#common-workflows)
7. [Tips & Best Practices](#tips--best-practices)

---

## 🚀 Getting Started

### Starting the Application
```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
cd client && npm run dev
```

### Access URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Test Mode Toggle
- Use the gear icon (⚙️) in header to toggle between Test Mode and Backend Mode
- Test Mode: Uses mock data, no backend required
- Backend Mode: Connected to MongoDB

---

## 📧 Test Accounts

### Test Mode (No Backend Required)
- **Admin**: `admin@test.com` (any password)
- **User**: `user@test.com` (any password)

### Backend Mode (Requires MongoDB)
**Admin Account:**
- Email: `admin@tshirtshop.com`
- Password: `admin123`

**User Account:**
- Email: `user@tshirtshop.com`
- Password: `user123`

---

## 📦 Product Management

### Creating a Product

#### Step 1: Basic Product Creation
1. Navigate to **Admin Dashboard** → **Add New Product**
2. Fill in:
   - **Product Name**: e.g., "Naruto Anime T-Shirt"
   - **Description**: Detailed product description
   - **Price**: e.g., 599
   - **Category**: Select or create new
   - **Initial Stock**: e.g., 100
   - **Image**: Upload file or provide URL

#### Step 2: Variant Configuration
1. Go to **Manage Products**
2. Find your product
3. Click the **palette icon (🎨)**
4. Configure variants (see Variant Management section)

### Product Features
- Single main product image
- Basic information (name, price, description)
- Category assignment
- Initial stock quantity

---

## 🎨 Variant Management

### Overview
After creating a product, you can configure:
- Multiple color variants
- Individual images per color
- Stock levels per size/color combination
- Enable/disable specific colors

### Accessing Variant Management
1. Navigate to **Admin Dashboard** → **Manage Products**
2. Click the **🎨 palette icon** next to any product
3. Opens the variant configuration page

### Variant Configuration Options

#### 1. Color Variants
- **Available Colors**: Black, White, Navy, Red, Gray, Green, Yellow, Purple
- **Enable/Disable**: Toggle each color on/off
- **Only enabled colors** appear to customers

#### 2. Images Per Variant
- Add unique image URL for each color
- Customers see variant-specific images when selecting colors
- Example:
  ```
  Black → black-tshirt.jpg
  White → white-tshirt.jpg
  Red → red-tshirt.jpg
  ```

#### 3. Stock Management Per Size
- Individual stock levels for each size within each color
- Sizes: S, M, L, XL, XXL
- Stock options:
  - **Number** (0-999): Regular stock tracking
  - **Infinity (∞)**: Unlimited stock (made-to-order)

---

## 🔢 Stock Management

### Understanding Stock Levels

| Stock Value | Display | Meaning | Color Code |
|-------------|---------|---------|------------|
| 0 | 0 | Out of stock | Red |
| 1-9 | 1-9 | Low stock warning | Yellow |
| 10+ | 10+ | Normal stock | White |
| ∞ | ∞ | Unlimited (Made to order) | Green |

### Adding Infinite Stock

#### Method 1: Quick Action (All Sizes)
1. In variant management, find your color
2. Click the **∞ button** in Actions column
3. Sets ALL sizes to infinity instantly

#### Method 2: Individual Size
1. Click on any stock number
2. Type **"infinity"** or **"∞"**
3. Press Enter or click ✓

#### Method 3: Bulk Operations
- **∞ button**: Sets all sizes to infinity
- **0 button**: Sets all sizes to zero

### Example Stock Configuration
```
Black T-Shirt:
- S: 10 (limited stock)
- M: ∞ (made to order)
- L: ∞ (made to order)
- XL: 25 (limited stock)
- XXL: 0 (out of stock)
```

---

## 🔄 Common Workflows

### Workflow 1: Creating a Product with Variants

1. **Create Base Product**
   ```
   Admin Dashboard → Add New Product
   - Name: "Anime Character T-Shirt"
   - Price: 599
   - Upload main image
   - Save
   ```

2. **Configure Variants**
   ```
   Manage Products → Click 🎨
   - Enable: Black, White, Red
   - Add images for each color
   - Set stock levels
   - Save Variants
   ```

3. **Set Infinite Stock for Popular Sizes**
   ```
   For each color:
   - Click on M size → Type "infinity" → Enter
   - Click on L size → Type "infinity" → Enter
   - Keep S, XL, XXL with regular stock
   ```

### Workflow 2: Quick Product Setup

1. **Use Quick Actions**
   ```
   - Create product
   - Go to variants
   - Enable desired colors
   - Click ∞ for all sizes (made-to-order)
   - Add images
   - Save
   ```

### Workflow 3: Seasonal Stock Update

1. **Reduce Stock for End of Season**
   ```
   - Go to variants
   - Click 0 button for colors to discontinue
   - Update remaining stock numbers
   - Save
   ```

---

## 💡 Tips & Best Practices

### Product Images
- **Main Image**: Shows in product listings
- **Variant Images**: Shows when customer selects color
- **Image Format**: Use high-quality JPG/PNG
- **Image Size**: 800x800px recommended

### Stock Strategy
- **Popular Sizes (M, L)**: Consider infinite stock
- **Less Common Sizes**: Track actual inventory
- **New Products**: Start with limited stock, switch to ∞ if popular
- **Seasonal Items**: Use regular stock tracking

### Variant Best Practices
1. **Enable only available colors** - Don't show colors you can't fulfill
2. **Update images promptly** - Each color should have its image
3. **Monitor low stock** - Yellow indicators need attention
4. **Use infinity wisely** - Only for items you can always produce

### Customer Experience
- Customers see:
  - Only enabled color variants
  - Real-time stock availability
  - "Out" badge for unavailable sizes
  - Variant images when selecting colors

### Quick Reference

| Task | Path | Action |
|------|------|--------|
| Add Product | Admin Dashboard → Add Product | Fill form |
| Manage Variants | Manage Products → 🎨 | Configure |
| Set Infinite Stock | Variant Page → Stock Number | Type "infinity" |
| Quick Infinity | Variant Page → Actions | Click ∞ |
| Disable Color | Variant Page → Active | Toggle off |
| Add Variant Image | Variant Page → Image | Enter URL |

---

## 🆘 Troubleshooting

### Common Issues

**Products Not Showing:**
- Ensure at least one variant is enabled
- Check if product has stock
- Verify product is saved

**Infinite Stock Not Working:**
- Type exactly "infinity" (lowercase)
- Press Enter to confirm
- Check if variant is enabled

**Images Not Loading:**
- Verify image URLs are accessible
- Check for CORS issues with external URLs
- Try re-entering the URL

**Variant Changes Not Saving:**
- Click "Save Variants" button
- Wait for success message
- Refresh to verify changes

---

## 📊 Admin Dashboard Features

### Quick Stats
- Total Revenue
- Total Orders
- Active Products
- Registered Users

### Quick Actions
- **Products**: Add, Manage, Configure variants
- **Categories**: Create, Organize products
- **Orders**: View, Process, Track
- **Analytics**: Sales data, Customer insights

### Navigation (Admin Only)
When logged in as admin, header shows:
- Dashboard
- Products
- Categories
- Orders
- Analytics

---

## 🔐 Security Notes

- Admin role = 1, User role = 0
- Admins bypass user pages (Shop, Customize)
- All admin routes protected
- Token-based authentication

---

## 📝 Notes

- **Test Mode**: Perfect for learning without affecting real data
- **Variants**: Core feature for size/color combinations
- **Infinite Stock**: Ideal for print-on-demand business model
- **Two-Step Process**: Product first, then variants (cleaner UX)

---

Last Updated: January 2025
