// Google Analytics 4 (GA4) Integration Utilities
import { GA4Events, GoogleAdsEvents, ProductData, CartItem, EcommerceItem, UserData } from '../types/analytics';

// Declare global gtag function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

class GoogleAnalytics {
  private measurementId: string;
  private googleAdsConversionId?: string;
  private isInitialized: boolean = false;
  private debug: boolean = false;

  constructor(measurementId: string, googleAdsConversionId?: string, debug: boolean = false) {
    this.measurementId = measurementId;
    this.googleAdsConversionId = googleAdsConversionId;
    this.debug = debug;
  }

  // Initialize Google Analytics 4
  init(): void {
    if (this.isInitialized || !this.measurementId || this.measurementId === 'your_ga4_measurement_id_here') {
      if (this.debug) {
      }
      return;
    }

    try {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      
      // Define gtag function
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Set initial configuration
      window.gtag('js', new Date());

      // Load GA4 script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // Configure GA4
      window.gtag('config', this.measurementId, {
        send_page_view: true,
        currency: 'INR',
        country: 'IN'
      });

      // Configure Google Ads if conversion ID is provided
      if (this.googleAdsConversionId) {
        window.gtag('config', this.googleAdsConversionId);
      }

      this.isInitialized = true;

      if (this.debug) {
        if (this.googleAdsConversionId) {
        }
      }
    } catch (error) {
      console.error('GA4: Initialization failed:', error);
    }
  }

  // Track page view
  trackPageView(data: GA4Events['page_view']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'page_view', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: page_view tracking failed:', error);
    }
  }

  // Track product view
  trackViewItem(data: GA4Events['view_item']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'view_item', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: view_item tracking failed:', error);
    }
  }

  // Track add to cart
  trackAddToCart(data: GA4Events['add_to_cart']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'add_to_cart', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: add_to_cart tracking failed:', error);
    }
  }

  // Track remove from cart
  trackRemoveFromCart(data: GA4Events['remove_from_cart']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'remove_from_cart', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: remove_from_cart tracking failed:', error);
    }
  }

  // Track view cart
  trackViewCart(data: GA4Events['view_cart']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'view_cart', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: view_cart tracking failed:', error);
    }
  }

  // Track begin checkout
  trackBeginCheckout(data: GA4Events['begin_checkout']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'begin_checkout', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: begin_checkout tracking failed:', error);
    }
  }

  // Track add shipping info
  trackAddShippingInfo(data: GA4Events['add_shipping_info']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'add_shipping_info', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: add_shipping_info tracking failed:', error);
    }
  }

  // Track add payment info
  trackAddPaymentInfo(data: GA4Events['add_payment_info']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'add_payment_info', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: add_payment_info tracking failed:', error);
    }
  }

  // Track purchase
  trackPurchase(data: GA4Events['purchase']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'purchase', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: purchase tracking failed:', error);
    }
  }

  // Track user registration
  trackSignUp(data: GA4Events['sign_up']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'sign_up', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: sign_up tracking failed:', error);
    }
  }

  // Track user login
  trackLogin(data: GA4Events['login']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'login', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: login tracking failed:', error);
    }
  }

  // Track search
  trackSearch(data: GA4Events['search']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'search', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: search tracking failed:', error);
    }
  }

  // Track custom events for design tool
  trackStartDesignTool(data: GA4Events['start_design_tool']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'start_design_tool', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: start_design_tool tracking failed:', error);
    }
  }

  trackCustomizeProduct(data: GA4Events['customize_product']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'customize_product', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: customize_product tracking failed:', error);
    }
  }

  trackSaveDesign(data: GA4Events['save_design']): void {
    if (!this.isReady()) return;

    try {
      window.gtag('event', 'save_design', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: save_design tracking failed:', error);
    }
  }

  // Google Ads Conversion Tracking
  trackGoogleAdsConversion(eventName: keyof GoogleAdsEvents, data: GoogleAdsEvents[keyof GoogleAdsEvents]): void {
    if (!this.isReady() || !this.googleAdsConversionId) return;

    try {
      window.gtag('event', 'conversion', data);
      
      if (this.debug) {
      }
    } catch (error) {
      console.error(`GA4: Google Ads ${eventName} conversion tracking failed:`, error);
    }
  }

  // Set user properties
  setUserProperties(userData: UserData): void {
    if (!this.isReady()) return;

    try {
      const userProperties: any = {};

      if (userData.customer_id) {
        userProperties.customer_id = userData.customer_id;
      }
      if (userData.customer_type) {
        userProperties.customer_type = userData.customer_type;
      }
      if (userData.city) {
        userProperties.city = userData.city;
      }
      if (userData.state) {
        userProperties.state = userData.state;
      }
      if (userData.country) {
        userProperties.country = userData.country;
      }

      if (Object.keys(userProperties).length > 0) {
        window.gtag('set', 'user_properties', userProperties);
        
        if (this.debug) {
        }
      }
    } catch (error) {
      console.error('GA4: Setting user properties failed:', error);
    }
  }

  // Set user ID for cross-device tracking
  setUserId(userId: string): void {
    if (!this.isReady()) return;

    try {
      window.gtag('config', this.measurementId, {
        user_id: userId
      });
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: Setting user ID failed:', error);
    }
  }

  // Clear user ID
  clearUserId(): void {
    if (!this.isReady()) return;

    try {
      window.gtag('config', this.measurementId, {
        user_id: null
      });
      
      if (this.debug) {
      }
    } catch (error) {
      console.error('GA4: Clearing user ID failed:', error);
    }
  }

  // Check if GA4 is ready
  private isReady(): boolean {
    if (!this.isInitialized) {
      if (this.debug) {
        console.warn('GA4: Not initialized');
      }
      return false;
    }
    
    if (!window.gtag) {
      if (this.debug) {
        console.warn('GA4: gtag function not available');
      }
      return false;
    }
    
    return true;
  }

  // Utility method to check if GA4 is loaded
  isLoaded(): boolean {
    return this.isInitialized && !!window.gtag;
  }

  // Get measurement ID
  getMeasurementId(): string {
    return this.measurementId;
  }

  // Get Google Ads conversion ID
  getGoogleAdsConversionId(): string | undefined {
    return this.googleAdsConversionId;
  }
}

