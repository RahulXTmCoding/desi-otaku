# Front & Back Design Feature Implementation

## Overview
This feature allows users to add custom designs to both the front and back of t-shirts with position selection options.

## Features Implemented

### 1. Design Placement Options
- **Front Positions**:
  - Center
  - Left Chest
  - Right Chest  
  - Center Bottom

- **Back Positions**:
  - Center
  - Center Bottom

### 2. User Interface Changes

#### Customize Page (`client/src/pages/Customize.tsx`)
- Added side selector buttons to switch between front and back views
- Position selector for each side with visual indicators
- Design can be added/removed independently for each side
- Price breakdown shows front and back design costs separately
- Visual indicators show which sides have designs (F/B badges)

#### Preview Component (`client/src/components/RealTShirtPreview.tsx`)
- Supports showing designs on both front and back
- Positions designs based on selected placement
- Toggle button to switch between front/back views
- Different design sizes for different positions (chest positions are smaller)

#### Cart Components
- `CartTShirtPreview.tsx` - Shows front/back designs with rotation button
- `Cart.tsx` - Displays design information (Front Only, Back Only, Front & Back)
- Price breakdown shows individual design costs

### 3. Backend Updates

#### Order Model (`server/models/order.js`)
```javascript
customization: {
  frontDesign: {
    designId: String,
    designImage: String,
    position: String (enum: ['center', 'left', 'right', 'center-bottom']),
    price: Number
  },
  backDesign: {
    designId: String,
    designImage: String,
    position: String (enum: ['center', 'center-bottom']),
    price: Number
  }
}
```

#### Order Controller (`server/controllers/order.js`)
- Handles both new multi-design structure and legacy single design
- Validates design prices from database
- Calculates total price including all designs

### 4. Backward Compatibility
The system maintains full backward compatibility:
- Old orders with single designs continue to work
- Legacy fields (`designId`, `designImage`) are still supported
- New orders can use either structure

### 5. Pricing Structure
- Base T-shirt Price: ₹549
- Each Design: ₹150 (or design-specific price from database)
- Examples:
  - Front only: ₹549 + ₹150 = ₹699
  - Back only: ₹549 + ₹150 = ₹699
  - Front & Back: ₹549 + ₹150 + ₹150 = ₹849

## Testing
Run the test script to verify backend functionality:
```bash
cd server
node testMultiDesign.js
```

## User Flow
1. User goes to Customize page
2. Selects a design from the gallery
3. Chooses position on current side (front/back)
4. Can switch sides and add another design
5. Both designs appear in preview with toggle button
6. Add to cart shows total price with breakdown
7. Cart displays which sides have designs
8. Order is processed with full design information

## Future Enhancements
1. More position options (sleeve, collar)
2. Design rotation/scaling controls
3. Text overlay options
4. Design templates for common layouts
5. Preview sharing functionality
