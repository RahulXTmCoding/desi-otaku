const Cart = require("../models/cart");
const Product = require("../models/product");

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.auth._id;
    
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price photos photoUrl category productType'
      })
      .populate({
        path: 'items.customization.selectedProduct',
        select: 'name price photos photoUrl category productType'
      });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: userId, items: [] });
    }
    
    return res.json({
      success: true,
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return res.status(500).json({
      error: "Failed to fetch cart"
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { 
      productId, 
      size, 
      color, 
      quantity = 1,
      isCustom = false,
      customization,
      price,
      name
    } = req.body;
    
    // Validate required fields
    if (!size) {
      return res.status(400).json({
        error: "Size is required"
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    let itemData = {
      size,
      color,
      quantity,
      price,
      name
    };
    
    if (isCustom && customization) {
      // Handle custom design
      itemData.isCustom = true;
      itemData.customization = {
        frontDesign: customization.frontDesign || {},
        backDesign: customization.backDesign || {},
        selectedProduct: customization.selectedProduct
      };
      itemData.name = name || "Custom T-Shirt";
    } else if (productId) {
      // Handle regular product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          error: "Product not found"
        });
      }
      
      itemData.product = productId;
      itemData.price = price || product.price;
      itemData.name = name || product.name;
      // Include photoUrl if product has it
      if (product.photoUrl) {
        itemData.photoUrl = product.photoUrl;
      }
    } else {
      return res.status(400).json({
        error: "Product ID or custom design required"
      });
    }
    
    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(item => {
      if (isCustom && item.isCustom) {
        // For custom items, check if designs match
        return JSON.stringify(item.customization) === JSON.stringify(itemData.customization) &&
               item.size === size &&
               item.color === color;
      } else if (!isCustom && !item.isCustom && item.product) {
        // For regular products
        return item.product.toString() === productId &&
               item.size === size &&
               item.color === color;
      }
      return false;
    });
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push(itemData);
    }
    
    await cart.save();
    
    // Populate and return updated cart
    await cart.populate({
      path: 'items.product',
      select: 'name price photos photoUrl category productType'
    });
    
    return res.json({
      success: true,
      message: "Item added to cart",
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
    
  } catch (error) {
    console.error("Add to Cart Error:", error);
    return res.status(500).json({
      error: "Failed to add item to cart"
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: "Invalid quantity"
      });
    }
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        error: "Item not found in cart"
      });
    }
    
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    // Populate and return updated cart
    await cart.populate({
      path: 'items.product',
      select: 'name price photos photoUrl category productType'
    });
    
    return res.json({
      success: true,
      message: "Cart updated",
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
    
  } catch (error) {
    console.error("Update Cart Error:", error);
    return res.status(500).json({
      error: "Failed to update cart"
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      });
    }
    
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    
    // Populate and return updated cart
    await cart.populate({
      path: 'items.product',
      select: 'name price photos photoUrl category productType'
    });
    
    return res.json({
      success: true,
      message: "Item removed from cart",
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
    
  } catch (error) {
    console.error("Remove from Cart Error:", error);
    return res.status(500).json({
      error: "Failed to remove item from cart"
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.auth._id;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      });
    }
    
    cart.items = [];
    await cart.save();
    
    return res.json({
      success: true,
      message: "Cart cleared",
      cart: {
        items: [],
        total: 0,
        itemCount: 0
      }
    });
    
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return res.status(500).json({
      error: "Failed to clear cart"
    });
  }
};

// Merge guest cart with user cart (called during login)
exports.mergeCart = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { guestCartItems } = req.body;
    
    if (!guestCartItems || !Array.isArray(guestCartItems)) {
      return res.status(400).json({
        error: "Invalid guest cart data"
      });
    }
    
    // Filter and validate guest cart items
    const validGuestItems = guestCartItems.filter(item => {
      // Skip invalid items
      if (!item || !item.size) return false;
      
      // For custom items, ensure customization exists
      if (item.isCustom) {
        return item.customization && (item.customization.frontDesign || item.customization.backDesign);
      }
      
      // For regular products, ensure product ID exists and is valid
      if (item.product) {
        // Check if it's a valid ObjectId format
        const productId = item.product.toString();
        return productId && productId.length === 24 && /^[0-9a-fA-F]{24}$/.test(productId);
      }
      
      return false;
    });
    
    if (validGuestItems.length === 0) {
      return res.json({
        success: true,
        message: "No valid items to merge",
        cart: {
          items: [],
          total: 0,
          itemCount: 0
        }
      });
    }
    
    // Find or create user cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    // Merge guest items
    cart.mergeCart(validGuestItems);
    await cart.save();
    
    // Populate and return merged cart
    await cart.populate({
      path: 'items.product',
      select: 'name price photos photoUrl category productType'
    });
    
    return res.json({
      success: true,
      message: "Cart merged successfully",
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
    
  } catch (error) {
    console.error("Merge Cart Error:", error);
    return res.status(500).json({
      error: "Failed to merge cart"
    });
  }
};

// Sync cart from frontend (replace entire cart)
exports.syncCart = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: "Invalid cart data"
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId });
    }
    
    // Replace cart items
    cart.items = items;
    await cart.save();
    
    // Populate and return synced cart
    await cart.populate({
      path: 'items.product',
      select: 'name price photos category productType'
    });
    
    return res.json({
      success: true,
      message: "Cart synced successfully",
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
    
  } catch (error) {
    console.error("Sync Cart Error:", error);
    return res.status(500).json({
      error: "Failed to sync cart"
    });
  }
};
