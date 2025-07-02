require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

//My Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const designRoutes = require("./routes/design");
const orderRoutes = require("./routes/order");
const paymentBRoutes = require("./routes/paymentBRoutes");
const stripePaymentRoutes = require("./routes/stripePayment");
const passwordResetRoutes = require("./routes/passwordReset");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/review");
const settingsRoutes = require("./routes/settings");
const couponRoutes = require("./routes/coupon");
const analyticsRoutes = require("./routes/analytics");
const razorpayRoutes = require("./routes/razorpay");
const guestOrderRoutes = require("./routes/guestOrder");
const { initializeSettings } = require("./controllers/settings");

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
  });

//Middlewares
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

//My Routers
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", designRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentBRoutes);
app.use("/api", stripePaymentRoutes);
app.use("/api", passwordResetRoutes);
app.use("/api", wishlistRoutes);
app.use("/api", reviewRoutes);
app.use("/api", settingsRoutes);
app.use("/api", couponRoutes);
app.use("/api", analyticsRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/guest/order", guestOrderRoutes);

//Port
const port = process.env.PORT || 8000;

//Starting a server
app.listen(port, () => {
  console.log(`App is running on ${port}...`);
});
