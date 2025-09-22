require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
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
const productAdminRoutes = require("./routes/productAdmin");
const sitemapRoutes = require("./routes/sitemap");
const telegramRoutes = require("./routes/telegram");
const { initializeSettings } = require("./controllers/settings");
const AOVService = require("./services/aovService");
const redisService = require("./services/redisService");
const spotTerminationService = require("./services/spotTerminationService");

const corsOptions = {
  origin: 'https://attars.club' // Allow only this domain to access your backend
};

const app = express();

//DB Connections
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
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
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

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
app.use("/api", productAdminRoutes);
app.use("/api/sitemap", sitemapRoutes);
app.use("/api/telegram", telegramRoutes);

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
