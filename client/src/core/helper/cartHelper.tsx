export const addItemToCart = (item, next) => {
  let cart = [];
  if (typeof window !== undefined) {
    if (localStorage.getItem("cart")) {
      cart = JSON.parse(localStorage.getItem("cart"));
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem._id === item._id
    );
    
    if (existingItemIndex > -1) {
      // If item exists, increase quantity
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + (item.quantity || 1);
    } else {
      // If new item, add to cart
      cart.push({
        ...item,
        quantity: item.quantity || 1
      });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Trigger cart update event for animation
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Play sound effect
    playCartSound();
    
    next();
  }
};

// Play a success sound when item is added to cart
const playCartSound = () => {
  // Create an audio context for a simple beep sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.log('Audio playback failed:', error);
  }
};

export const loadCart = () => {
  if (typeof window !== undefined) {
    if (localStorage.getItem("cart")) {
      try {
        return JSON.parse(localStorage.getItem("cart")) || [];
      } catch (error) {
        console.error("Error parsing cart data:", error);
        return [];
      }
    }
  }
  return [];
};

export const removeItemFromCart = (productId, next) => {
  let cart = [];
  if (typeof window !== undefined) {
    if (localStorage.getItem("cart")) {
      cart = JSON.parse(localStorage.getItem("cart"));
    }
    cart.map((product, i) => {
      if (product._id === productId) {
        cart.splice(i, 1);
      }
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'));
    
    if (next) {
      next();
    }
  }
  return cart;
};

export const updateCartItemQuantity = (productId, newQuantity, next) => {
  let cart = [];
  if (typeof window !== undefined) {
    if (localStorage.getItem("cart")) {
      cart = JSON.parse(localStorage.getItem("cart"));
    }
    
    cart = cart.map((product) => {
      if (product._id === productId) {
        return {
          ...product,
          quantity: newQuantity
        };
      }
      return product;
    });
    
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cartUpdated'));
    
    if (next) {
      next();
    }
  }
  return cart;
};

export const cartEmpty = next => {
  if (typeof window !== undefined) {
    localStorage.removeItem("cart");
    let cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    next();
  }
};
