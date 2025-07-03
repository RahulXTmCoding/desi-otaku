# System Patterns

## Current Architecture

### Actual Implementation
The application currently follows a traditional full-stack architecture:
- **Frontend**: React with Vite (TypeScript) - Single Page Application
- **Backend**: Node.js with Express.js
- **Database**: MongoDB (NoSQL)
- **File Storage**: MongoDB GridFS for product images
- **Deployment**: Vercel (frontend) + Render (backend)

### Service Structure
Currently implemented as a modular monolith with clear separation:
- **Authentication**: JWT-based with user/admin roles
- **Product Management**: CRUD operations with variants
- **Order Processing**: Cart, checkout, order tracking
- **Payment Integration**: Razorpay and Braintree
- **Shipping Integration**: Shiprocket API
- **Design System**: Custom t-shirt preview components

## Key Technical Decisions

### Frontend Architecture
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: React Context API + Local Storage
- **Styling**: Tailwind CSS with dark theme design system
- **Routing**: React Router v6 (all routes in pages/App.tsx)
- **Form Handling**: Controlled components with validation
- **API Client**: Fetch API with helper functions
- **Image Handling**: Smart URL resolution with fallbacks

### Backend Architecture
- **Framework**: Express.js with modular routing
- **Database**: Mongoose ODM for MongoDB
- **Authentication**: JWT with express-jwt middleware
- **Validation**: Express-validator for request validation
- **File Upload**: Multer + MongoDB GridFS
- **Error Handling**: Centralized error middleware
- **CORS**: Configured for cross-origin requests

### Database Design Patterns
- **Primary Database**: MongoDB for flexibility
- **Schema Design**: Mongoose schemas with relationships
- **Data Models**: User, Product, Order, Design, Wishlist
- **Relationships**: References between collections
- **Indexes**: On frequently queried fields

## Component Relationships

### Frontend Component Architecture (Actual)
```
App (pages/App.tsx - ALL ROUTES HERE)
├── Layout Components
│   ├── Header (with cart drawer)
│   ├── Footer
│   └── Base (layout wrapper)
├── Pages
│   ├── Home
│   ├── Shop (with ProductGridItem)
│   ├── ProductDetail
│   ├── Customize
│   ├── Cart
│   ├── CheckoutFixed
│   ├── Wishlist
│   └── UserDashBoardEnhanced
├── Reusable Components
│   ├── ProductGridItem (universal product display)
│   ├── OrderCard
│   ├── CartDrawer
│   └── Preview Components
│       ├── TShirtPreview
│       ├── SimpleTShirtPreview
│       ├── PhotoRealisticPreview
│       └── CartTShirtPreview
└── UI Components
    ├── Loading states
    ├── Empty states
    └── Toast notifications
```

### Backend Service Architecture (Actual)
```
Server (app.js)
├── Routes
│   ├── auth.js
│   ├── user.js
│   ├── product.js
│   ├── design.js
│   ├── order.js
│   ├── razorpay.js
│   ├── guestOrder.js
│   └── wishlist.js
├── Controllers
│   ├── auth.js
│   ├── user.js
│   ├── product.js
│   ├── design.js
│   ├── order.js
│   └── wishlist.js
├── Models
│   ├── user.js
│   ├── product.js
│   ├── design.js
│   ├── order.js
│   └── wishlist.js
├── Middleware
│   ├── Authentication (isSignedIn, isAuthenticated)
│   └── Authorization (isAdmin)
└── Services
    ├── emailService.js
    └── shiprocket.js
```

## Design Patterns

### Frontend Patterns (Implemented)
1. **Component Composition**: ProductGridItem used across all product displays
2. **Custom Hooks**: useDevMode for test mode switching
3. **Context Pattern**: DevModeContext for global test mode state
4. **Helper Functions**: Organized in core/helper directory
5. **Responsive Design**: Mobile-first with Tailwind breakpoints

