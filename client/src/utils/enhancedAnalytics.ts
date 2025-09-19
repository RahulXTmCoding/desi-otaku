// Enhanced Analytics - Attribution-Rich Event Tracking
import { 
  EnhancedPageView, 
  EnhancedConversionData, 
  AttributionData,
  AttributedEvent 
} from '../types/attribution';
import { getAttributionManager } from './attribution';
import { getSessionTracker, trackAttributedEvent } from './sessionTracking';

class EnhancedAnalytics {
  private debug: boolean = false;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  // Create enhanced page view with attribution data
  createEnhancedPageView(pageData: {
    page_title?: string;
    page_location?: string;
    page_path?: string;
  }): EnhancedPageView {
    const attributionManager = getAttributionManager();
    const sessionTracker = getSessionTracker();
    const attribution = attributionManager?.getCurrentAttribution();
    
    const enhancedPageView: EnhancedPageView = {
      // Standard Page Data
      page_title: pageData.page_title || document.title,
      page_location: pageData.page_location || window.location.href,
      page_path: pageData.page_path || window.location.pathname,
      
      // Attribution Data
      utm_source: attribution?.utm_source,
      utm_medium: attribution?.utm_medium,
      utm_campaign: attribution?.utm_campaign,
      utm_term: attribution?.utm_term,
      utm_content: attribution?.utm_content,
      
      // Click IDs
      gclid: attribution?.gclid,
      fbclid: attribution?.fbclid,
      
      // Traffic Classification
      traffic_type: attribution?.traffic_type || 'direct',
      ad_platform: attribution?.ad_platform,
      
      // Session Data
      session_id: sessionTracker?.getCurrentSession()?.session_id || 'unknown',
      visit_number: attribution?.visit_count || 1,
      is_new_visitor: (attribution?.visit_count || 1) === 1,
      time_on_previous_page: sessionTracker?.getTimeOnCurrentPage(),
      
      // Attribution Context
      is_attributed_visit: attributionManager?.isAttributedTraffic() || false,
      attribution_source: attribution?.utm_source || attribution?.ad_platform,
      attribution_campaign: attribution?.utm_campaign
    };

    if (this.debug) {
    }

    return enhancedPageView;
  }

