# Tech Context

## Current Implementation

### Current Stack (Phase 3 - In Active Development)

#### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript (actively implementing)
- **Styling**: Tailwind CSS with dark theme
- **State Management**: 
  - React Context API (DevModeContext)
  - Local state with useState/useReducer
  - LocalStorage for persistence
- **Routing**: React Router v6 (all routes in pages/App.tsx)
- **HTTP Client**: Fetch API with helper functions
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Components**: Reusable component architecture (ProductGridItem)

#### Backend
- **Runtime**: Node.js with Express.js
- **Language**: JavaScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with express-jwt
- **File Storage**: 
  - **Cloudinary**: For the new multi-image system. Images are uploaded via the backend.
  - **MongoDB GridFS**: Legacy system for older, single-image products.
- **Payment**: 
  - Razorpay (integrated with guest checkout)
  - Braintree (integrated)
- **Shipping**: Shiprocket API (integrated)
- **Email**: Custom email service with templates

#### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas
- **CI/CD**: GitHub Actions

### Recent Implementations (January 8, 2025)

#### Comprehensive Discount Display System
- **AOVService Centralization**: Replaced hardcoded discount values with database-driven service
- **Backend Architecture Overhaul**: 
  - `server/controllers/razorpay.js`: AOVService integration
  - `server/services/aovService.js`: Centralized discount calculation logic
  - `server/routes/razorpay.js`: New `/calculate-amount` endpoint for frontend access
- **Email System Enhancement**: Complete breakdown in `server/services/emailService.js`
- **Frontend Display Updates**: All order-related pages show detailed discount breakdown
- **TypeScript Interface Standardization**: Added discount fields to all order interfaces
- **Color-Coded UI**: Consistent color scheme (yellow=AOV, green=coupons, purple=rewards)

#### Technical Achievements
- **Data Flow Integration**: AOVService → Payment → Storage → Display → Email
- **Indian Number Formatting**: Proper ₹1,23,456 format across all components
- **Enterprise Architecture**: Configurable, scalable discount management
- **Email Templates**: Professional breakdown with all discount types
- **API Endpoints**: `/api/razorpay/calculate-amount` for frontend calculations
- **Database Settings**: AOV tiers stored in MongoDB Settings collection

#### Previous Implementation (January 20, 2025)

##### Checkout Discount Integration
- **DiscountSection Component**: Coupon and reward points application UI
- **OrderHandler Hook**: Extracted order placement logic for better separation
- **Backend Validation**: All discount calculations moved server-side
- **Security Enhancement**: Frontend only sends codes/points, not amounts
- **Atomic Operations**: Reward points redeemed during order creation
- **Guest Support**: Coupons available for guests, points for authenticated only

### Previous Implementations (January 11, 2025)

#### Enhanced User Experience
- **UserDashBoardEnhanced**: Modern UI with tabs, glassmorphism effects
- **ProductGridItem**: Universal product display component
- **Toast Notifications**: User feedback system
- **Loading/Empty States**: Consistent across all components
- **Responsive Design**: Mobile-first approach with flexible width containers
- **Form Validation**: Comprehensive validation with real-time feedback
- **Smart Product Recommendations**: AI-powered similar products

#### Performance Optimizations
- **React.memo**: For expensive components
- **useCallback/useMemo**: Preventing unnecessary re-renders
- **Image Optimization**: Smart URL handling with fallbacks
- **Component Splitting**: Smaller, focused components
- **MongoDB Aggregation**: Efficient similar products algorithm

#### Architecture Improvements
- **Routing Clarity**: All routes in pages/App.tsx
- **Component Reusability**: ProductGridItem used everywhere
- **Helper Organization**: Domain-based helper functions
- **TypeScript Adoption**: Interfaces for key components
- **Validation Utility**: Centralized validation rules

#### Recent Bug Fixes (January 11, 2025)
- **Cart Merge Error**: Fixed empty product ID validation
- **Delete Address API**: Fixed endpoint mismatch (singular to plural)
- **Shop Filter Toggle**: Fixed visibility on all screen sizes
- **Modal Overlapping**: Redesigned "Surprise Me" modal layout
- **Mobile Cart**: Redirect to cart page instead of drawer on mobile

## Current Development Setup

### Prerequisites
```bash
Node.js: 18.x or higher
npm: 9.x or higher
MongoDB: 5.x or higher
Git: 2.x
```

### Local Development
```bash
# Frontend (port 5173)
cd client
npm install
npm run dev

# Backend (port 8000)
cd server
npm install
npm start
```

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=8000
DATABASE=mongodb://localhost:27017/tshirtstore
SECRET=your-jwt-secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
BRAINTREE_MERCHANT_ID=xxx
BRAINTREE_PUBLIC_KEY=xxx
BRAINTREE_PRIVATE_KEY=xxx
SHIPROCKET_EMAIL=xxx
SHIPROCKET_PASSWORD=xxx
```

## Key Dependencies

### Frontend (Current)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "tailwindcss": "^3.x",
    "lucide-react": "^0.x",
    "razorpay": "^2.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

### Backend (Current)
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "mongoose": "^8.x",
    "jsonwebtoken": "^9.x",
    "bcrypt": "^5.x",
    "cors": "^2.x",
    "express-validator": "^7.x",
    "multer": "^1.x",
    "razorpay": "^2.x",
    "braintree": "^3.x",
    "axios": "^1.x"
  }
}
```

## Development Patterns

