require("dotenv").config();
const mongoose = require("mongoose");
const Coupon = require("../models/coupon");

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log("DB CONNECTED FOR COUPON MIGRATION");
    migrateCoupons();
  })
  .catch(err => {
    console.error("DB CONNECTION ERROR:", err);
    process.exit(1);
  });

async function migrateCoupons() {
  try {
    console.log("Starting coupon migration...");
    
    // Find all coupons that don't have the new fields
    const coupons = await Coupon.find({
      $or: [
        { displayType: { $exists: false } },
        { usedBy: { $exists: false } }
      ]
    });
    
    console.log(`Found ${coupons.length} coupons to migrate`);
    
    for (const coupon of coupons) {
      const updateData = {};
      
      // Add displayType if missing
      if (!coupon.displayType) {
        updateData.displayType = 'hidden'; // Default to hidden
      }
      
      // Add usedBy array if missing
      if (!coupon.usedBy) {
        updateData.usedBy = [];
      }
      
      // Add autoApplyPriority if missing
      if (coupon.autoApplyPriority === undefined) {
        updateData.autoApplyPriority = 0;
      }
      
      // Update the coupon
      if (Object.keys(updateData).length > 0) {
        await Coupon.updateOne(
          { _id: coupon._id },
          { $set: updateData }
        );
        console.log(`Migrated coupon: ${coupon.code}`);
      }
    }
    
    console.log("Coupon migration completed successfully!");
    
    // Create some sample promotional coupons
    const sampleCoupons = [
      {
        code: "WELCOME20",
        description: "Get 20% off on your first order",
        discountType: "percentage",
        discountValue: 20,
        minimumPurchase: 500,
        displayType: "promotional",
        bannerText: "New Customer Special - 20% OFF Everything!",
        autoApplyPriority: 0,
        usageLimit: 100,
        usageCount: 0,
        userLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        firstTimeOnly: true,
        usedBy: []
      },
      {
        code: "ANIME10",
        description: "10% off on all anime merchandise",
        discountType: "percentage",
        discountValue: 10,
        minimumPurchase: 300,
        displayType: "auto-apply",
        autoApplyPriority: 1,
        usageLimit: null,
        usageCount: 0,
        userLimit: 5,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        firstTimeOnly: false,
        usedBy: []
      },
      {
        code: "FLAT100",
        description: "Flat ₹100 off on orders above ₹999",
        discountType: "fixed",
        discountValue: 100,
        minimumPurchase: 999,
        displayType: "promotional",
        bannerText: "Save ₹100 on Orders Above ₹999!",
        autoApplyPriority: 0,
        usageLimit: 200,
        usageCount: 0,
        userLimit: 2,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        isActive: true,
        firstTimeOnly: false,
        usedBy: []
      }
    ];
    
    console.log("\nCreating sample promotional coupons...");
    
    for (const couponData of sampleCoupons) {
      try {
        const existingCoupon = await Coupon.findOne({ code: couponData.code });
        if (!existingCoupon) {
          const newCoupon = new Coupon(couponData);
          await newCoupon.save();
          console.log(`Created sample coupon: ${couponData.code}`);
        } else {
          console.log(`Coupon ${couponData.code} already exists`);
        }
      } catch (err) {
        console.error(`Error creating coupon ${couponData.code}:`, err.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}
