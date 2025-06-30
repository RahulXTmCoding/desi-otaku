import { API } from "../../backend";

// Mock wishlist for dev mode
const mockWishlist = {
  products: [] as any[],
  addProduct(productId: string) {
    const exists = this.products.some(p => p.product._id === productId);
    if (!exists) {
      this.products.push({ 
        product: { _id: productId },
        addedAt: new Date()
      });
    }
  },
  removeProduct(productId: string) {
    this.products = this.products.filter(p => p.product._id !== productId);
  },
  hasProduct(productId: string) {
    return this.products.some(p => p.product._id === productId);
  },
  clear() {
    this.products = [];
  }
};

// Add to wishlist
export const addToWishlist = (userId: string, token: string, productId: string) => {
  // Check if in dev mode
  const isDevMode = localStorage.getItem("devMode") === "test";
  
  if (isDevMode) {
    mockWishlist.addProduct(productId);
    localStorage.setItem("mockWishlist", JSON.stringify(mockWishlist.products));
    return Promise.resolve({ 
      message: "Product added to wishlist",
      wishlist: mockWishlist
    });
  }

  return fetch(`${API}/wishlist/${userId}/add/${productId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Initialize mock wishlist from localStorage
const initMockWishlist = () => {
  const saved = localStorage.getItem("mockWishlist");
  if (saved) {
    try {
      mockWishlist.products = JSON.parse(saved);
    } catch (e) {
      mockWishlist.products = [];
    }
  }
};
initMockWishlist();

// Remove from wishlist
export const removeFromWishlist = (userId: string, token: string, productId: string) => {
  const isDevMode = localStorage.getItem("devMode") === "test";
  
  if (isDevMode) {
    mockWishlist.removeProduct(productId);
    localStorage.setItem("mockWishlist", JSON.stringify(mockWishlist.products));
    return Promise.resolve({ 
      message: "Product removed from wishlist",
      wishlist: mockWishlist
    });
  }

  return fetch(`${API}/wishlist/${userId}/remove/${productId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get wishlist
export const getWishlist = (userId: string, token: string) => {
  const isDevMode = localStorage.getItem("devMode") === "test";
  
  if (isDevMode) {
    // Get mock products data
    const mockProducts = JSON.parse(localStorage.getItem("mockProducts") || "[]");
    const wishlistProducts = mockWishlist.products.map(item => {
      const product = mockProducts.find((p: any) => p._id === item.product._id);
      return {
        ...item,
        product: product || item.product
      };
    });
    
    return Promise.resolve({
      products: wishlistProducts,
      user: userId
    });
  }

  return fetch(`${API}/wishlist/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Check if product is in wishlist
export const isInWishlist = (userId: string, token: string, productId: string) => {
  const isDevMode = localStorage.getItem("devMode") === "test";
  
  if (isDevMode) {
    return Promise.resolve({ 
      isInWishlist: mockWishlist.hasProduct(productId)
    });
  }

  return fetch(`${API}/wishlist/${userId}/check/${productId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get wishlist count
export const getWishlistCount = (userId: string, token: string) => {
  const isDevMode = localStorage.getItem("devMode") === "test";
  
  if (isDevMode) {
    return Promise.resolve({ 
      count: mockWishlist.products.length
    });
  }

  return fetch(`${API}/wishlist/${userId}/count`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Clear wishlist
export const clearWishlist = (userId: string, token: string) => {
  const isDevMode = localStorage.getItem("devMode") === "test";
  
  if (isDevMode) {
    mockWishlist.clear();
    localStorage.setItem("mockWishlist", JSON.stringify(mockWishlist.products));
    return Promise.resolve({ 
      message: "Wishlist cleared successfully"
    });
  }

  return fetch(`${API}/wishlist/${userId}/clear`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Move to cart
export const moveToCart = (userId: string, token: string, productId: string) => {
  return fetch(`${API}/wishlist/${userId}/move-to-cart/${productId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Helper to toggle wishlist (add if not present, remove if present)
export const toggleWishlist = async (userId: string, token: string, productId: string) => {
  try {
    const result = await isInWishlist(userId, token, productId);
    
    if (result.isInWishlist) {
      return await removeFromWishlist(userId, token, productId);
    } else {
      return await addToWishlist(userId, token, productId);
    }
  } catch (err) {
    console.log("Error toggling wishlist:", err);
    return { error: "Failed to update wishlist" };
  }
};
