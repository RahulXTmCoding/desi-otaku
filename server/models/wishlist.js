const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    products: [{
      product: {
        type: ObjectId,
        ref: "Product",
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

// Prevent duplicate products in wishlist
wishlistSchema.index({ user: 1, "products.product": 1 }, { unique: true });

// Methods
wishlistSchema.methods.addProduct = function(productId) {
  const exists = this.products.some(item => 
    item.product.toString() === productId.toString()
  );
  
  if (!exists) {
    this.products.push({ product: productId });
  }
  
  return this.save();
};

wishlistSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(item => 
    item.product.toString() !== productId.toString()
  );
  
  return this.save();
};

wishlistSchema.methods.hasProduct = function(productId) {
  return this.products.some(item => 
    item.product.toString() === productId.toString()
  );
};

module.exports = mongoose.model("Wishlist", wishlistSchema);
