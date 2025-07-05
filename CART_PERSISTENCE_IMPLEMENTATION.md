# Cart Persistence Implementation

## Overview
Implemented a robust cart persistence system that stores cart data in MongoDB for logged-in users while maintaining localStorage support for guest users. The system properly handles custom t-shirt designs with front/back design data.

## Features

### 1. **Database Cart Storage**
- Cart data persists across sessions and devices for logged-in users
- Automatic cart recovery when users return
- Supports both regular products and custom designs

### 2. **Custom Design Support**
- Stores complete design data:
  - Front and back design images (base64 or URLs)
  - Position coordinates (x, y)
  - Scale and rotation values
  - Selected base product reference

### 3. **Guest to User Migration**
- When guest users log in, their cart automatically merges with any existing cart
- No loss of cart items during authentication
- Intelligent merging prevents duplicate items

### 4. **Cart Operations**
- Add items (regular or custom)
- Update quantities
- Remove items
- Clear entire cart
- Calculate totals
- Get item counts

## Technical Implementation

### Backend Components

#### Cart Model (`server/models/cart.js`)
```javascript
{
  user: ObjectId,
  items: [{
    product: ObjectId,
    isCustom: Boolean,
    customization: {
      frontDesign: {
        designImage: String,
        position: { x, y },
        scale: Number,
        rotation: Number
      },
      backDesign: { ... }
    },
    name: String,
    size: String,
    color: String,
    price: Number,
    quantity: Number
  }]
}
```

#### Cart Controller (`server/controllers/cart.js`)
- `getCart` - Fetch user's cart
- `addToCart` - Add item with custom design support
- `updateCartItem` - Update quantity
- `removeFromCart` - Remove specific item
- `clearCart` - Clear all items
- `mergeCart` - Merge guest cart after login
- `syncCart` - Sync entire cart from frontend

#### Cart Routes (`server/routes/cart.js`)
```
GET    /api/cart              - Get cart
POST   /api/cart/add          - Add item
PUT    /api/cart/item/:id     - Update item
DELETE /api/cart/item/:id     - Remove item
DELETE /api/cart/clear        - Clear cart
POST   /api/cart/merge        - Merge guest cart
POST   /api/cart/sync         - Sync cart
```

### Frontend Components

#### Cart Helper (`client/src/core/helper/cartHelper.tsx`)
- API calls for all cart operations
- Local storage management for guest users
- Cart calculation utilities

#### Cart Context (`client/src/context/CartContext.tsx`)
- Global cart state management
- Automatic guest/user detection
- Seamless switching between local and database storage
- Cart synchronization on login/logout

## Usage

### Adding Regular Product
```javascript
await addToCart({
  product: productId,
  name: "Product Name",
  size: "M",
  color: "Black",
  price: 599,
  quantity: 1,
  isCustom: false
});
```

### Adding Custom Design
```javascript
await addToCart({
  isCustom: true,
  name: "Custom T-Shirt",
  size: "L",
  color: "White",
  price: 699,
  quantity: 1,
  customization: {
    frontDesign: {
      designImage: "base64_or_url",
      position: { x: 100, y: 150 },
      scale: 1.5,
      rotation: 45
    },
    backDesign: {
      designImage: "base64_or_url",
      position: { x: 120, y: 180 },
      scale: 1.2,
      rotation: 0
    },
    selectedProduct: baseProductId
  }
});
```

## Benefits

1. **Improved User Experience**
   - Cart persists across sessions
   - Access cart from any device
   - No lost items after browser closes

2. **Abandoned Cart Recovery**
   - Track abandoned carts
   - Send reminder emails
   - Analyze cart abandonment patterns

3. **Better Analytics**
   - Track cart value over time
   - Monitor popular items
   - Understand user behavior

4. **Marketing Opportunities**
   - Price drop alerts for cart items
   - Stock alerts when items return
   - Personalized recommendations

## Testing

Run the cart test to verify functionality:
```bash
cd server
node testCart.js
```

## Next Steps

1. **Add Cart Expiry**
   - Clear old abandoned carts (e.g., after 30 days)
   - Send reminder emails before expiry

2. **Cart Analytics**
   - Track cart abandonment rate
   - Average cart value
   - Most abandoned products

3. **Cart Notifications**
   - Email reminders for abandoned carts
   - Price drop notifications
   - Low stock alerts

4. **UI Integration**
   - Update cart drawer to use CartContext
   - Add loading states
   - Show sync status

## Migration Notes

For existing users with localStorage carts:
1. On first login after update, localStorage cart will automatically merge with database
2. No manual intervention required
3. Guest carts continue using localStorage until login