### Component Structure
```typescript
// ProductGridItem Example
interface ProductGridItemProps {
  product: Product;
  showWishlistButton?: boolean;
  showCartButton?: boolean;
  showQuickView?: boolean;
  showRemoveButton?: boolean;
  onRemove?: (productId: string) => void;
  isInWishlist?: boolean;
  onWishlistToggle?: (productId: string) => void;
  className?: string;
}
```

### State Management
- **Global State**: Context API (DevModeContext, CartContext)
- **Local State**: useState for component state
- **Persistent State**: LocalStorage for cart, auth
- **Server State**: Direct API calls with loading states
- **Form State**: Controlled components with validation

### Validation Pattern
```typescript
// Validation utility (client/src/utils/validation.ts)
export const validateEmail = (email: string): { isValid: boolean; error?: string }
export const validatePhone = (phone: string): { isValid: boolean; error?: string }
export const validatePassword = (password: string): { isValid: boolean; error?: string }
export const validatePinCode (pinCode: string): { isValid: boolean; error?: string }

// Real-time validation with touched state
const [errors, setErrors] = useState<Record<string, string>>({});
const [touched, setTouched] = useState<Record<string, boolean>>({});
```

### API Pattern
```javascript
// Helper function pattern
export const getOrders = (userId, token) => {
  return fetch(`${API}/orders/user/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .catch(err => console.log(err));
};
```

### Routing Structure
```
main.tsx
└── pages/App.tsx (ALL ROUTES)
    ├── Public Routes
    │   ├── /
    │   ├── /shop
    │   ├── /product/:id
    │   └── /signin
    ├── Protected Routes
    │   ├── /user/dashboard (UserDashBoardEnhanced)
    │   ├── /order/:orderId
    │   └── /checkout
    └── Admin Routes
        ├── /admin/dashboard
        └── /admin/products
```

## UI/UX Implementation

### Dark Theme Design System
```css
/* Color Palette */
--background: #111827 (gray-900)
--surface: #1F2937 (gray-800)
--card: #374151 (gray-700)
--primary: #FCD34D (yellow-400)
--accent: #8B5CF6 (purple-600)
--success: #10B981 (green-500)
--error: #EF4444 (red-500)

/* Component Patterns */
- Glassmorphism: backdrop-blur bg-opacity
- Gradients: from-yellow-400 to-yellow-500
- Shadows: shadow-lg shadow-yellow-400/25
- Animations: transition-all duration-200
- Hover: scale-105 hover:bg-opacity
```

### Responsive Design System
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- **Layout Pattern**: 
  - Flexible width: `w-[96%] md:w-[90%]` instead of `max-w-7xl`
  - Mobile-specific behaviors (cart redirect)
- **Grid Systems**:
  - Product grid: 2 cols mobile → 5 cols desktop
  - Responsive modals with proper spacing

## Security Implementation
- **Authentication**: JWT tokens in localStorage
- **Authorization**: Role-based (user/admin)
- **Protected Routes**: PrivateRoute/AdminRoute components
- **Input Validation**: Server-side with express-validator
- **CORS**: Configured for frontend domain

## Performance Features
- **Image Optimization**: 
  - Smart URL handling in ProductGridItem
  - Fallback to SVG placeholders
  - Lazy loading with loading="lazy"
- **React Optimizations**:
  - React.memo for ProductGridItem
  - useCallback for event handlers
  - useMemo for expensive computations
- **Code Organization**:
  - Feature-based file structure
  - Reusable components
  - Helper function separation

## Testing & Development Tools
- **Dev Mode**: Toggle between test/production data
- **Mock Data**: For offline development
- **API Testing**: Test scripts in server directory
- **Browser DevTools**: React Developer Tools

## Recent Features & Improvements

### Smart Product Recommendations
- **MongoDB Aggregation Pipeline**: Efficient similarity calculation
- **Scoring Algorithm**:
  - Same category: 50 points
  - Same product type: 30 points
  - Price similarity (±20%): 20 points
  - Tag matching: 10 points per tag (max 30)
- **Fallback Strategy**: Popular products when insufficient matches

### Form Validation System
- **Comprehensive Rules**:
  - Email: Format validation
  - Phone: 10-digit Indian numbers
  - Password: Min 6 chars with letter & number
  - Address fields: Complete validation
- **User Experience**:
  - Real-time validation on blur
  - Clear error messages with icons
  - Touch state management

### Recent Bug Fixes
- Fixed wishlist image display (API path handling)
- Fixed address count in dashboard overview
- Fixed checkout performance issues
- Fixed routing confusion (removed Routes.tsx)
- Implemented guest checkout flow
- Added proper error handling and timeouts
- **Cart merge error**: Added validation for empty product IDs
- **Delete address API**: Fixed endpoint mismatch
- **Mobile cart drawer**: Redirect to cart page on mobile
- **Shop filter toggle**: Fixed visibility issues

## Next Technical Goals
1. **Complete TypeScript Migration**
   - Add interfaces for all components
   - Type-safe API calls
   - Strict mode configuration

2. **State Management Enhancement**
   - Consider Redux Toolkit for complex state
   - React Query for server state

3. **Testing Implementation**
   - Unit tests with Jest
   - Component tests with React Testing Library
   - E2E tests with Playwright

4. **Performance Optimization**
   - Code splitting
   - Bundle size optimization
   - Image CDN integration

5. **Security Enhancements**
   - Move JWT to httpOnly cookies
   - Implement refresh tokens
   - Add rate limiting
