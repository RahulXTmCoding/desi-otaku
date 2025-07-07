# Routing Guide for Custom T-Shirt Shop

## 🚨 IMPORTANT: Routing Structure

This application uses React Router v6 with a specific structure that must be understood:

### Routing Hierarchy

```
client/src/main.tsx
    └── imports client/src/pages/App.tsx
            └── Contains all route definitions
```

## ⚡ Key Points

1. **DO NOT USE `client/src/Routes.tsx`** - This file should not exist and is not used
2. **All routes are defined in `client/src/pages/App.tsx`**
3. **Main entry point is `client/src/main.tsx`** which imports App from pages/App.tsx

## 📁 File Structure

```
client/src/
├── main.tsx                    # Entry point - imports pages/App.tsx
├── pages/
│   └── App.tsx                # ⭐ ALL ROUTES ARE DEFINED HERE
├── user/
│   ├── UserDashBoard.tsx      # Old dashboard (deprecated)
│   └── UserDashBoardEnhanced.tsx # New enhanced dashboard
└── Routes.tsx                 # ❌ DO NOT USE - Should be deleted
```

## 🔧 How to Update Routes

When you need to change a route or component:

1. **Open `client/src/pages/App.tsx`**
2. **Update the import** at the top of the file
3. **Update the route** in the Routes component

### Example: Updating User Dashboard

```jsx
// In client/src/pages/App.tsx

// 1. Update import
import UserDashBoardEnhanced from '../user/UserDashBoardEnhanced';

// 2. Update route
<Route path="/user/dashboard" element={
  <PrivateRoute>
    <UserDashBoardEnhanced />  {/* Changed from UserDashBoard */}
  </PrivateRoute>
} />
```

## 🛣️ Current Routes

### Public Routes
- `/` - Home page
- `/shop` - Shop page
- `/product/:id` - Product detail
- `/customize` - T-shirt customization
- `/cart` - Shopping cart
- `/wishlist` - Wishlist
- `/signin` - Sign in
- `/signup` - Sign up
- `/contact` - Contact page

### Protected Routes (Require Authentication)
- `/user/dashboard` - User dashboard (using UserDashBoardEnhanced)
- `/user/profile` - User profile
- `/order/:orderId` - Order details

### Admin Routes (Require Admin Role)
- `/admin/dashboard` - Admin dashboard
- `/admin/products` - Manage products
- `/admin/categories` - Manage categories
- `/admin/designs` - Manage designs
- `/admin/orders` - Manage orders
- `/admin/analytics` - Analytics dashboard
- `/admin/coupons` - Manage coupons

## 🔍 Troubleshooting

### Issue: Changes to routes not reflecting
1. Make sure you're editing `client/src/pages/App.tsx` NOT `client/src/Routes.tsx`
2. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Check the browser console for errors

### Issue: Component not found
1. Verify the import path in `client/src/pages/App.tsx`
2. Ensure the component file exists and exports correctly
3. Check for typos in component names

## 💡 Best Practices

1. **Always update routes in `client/src/pages/App.tsx`**
2. **Delete any `Routes.tsx` file if it exists**
3. **Use meaningful route paths**
4. **Wrap protected routes with appropriate guards (PrivateRoute/AdminRoute)**
5. **Keep route definitions organized and grouped by access level**

## 🚀 Quick Reference

```bash
# Main routing file location
client/src/pages/App.tsx

# Entry point that imports App.tsx
client/src/main.tsx

# DO NOT USE
client/src/Routes.tsx  ❌
```

Remember: When in doubt, check `client/src/pages/App.tsx` - that's where all the routing magic happens!
