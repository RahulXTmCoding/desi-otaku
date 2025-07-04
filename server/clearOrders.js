require("dotenv").config();
const mongoose = require("mongoose");
const { Order } = require("./models/order");

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("DB CONNECTED");
  clearOrders();
}).catch(err => {
  console.error("DB CONNECTION ERROR:", err);
  process.exit(1);
});

async function clearOrders() {
  try {
    console.log("\n=== Clearing All Orders from Database ===\n");

    // First, get count of existing orders
    const orderCount = await Order.countDocuments();
    console.log(`Found ${orderCount} orders in database`);

    if (orderCount === 0) {
      console.log("No orders to delete");
      mongoose.connection.close();
      return;
    }

    // Confirm deletion
    console.log("\nDeleting all orders...");
    
    // Delete all orders
    const result = await Order.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} orders`);
    
    // Verify deletion
    const remainingOrders = await Order.countDocuments();
    console.log(`\nRemaining orders in database: ${remainingOrders}`);

  } catch (error) {
    console.error("\n❌ Error clearing orders:", error);
  } finally {
    mongoose.connection.close();
  }
}
