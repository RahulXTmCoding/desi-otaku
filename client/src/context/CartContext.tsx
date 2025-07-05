import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAutheticated } from '../auth/helper';
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

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (item: Omit<CartItem, '_id' | 'quantity'> & { quantity?: number }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  syncCart: () => Promise<void>;
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
  const addToCart = async (item: Omit<CartItem, '_id' | 'quantity'> & { quantity?: number }) => {
    setError(null);
    
    try {
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
            quantity: item.quantity || 1,
            isCustom: item.isCustom,
            customization: item.customization,
            price: item.price,
            name: item.name
          }
        );
        
        if (response.success && response.cart) {
          setCart(response.cart.items || []);
        } else {
          throw new Error(response.error || 'Failed to add item to cart');
        }
      } else {
        // User is not logged in, add to local storage
        const updatedCart = addToLocalCart({
          ...item,
          quantity: item.quantity || 1
        } as CartItem);
        setCart(updatedCart);
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
    syncCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