// Utility functions for converting product data to GA4 format
export const convertToGA4Product = (product: any): EcommerceItem => {
  return {
    item_id: product._id || product.id || '',
    item_name: product.name || product.title || '',
    affiliation: 'Attars Fashion',
    currency: 'INR',
    item_brand: 'Attars',
    item_category: product.category || 'T-Shirt',
    item_category2: product.subcategory || '',
    item_variant: product.color || product.size || '',
    price: product.price || 0,
    quantity: product.quantity || 1,
    custom_design: !!(product.customization || product.isCustom),
    design_position: product.customization ? 
      (product.customization.frontDesign && product.customization.backDesign ? 'front_back' :
       product.customization.frontDesign ? 'front' :
       product.customization.backDesign ? 'back' : 'none') : 'none'
  };
};

export const convertToGA4CartItem = (cartItem: any): EcommerceItem => {
  return {
    item_id: cartItem._id || cartItem.product?._id || cartItem.id || '',
    item_name: cartItem.name || cartItem.product?.name || cartItem.title || '',
    affiliation: 'Attars Fashion',
    currency: 'INR',
    item_brand: 'Attars',
    item_category: cartItem.category || cartItem.product?.category || 'T-Shirt',
    item_category2: cartItem.subcategory || cartItem.product?.subcategory || '',
    item_variant: cartItem.color || cartItem.size || '',
    price: cartItem.price || cartItem.product?.price || 0,
    quantity: cartItem.quantity || cartItem.count || 1,
    custom_design: !!(cartItem.customization || cartItem.isCustom),
    design_position: cartItem.customization ? 
      (cartItem.customization.frontDesign && cartItem.customization.backDesign ? 'front_back' :
       cartItem.customization.frontDesign ? 'front' :
       cartItem.customization.backDesign ? 'back' : 'none') : 'none'
  };
};

export const convertToPurchaseData = (order: any): GA4Events['purchase'] => {
  const items = (order.products || []).map((product: any) => convertToGA4Product(product));
  
  return {
    transaction_id: order._id || order.id || '',
    value: order.amount || order.finalAmount || 0,
    currency: 'INR',
    tax: order.tax || 0,
    shipping: order.shipping?.shippingCost || 0,
    items: items,
    coupon: order.coupon?.code || '',
    affiliation: 'Attars Fashion'
  };
};

export const generateGoogleAdsConversionData = (
  conversionId: string,
  conversionLabel: string,
  value: number,
  transactionId?: string
): GoogleAdsEvents['purchase'] => {
  return {
    send_to: `${conversionId}/${conversionLabel}`,
    value: value,
    currency: 'INR',
    transaction_id: transactionId || ''
  };
};

// Export singleton instance
let ga4Instance: GoogleAnalytics | null = null;

export const initializeGA4 = (
  measurementId: string,
  googleAdsConversionId?: string,
  debug: boolean = false
): GoogleAnalytics => {
  if (!ga4Instance) {
    ga4Instance = new GoogleAnalytics(measurementId, googleAdsConversionId, debug);
    ga4Instance.init();
  }
  return ga4Instance;
};

export const getGA4 = (): GoogleAnalytics | null => {
  return ga4Instance;
};

export default GoogleAnalytics;
