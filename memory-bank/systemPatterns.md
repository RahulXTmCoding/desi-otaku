# System Patterns

## Architecture Overview
The custom t-shirt shop follows a modular React + TypeScript architecture with clear separation of concerns:

```
client/
├── src/
│   ├── admin/           # Admin dashboard modules
│   │   ├── components/  # Reusable admin components
│   │   │   └── orders/  # Order-specific components
│   │   └── pages/       # Admin page components
│   ├── components/      # Shared UI components
│   ├── pages/          # Route pages
│   ├── user/           # User dashboard modules
│   ├── core/           # Core utilities
│   └── types/          # TypeScript types
```

## Component Architecture Pattern

### Modular Component Design
**IMPORTANT PATTERN**: Always break large pages into small, reusable modules. This ensures:
- Better maintainability
- Easier testing
- Improved reusability
- Clear separation of concerns
- Better performance through code splitting

### Example Structure (Order Management)
```
admin/
├── OrderManagement.tsx              # Main container component
├── components/
│   └── orders/
│       ├── types.ts                # Shared TypeScript interfaces
│       ├── OrderStats.tsx          # Statistics display component
│       ├── OrderFilters.tsx        # Filter controls component
│       ├── OrderListItem.tsx       # Individual order row
│       ├── OrderStatusBadge.tsx    # Status badge component
│       ├── OrderDetailModal.tsx    # Detail view modal
│       ├── BulkActions.tsx         # Bulk operations component
│       └── Pagination.tsx          # Pagination controls
```

### Component Guidelines
1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **State Management**: Keep state as close to where it's needed as possible
4. **Reusability**: Design components to be reusable across different contexts
5. **Size Limit**: If a component exceeds 200 lines, consider breaking it down

## Navigation Patterns (Updated 2025-01-28)

### Enhanced Dropdown Navigation Pattern
**New Pattern**: Professional e-commerce dropdown menus with visual hierarchy

```typescript
// ShoppingDropdown.tsx - Reusable dropdown component
interface DropdownCategory {
  title: string;
  icon: ReactNode;
  color: string; // Gradient classes
  description: string;
  items: {
    name: string;
    link: string;
    badge?: string;
    icon?: string; // Emoji or icon
  }[];
}

const ShoppingDropdown = () => {
  return (
    <>
      {/* Products Dropdown */}
      <div className="dropdown-container">
        {/* Category Cards with gradients */}
        <div className="category-header gradient-bg">
          {icon}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        
        {/* Items with hover states */}
        <Link className="hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="group-hover:text-yellow-600">
            {item.name}
          </span>
          {item.badge && <Badge />}
        </Link>
      </div>
      
      {/* Quick Access Section */}
      <div className="quick-access">
        <Link className="gradient-card">
          Best Sellers / New Arrivals / Limited Edition
        </Link>
      </div>
    </>
  );
};
```

### Mobile Navigation Pattern
```typescript
// Enhanced mobile menu with categories
const MobileMenu = () => {
  return (
    <div className="w-80 overflow-y-auto"> {/* Increased width */}
      {/* Organized sections */}
      <div className="shop-by-products">
        <h3>Shop by Products</h3>
        {/* Category links */}
      </div>
      
      <div className="shop-by-anime">
        <h3>Shop by Anime</h3>
        {/* Grid layout for anime */}
      </div>
    </div>
  );
};
```

### Route Structure
- All routes defined in `pages/App.tsx`
- Protected routes check authentication
- Consistent breadcrumb navigation
- Clear URL patterns
- Dropdown navigation for better discoverability

## Data Flow Patterns

### API Integration
```typescript
// Centralized API calls
const loadOrders = async () => {
  if (isTestMode) {
    return mockData;
  }
  const response = await fetch(`${API}/endpoint`);
  return response.json();
};
```

### Custom Order Data Flow Pattern
**Critical Pattern**: Ensure customization data flows properly from Cart → Checkout → Backend → Database

```typescript
// Frontend: Include all customization fields
interface CartItem {
  // ... other fields
  customization?: {
    frontDesign?: {
      designId: string;
      designImage: string;
      position: string;
      price: number;
    };
    backDesign?: {
      designId: string;
      designImage: string;
      position: string;
      price: number;
    };
  };
}

// Backend: Validate and clean customization data
const processProducts = products.map(product => {
  if (product.customization) {
    const { frontDesign, backDesign } = product.customization;
    const hasFrontDesign = frontDesign?.designId && frontDesign?.designImage;
    const hasBackDesign = backDesign?.designId && backDesign?.designImage;
    
    if (!hasFrontDesign && !hasBackDesign) {
      delete product.customization;
    }
  }
  return product;
});
```

### State Management
- **Local State**: For component-specific state (useState)
- **Context**: For cross-component communication (React Context)
- **Session Storage**: For temporary data persistence
- **Local Storage**: For user preferences

## Enhanced Coupon System Patterns (New)

### Coupon Display Types
```typescript
interface EnhancedCoupon extends Coupon {
  displayType: 'promotional' | 'hidden' | 'auto-apply';
  bannerImage?: string;
  bannerText?: string;
  autoApplyPriority?: number;
}
```

### Auto-Apply Algorithm
```typescript
const getBestAutoApplyCoupon = async (cartTotal: number, userId?: string) => {
  const eligibleCoupons = await Coupon.find({
    displayType: 'auto-apply',
    isActive: true,
    minimumPurchase: { $lte: cartTotal },
    $or: [
      { validUntil: { $gte: new Date() } },
      { validUntil: null }
    ]
  }).sort({ autoApplyPriority: -1, discountValue: -1 });
  
  // Check user eligibility for each coupon
  for (const coupon of eligibleCoupons) {
    if (await isUserEligible(coupon, userId)) {
      return coupon;
    }
  }
  return null;
};
```

