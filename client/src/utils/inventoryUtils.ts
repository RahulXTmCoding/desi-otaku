import { API } from '../backend';

// Inventory validation utilities
export interface ProductInventory {
  sizeStock: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  totalStock: number;
  availableSizes: string[];
}

export interface InventoryCheckResult {
  isValid: boolean;
  availableStock: number;
  maxAllowed: number;
  message?: string;
}

/**
 * Check if a quantity is available for a specific product size
 */
export const checkInventoryAvailability = (
  product: any,
  size: string,
  requestedQuantity: number,
  currentCartQuantity: number = 0
): InventoryCheckResult => {
  // Handle missing product or inventory data
  if (!product) {
    return {
      isValid: false,
      availableStock: 0,
      maxAllowed: 0,
      message: 'Product not found'
    };
  }

  // Get inventory data - support both direct sizeStock and nested inventory
  const inventory = product.sizeStock || product.inventory || {};
  const availableStock = inventory[size] || 0;
  
  // Calculate max allowed (available stock minus what's already in cart for this product+size)
  const maxAllowed = Math.max(0, availableStock - currentCartQuantity);
  
  // Check if requested quantity exceeds available stock
  const isValid = requestedQuantity <= maxAllowed;
  
  let message = '';
  if (!isValid) {
    if (maxAllowed === 0) {
      message = `Size ${size} is out of stock`;
    } else {
      message = `Only ${maxAllowed} items available in size ${size}`;
    }
  }

  return {
    isValid,
    availableStock,
    maxAllowed,
    message
  };
};

/**
 * Get available stock for a specific size
 */
export const getAvailableStock = (product: any, size: string): number => {
  if (!product) return 0;
  
  const inventory = product.sizeStock || product.inventory || {};
  return inventory[size] || 0;
};

/**
 * Get all available sizes for a product (sizes with stock > 0)
 */
export const getAvailableSizes = (product: any): string[] => {
  if (!product) return [];
  
  const inventory = product.sizeStock || product.inventory || {};
  const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  return allSizes.filter(size => (inventory[size] || 0) > 0);
};

/**
 * Check if product has any stock available
 */
export const isProductInStock = (product: any): boolean => {
  if (!product) return false;
  
  const inventory = product.sizeStock || product.inventory || {};
  const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  return allSizes.some(size => (inventory[size] || 0) > 0);
};

/**
 * Calculate current cart quantity for a specific product and size
 */
export const getCurrentCartQuantity = (cart: any[], productId: string, size: string): number => {
  const cartItem = cart.find(item => 
    (item.product === productId || item.product?._id === productId) && 
    item.size === size
  );
  return cartItem ? cartItem.quantity : 0;
};

/**
 * Validate cart item quantity against inventory
 */
export const validateCartItemQuantity = (
  product: any,
  size: string,
  newQuantity: number,
  cart: any[],
  currentItemId?: string
): InventoryCheckResult => {
  if (!product || !size) {
    return {
      isValid: false,
      availableStock: 0,
      maxAllowed: 0,
      message: 'Invalid product or size'
    };
  }

  // Get current cart quantity (excluding the item being updated)
  const productId = product._id || product.id;
  let currentCartQuantity = 0;
  
  if (cart && cart.length > 0) {
    cart.forEach(item => {
      const itemProductId = item.product?._id || item.product;
      if (itemProductId === productId && item.size === size && item._id !== currentItemId) {
        currentCartQuantity += item.quantity;
      }
    });
  }

  return checkInventoryAvailability(product, size, newQuantity, currentCartQuantity);
};

/**
 * Get inventory status message for display
 */
export const getInventoryStatusMessage = (product: any, size: string): string => {
  const availableStock = getAvailableStock(product, size);
  
  if (availableStock === 0) {
    return 'Out of stock';
  } else if (availableStock <= 5) {
    return `Only ${availableStock} left`;
  } else if (availableStock <= 10) {
    return `${availableStock} in stock`;
  }
  
  return 'In stock';
};

/**
 * Fetch fresh inventory data from server
 */
export const fetchProductInventory = async (productId: string): Promise<ProductInventory | null> => {
  try {
    const response = await fetch(`${API}/product/${productId}`);
    if (response.ok) {
      const product = await response.json();
      return {
        sizeStock: product.sizeStock || {},
        totalStock: product.totalStock || 0,
        availableSizes: product.availableSizes || []
      };
    }
  } catch (error) {
    console.error('Failed to fetch product inventory:', error);
  }
  return null;
};
