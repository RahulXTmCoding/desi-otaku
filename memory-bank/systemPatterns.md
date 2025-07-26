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

## Multi-Theme System Patterns (New)

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
  },
  midnightBlue: {
    name: 'Midnight Blue',
    colors: {
      'bg-primary': '#0F172A',
      'bg-secondary': '#1E293B',
      'bg-card': '#334155',
      'text-primary': '#F8FAFC',
      'text-secondary': '#CBD5E1',
      'accent': '#3B82F6',
      'border': '#475569'
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      'bg-primary': '#0A0A0A',
      'bg-secondary': '#1A1A1A',
      'bg-card': '#2A2A2A',
      'text-primary': '#FFFFFF',
      'text-secondary': '#C0C0C0',
      'accent': '#FF0080',
      'border': '#FF00FF'
    }
  },
  sakura: {
    name: 'Sakura',
    colors: {
      'bg-primary': '#FFF0F5',
      'bg-secondary': '#FFE4E1',
      'bg-card': '#FFC0CB',
      'text-primary': '#4A0E4E',
      'text-secondary': '#8B4789',
      'accent': '#FF69B4',
      'border': '#FFB6C1'
    }
  }
};
```

### Theme Provider Pattern
```typescript
// context/ThemeContext.tsx
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);
  
  const applyTheme = (themeName: string) => {
    const themeConfig = themes[themeName];
    const root = document.documentElement;
    
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    root.setAttribute('data-theme', themeName);
  };
  
  const switchTheme = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Save to user preferences if authenticated
    if (isAuthenticated()) {
      updateUserThemePreference(newTheme);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, switchTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### CSS Variables Usage
```css
/* globals.css */
:root {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1F2937;
  --color-bg-card: #374151;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #D1D5DB;
  --color-accent: #FCD34D;
  --color-border: #4B5563;
}

/* Component usage */
.card {
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.button-primary {
  background-color: var(--color-accent);
  color: var(--color-bg-primary);
}
```

## UI/UX Patterns

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

## Navigation Patterns

### Route Structure
- All routes defined in `pages/App.tsx`
- Protected routes check authentication
- Consistent breadcrumb navigation
- Clear URL patterns

### Modal Navigation
- Modals for detail views
- Preserve background state
- Clear close actions
- Keyboard navigation support

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