  // Create enhanced conversion data with attribution
  createEnhancedConversionData(conversionData: {
    transaction_id: string;
    value: number;
    currency: string;
    items: any[];
    conversion_type: 'purchase' | 'signup' | 'lead' | 'add_to_cart' | 'begin_checkout';
    customer_data?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      address?: any;
    };
  }): EnhancedConversionData {
    const attributionManager = getAttributionManager();
    const sessionTracker = getSessionTracker();
    const attribution = attributionManager?.getCurrentAttribution();
    const journey = sessionTracker?.getCustomerJourney();

    if (!attribution) {
      throw new Error('No attribution data available for conversion');
    }

    // Calculate days since attribution
    const daysSinceAttribution = attribution.first_visit_time 
      ? (Date.now() - attribution.first_visit_time) / (1000 * 60 * 60 * 24)
      : 0;

    // Get conversion path
    const conversionPath = sessionTracker?.getConversionPath() || [];

    // Calculate touchpoint count
    const touchpointCount = journey?.sessions.length || 1;

    // Determine attribution window type
    const attributionWindowType: 'click_through' | 'view_through' = 
      (attribution.gclid || attribution.fbclid || attribution.utm_source) ? 'click_through' : 'view_through';

    const enhancedConversion: EnhancedConversionData = {
      // Standard Conversion Data
      transaction_id: conversionData.transaction_id,
      value: conversionData.value,
      currency: conversionData.currency,
      items: conversionData.items,
      
      // Attribution Data
      attribution: attribution,
      customer_journey_id: journey?.anonymous_id || 'unknown',
      session_id: sessionTracker?.getCurrentSession()?.session_id || 'unknown',
      
      // Enhanced Conversion Data (hashed if customer data provided)
      ...(conversionData.customer_data && this.getHashedCustomerData(conversionData.customer_data)),
      
      // Attribution Context
      conversion_type: conversionData.conversion_type,
      attribution_window_type: attributionWindowType,
      days_since_attribution: Math.round(daysSinceAttribution),
      touchpoint_count: touchpointCount,
      conversion_path: conversionPath
    };

    if (this.debug) {
    }

    return enhancedConversion;
  }

  // Get hashed customer data for enhanced conversions
  private getHashedCustomerData(customerData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    address?: any;
  }): any {
    const attributionManager = getAttributionManager();
    
    if (!attributionManager) {
      return {};
    }

    const enhancedData = attributionManager.getEnhancedConversionData({
      email: customerData.email,
      phone: customerData.phone,
      firstName: customerData.firstName,
      lastName: customerData.lastName
    });

    // Add address data if available
    if (customerData.address) {
      enhancedData.customer_address = {
        first_name: customerData.firstName ? this.hashString(customerData.firstName.toLowerCase()) : undefined,
        last_name: customerData.lastName ? this.hashString(customerData.lastName.toLowerCase()) : undefined,
        street: customerData.address.street ? this.hashString(customerData.address.street.toLowerCase()) : undefined,
        city: customerData.address.city ? this.hashString(customerData.address.city.toLowerCase()) : undefined,
        region: customerData.address.state ? this.hashString(customerData.address.state.toLowerCase()) : undefined,
        postal_code: customerData.address.zipCode ? this.hashString(customerData.address.zipCode) : undefined,
        country: customerData.address.country ? this.hashString(customerData.address.country.toLowerCase()) : undefined
      };
    }

    return enhancedData;
  }

  // Simple hash function (should use SHA-256 in production)
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Track attributed page view
  trackAttributedPageView(pageData?: {
    page_title?: string;
    page_location?: string;
    page_path?: string;
  }): EnhancedPageView {
    const enhancedPageView = this.createEnhancedPageView(pageData || {});
    
    // Track in session
    const sessionTracker = getSessionTracker();
    if (sessionTracker) {
      sessionTracker.trackPageVisit({
        page_path: enhancedPageView.page_path,
        page_title: enhancedPageView.page_title,
        page_location: enhancedPageView.page_location
      });
    }

    // Track as attributed event
    trackAttributedEvent({
      event_name: 'page_view',
      event_data: enhancedPageView,
      value: 0
    });

    return enhancedPageView;
  }

  // Track attributed product view
  trackAttributedProductView(productData: {
    product_id: string;
    product_name: string;
    product_category?: string;
    product_price?: number;
    product_brand?: string;
  }): void {
    const attribution = getAttributionManager()?.getCurrentAttribution();
    
    const eventData = {
      ...productData,
      attribution_campaign: attribution?.utm_campaign,
      attribution_source: attribution?.utm_source || attribution?.ad_platform,
      traffic_type: attribution?.traffic_type,
      session_id: getSessionTracker()?.getCurrentSession()?.session_id
    };

    trackAttributedEvent({
      event_name: 'view_item',
      event_data: eventData,
      value: productData.product_price || 0
    });

    if (this.debug) {
    }
  }

  // Track attributed add to cart
  trackAttributedAddToCart(cartData: {
    product_id: string;
    product_name: string;
    product_category?: string;
    product_price: number;
    quantity: number;
    product_brand?: string;
  }): void {
    const attribution = getAttributionManager()?.getCurrentAttribution();
    const totalValue = cartData.product_price * cartData.quantity;
    
    const eventData = {
      ...cartData,
      total_value: totalValue,
      attribution_campaign: attribution?.utm_campaign,
      attribution_source: attribution?.utm_source || attribution?.ad_platform,
      traffic_type: attribution?.traffic_type,
      session_id: getSessionTracker()?.getCurrentSession()?.session_id
    };

    trackAttributedEvent({
      event_name: 'add_to_cart',
      event_data: eventData,
      value: totalValue
    });

    if (this.debug) {
    }
  }

  // Track attributed begin checkout
  trackAttributedBeginCheckout(checkoutData: {
    cart_items: any[];
    total_value: number;
    currency?: string;
    coupon?: string;
  }): void {
    const attribution = getAttributionManager()?.getCurrentAttribution();
    
    const eventData = {
      ...checkoutData,
      item_count: checkoutData.cart_items.length,
      attribution_campaign: attribution?.utm_campaign,
      attribution_source: attribution?.utm_source || attribution?.ad_platform,
      traffic_type: attribution?.traffic_type,
      session_id: getSessionTracker()?.getCurrentSession()?.session_id,
      conversion_path: getSessionTracker()?.getConversionPath()
    };

    trackAttributedEvent({
      event_name: 'begin_checkout',
      event_data: eventData,
      value: checkoutData.total_value
    });

    if (this.debug) {
    }
  }

  // Track attributed purchase with enhanced data
  trackAttributedPurchase(purchaseData: {
    transaction_id: string;
    total_value: number;
    currency: string;
    items: any[];
    customer_data?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      address?: any;
    };
    order_details?: any;
  }): EnhancedConversionData {
    const enhancedConversion = this.createEnhancedConversionData({
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.total_value,
      currency: purchaseData.currency,
      items: purchaseData.items,
      conversion_type: 'purchase',
      customer_data: purchaseData.customer_data
    });

    // Track as attributed event
    trackAttributedEvent({
      event_name: 'purchase',
      event_data: {
        ...enhancedConversion,
        order_details: purchaseData.order_details
      },
      value: purchaseData.total_value
    });

    if (this.debug) {
    }

    return enhancedConversion;
  }

  // Track attributed signup
  trackAttributedSignup(signupData: {
    method?: string;
    customer_data?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
    };
  }): void {
    const attribution = getAttributionManager()?.getCurrentAttribution();
    
    const eventData = {
      ...signupData,
      attribution_campaign: attribution?.utm_campaign,
      attribution_source: attribution?.utm_source || attribution?.ad_platform,
      traffic_type: attribution?.traffic_type,
      session_id: getSessionTracker()?.getCurrentSession()?.session_id,
      days_since_first_visit: attribution?.first_visit_time 
        ? Math.round((Date.now() - attribution.first_visit_time) / (1000 * 60 * 60 * 24))
        : 0
    };

    trackAttributedEvent({
      event_name: 'sign_up',
      event_data: eventData,
      value: 0
    });

    if (this.debug) {
    }
  }

  // Get attribution summary for current session
  getAttributionSummary(): any {
    const attributionManager = getAttributionManager();
    const sessionTracker = getSessionTracker();
    const attribution = attributionManager?.getCurrentAttribution();
    const journey = sessionTracker?.getCustomerJourney();

    return {
      attribution: attribution,
      journey_summary: {
        total_sessions: journey?.sessions.length || 0,
        total_conversions: journey?.total_conversions || 0,
        total_value: journey?.total_conversion_value || 0,
        journey_duration_days: journey?.journey_start 
          ? Math.round((Date.now() - journey.journey_start) / (1000 * 60 * 60 * 24))
          : 0
      },
      current_session: {
        session_id: sessionTracker?.getCurrentSession()?.session_id,
        pages_visited: sessionTracker?.getConversionPath().length || 0,
        time_spent: sessionTracker?.getTimeOnCurrentPage() || 0,
        has_converted: sessionTracker?.hasConverted() || false
      }
    };
  }

  // Get debug information
  getDebugInfo(): any {
    return {
      attribution_manager: getAttributionManager()?.getDebugInfo(),
      session_tracker: getSessionTracker()?.getDebugInfo(),
      attribution_summary: this.getAttributionSummary()
    };
  }
}

