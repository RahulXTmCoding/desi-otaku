// Google Analytics 4 (GA4) Integration

// Replace with your actual GA4 Measurement ID
export const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Update this!

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }
};

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// E-commerce specific event tracking
export const trackEcommerce = {
  // View item (product page view)
  viewItem: (product: any) => {
    trackEvent('view_item', {
      currency: 'INR',
      value: product.price,
      items: [{
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || 'Uncategorized',
        item_category2: product.productType || '',
        item_brand: 'Attars Clothing',
        price: product.price,
        quantity: 1
      }]
    });
  },

  // View item list (category/shop page)
  viewItemList: (products: any[], listName: string) => {
    trackEvent('view_item_list', {
      item_list_name: listName,
      items: products.map((product, index) => ({
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || 'Uncategorized',
        item_brand: 'Attars Clothing',
        price: product.price,
        index: index
      }))
    });
  },

  // Add to cart
  addToCart: (product: any, quantity: number = 1) => {
    trackEvent('add_to_cart', {
      currency: 'INR',
      value: product.price * quantity,
      items: [{
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || 'Uncategorized',
        item_brand: 'Attars Clothing',
        price: product.price,
        quantity: quantity
      }]
    });
  },

  // Remove from cart
  removeFromCart: (product: any, quantity: number = 1) => {
    trackEvent('remove_from_cart', {
      currency: 'INR',
      value: product.price * quantity,
      items: [{
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || 'Uncategorized',
        item_brand: 'Attars Clothing',
        price: product.price,
        quantity: quantity
      }]
    });
  },

  // Begin checkout
  beginCheckout: (cartItems: any[], total: number) => {
    trackEvent('begin_checkout', {
      currency: 'INR',
      value: total,
      items: cartItems.map(item => ({
        item_id: item.product?._id || item._id,
        item_name: item.product?.name || item.name,
        item_category: item.product?.category?.name || 'Custom',
        item_brand: 'Attars Clothing',
        price: item.price,
        quantity: item.quantity
      }))
    });
  },

  // Purchase
  purchase: (order: any) => {
    trackEvent('purchase', {
      transaction_id: order._id,
      value: order.amount,
      currency: 'INR',
      shipping: order.shippingFee || 0,
      items: order.products.map((item: any) => ({
        item_id: item.product?._id || item._id,
        item_name: item.product?.name || item.name,
        item_category: item.product?.category?.name || 'Custom',
        item_brand: 'Attars Clothing',
        price: item.price,
        quantity: item.count || item.quantity
      }))
    });
  },

  // Search
  search: (searchTerm: string) => {
    trackEvent('search', {
      search_term: searchTerm
    });
  },

  // View cart
  viewCart: (cartItems: any[], total: number) => {
    trackEvent('view_cart', {
      currency: 'INR',
      value: total,
      items: cartItems.map(item => ({
        item_id: item.product?._id || item._id,
        item_name: item.product?.name || item.name,
        item_category: item.product?.category?.name || 'Custom',
        item_brand: 'Attars Clothing',
        price: item.price,
        quantity: item.quantity
      }))
    });
  },

  // Add to wishlist
  addToWishlist: (product: any) => {
    trackEvent('add_to_wishlist', {
      currency: 'INR',
      value: product.price,
      items: [{
        item_id: product._id,
        item_name: product.name,
        item_category: product.category?.name || 'Uncategorized',
        item_brand: 'Attars Clothing',
        price: product.price
      }]
    });
  }
};

// User engagement events
export const trackUserEngagement = {
  // Sign up
  signUp: (method: string = 'email') => {
    trackEvent('sign_up', {
      method: method
    });
  },

  // Login
  login: (method: string = 'email') => {
    trackEvent('login', {
      method: method
    });
  },

  // Share
  share: (contentType: string, itemId: string, method: string) => {
    trackEvent('share', {
      content_type: contentType,
      item_id: itemId,
      method: method
    });
  }
};

// Custom design events
export const trackCustomDesign = {
  // Start design
  startDesign: () => {
    trackEvent('custom_design_start');
  },

  // Save design
  saveDesign: (designId: string) => {
    trackEvent('custom_design_save', {
      design_id: designId
    });
  },

  // Complete design
  completeDesign: (designId: string, price: number) => {
    trackEvent('custom_design_complete', {
      design_id: designId,
      value: price,
      currency: 'INR'
    });
  }
};

// Declare gtag on window object for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
