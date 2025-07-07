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
      // Find an admin user and a regular user
      const adminUser = await User.findOne({ email: "admin@tshirtshop.com" });
      const regularUser = await User.findOne({ email: "user@tshirtshop.com" });
      
      if (!adminUser || !regularUser) {
        console.log("Please run seedUsers.js first to create test users");
        process.exit(1);
      }
      
      // Find some products
      const products = await Product.find();
      
      if (products.length < 2) {
        console.log("Not enough products found. Please add at least 2 products first.");
        process.exit(1);
      }
      
      console.log(`Found ${products.length} products`);
      
      // Create sample orders using only the available products
      const product1 = products[0];
      const product2 = products[1];
      
      const orders = [
        // Delivered orders
        {
          products: [
            { 
              product: product1._id, 
              count: 2, 
              name: product1.name, 
              price: product1.price,
              size: "L",
              color: "Black",
              image: product1.photoUrl || "/placeholder.png"
            },
            { 
              product: product2._id, 
              count: 1, 
              name: product2.name, 
              price: product2.price,
              size: "M",
              color: "White",
              image: product2.photoUrl || "/placeholder.png"
            }
          ],
          amount: (product1.price * 2) + product2.price + 50, // Including shipping
          address: "123 Main St, Mumbai, Maharashtra - 400001",
          shipping: {
            name: "John Doe",
            phone: "9876543210",
            pincode: "400001",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            shippingCost: 50,
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          },
          status: "Delivered",
          paymentStatus: "Paid",
          paymentMethod: "razorpay",
          transaction_id: "pay_" + Math.random().toString(36).substr(2, 9),
          user: regularUser._id,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
        },
        // Shipped order
        {
          products: [
            { 
              product: product1._id, 
              count: 3, 
              name: product1.name, 
              price: product1.price,
              size: "XL",
              color: "Navy",
              image: product1.photoUrl || "/placeholder.png"
            }
          ],
          amount: (product1.price * 3) + 50,
          address: "456 Park Ave, Delhi - 110001",
          shipping: {
            name: "Jane Smith",
            phone: "9876543211",
            pincode: "110001",
            city: "Delhi",
            state: "Delhi",
            country: "India",
            shippingCost: 50,
            awbCode: "AWB" + Math.random().toString(36).substr(2, 9).toUpperCase(),
            courier: "Blue Dart",
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          },
          status: "Shipped",
          paymentStatus: "Paid",
          paymentMethod: "card",
          transaction_id: "pay_" + Math.random().toString(36).substr(2, 9),
          user: regularUser._id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        // Processing order
        {
          products: [
            { 
              product: product2._id, 
              count: 1, 
              name: product2.name, 
              price: product2.price,
              size: "S",
              color: "Red",
              image: product2.photoUrl || "/placeholder.png"
            },
            { 
              product: product1._id, 
              count: 2, 
              name: product1.name, 
              price: product1.price,
              size: "M",
              color: "Blue",
              image: product1.photoUrl || "/placeholder.png"
            }
          ],
          amount: product2.price + (product1.price * 2) + 50,
          address: "789 Oak St, Bangalore, Karnataka - 560001",
          shipping: {
            name: "Bob Wilson",
            phone: "9876543212",
            pincode: "560001",
            city: "Bangalore",
            state: "Karnataka",
            country: "India",
            shippingCost: 50,
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          },
          status: "Processing",
          paymentStatus: "Paid",
          paymentMethod: "razorpay",
          transaction_id: "pay_" + Math.random().toString(36).substr(2, 9),
          user: regularUser._id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        // Pending order (COD)
        {
          products: [
            { 
              product: product1._id, 
              count: 1, 
              name: product1.name, 
              price: product1.price,
              size: "L",
              color: "Gray",
              image: product1.photoUrl || "/placeholder.png"
            }
          ],
          amount: product1.price + 50,
          address: "321 Elm St, Chennai, Tamil Nadu - 600001",
          shipping: {
            name: "Alice Brown",
            phone: "9876543213",
            pincode: "600001",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            shippingCost: 50,
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          },
          status: "Received",
          paymentStatus: "Pending",
          paymentMethod: "cod",
          user: regularUser._id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        },
        // Today's order  
        {
          products: [
            { 
              product: product2._id, 
              count: 2, 
              name: product2.name, 
              price: product2.price,
              size: "L",
              color: "Green",
              image: product2.photoUrl || "/placeholder.png",
              isCustom: true,
              designId: "custom123"
            },
            { 
              product: product1._id, 
              count: 1, 
              name: product1.name, 
              price: product1.price,
              size: "XL",
              color: "Yellow",
              image: product1.photoUrl || "/placeholder.png"
            }
          ],
          amount: (product2.price * 2) + product1.price + 50,
          address: "555 Pine St, Pune, Maharashtra - 411001",
          shipping: {
            name: "Charlie Davis",
            phone: "9876543214",
            pincode: "411001",
            city: "Pune",
            state: "Maharashtra",
            country: "India",
            shippingCost: 50,
            courier: "Express",
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          },
          status: "Received",
          paymentStatus: "Paid",
          paymentMethod: "razorpay",
          transaction_id: "pay_" + Math.random().toString(36).substr(2, 9),
          user: regularUser._id,
          createdAt: new Date() // Today
        },
        // Cancelled order
        {
          products: [
            { 
              product: product2._id, 
              count: 1, 
              name: product2.name, 
              price: product2.price,
              size: "M",
              color: "Purple",
              image: product2.photoUrl || "/placeholder.png"
            }
          ],
          amount: product2.price + 50,
          address: "999 Maple Ave, Kolkata, West Bengal - 700001",
          shipping: {
            name: "David Lee",
            phone: "9876543215",
            pincode: "700001",
            city: "Kolkata",
            state: "West Bengal",
            country: "India",
            shippingCost: 50
          },
          status: "Cancelled",
          paymentStatus: "Refunded",
          paymentMethod: "card",
          transaction_id: "pay_" + Math.random().toString(36).substr(2, 9),
          user: regularUser._id,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
        }
      ];
      
      // Clear existing orders (optional)
      await Order.deleteMany({});
      console.log("Cleared existing orders");
      
      // Insert new orders
      const createdOrders = await Order.insertMany(orders);
      console.log(`Created ${createdOrders.length} sample orders`);
      
      // Update order timestamps for analytics
      for (let i = 0; i < createdOrders.length; i++) {
        const order = createdOrders[i];
        order.updatedAt = order.createdAt;
        await order.save();
      }
      
      console.log("Sample orders created successfully!");
      console.log("Order statuses: Received(2), Processing(1), Shipped(1), Delivered(1), Cancelled(1)");
      
    } catch (error) {
      console.error("Error creating sample orders:", error);
    }
    
    process.exit();
  })
  .catch((err) => {
    console.error("DB CONNECTION ERROR:", err);
    process.exit(1);
  });
