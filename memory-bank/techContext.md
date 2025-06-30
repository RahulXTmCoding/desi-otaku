# Tech Context

## Technologies Used

### Frontend Stack
- **Framework**: React 18+ with Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.x with custom design system
- **UI Components**: shadcn/ui (customized for dark theme)
- **State Management**: 
  - Redux Toolkit for global state
  - React Query/TanStack Query for server state
  - Zustand for lightweight local state
- **Forms**: React Hook Form + Zod validation
- **Design Editor**: Fabric.js with TypeScript bindings
- **3D Graphics**: Three.js + react-three-fiber
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios with TypeScript interceptors
- **Image Handling**: Next/Image + Cloudinary
- **Dev Tools**: ESLint, Prettier, Husky

### Backend Stack
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js with TypeScript or Nest.js
- **Language**: TypeScript (strict mode)
- **Database**: 
  - PostgreSQL 15+ (primary)
  - Redis 7+ (caching/sessions)
- **ORM**: Prisma 5+ (type-safe queries)
- **Authentication**: 
  - JWT (jsonwebtoken)
  - Passport.js (social auth)
  - bcrypt (password hashing)
- **Validation**: Zod (shared with frontend)
- **Queue**: Bull.js with Redis
- **File Storage**: AWS S3 or Cloudinary
- **Email**: SendGrid or AWS SES
- **SMS**: Twilio
- **API Docs**: Swagger/OpenAPI
- **Logging**: Winston
- **Process Manager**: PM2

### Payment & Logistics
- **Payment Gateways**:
  - Stripe (international)
  - Razorpay (India primary)
  - PayPal (alternative)
- **Shipping Partners**:
  - Shiprocket (aggregator)
  - Delhivery
  - Blue Dart
  - India Post

### DevOps & Infrastructure
- **Version Control**: Git with GitFlow
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Orchestration**: Kubernetes (production)
- **Cloud Providers**:
  - AWS (primary)
  - Vercel (frontend hosting)
- **CDN**: CloudFront or Cloudflare
- **Monitoring**: 
  - DataDog or New Relic
  - Sentry (error tracking)
- **Analytics**: Google Analytics 4 + Mixpanel

## Development Setup

### Prerequisites
```bash
# Required versions
Node.js: 20.x LTS
npm: 10.x or pnpm: 8.x
PostgreSQL: 15.x
Redis: 7.x
Git: 2.x
```

### Local Development
```bash
# Clone repository
git clone <repo-url>
cd anime-tshirt-platform

# Install dependencies
npm install # or pnpm install

# Setup environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development servers
npm run dev # Starts both frontend and backend
```

### Environment Variables
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=xxx

# Backend (.env)
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/anime_tshirt
REDIS_URL=redis://localhost:6379
JWT_SECRET=xxx
STRIPE_SECRET_KEY=xxx
RAZORPAY_KEY_SECRET=xxx
CLOUDINARY_API_KEY=xxx
SENDGRID_API_KEY=xxx
```

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.0.0",
    "fabric": "^5.3.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@types/express": "^4.17.0",
    "typescript": "^5.3.0",
    "@prisma/client": "^5.8.0",
    "prisma": "^5.8.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "passport-google-oauth20": "^2.0.0",
    "zod": "^3.22.0",
    "bull": "^4.12.0",
    "winston": "^3.11.0",
    "cors": "^2.8.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.0",
    "express-rate-limit": "^7.1.0",
    "@sendgrid/mail": "^8.1.0",
    "twilio": "^4.20.0",
    "stripe": "^14.10.0",
    "razorpay": "^2.9.0"
  }
}
```

## Tool Usage Patterns

### State Management Strategy
- **Global State (Redux Toolkit)**: User auth, cart, app settings
- **Server State (React Query)**: Product data, orders, API responses
- **Local State (useState/useReducer)**: Form inputs, UI state
- **URL State (Next.js Router)**: Filters, pagination, search

### API Communication
- **Request/Response Types**: Fully typed with TypeScript interfaces
- **Error Handling**: Centralized error interceptor
- **Authentication**: Bearer token in Authorization header
- **Request Retry**: Exponential backoff for failed requests
- **Caching**: React Query with stale-while-revalidate

### Database Patterns
- **Schema Design**: Normalized with Prisma schema
- **Migrations**: Version controlled with Prisma Migrate
- **Query Optimization**: Eager loading, select specific fields
- **Transactions**: For critical operations (orders, payments)
- **Soft Deletes**: For data retention compliance

### Image Handling
- **Upload**: Direct to Cloudinary or S3 presigned URLs
- **Optimization**: Automatic format conversion (WebP, AVIF)
- **Responsive**: Multiple sizes generated on upload
- **CDN**: Served through CloudFront or Cloudinary CDN
- **Lazy Loading**: Next/Image with blur placeholders

### Security Practices
- **Input Validation**: Zod schemas on all endpoints
- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based with middleware checks
- **Rate Limiting**: Per-endpoint limits with Redis
- **CORS**: Whitelisted origins only
- **Headers**: Helmet.js for security headers
- **Secrets**: Environment variables, never in code

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supertest for API endpoints
- **E2E Tests**: Playwright for critical paths
- **Type Tests**: tsc --noEmit in CI
- **Coverage Target**: 80% for critical paths

### Performance Optimization
- **Frontend**: 
  - Code splitting by route
  - Dynamic imports for heavy components
  - Image optimization with Next/Image
  - Font optimization with next/font
- **Backend**:
  - Response compression
  - Database connection pooling
  - Redis caching for frequent queries
  - CDN for static assets

### Development Workflow
- **Branching**: Feature branches from develop
- **Commits**: Conventional commits (feat, fix, docs)
- **Code Review**: Required for all PRs
- **Testing**: Must pass before merge
- **Deployment**: Automatic on main branch push
