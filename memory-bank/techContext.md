# Tech Context

## Current Implementation vs Target Architecture

### Current Stack (Phase 3 - In Use)

#### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript (gradually adopting)
- **Styling**: Tailwind CSS with dark theme
- **State Management**: 
  - Local state with useState/useReducer
  - Context API for global state
  - LocalStorage for persistence
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

#### Backend
- **Runtime**: Node.js with Express.js
- **Language**: JavaScript (moving to TypeScript)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with jsonwebtoken
- **File Storage**: Local filesystem
- **Payment**: Stripe (integrated), Braintree (setup)
- **Shipping**: Shiprocket (integrated)
- **Email**: Nodemailer

#### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **CI/CD**: GitHub Actions

### Target Architecture (Per Comprehensive Plan)

#### Frontend Stack
- **Framework**: React 18+ with Next.js 14+ (App Router) ⏳
- **Language**: TypeScript (strict mode) 🚧
- **Styling**: Tailwind CSS 3.x with custom design system ✅
- **UI Components**: shadcn/ui (customized for dark theme) ⏳
- **State Management**: 
  - Redux Toolkit for global state ⏳
  - React Query/TanStack Query for server state ⏳
  - Zustand for lightweight local state ⏳
- **Forms**: React Hook Form + Zod validation ⏳
- **Design Editor**: Fabric.js with TypeScript bindings 🚧
- **3D Graphics**: Three.js + react-three-fiber ⏳
- **Animations**: Framer Motion ⏳
- **Icons**: Lucide React ✅
- **HTTP Client**: Axios with TypeScript interceptors 🚧
- **Image Handling**: Next/Image + Cloudinary ⏳
- **Dev Tools**: ESLint, Prettier, Husky ⏳

#### Backend Stack
- **Runtime**: Node.js 20+ LTS ✅
- **Framework**: Express.js with TypeScript or Nest.js ⏳
- **Language**: TypeScript (strict mode) ⏳
- **Database**: 
  - PostgreSQL 15+ (primary) ⏳
  - Redis 7+ (caching/sessions) ⏳
- **ORM**: Prisma 5+ (type-safe queries) ⏳
- **Authentication**: 
  - JWT (jsonwebtoken) ✅
  - Passport.js (social auth) ⏳
  - bcrypt (password hashing) ✅
- **Validation**: Zod (shared with frontend) ⏳
- **Queue**: Bull.js with Redis ⏳
- **File Storage**: AWS S3 or Cloudinary ⏳
- **Email**: SendGrid or AWS SES ⏳
- **SMS**: Twilio ⏳
- **API Docs**: Swagger/OpenAPI ⏳
- **Logging**: Winston ⏳
- **Process Manager**: PM2 ⏳

### Migration Path

#### Phase 3 (Current) - Custom Design System
- Implementing TypeScript gradually
- Building design editor with Canvas API
- Maintaining current MongoDB/Express setup

#### Phase 4 - Advanced Features
- Introduce Redux Toolkit for state management
- Add React Query for API state
- Implement performance optimizations

#### Phase 5 - Polish & Launch
- Migrate to Next.js for SSR/SEO
- Move from MongoDB to PostgreSQL with Prisma
- Add Redis for caching
- Implement advanced monitoring

## Current Development Setup

### Prerequisites
```bash
# Currently required
Node.js: 16.x or higher
npm: 8.x or higher
MongoDB: 5.x or higher
Git: 2.x
```

### Local Development
```bash
# Clone repository
git clone <repo-url>
cd custom-tshirt-shop

# Frontend setup
cd client
npm install
npm run dev

# Backend setup (new terminal)
cd server
npm install
npm start
```

### Current Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=8000
DATABASE=mongodb://localhost:27017/tshirtstore
SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_xxx
BRAINTREE_MERCHANT_ID=xxx
BRAINTREE_PUBLIC_KEY=xxx
BRAINTREE_PRIVATE_KEY=xxx
```

## Current Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "tailwindcss": "^3.3.6",
    "lucide-react": "^0.294.0",
    "@stripe/stripe-js": "^2.2.0",
    "braintree-web": "^3.97.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "cookie-parser": "^1.4.6",
    "express-validator": "^7.0.1",
    "formidable": "^3.5.1",
    "lodash": "^4.17.21",
    "morgan": "^1.10.0",
    "nodemailer": "^6.9.7",
    "stripe": "^14.9.0",
    "braintree": "^3.19.0",
    "uuid": "^9.0.1"
  }
}
```

## Development Patterns

### Current Patterns
- **Component Structure**: Functional components with hooks
- **State Management**: useState, useContext, localStorage
- **API Calls**: Axios with try-catch in components
- **Styling**: Tailwind utility classes
- **File Organization**: Feature-based folders

### Target Patterns
- **Component Structure**: TypeScript functional components
- **State Management**: Redux Toolkit + React Query
- **API Calls**: Typed API client with interceptors
- **Styling**: Tailwind + CSS modules for complex components
- **File Organization**: Domain-driven structure

## Security Practices (Current)
- JWT tokens in localStorage (to be moved to httpOnly cookies)
- Password hashing with bcrypt
- CORS enabled
- Input validation with express-validator
- Environment variables for secrets

## Performance Considerations
- **Current**: Basic React optimization with useMemo/useCallback
- **Planned**: 
  - Code splitting with React.lazy
  - Image lazy loading
  - Service workers
  - CDN integration
  - Database indexing

## Testing Strategy
- **Current**: Manual testing
- **Planned**: 
  - Jest + React Testing Library
  - API testing with Supertest
  - E2E with Playwright
  - 80% coverage target

## Legend
- ✅ Implemented
- 🚧 In Progress
- ⏳ Planned