// Export singleton instance
let enhancedAnalytics: EnhancedAnalytics | null = null;

export const initializeEnhancedAnalytics = (debug: boolean = false): EnhancedAnalytics => {
  if (!enhancedAnalytics) {
    enhancedAnalytics = new EnhancedAnalytics(debug);
  }
  return enhancedAnalytics;
};

export const getEnhancedAnalytics = (): EnhancedAnalytics | null => {
  return enhancedAnalytics;
};

// Utility functions for easy access
export const trackEnhancedPageView = (pageData?: {
  page_title?: string;
  page_location?: string;
  page_path?: string;
}): EnhancedPageView | null => {
  const analytics = getEnhancedAnalytics();
  return analytics ? analytics.trackAttributedPageView(pageData) : null;
};

export const trackEnhancedProductView = (productData: {
  product_id: string;
  product_name: string;
  product_category?: string;
  product_price?: number;
  product_brand?: string;
}): void => {
  const analytics = getEnhancedAnalytics();
  if (analytics) {
    analytics.trackAttributedProductView(productData);
  }
};

export const trackEnhancedAddToCart = (cartData: {
  product_id: string;
  product_name: string;
  product_category?: string;
  product_price: number;
  quantity: number;
  product_brand?: string;
}): void => {
  const analytics = getEnhancedAnalytics();
  if (analytics) {
    analytics.trackAttributedAddToCart(cartData);
  }
};

export const trackEnhancedBeginCheckout = (checkoutData: {
  cart_items: any[];
  total_value: number;
  currency?: string;
  coupon?: string;
}): void => {
  const analytics = getEnhancedAnalytics();
  if (analytics) {
    analytics.trackAttributedBeginCheckout(checkoutData);
  }
};

export const trackEnhancedPurchase = (purchaseData: {
  transaction_id: string;
  total_value: number;
  currency: string;
  items: any[];
  customer_data?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    address?: any;
  };
  order_details?: any;
}): EnhancedConversionData | null => {
  const analytics = getEnhancedAnalytics();
  return analytics ? analytics.trackAttributedPurchase(purchaseData) : null;
};

export const trackEnhancedSignup = (signupData: {
  method?: string;
  customer_data?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}): void => {
  const analytics = getEnhancedAnalytics();
  if (analytics) {
    analytics.trackAttributedSignup(signupData);
  }
};

export const getAttributionSummary = (): any => {
  const analytics = getEnhancedAnalytics();
  return analytics ? analytics.getAttributionSummary() : null;
};

export default EnhancedAnalytics;
