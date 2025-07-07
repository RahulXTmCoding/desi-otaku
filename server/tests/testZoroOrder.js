require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");
const User = require("./models/user");
const Product = require("./models/product");

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("DB CONNECTED");
    
    try {
      // Find the Zoro tshirt
      const zoroProduct = await Product.findOne({ name: /zoro/i });
      
      if (!zoroProduct) {
        console.log("Zoro tshirt not found. Please create it first in admin panel.");
        process.exit(1);
      }
      
      console.log("Found Zoro tshirt:", {
        name: zoroProduct.name,
        photoUrl: zoroProduct.photoUrl,
        price: zoroProduct.price
      });
      
      // Find a user
      const user = await User.findOne({ email: "user@tshirtshop.com" });
      
      if (!user) {
        console.log("User not found. Please run seedUsers.js first.");
        process.exit(1);
      }
      
      // Create an order with Zoro tshirt
      const order = new Order({
        products: [
          {
            product: zoroProduct._id,
            name: zoroProduct.name,
            price: zoroProduct.price,
            count: 1,
            size: "L",
            color: "Black"
          }
        ],
        amount: zoroProduct.price + 50, // Including shipping
        transaction_id: "pay_zoro_" + Math.random().toString(36).substr(2, 9),
        user: user._id,
        status: "Processing",
        paymentStatus: "Paid",
        paymentMethod: "razorpay",
        shippingAddress: {
          fullName: user.name,
          addressLine1: "123 Anime Street",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          phone: "9876543210"
        },
        shipping: {
          method: "Standard",
          cost: 50,
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        }
      });
      
      await order.save();
      console.log("Created order with Zoro tshirt!");
      console.log("Order ID:", order._id);
      
    } catch (error) {
      console.error("Error creating order:", error);
    }
    
    process.exit();
  })
  .catch((err) => {
    console.error("DB CONNECTION ERROR:", err);
    process.exit(1);
  });