### Promotional Banner Pattern
```typescript
// Homepage component
const PromotionalBanner = () => {
  const [promotionalCoupons, setPromotionalCoupons] = useState([]);
  
  useEffect(() => {
    fetchPromotionalCoupons().then(setPromotionalCoupons);
  }, []);
  
  return (
    <div className="promotional-banner-carousel">
      {promotionalCoupons.map(coupon => (
        <div key={coupon._id} className="banner-slide">
          <img src={coupon.bannerImage} alt={coupon.code} />
          <div className="banner-content">
            <h3>{coupon.bannerText}</h3>
            <p>Use code: {coupon.code}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Universal Discount Calculation Consistency Patterns (New - 2025-01-09)

### Progressive Discount Flow Pattern
**Critical Pattern**: Ensures identical discount calculations across all systems using sequential discount application

```javascript
// Universal Progressive Discount Algorithm
const calculateOrderDiscounts = (order) => {
  // 1. Calculate product subtotal (no shipping)
  let productSubtotal = order.products.reduce((sum, product) => {
    return sum + (product.price * product.count);
  }, 0);

  // 2. Apply discounts progressively (ORDER MATTERS!)
  let remainingAmount = productSubtotal;

  // 3. Apply AOV/Quantity discount first
  const quantityDiscount = calculateQuantityDiscount(remainingAmount, totalQuantity);
  remainingAmount -= quantityDiscount;

  // 4. Apply coupon discount to reduced amount
  let couponDiscount = 0;
  if (order.coupon) {
    const couponBaseAmount = remainingAmount; // After AOV discount
    if (order.coupon.discountType === 'percentage') {
      couponDiscount = Math.floor((couponBaseAmount * order.coupon.discountValue) / 100);
    } else {
      couponDiscount = order.coupon.discountValue;
    }
  }
  remainingAmount -= couponDiscount;

  // 5. Apply online payment discount to final reduced amount
  const onlinePaymentDiscount = isOnlinePayment 
    ? Math.round(remainingAmount * 0.05) 
    : 0;

  // 6. Calculate final total with shipping
  const finalTotal = remainingAmount - onlinePaymentDiscount + shippingCost;

  return {
    productSubtotal,
    quantityDiscount,
    couponDiscount,
    onlinePaymentDiscount,
    finalTotal,
    totalSavings: quantityDiscount + couponDiscount + onlinePaymentDiscount
  };
};
```

### Universal Calculator Architecture Pattern
**Single Source of Truth**: One calculator for backend, one component for frontend, both using identical logic

```javascript
// Backend: server/utils/discountCalculator.js
class DiscountCalculator {
  static calculateOrderDiscounts(order) {
    // Progressive discount logic implementation
    // Smart coupon metadata handling
    // Consistent HTML generation for emails
    return discountBreakdown;
  }

  static generateDiscountHTML(order) {
    const discounts = this.calculateOrderDiscounts(order);
    return `
      <tr><td>Subtotal:</td><td>₹${discounts.subtotal}</td></tr>
      <tr><td>Quantity Discount:</td><td>-₹${discounts.quantityDiscount}</td></tr>
      <tr><td>Coupon Discount:</td><td>-₹${discounts.couponDiscount}</td></tr>
      <tr><td>Online Payment Discount:</td><td>-₹${discounts.onlinePaymentDiscount}</td></tr>
      <tr><td>Final Total:</td><td>₹${discounts.finalTotal}</td></tr>
    `;
  }
}

