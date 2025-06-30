# Project Brief: Anime T-Shirt Brand - Full Stack E-Commerce Platform

## Project Overview
Build a complete e-commerce platform for custom anime t-shirt designs with user customization, ordering, payment, and admin management capabilities. The platform targets the anime community with both pre-made designs and custom creation tools.

## Core Vision
- **Goal**: Create a comprehensive anime merchandise platform that combines curated anime designs, brand designs, and custom creation capabilities
- **Target Audience**: Anime enthusiasts who want unique, high-quality t-shirt designs
- **Differentiators**: Dark theme anime aesthetics, advanced customization tools, random design generator, 3D mockups

## Core Requirements

### User Website

#### 1. Home Page
- Hero section with gradient backgrounds and decorative anime elements
- Category cards in 2x2 or 4x1 grid with hover animations
- Trending anime t-shirts showcase
- "Surprise Me" random design feature
- Smooth scroll animations to shop section

#### 2. Product Catalog System
- **Pre-made Anime Designs**: Curated collection of ready-to-order anime designs
- **Brand Designs**: Custom branding/logo designs
- **Design Categories**: Anime characters, series, genres, brand collections
- **T-shirt Variants**: Multiple colors, sizes, and materials
- Design search and filtering with TypeScript type safety
- Design ratings and reviews
- Related/recommended designs

#### 3. Purchase Flows
**Path 1: Pre-made Design Purchase**
- Browse catalog → Select design → Choose t-shirt color → Choose size → Add to cart
- Bulk ordering options
- Optional design customization (position, size)

**Path 2: Custom Design Creation**
- Interactive design placement on t-shirt mockup
- Upload custom artwork with guidelines
- Real-time color selection for t-shirt base
- Design size and position adjustment
- Multiple design positions (front, back, sleeve)
- Live 3D preview with mockup
- Save custom designs to user account

#### 4. Random Design Generator
- "Surprise Me" feature with random selection
- Random pre-made or custom combinations
- Filters for random selection
- Quick random order capability

#### 5. Shopping Cart & Checkout
- Persistent cart across sessions
- Guest checkout option
- Multiple shipping options
- Shipping address management
- Order summary and validation

#### 6. Payment Processing
- Multiple payment methods (Credit/Debit, PayPal, Stripe, Razorpay)
- Secure payment processing
- Order confirmation emails
- Invoice generation

#### 7. User Features
- Registration/login (email/password, social login)
- User dashboard with order history
- Profile management
- Wishlist/favorites
- Order tracking
- Design library for saved custom designs

### Admin Dashboard

#### 1. Dashboard & Analytics
- Sales overview and statistics
- Popular designs analytics
- User behavior tracking
- Revenue reports
- Inventory status overview

#### 2. Design Management
- Upload new anime designs
- Design categorization and tagging
- Design approval workflow
- Copyright management
- Bulk design operations

#### 3. Order Management
- Order processing workflow
- Status updates and tracking
- Customer communication
- Refund processing
- Bulk order operations

#### 4. Content Management
- Website content editing
- Banner/promotion management
- FAQ and policy pages
- Blog/news management

#### 5. Inventory Control
- Stock level management
- Low stock alerts
- Supplier management
- Cost tracking

## Design System & Visual Identity

### Core Design Philosophy
- **Dark Theme First**: Modern dark UI (#1F2937, #111827, #374151)
- **Vibrant Accent System**: High-contrast colors for visual impact
- **Anime-Inspired Aesthetics**: Playful yet professional
- **Interactive & Engaging**: Hover effects, animations, micro-interactions

### Color Palette
```css
/* Primary Colors */
Background Dark: #1F2937 (gray-800)
Background Darker: #111827 (gray-900)
Card Background: #374151 (gray-700)

/* Accent Colors */
Primary Yellow: #FCD34D (yellow-400) - CTAs, highlights
Purple Gradient: #8B5CF6 to #6366F1
Success Green: #10B981
Warning Orange: #F59E0B
Error Red: #EF4444
Info Blue: #3B82F6

/* Text Colors */
Primary Text: #FFFFFF
Secondary Text: #D1D5DB
Muted Text: #9CA3AF
```

### Typography System
- Font Family: Inter, system-ui, sans-serif
- H1: 3.5rem (56px) - Hero titles
- H2: 2.25rem (36px) - Section headers
- H3: 1.5rem (24px) - Card titles
- Body: 1rem (16px) - Standard content

### Component Design Principles
1. **Rounded Corners**: 8px, 12px, 16px for modern feel
2. **Glassmorphism Elements**: Subtle backdrop-blur on navigation
3. **Gradient Accents**: Hero sections and CTAs
4. **Shadow System**: Layered shadows for depth
5. **Smooth Transitions**: 200-300ms duration

## Technical Requirements

### Performance Goals
- Page load time < 3 seconds
- Time to interactive < 5 seconds
- Mobile-first responsive design
- SEO optimized with SSR/SSG

### Security Requirements
- HTTPS enforcement
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens
- PCI DSS compliance for payments

### Scalability Requirements
- Support for 10,000+ concurrent users
- CDN for global content delivery
- Database optimization for large catalogs
- Microservices-ready architecture

## Success Metrics
- User engagement: Average session duration > 5 minutes
- Conversion rate: > 3%
- Cart abandonment rate: < 60%
- Customer satisfaction: > 4.5/5 rating
- Page load speed: < 3 seconds
