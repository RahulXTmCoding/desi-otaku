import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAutheticated } from '../auth/helper';
import { useAnalytics } from './AnalyticsContext';
import {
  CartItem,
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearUserCart,
  mergeGuestCart,
  syncUserCart,
  getLocalCart,
  addToLocalCart,
  updateLocalCartItem,
  removeFromLocalCart,
  clearLocalCart,
  calculateCartTotal,
  getCartItemCount
} from '../core/helper/cartHelper';
import { 
  validateCartItemQuantity
} from '../utils/inventoryUtils';
import { API } from '../backend';

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (item: Omit<CartItem, '_id' | 'quantity'> & { quantity?: number; category?: string }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  syncCart: () => Promise<void>;
  getAOVDiscount: () => { discount: number; percentage: number; nextTier?: { quantity: number; discount: number } };
  getShippingProgress: () => { current: number; needed: number; percentage: number };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analytics = useAnalytics();

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Load cart based on auth status
  const loadCart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authData = isAutheticated();
      
      if (authData && authData.user && authData.token) {
        // User is logged in, fetch from backend
        const response = await getUserCart(authData.user._id, authData.token);
        
        if (response.success && response.cart) {
          setCart(response.cart.items || []);
          
          // Check if there's a local cart to merge
          const localCart = getLocalCart();
          if (localCart.length > 0) {
            // Merge local cart with user cart
            await mergeGuestCart(authData.user._id, authData.token, localCart);
            // Clear local cart after merging
            clearLocalCart();
            // Reload cart after merge
            const mergedResponse = await getUserCart(authData.user._id, authData.token);
            if (mergedResponse.success && mergedResponse.cart) {
              setCart(mergedResponse.cart.items || []);
            }
          }
        }
      } else {
        // User is not logged in, use local storage
        const localCart = getLocalCart();
        setCart(localCart);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Failed to load cart');
      // Fallback to local cart
      setCart(getLocalCart());
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (item: Omit<CartItem, '_id' | 'quantity'> & { quantity?: number; category?: string }) => {
    setError(null);
    
    try {
      const requestedQuantity = item.quantity || 1;
      
      // Skip inventory validation for custom products
      if (!item.isCustom && item.size) {
        // Fetch fresh product data to validate inventory
        try {
          const productResponse = await fetch(`${API}/product/${item.product}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            
            // Validate inventory availability
            const validation = validateCartItemQuantity(
              productData,
              item.size,
              requestedQuantity,
              cart
            );
            
            if (!validation.isValid) {
              throw new Error(validation.message || 'Insufficient stock available');
            }
          }
        } catch (inventoryError: any) {
          // If inventory check fails, throw the error
          throw new Error(inventoryError.message || 'Unable to verify product availability');
        }
      }
      
      const authData = isAutheticated();
      
      if (authData && authData.user && authData.token) {
        // User is logged in, add to backend
        const response = await addItemToCart(
          authData.user._id,
          authData.token,
          {
            productId: item.product,
            photoUrl: item.photoUrl,
            size: item.size,
            color: item.color,
            quantity: requestedQuantity,
            isCustom: item.isCustom,
            customization: item.customization,
            price: item.price,
            name: item.name
          }
        );
        
        if (response.success && response.cart) {
          setCart(response.cart.items || []);
          
          // Track add to cart event
          analytics.trackAddToCart({
            _id: item.product,
            name: item.name,
            price: item.price,
            category: item.category || 'T-Shirt'
          }, requestedQuantity);
        } else {
          throw new Error(response.error || 'Failed to add item to cart');
        }
      } else {
        // User is not logged in, add to local storage
        const updatedCart = addToLocalCart({
          ...item,
          quantity: requestedQuantity
        } as CartItem);
        setCart(updatedCart);
        
        // Track add to cart event
        analytics.trackAddToCart({
          _id: item.product,
          name: item.name,
          price: item.price,
          category: item.category || 'T-Shirt'
        }, requestedQuantity);
      }
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.message || 'Failed to add item to cart');
      throw err;
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    setError(null);
    
    if (quantity < 1) return;
    
    try {
      // Find the cart item to validate
      const cartItem = cart.find(item => item._id === itemId);
      if (!cartItem) {
        throw new Error('Cart item not found');
      }
      
      // Skip inventory validation for custom products
      if (!cartItem.isCustom && cartItem.size && cartItem.product) {
        // Fetch fresh product data to validate inventory
        try {
          const productId = cartItem.product && typeof cartItem.product === 'object' 
            ? cartItem.product._id 
            : (cartItem.product || null);
          if (!productId) {
            throw new Error('Product ID not found in cart item');
          }
          const productResponse = await fetch(`${API}/product/${productId}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            
            // Validate inventory availability (excluding current item from cart count)
            const validation = validateCartItemQuantity(
              productData,
              cartItem.size,
              quantity,
              cart,
              itemId // Exclude this item from current cart quantity calculation
            );
            
            if (!validation.isValid) {
              throw new Error(validation.message || 'Insufficient stock available');
            }
          }
        } catch (inventoryError: any) {
          // If inventory check fails, throw the error
          throw new Error(inventoryError.message || 'Unable to verify product availability');
        }
      }
      
      const authData = isAutheticated();
      
      if (authData && authData.user && authData.token) {
        // User is logged in, update on backend
        const response = await updateCartItemQuantity(
          authData.user._id,
          authData.token,
          itemId,
          quantity
        );
        
        if (response.success && response.cart) {
          setCart(response.cart.items || []);
        } else {
          throw new Error(response.error || 'Failed to update cart');
        }
      } else {
        // User is not logged in, update local storage
        const updatedCart = updateLocalCartItem(itemId, quantity);
        setCart(updatedCart);
      }
    } catch (err: any) {
      console.error('Error updating cart:', err);
      setError(err.message || 'Failed to update cart');
      throw err; // Re-throw to allow UI components to handle the error
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    setError(null);
    
    try {
      const authData = isAutheticated();
      
      if (authData && authData.user && authData.token) {
        // User is logged in, remove from backend
        const response = await removeItemFromCart(
          authData.user._id,
          authData.token,
          itemId
        );
        
        if (response.success && response.cart) {
          setCart(response.cart.items || []);
        } else {
          throw new Error(response.error || 'Failed to remove item from cart');
        }
      } else {
        // User is not logged in, remove from local storage
        const updatedCart = removeFromLocalCart(itemId);
        setCart(updatedCart);
      }
    } catch (err: any) {
      console.error('Error removing from cart:', err);
      setError(err.message || 'Failed to remove item from cart');
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setError(null);
    
    try {
      const authData = isAutheticated();
      
      if (authData && authData.user && authData.token) {
        // User is logged in, clear on backend
        const response = await clearUserCart(authData.user._id, authData.token);
        
        if (response.success) {
          setCart([]);
        } else {
          throw new Error(response.error || 'Failed to clear cart');
        }
      } else {
        // User is not logged in, clear local storage
        clearLocalCart();
        setCart([]);
      }
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      setError(err.message || 'Failed to clear cart');
    }
  };

  // Sync cart (useful after login/logout)
  const syncCart = async () => {
    await loadCart();
  };

  // Calculate total
  const getTotal = () => {
    return calculateCartTotal(cart);
  };

  // Get item count
  const getItemCount = () => {
    return getCartItemCount(cart);
  };

  // Calculate AOV discount based on backend configuration
  const getAOVDiscount = () => {
    const itemCount = getItemCount();
    const total = getTotal();
    
    // Get AOV tiers from global window object (loaded at app start)
    const aovTiers = (window as any).aovQuantityTiers || [];
    
    if (!aovTiers.length) {
      // Fallback to default tiers if backend config not available
      if (itemCount >= 5) {
        return { 
          discount: Math.round(total * 0.20), 
          percentage: 20 
        };
      }
      if (itemCount >= 3) {
        return { 
          discount: Math.round(total * 0.10), 
          percentage: 10,
          nextTier: { quantity: 5, discount: 20 }
        };
      }
      
      return { 
        discount: 0, 
        percentage: 0, 
        nextTier: { quantity: 3, discount: 10 }
      };
    }
    
    // Sort tiers by quantity ascending
    const sortedTiers = [...aovTiers].sort((a, b) => a.quantity - b.quantity);
    
    let currentTier = null;
    let nextTier = null;
    
    // Find current applicable tier
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (itemCount >= sortedTiers[i].quantity) {
        currentTier = sortedTiers[i];
        break;
      }
    }
    
    // Find next tier
    for (const tier of sortedTiers) {
      if (tier.quantity > itemCount) {
        nextTier = tier;
        break;
      }
    }
    
    if (currentTier) {
      return {
        discount: Math.round((total * currentTier.discount) / 100),
        percentage: currentTier.discount,
        nextTier: nextTier ? { quantity: nextTier.quantity, discount: nextTier.discount } : undefined
      };
    }
    
    return {
      discount: 0,
      percentage: 0,
      nextTier: nextTier ? { quantity: nextTier.quantity, discount: nextTier.discount } : undefined
    };
  };

  // Calculate shipping progress towards free shipping
  const getShippingProgress = () => {
    const total = getTotal();
    const freeShippingThreshold = 1000; // ₹1000 for free shipping
    
    return {
      current: total,
      needed: Math.max(0, freeShippingThreshold - total),
      percentage: Math.min(100, (total / freeShippingThreshold) * 100)
    };
  };

  const value: CartContextType = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotal,
    getItemCount,
    syncCart,
    getAOVDiscount,
    getShippingProgress
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
