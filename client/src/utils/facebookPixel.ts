// Meta Pixel (Facebook Pixel) Integration Utilities
import { MetaPixelEvents, ProductData, CartItem, PurchaseData, UserData } from '../types/analytics';

// Declare global fbq function
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

class MetaPixel {
  private pixelId: string;
  private isInitialized: boolean = false;
  private debug: boolean = false;

  constructor(pixelId: string, debug: boolean = false) {
    this.pixelId = pixelId;
    this.debug = debug;
  }

  // Initialize Meta Pixel
  init(): void {
    if (this.isInitialized || !this.pixelId || this.pixelId === 'your_meta_pixel_id_here') {
      if (this.debug) {
        console.log('Meta Pixel: Skipping initialization - already initialized or invalid pixel ID');
      }
      return;
    }

    try {
      // Facebook Pixel Code
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      // Initialize the pixel
      window.fbq('init', this.pixelId);
      
      // Track initial page view
      window.fbq('track', 'PageView');

      this.isInitialized = true;

      if (this.debug) {
        console.log('Meta Pixel: Initialized successfully with ID:', this.pixelId);
      }
    } catch (error) {
      console.error('Meta Pixel: Initialization failed:', error);
    }
  }

  // Track page view
  trackPageView(): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'PageView');
      
      if (this.debug) {
        console.log('Meta Pixel: PageView tracked');
      }
    } catch (error) {
      console.error('Meta Pixel: PageView tracking failed:', error);
    }
  }

  // Track product view
  trackViewContent(data: MetaPixelEvents['ViewContent']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'ViewContent', data);
      
      if (this.debug) {
        console.log('Meta Pixel: ViewContent tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: ViewContent tracking failed:', error);
    }
  }

  // Track add to cart
  trackAddToCart(data: MetaPixelEvents['AddToCart']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'AddToCart', data);
      
      if (this.debug) {
        console.log('Meta Pixel: AddToCart tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: AddToCart tracking failed:', error);
    }
  }

  // Track remove from cart
  trackRemoveFromCart(data: MetaPixelEvents['RemoveFromCart']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'RemoveFromCart', data);
      
      if (this.debug) {
        console.log('Meta Pixel: RemoveFromCart tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: RemoveFromCart tracking failed:', error);
    }
  }

  // Track checkout initiation
  trackInitiateCheckout(data: MetaPixelEvents['InitiateCheckout']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'InitiateCheckout', data);
      
      if (this.debug) {
        console.log('Meta Pixel: InitiateCheckout tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: InitiateCheckout tracking failed:', error);
    }
  }

  // Track purchase
  trackPurchase(data: MetaPixelEvents['Purchase']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'Purchase', data);
      
      if (this.debug) {
        console.log('Meta Pixel: Purchase tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: Purchase tracking failed:', error);
    }
  }

  // Track user registration
  trackCompleteRegistration(data: MetaPixelEvents['CompleteRegistration']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'CompleteRegistration', data);
      
      if (this.debug) {
        console.log('Meta Pixel: CompleteRegistration tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: CompleteRegistration tracking failed:', error);
    }
  }

  // Track search
  trackSearch(data: MetaPixelEvents['Search']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'Search', data);
      
      if (this.debug) {
        console.log('Meta Pixel: Search tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: Search tracking failed:', error);
    }
  }

  // Track contact
  trackContact(data: MetaPixelEvents['Contact']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('track', 'Contact', data);
      
      if (this.debug) {
        console.log('Meta Pixel: Contact tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: Contact tracking failed:', error);
    }
  }

  // Track custom events for design tool
  trackCustomizeProduct(data: MetaPixelEvents['CustomizeProduct']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('trackCustom', 'CustomizeProduct', data);
      
      if (this.debug) {
        console.log('Meta Pixel: CustomizeProduct tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: CustomizeProduct tracking failed:', error);
    }
  }

  trackStartDesignTool(data: MetaPixelEvents['StartDesignTool']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('trackCustom', 'StartDesignTool', data);
      
      if (this.debug) {
        console.log('Meta Pixel: StartDesignTool tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: StartDesignTool tracking failed:', error);
    }
  }

  trackSaveDesign(data: MetaPixelEvents['SaveDesign']): void {
    if (!this.isReady()) return;

    try {
      window.fbq('trackCustom', 'SaveDesign', data);
      
      if (this.debug) {
        console.log('Meta Pixel: SaveDesign tracked:', data);
      }
    } catch (error) {
      console.error('Meta Pixel: SaveDesign tracking failed:', error);
    }
  }

  // Set user data for advanced matching
  setUserData(userData: UserData): void {
    if (!this.isReady()) return;

    try {
      const advancedMatchingData: any = {};

      if (userData.email) {
        advancedMatchingData.em = userData.email;
      }
      if (userData.phone) {
        advancedMatchingData.ph = userData.phone;
      }
      if (userData.first_name) {
        advancedMatchingData.fn = userData.first_name;
      }
      if (userData.last_name) {
        advancedMatchingData.ln = userData.last_name;
      }
      if (userData.city) {
        advancedMatchingData.ct = userData.city;
      }
      if (userData.state) {
        advancedMatchingData.st = userData.state;
      }
      if (userData.zip_code) {
        advancedMatchingData.zp = userData.zip_code;
      }
      if (userData.country) {
        advancedMatchingData.country = userData.country;
      }

      if (Object.keys(advancedMatchingData).length > 0) {
        window.fbq('setUserData', advancedMatchingData);
        
        if (this.debug) {
          console.log('Meta Pixel: User data set for advanced matching:', advancedMatchingData);
        }
      }
    } catch (error) {
      console.error('Meta Pixel: Setting user data failed:', error);
    }
  }

  // Clear user data
  clearUserData(): void {
    if (!this.isReady()) return;

    try {
      window.fbq('setUserData', {});
      
      if (this.debug) {
        console.log('Meta Pixel: User data cleared');
      }
    } catch (error) {
      console.error('Meta Pixel: Clearing user data failed:', error);
    }
  }

  // Check if pixel is ready
  private isReady(): boolean {
    if (!this.isInitialized) {
      if (this.debug) {
        console.warn('Meta Pixel: Not initialized');
      }
      return false;
    }
    
    if (!window.fbq) {
      if (this.debug) {
        console.warn('Meta Pixel: fbq function not available');
      }
      return false;
    }
    
    return true;
  }

  // Utility method to check if pixel is loaded
  isLoaded(): boolean {
    return this.isInitialized && !!window.fbq;
  }

  // Get pixel ID
  getPixelId(): string {
    return this.pixelId;
  }
}

