# System Patterns

## Architecture

### Overall Architecture
The application follows a modern full-stack architecture with clear separation of concerns:
- **Frontend**: React with Next.js (TypeScript) for SSR/SSG capabilities
- **Backend**: Node.js with Express.js or Nest.js (TypeScript-first)
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **File Storage**: AWS S3 or Cloudinary for images
- **CDN**: CloudFront or Cloudflare for global content delivery

### Microservices-Ready Design
While starting as a monolith for faster development, the architecture is designed to be split into microservices:
- **User Service**: Authentication, profiles, preferences
- **Product Service**: Catalog, designs, inventory
- **Order Service**: Cart, checkout, order management
- **Payment Service**: Payment processing, invoicing
- **Design Service**: Custom design editor, mockup generation
- **Notification Service**: Email, SMS, push notifications

## Key Technical Decisions

### Frontend Architecture
- **Framework**: Next.js 14+ with App Router for optimal performance
- **State Management**: Redux Toolkit for global state, React Context for feature-specific state
- **Styling**: Tailwind CSS with custom design system tokens
- **UI Components**: shadcn/ui as base, customized for dark theme
- **Design Editor**: Fabric.js for 2D canvas manipulation
- **3D Preview**: Three.js with react-three-fiber for t-shirt mockups
- **API Client**: Axios with TypeScript interfaces and interceptors
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript or Nest.js (preferred for enterprise features)
- **ORM**: Prisma for type-safe database queries
- **Authentication**: JWT with refresh tokens, Passport.js for social auth
- **Validation**: Zod for runtime validation matching frontend
- **Queue System**: Bull.js for background jobs (email, image processing)
- **API Documentation**: OpenAPI/Swagger auto-generated from TypeScript
- **Error Handling**: Centralized error handling with custom error classes
- **Logging**: Winston with structured logging

### Database Design Patterns
- **Primary Database**: PostgreSQL for ACID compliance
- **Caching Layer**: Redis for sessions, frequently accessed data
- **Search**: Elasticsearch for product search (future phase)
- **Schema Design**: Normalized with strategic denormalization for performance
- **Migrations**: Prisma migrations with version control

## Component Relationships

### Frontend Component Architecture
```
App
├── Layout
│   ├── Header (with cart, user menu)
│   ├── Navigation (glassmorphism effect)
│   └── Footer
├── Pages
│   ├── Home
│   │   ├── HeroSection
│   │   ├── CategoryCards
│   │   └── TrendingProducts
│   ├── Shop
│   │   ├── ProductGrid
│   │   ├── Filters
│   │   └── SearchBar
│   ├── ProductDetail
│   │   ├── ImageGallery
│   │   ├── ProductInfo
│   │   └── AddToCart
│   ├── Customize
│   │   ├── DesignCanvas
│   │   ├── ToolPanel
│   │   └── Preview3D
│   └── Checkout
│       ├── CartSummary
│       ├── AddressForm
│       └── PaymentForm
└── Components
    ├── UI (buttons, cards, modals)
    ├── Product (cards, carousel)
    └── Common (loaders, errors)
```

### Backend Service Architecture
```
Server
├── Controllers
│   ├── AuthController
│   ├── UserController
│   ├── ProductController
│   ├── DesignController
│   ├── OrderController
│   └── PaymentController
├── Services
│   ├── AuthService
│   ├── EmailService
│   ├── ImageService
│   ├── PaymentService
│   └── ShippingService
├── Middleware
│   ├── Authentication
│   ├── Authorization
│   ├── Validation
│   └── ErrorHandler
└── Models
    ├── User
    ├── Product
    ├── Design
    ├── Order
    └── Payment
```

## Design Patterns

### Frontend Patterns
1. **Container/Presenter Pattern**: Business logic separated from UI components
2. **Custom Hooks**: Reusable logic for data fetching, form handling
3. **Compound Components**: For complex UI like product cards
4. **Render Props**: For flexible component composition
5. **Higher-Order Components**: For authentication, error boundaries

### Backend Patterns
1. **Repository Pattern**: Data access abstraction
2. **Service Layer Pattern**: Business logic encapsulation
3. **Factory Pattern**: For creating different payment providers
4. **Strategy Pattern**: For shipping calculations
5. **Observer Pattern**: For order status updates
6. **Dependency Injection**: Using Nest.js or manual with Express

### API Design Patterns
1. **RESTful Design**: Resource-based URLs with proper HTTP methods
2. **Pagination**: Cursor-based for large datasets
3. **Filtering**: Query parameter based with validation
4. **Versioning**: URL-based (v1, v2) for backwards compatibility
5. **Rate Limiting**: Token bucket algorithm
6. **Caching**: ETags and Cache-Control headers

## Security Patterns

### Authentication & Authorization
- **JWT Strategy**: Access tokens (15min) + Refresh tokens (7 days)
- **Role-Based Access Control (RBAC)**: User and Admin roles
- **Permission-Based Access**: Granular permissions for admin features
- **Session Management**: Redis-backed sessions for active users
- **OAuth Integration**: Google, Facebook login

### Data Protection
- **Input Validation**: Zod schemas on both frontend and backend
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Prevention**: Content Security Policy, input sanitization
- **CSRF Protection**: Double submit cookie pattern
- **Rate Limiting**: Per-endpoint limits based on user role

## Performance Patterns

### Frontend Optimization
1. **Code Splitting**: Route-based and component-based
2. **Lazy Loading**: Images, components, and routes
3. **Prefetching**: Next.js link prefetching
4. **Image Optimization**: Next/Image with responsive sizes
5. **Bundle Optimization**: Tree shaking, minification
6. **Service Workers**: For offline capability

### Backend Optimization
1. **Database Indexing**: Strategic indexes on frequently queried fields
2. **Query Optimization**: N+1 query prevention, eager loading
3. **Caching Strategy**: Multi-level (CDN, Redis, application)
4. **Connection Pooling**: Database and Redis connections
5. **Async Processing**: Queue-based for heavy operations
6. **Response Compression**: Gzip/Brotli compression

## Testing Patterns

### Testing Strategy
1. **Unit Tests**: Jest for isolated component/function testing
2. **Integration Tests**: Testing API endpoints with Supertest
3. **E2E Tests**: Playwright for critical user journeys
4. **Performance Tests**: Lighthouse CI for frontend metrics
5. **Load Tests**: K6 for API stress testing

### Test Organization
- **Frontend**: Component tests, hook tests, utility tests
- **Backend**: Controller tests, service tests, middleware tests
- **Shared**: Type tests, validation schema tests

## Deployment Patterns

### Infrastructure
1. **Frontend**: Vercel or AWS Amplify for Next.js
2. **Backend**: AWS ECS or Google Cloud Run
3. **Database**: AWS RDS or Google Cloud SQL
4. **Cache**: AWS ElastiCache or Redis Cloud
5. **CDN**: CloudFront or Cloudflare
6. **Monitoring**: DataDog or New Relic

### CI/CD Pipeline
1. **Source Control**: Git with GitFlow branching
2. **CI**: GitHub Actions for automated testing
3. **CD**: Automated deployment on main branch
4. **Environments**: Development, Staging, Production
5. **Feature Flags**: For gradual rollouts