### Backend Patterns (Implemented)
1. **MVC Pattern**: Models, Views (React), Controllers
2. **Middleware Chain**: Authentication → Authorization → Controller
3. **Helper Methods**: Mongoose schema methods for business logic
4. **Error Handling**: Try-catch with consistent error responses
5. **Modular Routing**: Feature-based route files

### API Design Patterns (Implemented)
1. **RESTful Routes**: Standard CRUD operations
2. **JWT Authentication**: Bearer token in headers
3. **Request Validation**: Middleware-based validation
4. **Response Format**: Consistent JSON structure
5. **File Upload**: Multipart form data for images

## Security Patterns

### Authentication & Authorization (Implemented)
- **JWT Strategy**: Tokens with user info and expiry
- **Role-Based Access**: User and Admin roles
- **Protected Routes**: Frontend (PrivateRoute, AdminRoute components)
- **Session Management**: Token stored in localStorage
- **Password Hashing**: Using bcrypt

### Data Protection (Implemented)
- **Input Validation**: Server-side validation
- **MongoDB Injection Prevention**: Mongoose sanitization
- **CORS Configuration**: Whitelisted origins
- **Environment Variables**: Sensitive data in .env files

## Performance Patterns

### Frontend Optimization (Implemented)
1. **Component Memoization**: React.memo for expensive components
2. **Callback Optimization**: useCallback for event handlers
3. **State Optimization**: useMemo for computed values
4. **Image Optimization**: Lazy loading with fallbacks
5. **Code Splitting**: Route-based with React.lazy
6. **Dev Mode**: Mock data for offline development

### Backend Optimization (Implemented)
1. **Database Indexes**: On frequently queried fields
2. **Populate Control**: Selective field population
3. **Pagination**: Limit and skip for large datasets
4. **Caching**: Pincode serviceability cache
5. **Error Timeouts**: Prevent hanging requests

## Testing Patterns

### Current Testing Approach
1. **Manual Testing**: Developer testing during development
2. **Test Mode**: Mock data for frontend testing
3. **API Testing**: Using test scripts (testCheckout.js, etc.)
4. **Error Scenarios**: Handled with proper error messages

## Deployment Patterns

### Current Infrastructure
1. **Frontend**: Vercel with automatic deployments
2. **Backend**: Render with environment variables
3. **Database**: MongoDB Atlas cloud hosting
4. **CI/CD**: GitHub Actions for automated deployment
5. **Monitoring**: Basic error logging

### Development Workflow
1. **Version Control**: Git with feature branches
2. **Environment**: Development and Production
3. **Configuration**: Environment-specific variables
4. **Hot Reload**: Vite for frontend, Nodemon for backend

## UI/UX Patterns

### Design System (Implemented)
```css
/* Dark Theme Palette */
Background: #111827 (gray-900)
Surface: #1F2937 (gray-800)
Card: #374151 (gray-700)
Primary: #FCD34D (yellow-400)
Accent: #8B5CF6 (purple-600)

/* Component Patterns */
- Rounded corners: rounded-lg, rounded-xl, rounded-2xl
- Shadows: shadow-lg with color variants
- Transitions: 200-300ms for smooth interactions
- Hover effects: scale-105, brightness adjustments
- Glassmorphism: backdrop-blur with transparency
```

### Component Styling Patterns
1. **Consistent Spacing**: p-4, p-6, p-8 for padding
2. **Responsive Grid**: grid-cols with breakpoints
3. **Flex Layouts**: Flexible alignment and spacing
4. **Animation**: Smooth transitions and transforms
5. **Loading States**: Skeleton screens and spinners

## Recent Architectural Improvements

### Component Reusability
- Created ProductGridItem for consistent product display
- Standardized loading and empty states
- Reusable form components for addresses

### Performance Improvements
- Split large components into smaller, focused ones
- Implemented proper memoization strategies
- Optimized re-renders with dependency management

### Code Organization
- Clear file structure with feature-based organization
- Helper functions separated by domain
- Consistent naming conventions
- TypeScript interfaces for type safety

### Documentation
- Created ROUTING_GUIDE.md for routing clarity
- Comprehensive memory bank documentation
- API documentation in implementation guides
