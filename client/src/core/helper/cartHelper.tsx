const API = import.meta.env.VITE_API_URL;

// Cart item type definition
export interface ProductImage {
  _id?: string;
  url: string;
  isPrimary?: boolean;
  order?: number;
  caption?: string;
}

export interface CartItem {
  _id?: string;
  product?: string;
  photoUrl?: string; // URL-based product images (legacy)
  images?: ProductImage[]; // New multi-image structure
  isCustom: boolean;
  customization?: {
    frontDesign?: {
      designId?: string;
      designImage: string;
      position: string;
      price: number;
    };
    backDesign?: {
      designId?: string;
      designImage: string;
      position: string;
      price: number;
    };
    selectedProduct?: string;
  };
  name: string;
  size: string;
  color?: string;
  price: number;
  quantity: number;
}

// Get user's cart from backend
export const getUserCart = (userId: string, token: string) => {
  return fetch(`${API}/cart`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      return response.json();
    })
    .catch(err => {
      // Return error response instead of undefined
      return { success: false, error: err.message };
    });
};

// Add item to cart
export const addItemToCart = (
  userId: string,
  token: string,
  cartItem: {
    productId?: string;
    photoUrl?: string;
    size: string;
    color?: string;
    quantity?: number;
    isCustom?: boolean;
    customization?: CartItem['customization'];
    price: number;
    name: string;
  }
) => {
  return fetch(`${API}/cart/add`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(cartItem)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
      return response.json();
    })
    .catch(err => {
      return { success: false, error: err.message };
    });
};

// Update cart item quantity
export const updateCartItemQuantity = (
  userId: string,
  token: string,
  itemId: string,
  quantity: number
) => {
  return fetch(`${API}/cart/item/${itemId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ quantity })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update cart');
      }
      return response.json();
    })
    .catch(err => {
      return { success: false, error: err.message };
    });
};

// Remove item from cart
export const removeItemFromCart = (
  userId: string,
  token: string,
  itemId: string
) => {
  return fetch(`${API}/cart/item/${itemId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to remove item');
      }
      return response.json();
    })
    .catch(err => {
      return { success: false, error: err.message };
    });
};

// Clear entire cart
export const clearUserCart = (userId: string, token: string) => {
  return fetch(`${API}/cart/clear`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
      return response.json();
    })
    .catch(err => {
      return { success: false, error: err.message };
    });
};

// Merge guest cart with user cart (after login)
export const mergeGuestCart = (
  userId: string,
  token: string,
  guestCartItems: CartItem[]
) => {
  // Remove temporary _id fields from guest cart items
  const cleanedItems = guestCartItems.map(item => {
    const { _id, ...itemWithoutId } = item;
    return itemWithoutId;
  });
  
  return fetch(`${API}/cart/merge`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ guestCartItems: cleanedItems })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to merge cart');
      }
      return response.json();
    })
    .catch(err => {
      return { success: false, error: err.message };
    });
};

// Sync entire cart from frontend
export const syncUserCart = (
  userId: string,
  token: string,
  items: CartItem[]
) => {
  return fetch(`${API}/cart/sync`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to sync cart');
      }
      return response.json();
    })
    .catch(err => {
      return { success: false, error: err.message };
    });
};

// Local storage helpers
const CART_KEY = "cart";

// Get cart from localStorage
export const getLocalCart = (): CartItem[] => {
  if (typeof window !== "undefined") {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  }
  return [];
};

// Save cart to localStorage
export const saveLocalCart = (cart: CartItem[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
};

// Add item to local cart
export const addToLocalCart = (item: CartItem): CartItem[] => {
  const cart = getLocalCart();
  
  // Check if item already exists
  const existingIndex = cart.findIndex(cartItem => {
    if (item.isCustom && cartItem.isCustom) {
      // For custom items, check if designs match
      return JSON.stringify(cartItem.customization) === JSON.stringify(item.customization) &&
             cartItem.size === item.size &&
             cartItem.color === item.color;
    } else if (!item.isCustom && !cartItem.isCustom) {
      // For regular products
      return cartItem.product === item.product &&
             cartItem.size === item.size &&
             cartItem.color === item.color;
    }
    return false;
  });
  
  if (existingIndex > -1) {
    // Update quantity if exists
    cart[existingIndex].quantity += item.quantity || 1;
  } else {
    // Add new item with temporary ID
    cart.push({
      ...item,
      _id: `temp_${Date.now()}_${Math.random()}`,
      product: item.product || ''
    });
  }
  
  saveLocalCart(cart);
  return cart;
};

// Update local cart item quantity
export const updateLocalCartItem = (itemId: string, quantity: number): CartItem[] => {
  const cart = getLocalCart();
  const index = cart.findIndex(item => item._id === itemId);
  
  if (index > -1) {
    cart[index].quantity = quantity;
    saveLocalCart(cart);
  }
  
  return cart;
};

// Remove item from local cart
export const removeFromLocalCart = (itemId: string): CartItem[] => {
  const cart = getLocalCart();
  const filteredCart = cart.filter(item => item._id !== itemId);
  saveLocalCart(filteredCart);
  return filteredCart;
};

// Clear local cart
export const clearLocalCart = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CART_KEY);
  }
};

// Calculate cart total
export const calculateCartTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Get cart item count
export const getCartItemCount = (cart: CartItem[]): number => {
  return cart.reduce((count, item) => {
    return count + item.quantity;
  }, 0);
};