// Frontend: client/src/components/OrderDiscountBreakdown.tsx
const OrderDiscountBreakdown = ({ order, orderStateData }) => {
  // Uses IDENTICAL progressive logic as backend
  // Handles missing coupon metadata intelligently  
  // Provides consistent UI across all order pages
  return <div>{/* Discount breakdown UI */}</div>;
};
```

### Smart Coupon Metadata Handling Pattern
**Intelligent Detection**: Handles missing coupon metadata gracefully

```javascript
// Automatic discount type detection
const handleMissingCouponMetadata = (coupon, baseAmount) => {
  let couponDiscount = 0;
  
  if (coupon.discountType === 'percentage') {
    // Explicitly marked as percentage
    couponDiscount = Math.floor((baseAmount * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'fixed') {
    // Explicitly marked as fixed amount
    couponDiscount = coupon.discountValue;
  } else {
    // ✅ SMART DETECTION: Missing discountType
    const discountValue = coupon.discountValue || 0;
    if (discountValue <= 100 && discountValue > 0) {
      // Likely percentage (e.g., 10 = 10%)
      couponDiscount = Math.floor((baseAmount * discountValue) / 100);
      console.log(`🔄 Auto-detected percentage: ${discountValue}% = ₹${couponDiscount}`);
    } else {
      // Likely fixed amount (e.g., 150 = ₹150)
      couponDiscount = discountValue;
      console.log(`🔄 Auto-detected fixed amount: ₹${couponDiscount}`);
    }
  }
  
  return couponDiscount;
};
```

### Email Integration Pattern
**Hardcoded Removal**: Replace all hardcoded email calculations with universal calculator

```javascript
// BEFORE: Hardcoded email calculations (WRONG)
const sendOrderConfirmationWithTracking = (order) => {
  const html = `
    <!-- Hardcoded inline calculations -->
    ${(() => {
      const subtotal = order.originalAmount || order.amount;
      let couponDiscountAmount = 0;
      if (order.coupon.discountType === 'percentage') {
        couponDiscountAmount = Math.floor((subtotal * order.coupon.discountValue) / 100);
      }
      return `<tr><td>Coupon:</td><td>-₹${couponDiscountAmount}</td></tr>`;
    })()}
  `;
};

// AFTER: Universal calculator integration (CORRECT)
const sendOrderConfirmationWithTracking = (order) => {
  const html = `
    <h3>Order Summary:</h3>
    <table>
      <tbody>
        ${DiscountCalculator.generateDiscountHTML(order)}
      </tbody>
    </table>
  `;
};
```

### Consistency Validation Pattern
**Zero Tolerance**: System must show identical amounts across all touchpoints

```javascript
// Validation test pattern
const validateDiscountConsistency = async (orderId) => {
  const order = await Order.findById(orderId);
  
  // Get calculations from all sources
  const frontendCalc = OrderDiscountBreakdown.calculateDiscounts(order);
  const backendCalc = DiscountCalculator.calculateOrderDiscounts(order);
  const checkoutCalc = getCheckoutPageCalculation(order);
  
  // Verify all calculations match
  const calculations = [frontendCalc, backendCalc, checkoutCalc];
  const areConsistent = calculations.every(calc => 
    calc.couponDiscount === calculations[0].couponDiscount &&
    calc.onlinePaymentDiscount === calculations[0].onlinePaymentDiscount &&
    calc.totalSavings === calculations[0].totalSavings
  );
  
  if (!areConsistent) {
    throw new Error('Discount calculation inconsistency detected!');
  }
  
  return { consistent: true, calculation: calculations[0] };
};
```

### Architecture Diagram Pattern
```
┌─────────────────────────────────┐
│     Universal Calculator        │
│  (DiscountCalculator.js)        │
│                                 │
│  ✅ Progressive discount logic  │
│  ✅ Smart metadata handling     │
│  ✅ HTML generation for emails  │
│  ✅ Consistent mathematical ops │
└─────────────────┬───────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │ Backend  │    │  Frontend  │
    │ Systems  │    │ Component  │
    │          │    │            │
    │ • Emails │    │ • OrderDiscount│
    │ • Invoice│    │   Breakdown │
    │ • APIs   │    │ • All Pages│
    │ • Orders │    │ • Admin UI │
    └──────────┘    └────────────┘
```

### Implementation Checklist Pattern
```javascript
// Files requiring universal calculator integration
const DISCOUNT_CONSISTENCY_CHECKLIST = {
  backend: [
    'server/utils/discountCalculator.js',     // ✅ Universal calculator
    'server/services/emailService.js',       // ✅ Remove hardcoded calculations
    'server/services/invoiceService.js',     // ✅ Use universal calculator
    'server/controllers/order.js'            // ✅ Store consistent data
  ],
  frontend: [
    'client/src/components/OrderDiscountBreakdown.tsx', // ✅ Universal component
    'client/src/pages/OrderConfirmationEnhanced.tsx',   // ✅ Use universal component
    'client/src/pages/OrderTracking.tsx',               // ✅ Use universal component
    'client/src/user/OrderDetail.tsx',                  // ✅ Use universal component
    'client/src/admin/components/orders/OrderDetailModal.tsx' // ✅ Use universal component
  ],
  validation: [
    'All pages show identical coupon discounts',        // ✅ Verified
    'All pages show identical online payment discounts', // ✅ Verified  
    'All pages show identical total savings',           // ✅ Verified
    'Emails match all frontend displays',               // ✅ Verified
    'Invoices match all frontend displays'              // ✅ Verified
  ]
};
```

### Business Rules Enforcement Pattern
```javascript
// Consistent business rules across all systems
const DISCOUNT_BUSINESS_RULES = {
  discountOrder: [
    '1. Product subtotal calculation (no shipping)',
    '2. AOV/Quantity discount application', 
    '3. Coupon discount on reduced amount',
    '4. Online payment discount on final reduced amount',
    '5. Add shipping cost to get final total'
  ],
  
  couponCalculation: {
    baseAmount: 'Product subtotal AFTER AOV discount',
    percentageFormula: 'Math.floor((baseAmount * percentage) / 100)',
    fixedFormula: 'coupon.discountValue',
    autoDetection: 'Value <= 100 = percentage, > 100 = fixed amount'
  },
  
  onlinePaymentDiscount: {
    baseAmount: 'Amount AFTER AOV and coupon discounts',
    percentage: '5%',
    formula: 'Math.round(baseAmount * 0.05)',
    eligibility: 'razorpay, card, or online payment methods only'
  }
};
```

## Comprehensive Discount Display Patterns (Previous - 2025-01-08)

### Centralized Discount Architecture Pattern
**Critical Pattern**: Replace all hardcoded discount values with centralized, configurable service

```typescript
// server/services/aovService.js - Single source of truth
class AOVService {
  static async getAOVSettings() {
    return await Settings.findOne({ key: 'aov_discount_tiers' }) || {
      value: {
        tier1: { minQuantity: 2, discountPercentage: 10 },
        tier2: { minQuantity: 3, discountPercentage: 15 },
        tier3: { minQuantity: 5, discountPercentage: 20 }
      }
    };
  }
  
  static async calculateDiscount(totalQuantity, subtotal) {
    const settings = await this.getAOVSettings();
    const tiers = settings.value;
    
    // Find highest applicable tier
    let applicableTier = null;
    if (totalQuantity >= tiers.tier3.minQuantity) {
      applicableTier = tiers.tier3;
    } else if (totalQuantity >= tiers.tier2.minQuantity) {
      applicableTier = tiers.tier2;
    } else if (totalQuantity >= tiers.tier1.minQuantity) {
      applicableTier = tiers.tier1;
    }
    
    return applicableTier ? {
      applicable: true,
      percentage: applicableTier.discountPercentage,
      amount: Math.round(subtotal * (applicableTier.discountPercentage / 100))
    } : { applicable: false, percentage: 0, amount: 0 };
  }
}
```

### Backend Integration Pattern
**BEFORE**: Hardcoded values scattered across controllers
```typescript
// ❌ OLD - Hardcoded in razorpay.js
let quantityDiscount = 0;
if (totalQuantity >= 5) {
  quantityDiscount = Math.round(subtotal * 0.20); // 20% hardcoded
} else if (totalQuantity >= 3) {
  quantityDiscount = Math.round(subtotal * 0.15); // 15% hardcoded
}
```

**AFTER**: Centralized service integration
```typescript
// ✅ NEW - Service-driven in razorpay.js
const aovResult = await AOVService.calculateDiscount(totalQuantity, subtotal);
const quantityDiscount = aovResult.amount;

// Return complete discount data
return {
  success: true,
  finalAmount,
  subtotal,
  quantityDiscount,
  aovDiscount: aovResult.applicable ? {
    amount: aovResult.amount,
    percentage: aovResult.percentage,
    totalQuantity
  } : null
};
```

### Discount Data Flow Pattern
```
Frontend Request
      ↓
calculateOrderAmountSecure() 
      ↓
AOVService.calculateDiscount()
      ↓
MongoDB Settings Collection
      ↓
Return Complete Discount Object
      ↓
Store in Order Document
      ↓
Display Across All UI Components
      ↓
Include in Email Templates
```

### Enhanced Email Template Pattern
```typescript
// server/services/emailService.js - Comprehensive breakdown
const generateOrderSummaryHTML = (order) => {
  const {
    products,
    originalAmount,
    amount,
    shipping,
    aovDiscount,
    coupon,
    rewardPointsRedeemed,
    discount
  } = order;
  
  return `
    <div class="order-summary">
      <h3>Order Summary</h3>
      
      <!-- Subtotal -->
      <div class="summary-line">
        <span>Subtotal (${products.length} items):</span>
        <span>₹${(originalAmount || amount).toLocaleString('en-IN')}</span>
      </div>
      
      <!-- Shipping -->
      ${shipping?.shippingCost > 0 ? `
        <div class="summary-line">
          <span>Shipping:</span>
          <span>₹${shipping.shippingCost.toLocaleString('en-IN')}</span>
        </div>
      ` : `
        <div class="summary-line" style="color: #10B981;">
          <span>Free Shipping:</span>
          <span>₹0</span>
        </div>
      `}
      
      <!-- AOV Discount -->
      ${aovDiscount ? `
        <div class="summary-line" style="color: #F59E0B;">
          <span>Quantity Discount (${aovDiscount.percentage}% off for ${aovDiscount.totalQuantity} items):</span>
          <span>-₹${aovDiscount.amount.toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      
      <!-- Coupon Discount -->
      ${coupon ? `
        <div class="summary-line" style="color: #10B981;">
          <span>Coupon Discount (${coupon.code}):</span>
          <span>-₹${(coupon.discountValue || coupon.discount).toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      
      <!-- Reward Points -->
      ${rewardPointsRedeemed > 0 ? `
        <div class="summary-line" style="color: #8B5CF6;">
          <span>Reward Points (${rewardPointsRedeemed} points):</span>
          <span>-₹${rewardPointsRedeemed.toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      
      <!-- Total Savings -->
      ${discount > 0 ? `
        <div class="summary-line total-savings" style="color: #10B981; font-weight: bold; border-top: 1px solid #E5E7EB; padding-top: 10px;">
          <span>Total Savings:</span>
          <span>-₹${discount.toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      
      <!-- Final Total -->
      <div class="summary-line final-total" style="font-weight: bold; font-size: 1.2em; border-top: 2px solid #374151; padding-top: 15px;">
        <span>Final Total:</span>
        <span style="color: #F59E0B;">₹${amount.toLocaleString('en-IN')}</span>
      </div>
    </div>
  `;
};
```

### Frontend TypeScript Interface Pattern
```typescript
// Standardized across all components
interface OrderWithDiscounts {
  _id: string;
  products: OrderProduct[];
  amount: number;
  originalAmount?: number;
  discount?: number;
  status: string;
  createdAt: string;
  address: string;
  
  // Shipping information
  shipping?: {
    courier?: string;
    trackingId?: string;
    estimatedDelivery?: string;
    shippingCost?: number;
  };
  
  // Detailed discount breakdown
  aovDiscount?: {
    amount: number;
    percentage: number;
    totalQuantity: number;
  };
  
  coupon?: {
    code: string;
    discount?: number;
    discountValue?: number;
  };
  
  rewardPointsRedeemed?: number;
  
  // Customer information
  user?: {
    name: string;
    email: string;
  };
  guestInfo?: {
    name: string;
    email: string;
  };
}
```

### Consistent UI Display Pattern
```typescript
// Reusable order summary component pattern
const OrderSummaryBreakdown = ({ order }: { order: OrderWithDiscounts }) => {
  const {
    originalAmount,
    amount,
    shipping,
    aovDiscount,
    coupon,
    rewardPointsRedeemed,
    discount
  } = order;
  
  return (
    <div className="order-summary space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Subtotal:</span>
        <span className="text-white font-medium">
          ₹{(originalAmount || amount).toLocaleString('en-IN')}
        </span>
      </div>
      
      {/* Shipping */}
      {shipping?.shippingCost > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Shipping:</span>
          <span className="text-white font-medium">
            ₹{shipping.shippingCost.toLocaleString('en-IN')}
          </span>
        </div>
      ) : (
        <div className="flex justify-between text-sm">
          <span className="text-green-400">Free Shipping:</span>
          <span className="text-green-400 font-medium">₹0</span>
        </div>
      )}
      
      {/* AOV Discount */}
      {aovDiscount && (
        <div className="flex justify-between text-sm">
          <span className="text-yellow-400">
            Quantity Discount ({aovDiscount.percentage}% off for {aovDiscount.totalQuantity} items):
          </span>
          <span className="text-yellow-400 font-medium">
            -₹{aovDiscount.amount.toLocaleString('en-IN')}
          </span>
        </div>
      )}
      
      {/* Coupon Discount */}
      {coupon && (
        <div className="flex justify-between text-sm">
          <span className="text-green-400">
            Coupon Discount ({coupon.code}):
          </span>
          <span className="text-green-400 font-medium">
            -₹{(coupon.discountValue || coupon.discount).toLocaleString('en-IN')}
          </span>
        </div>
      )}
      
      {/* Reward Points */}
      {rewardPointsRedeemed > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-purple-400">
            Reward Points ({rewardPointsRedeemed} points):
          </span>
          <span className="text-purple-400 font-medium">
            -₹{rewardPointsRedeemed.toLocaleString('en-IN')}
          </span>
        </div>
      )}
      
      {/* Total Savings */}
      {discount > 0 && (
        <div className="flex justify-between text-sm pt-2 border-t border-gray-600">
          <span className="text-green-400 font-semibold">Total Savings:</span>
          <span className="text-green-400 font-semibold">
            -₹{discount.toLocaleString('en-IN')}
          </span>
        </div>
      )}
      
      {/* Final Total */}
      <div className="pt-2 border-t border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-white">Final Total:</span>
          <span className="text-xl font-bold text-yellow-400">
            ₹{amount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### Color-Coded Discount Pattern
```typescript
// Consistent color scheme across all components
const DiscountColors = {
  aov: 'text-yellow-400',      // AOV/Quantity discounts
  coupon: 'text-green-400',    // Coupon discounts
  rewards: 'text-purple-400',  // Reward point redemption
  shipping: 'text-green-400',  // Free shipping
  savings: 'text-green-400',   // Total savings summary
  total: 'text-yellow-400'     // Final total amount
};
```

### API Endpoint Pattern for Frontend Access
```typescript
// server/routes/razorpay.js - New endpoint for frontend calculations
router.post('/calculate-amount', async (req, res) => {
  try {
    const { products, couponCode, rewardPointsRedeemed, userId } = req.body;
    
    // Calculate with full discount breakdown
    const calculation = await calculateOrderAmountSecure(
      products,
      couponCode,
      rewardPointsRedeemed,
      userId
    );
    
    res.json({
      success: true,
      ...calculation,
      breakdown: {
        subtotal: calculation.subtotal,
        quantityDiscount: calculation.quantityDiscount,
        couponDiscount: calculation.couponDiscount,
        rewardDiscount: calculation.rewardPointsRedeemed,
        shippingCost: calculation.shippingCost,
        finalAmount: calculation.finalAmount
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

### Files Modified in This Pattern Implementation
**Backend Core**:
- `server/controllers/razorpay.js` - AOVService integration
- `server/services/aovService.js` - Centralized discount logic
- `server/routes/razorpay.js` - New calculation endpoint
- `server/services/emailService.js` - Enhanced email templates

**Frontend Display**:
- `client/src/pages/OrderTracking.tsx` - Secure tracking with discounts
- `client/src/user/OrderDetail.tsx` - User dashboard order view
- `client/src/admin/components/orders/OrderDetailModal.tsx` - Admin order view
- `client/src/admin/components/orders/types.ts` - TypeScript interfaces
- `client/src/pages/OrderConfirmationEnhanced.tsx` - Post-purchase view

### Benefits of This Pattern
1. **Centralized Configuration**: All discount rules in one place
2. **Database-Driven**: Settings stored in MongoDB for admin control
3. **Consistent Display**: Same breakdown across all touchpoints
4. **Email Transparency**: Professional invoices with complete breakdowns
5. **TypeScript Safety**: Standardized interfaces prevent errors
6. **Color-Coded UX**: Visual hierarchy for different discount types
7. **Scalable Architecture**: Easy to add new discount types
8. **Admin Visibility**: Complete financial transparency in admin dashboard

## Secure Reward Points Patterns (New)

### Points Transaction Model
```typescript
interface RewardTransaction {
  userId: ObjectId;
  type: 'earned' | 'redeemed' | 'expired' | 'admin_adjustment';
  points: number;
  orderId?: ObjectId;
  description: string;
  balance: number; // Balance after transaction
  metadata: {
    orderAmount?: number;
    adminId?: ObjectId;
    reason?: string;
  };
  createdAt: Date;
}
```

### Secure Points Service
```typescript
class RewardPointsService {
  // Called ONLY from order controller after payment success
  async creditPoints(userId: string, orderId: string, amount: number) {
    const order = await Order.findById(orderId);
    
    // Verify order exists and is paid
    if (!order || order.status !== 'paid') {
      throw new Error('Invalid order for points credit');
    }
    
    // Calculate points (1% of order value)
    const pointsToCredit = Math.floor(amount * 0.01);
    
    // Create transaction record
    const transaction = await RewardTransaction.create({
      userId,
      type: 'earned',
      points: pointsToCredit,
      orderId,
      description: `Earned from order ${orderId}`,
      metadata: { orderAmount: amount }
    });
    
    // Update user points atomically
    await User.findByIdAndUpdate(
      userId,
      { 
        $inc: { 
          rewardPoints: pointsToCredit,
          totalPointsEarned: pointsToCredit 
        }
      },
      { session } // Use MongoDB session for atomicity
    );
    
    return transaction;
  }
  
  // Called ONLY during checkout
  async redeemPoints(userId: string, pointsToRedeem: number, orderId: string) {
    const user = await User.findById(userId);
    
    // Verify user has sufficient points
    if (!user || user.rewardPoints < pointsToRedeem) {
      throw new Error('Insufficient points');
    }
    
    // Max 50 points per order
    const actualRedemption = Math.min(pointsToRedeem, 50);
    
    // Create redemption transaction
    const transaction = await RewardTransaction.create({
      userId,
      type: 'redeemed',
      points: -actualRedemption,
      orderId,
      description: `Redeemed for order ${orderId}`,
      balance: user.rewardPoints - actualRedemption
    });
    
    // Deduct points atomically
    await User.findByIdAndUpdate(
      userId,
      { $inc: { rewardPoints: -actualRedemption } },
      { session }
    );
    
    return transaction;
  }
}
```

### Points Display Pattern
```typescript
// User dashboard component
const PointsBalance = () => {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  
  return (
    <div className="points-widget">
      <div className="points-balance">
        <h3>Reward Points</h3>
        <p className="text-3xl font-bold text-yellow-400">{balance}</p>
        <p className="text-sm text-gray-400">₹{balance * 0.5} value</p>
      </div>
      <TransactionHistory transactions={history} />
    </div>
  );
};
```

## Multi-Theme System Patterns (Updated 2025-01-28)

### Theme Configuration
```typescript
// themes/config.ts
export const themes = {
  dark: {
    name: 'Dark',
    colors: {
      'bg-primary': '#111827',
      'bg-secondary': '#1F2937',
      'bg-card': '#374151',
      'text-primary': '#FFFFFF',
      'text-secondary': '#D1D5DB',
      'accent': '#FCD34D',
      'border': '#4B5563'
    }
  },
  light: {
    name: 'Light',
    colors: {
      'bg-primary': '#FFFFFF',
      'bg-secondary': '#F9FAFB',
      'bg-card': '#F3F4F6',
      'text-primary': '#111827',
      'text-secondary': '#6B7280',
      'accent': '#F59E0B',
      'border': '#E5E7EB'
    }
  }
  // ... other themes
};
```

### Theme-Aware Component Pattern
```typescript
// Use theme variables for components
const ThemedComponent = () => {
  return (
    <div style={{ 
      backgroundColor: 'var(--color-background)', 
      color: 'var(--color-text)' 
    }}>
      {/* Content */}
    </div>
  );
};

// Exception: Force contrast for critical UI
const HighContrastSection = () => {
  return (
    <div className="bg-black text-white"> {/* Hardcoded for visibility */}
      {/* Critical content like About page sections */}
    </div>
  );
};
```

### CSS Variables Usage
```css
/* globals.css */
:root {
  --color-background: #111827;
  --color-surface: #1F2937;
  --color-text: #FFFFFF;
  --color-textMuted: #D1D5DB;
  --color-primary: #FCD34D;
  --color-border: #4B5563;
}

/* Component usage */
.card {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* Hover states with proper contrast */
.nav-item:hover {
  color: var(--color-primary);
  background-color: var(--color-surfaceHover);
}
```

## UI/UX Patterns (Updated 2025-01-28)

### Enhanced Dropdown Pattern
```typescript
// Professional dropdown with visual hierarchy
const EnhancedDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div 
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1">
        <span>SHOP BY PRODUCTS</span>
        <ChevronDown className={isOpen ? 'rotate-180' : ''} />
      </button>
      
      <div className={`dropdown ${isOpen ? 'visible' : 'invisible'}`}>
        {/* Gradient category cards */}
        {/* Hover states with backgrounds */}
        {/* Visual badges and icons */}
      </div>
    </div>
  );
};
```

### Dark Theme Implementation
```typescript
// Consistent color palette
const colors = {
  background: 'bg-gray-900',
  card: 'bg-gray-800',
  border: 'border-gray-700',
  text: 'text-white',
  muted: 'text-gray-400',
  accent: 'text-yellow-400'
};
```

### Loading States
```typescript
if (loading) {
  return <Loader className="w-12 h-12 animate-spin text-yellow-400" />;
}
```

### Empty States
```typescript
if (data.length === 0) {
  return (
    <div className="text-center py-8">
      <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <p className="text-gray-400">No data found</p>
    </div>
  );
}
```

### Error Handling
```typescript
try {
  // API call
} catch (error) {
  toast.error('Operation failed');
  console.error('Error details:', error);
}
```

## Form Patterns

### Controlled Components
```typescript
const [value, setValue] = useState('');

<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="standard-input-classes"
/>
```

### Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- Display errors inline with fields
- Validate nested objects (e.g., customization data)

### Enhanced Form Validation Pattern
**New Validation System**: Comprehensive validation utility (`client/src/utils/validation.ts`)

```typescript
// Validation functions with specific rules
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { isValid: false, error: 'Email is required' };
  if (!emailRegex.test(email)) return { isValid: false, error: 'Please enter a valid email address' };
  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  const cleanPhone = phone.replace(/[\s-+]/g, '').replace(/^91/, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian phone number' };
  }
  return { isValid: true };
};
```

**Real-time Validation Pattern**:
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});
const [touched, setTouched] = useState<Record<string, boolean>>({});

const handleBlur = (field: string) => {
  setTouched(prev => ({ ...prev, [field]: true }));
  const error = validateField(field, values[field]);
  setErrors(prev => ({ ...prev, [field]: error }));
};

// Show error only if field was touched
{errors.email && touched.email && (
  <p className="text-red-400 flex items-center">
    <AlertCircle className="w-4 h-4 mr-1" />
    {errors.email}
  </p>
)}
```

## Performance Patterns

### Code Splitting
```typescript
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Memoization
```typescript
// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component);
const memoizedValue = useMemo(() => computeExpensive(data), [data]);
const memoizedCallback = useCallback(() => {}, [dependencies]);
```

### Image Optimization & Handling

**New Multi-Image Pattern (Primary System):**
- **Storage**: Products now have an `images` array in the database, storing objects with `url` and `isPrimary` fields.
- **API Endpoints**:
    - `POST /product/create-json/:userId`: Creates a product using a JSON payload, including base64-encoded images.
    - `PUT /product/update-json/:productId/:userId`: Updates a product using a JSON payload, managing existing, new URL, and new file images.
    - `GET /product/image/:productId/:index`: Serves a specific image by its index in the `images` array.
- **Data Flow**:
    1.  **Frontend**: `productApiHelper.tsx` prepares the JSON payload. File images are converted to base64.
    2.  **Backend**: `product` controller decodes base64 images, uploads them to Cloudinary, and saves the URLs to the `product.images` array.
    3.  **Display**: All components (`ProductCard`, `Cart`, `OrderDetail`, etc.) now use a helper function (`getProductImageUrl`) that prioritizes the primary image from the `images` array and falls back to the first image if none is marked as primary.

**Legacy Single-Image Pattern (Fallback):**
- **Storage**: Older products might have a single `photoUrl`.
- **API Endpoint**: `GET /product/photo/:productId` (Still supported for backward compatibility).
- **Display Logic**: Image display helpers check for the new `images` array first, then fall back to `photoUrl` if `images` is not present.

## Testing Patterns

### Test Mode
- Toggle between real and mock data
- Consistent test data structure
- No external dependencies in test mode

### Component Testing
```typescript
// Test individual components in isolation
// Mock dependencies
// Test user interactions
// Verify rendered output
```

## Security Patterns

### Authentication
- JWT token storage
- Automatic token refresh
- Protected route guards
- Role-based access control

### Data Sanitization
- Sanitize user inputs
- Validate API responses
- Escape HTML content
- Prevent XSS attacks
- Clean nested object structures before DB storage

### Checkout Discount Security Pattern (New)
```typescript
// Backend-only discount validation
class SecureDiscountValidation {
  // In order controller - validate everything server-side
  async validateAndApplyDiscounts(order: OrderData, userId?: string) {
    let totalDiscount = 0;
    
    // Validate coupon if provided
    if (order.coupon?.code) {
      const coupon = await Coupon.findOne({ 
        code: order.coupon.code.toUpperCase(),
        isActive: true
      });
      
      if (!coupon || !coupon.isValid()) {
        throw new Error('Invalid coupon');
      }
      
      // Check all restrictions
      if (order.amount < coupon.minimumPurchase) {
        throw new Error(`Minimum purchase of ₹${coupon.minimumPurchase} required`);
      }
      
      if (coupon.firstTimeOnly && userId) {
        const previousOrders = await Order.countDocuments({ 
          user: userId, 
          status: { $ne: "Cancelled" } 
        });
        if (previousOrders > 0) {
          throw new Error('First-time customers only');
        }
      }
      
      // Calculate discount server-side
      const couponDiscount = coupon.calculateDiscount(order.amount);
      totalDiscount += couponDiscount;
      
      // Track usage after order success
      await trackCouponUsage(coupon.code, order._id, userId);
    }
    
    // Validate reward points if provided
    if (order.rewardPointsRedeemed > 0 && userId) {
      const redeemResult = await redeemPoints(
        userId,
        order.rewardPointsRedeemed,
        order._id
      );
      
      if (!redeemResult.success) {
        throw new Error('Failed to redeem points');
      }
      
      totalDiscount += redeemResult.discountAmount;
    }
    
    // Apply validated discounts
    order.discount = totalDiscount;
    order.amount = Math.max(0, order.originalAmount - totalDiscount);
    
    return order;
  }
}

// Frontend - only sends codes/points, not amounts
interface CheckoutDiscountData {
  coupon?: {
    code: string;  // Only the code
  };
  rewardPointsRedeemed?: number;  // Only points count
}
```

### Soft Delete Pattern
```typescript
// Never hard delete - preserve data for analytics
interface Product {
  // ... other fields
  isDeleted: boolean;  // Default: false
}

// Filter deleted items from public views
const getProducts = async (filters) => {
  return Product.find({ 
    ...filters, 
    isDeleted: { $ne: true } 
  });
};

// Admin can view/restore deleted items
const getDeletedProducts = async () => {
  return Product.find({ isDeleted: true });
};
```

## Development Workflow

### File Organization
```
feature/
├── FeatureComponent.tsx    # Main component
├── components/             # Sub-components
├── hooks/                  # Custom hooks
├── utils/                  # Helper functions
└── types.ts               # TypeScript types
```

### Naming Conventions
- Components: PascalCase
- Files: PascalCase for components
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case

### Git Workflow
- Feature branches
- Descriptive commit messages
- PR reviews
- Automated testing

## Deployment Patterns

### Environment Variables
```typescript
// Use import.meta.env for Vite
const API_URL = import.meta.env.VITE_API_URL;
```

### Build Optimization
- Tree shaking
- Code minification
- Asset optimization
- CDN deployment

## Common Utilities

### Date Formatting
```typescript
format(new Date(date), 'PPpp'); // Pretty date format
```

### Currency Formatting
```typescript
new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(amount);
```

### Debouncing
```typescript
const debounced = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

## Smart Product Recommendations Pattern

### Similar Products Algorithm
```typescript
// MongoDB aggregation pipeline for intelligent recommendations
const getSimilarProducts = async (productId: string) => {
  const product = await Product.findById(productId);
  
  const pipeline = [
    // Filter out current product and deleted items
    { $match: { 
      _id: { $ne: productId },
      isDeleted: { $ne: true }
    }},
    
    // Calculate similarity score
    { $addFields: {
      similarityScore: {
        $sum: [
          // Same category: 50 points
          { $cond: [{ $eq: ["$category", product.category] }, 50, 0] },
          // Same product type: 30 points
          { $cond: [{ $eq: ["$productType", product.productType] }, 30, 0] },
          // Similar price (±20%): 20 points
          { $cond: [{
            $and: [
              { $gte: ["$price", product.price * 0.8] },
              { $lte: ["$price", product.price * 1.2] }
            ]
          }, 20, 0] },
          // Matching tags: 10 points per tag (max 30)
          { $min: [30, { $multiply: [10, { $size: { 
            $setIntersection: ["$tags", product.tags || []] 
          }}]}]}
        ]
      }
    }},
    
    // Sort by similarity and popularity
    { $sort: { similarityScore: -1, soldCount: -1 } },
    { $limit: 8 }
  ];
  
  return Product.aggregate(pipeline);
};
```

## Responsive Layout Patterns

### Flexible Width Container
```typescript
// Replace fixed max-width with percentage-based responsive width
<div className="w-[96%] md:w-[90%] mx-auto">
  {/* Content */}
</div>
```

### Mobile-First Responsive Design
```typescript
// Cart behavior based on screen size
const isMobile = window.innerWidth < 768;

const handleCartClick = () => {
  if (isMobile) {
    navigate('/cart'); // Redirect on mobile
  } else {
    setCartOpen(true); // Open drawer on desktop
  }
};
```

## Hierarchical Category Pattern

### Category Structure
```typescript
interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | null;
  level: number; // 0 for main, 1 for sub
  icon?: string;
  isActive: boolean;
}
```

### Category API Patterns
```typescript
// Get only main categories (level 0)
export const getMainCategories = () => {
  return fetch(`${API}/categories/main`)
    .then(response => response.json());
};

// Get subcategories for a parent
export const getSubcategories = (parentId: string) => {
  return fetch(`${API}/categories/${parentId}/subcategories`)
    .then(response => response.json());
};

// Get full category tree
export const getCategoryTree = () => {
  return fetch(`${API}/categories/tree`)
    .then(response => response.json());
};
```

### Admin Category Management
```typescript
// Hierarchical tree display with expand/collapse
const CategoryTreeItem = ({ categories, level }) => {
  return categories.map(category => (
    <div style={{ marginLeft: `${level * 2}rem` }}>
      <button onClick={() => toggleExpand(category._id)}>
        {hasSubcategories ? <ChevronRight /> : null}
        {category.name}
      </button>
      {isExpanded && category.subcategories && (
        <CategoryTreeItem 
          categories={category.subcategories} 
          level={level + 1} 
        />
      )}
    </div>
  ));
};
```

### Database Query Patterns
```typescript
// Include old categories without new fields
Category.find({ 
  $or: [
    { isActive: true }, 
    { isActive: { $exists: false } }
  ]
});

// Shop page: Show only main categories
Category.find({ 
  parentCategory: null,
  $or: [{ isActive: true }, { isActive: { $exists: false } }]
});
```

## Best Practices Summary

1. **Always break large components into smaller modules**
2. Use TypeScript for type safety
3. Implement proper error handling
4. Provide loading and empty states
5. Follow consistent naming conventions
6. Write reusable components
7. Optimize for performance
8. Maintain clean code structure
9. Document complex logic
10. Test critical paths
11. **Validate nested data structures at every layer**
12. **Use soft delete for data preservation**
13. **Ensure complete data flow from frontend to database**
14. **Implement comprehensive form validation with real-time feedback**
15. **Use intelligent algorithms for product recommendations**
16. **Design mobile-first responsive layouts**
17. **Support hierarchical data structures (categories/subcategories)**
18. **Handle backward compatibility for schema changes**
19. **Implement secure reward points with audit trails**
20. **Use CSS variables for theme flexibility**
21. **Create intelligent auto-apply algorithms for coupons**
22. **Use dropdown navigation for better product discovery**
23. **Ensure text visibility across all themes with proper contrast**
24. **Add visual hierarchy with icons, badges, and gradients**

## Testing Utilities

### Database Cleanup Scripts
```typescript
// clearOrders.js - Remove all orders for testing
const clearOrders = async () => {
  const result = await Order.deleteMany({});
  console.log(`Deleted ${result.deletedCount} orders`);
};
```

### Data Flow Testing
```typescript
// testCustomizationFlow.js - Verify data integrity
const testCustomizationFlow = async () => {
  // Test frontend data structure
  // Test backend processing
  // Verify database storage
  // Fetch and validate stored data
};
```

### Security Testing
```typescript
// testRewardPointsManipulation.js - Test security
const testPointsManipulation = async () => {
  // Attempt direct API calls to modify points
  // Verify all attempts are blocked
  // Test race conditions
  // Verify audit trail creation
};
