require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing database connection...");
console.log("DATABASE URL:", process.env.DATABASE ? "Found" : "Not found");

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ DB CONNECTED SUCCESSFULLY");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ DB CONNECTION FAILED:", err.message);
    process.exit(1);
  });
