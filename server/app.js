require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("./config/passport");

//My Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const designRoutes = require("./routes/design");
const orderRoutes = require("./routes/order");
const paymentBRoutes = require("./routes/paymentBRoutes");
// const stripePaymentRoutes = require("./routes/stripePayment");
const passwordResetRoutes = require("./routes/passwordReset");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/review");
const settingsRoutes = require("./routes/settings");
const couponRoutes = require("./routes/coupon");
const analyticsRoutes = require("./routes/analytics");
const razorpayRoutes = require("./routes/razorpay");
const guestOrderRoutes = require("./routes/guestOrder");
const secureOrderRoutes = require("./routes/secureOrder");
const productTypeRoutes = require("./routes/productType");
const cartRoutes = require("./routes/cart");
const rewardRoutes = require("./routes/reward");
const invoiceRoutes = require("./routes/invoice");
const aovRoutes = require("./routes/aov");
const codRoutes = require("./routes/cod");
const codBlockedPincodeRoutes = require("./routes/codBlockedPincode");
const productAdminRoutes = require("./routes/productAdmin");
const sitemapRoutes = require("./routes/sitemap");
const telegramRoutes = require("./routes/telegram");
const marketingRoutes = require("./routes/marketing");
const returnExchangeRoutes = require("./routes/returnExchange");
const sizeChartRoutes = require("./routes/sizeChart");
const { initializeSettings } = require("./controllers/settings");
const AOVService = require("./services/aovService");
const redisService = require("./services/redisService");
const spotTerminationService = require("./services/spotTerminationService");

const corsOptions = {
  origin: ['https://attars.club', 'http://localhost:5173'] // Allow only this domain to access your backend
};

const app = express();

//DB Connections
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: process.env.NODE_ENV !== 'production', // Skip index rebuild on prod startup
  })
  .then(() => {
    console.log("DB CONNECTED");
    // Initialize default settings
    initializeSettings();
    // Initialize AOV settings
    AOVService.initializeAOVSettings();
    // Initialize Redis connection (optional, graceful fallback if unavailable)
    redisService.connect().then(() => {
      console.log("✅ Redis initialization complete");
    }).catch(err => {
      console.log("⚠️ Redis initialization failed, continuing without cache:", err.message);
    });
  });

//Middlewares
// Security headers
app.use(helmet({
  contentSecurityPolicy: false,        // React app manages its own CSP via meta tags
  crossOriginEmbedderPolicy: false,    // Required for external images (Cloudflare R2, etc.)
}));

// Gzip/Brotli compression - reduces payload size by 60-80%
app.use(compression());

// General API rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health', // never rate-limit health checks
});

// Stricter limiter for auth endpoints: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use("/api", apiLimiter);
app.use("/api/signin", authLimiter);
app.use("/api/signup", authLimiter);

// Body parsing - 100MB intentional limit for large image uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 50000 }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Session + Passport — scoped ONLY to OAuth routes.
// All other auth uses JWT (req.auth set by express-jwt), not Passport sessions.
const oauthSessionMiddleware = [
  session({
    secret: process.env.SESSION_SECRET || 'your-fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }),
  passport.initialize(),
  passport.session()
];
app.use("/api/auth/google", oauthSessionMiddleware);
app.use("/api/auth/facebook", oauthSessionMiddleware);

// Graceful shutdown middleware - reject requests during shutdown
app.use((req, res, next) => {
  if (spotTerminationService.isInShutdown()) {
    return res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: 'Server is shutting down, please retry in a few seconds'
    });
  }
  next();
});

// Health check endpoint for load balancer
app.get('/health', (req, res) => {
  if (spotTerminationService.isInShutdown()) {
    return res.status(503).json({ 
      status: 'shutting-down',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", designRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentBRoutes);
app.use("/api", passwordResetRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", reviewRoutes);
app.use("/api", settingsRoutes);
app.use("/api", couponRoutes);
app.use("/api", analyticsRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/guest/order", guestOrderRoutes);
app.use("/api/secure-order", secureOrderRoutes);
app.use("/api", productTypeRoutes);
app.use("/api", cartRoutes);
app.use("/api", rewardRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/aov", aovRoutes);
app.use("/api/cod", codRoutes);
app.use("/api/cod-pincodes", codBlockedPincodeRoutes);
app.use("/api", productAdminRoutes);
app.use("/api/sitemap", sitemapRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/return-exchange", returnExchangeRoutes);
app.use("/api", sizeChartRoutes);

// Serve static files (for invoice PDFs)
app.use('/invoices', express.static(require('path').join(__dirname, 'public/invoices')));

//Port
const port = process.env.PORT || 8000;

//Starting a server
const server = app.listen(port, () => {
  console.log(`🚀 App is running on ${port}...`);
  console.log(`🏥 Health check available at http://localhost:${port}/health`);
  
  // Initialize spot termination monitoring
  spotTerminationService.initialize(server);
  console.log(`🛡️ Spot termination monitoring active`);
});


module.exports = server;