// Utility functions for converting product data
export const convertToMetaPixelProduct = (product: any): ProductData => {
  return {
    content_id: product._id || product.id || '',
    content_name: product.name || product.title || '',
    content_category: product.category || 'T-Shirt',
    value: product.price || 0,
    currency: 'INR',
    quantity: product.quantity || 1,
    item_brand: 'Attars',
    item_category: product.category || 'T-Shirt',
    item_category2: product.subcategory || '',
    item_id: product._id || product.id || '',
    item_name: product.name || product.title || '',
    price: product.price || 0,
    custom_design: !!(product.customization || product.isCustom),
    design_type: product.customization ? 
      (product.customization.frontDesign && product.customization.backDesign ? 'both' :
       product.customization.frontDesign ? 'front' :
       product.customization.backDesign ? 'back' : 'none') : 'none'
  };
};

export const convertToMetaPixelCartItem = (cartItem: any): CartItem => {
  return {
    content_id: cartItem._id || cartItem.product?._id || cartItem.id || '',
    content_name: cartItem.name || cartItem.product?.name || cartItem.title || '',
    content_category: cartItem.category || cartItem.product?.category || 'T-Shirt',
    quantity: cartItem.quantity || cartItem.count || 1,
    value: (cartItem.price || cartItem.product?.price || 0) * (cartItem.quantity || cartItem.count || 1),
    currency: 'INR',
    custom_design: !!(cartItem.customization || cartItem.isCustom),
    design_type: cartItem.customization ? 
      (cartItem.customization.frontDesign && cartItem.customization.backDesign ? 'both' :
       cartItem.customization.frontDesign ? 'front' :
       cartItem.customization.backDesign ? 'back' : 'none') : 'none'
  };
};

export const convertToPurchaseData = (order: any): PurchaseData => {
  const products = (order.products || []).map((product: any) => convertToMetaPixelProduct(product));
  
  return {
    content_ids: products.map(p => p.content_id),
    content_type: 'product',
    contents: products,
    currency: 'INR',
    value: order.amount || order.finalAmount || 0,
    transaction_id: order._id || order.id || '',
    affiliation: 'Attars Fashion',
    tax: order.tax || 0,
    shipping: order.shipping?.shippingCost || 0,
    coupon: order.coupon?.code || '',
    payment_method: order.paymentMethod || 'unknown',
    customer_type: order.user ? 'registered' : 'guest',
    order_id: order._id || order.id || '',
    discount_amount: order.discount || 0,
    reward_points_used: order.rewardPointsRedeemed || 0
  };
};

// Export singleton instance
let metaPixelInstance: MetaPixel | null = null;

export const initializeMetaPixel = (pixelId: string, debug: boolean = false): MetaPixel => {
  if (!metaPixelInstance) {
    metaPixelInstance = new MetaPixel(pixelId, debug);
    metaPixelInstance.init();
  }
  return metaPixelInstance;
};

export const getMetaPixel = (): MetaPixel | null => {
  return metaPixelInstance;
};

export default MetaPixel;
