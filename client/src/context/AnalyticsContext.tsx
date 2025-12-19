// Analytics Context - Centralized analytics management with comprehensive attribution tracking
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeMetaPixel, getMetaPixel } from '../utils/facebookPixel';
import { initializeGA4, getGA4, generateGoogleAdsConversionData } from '../utils/googleAnalytics';
import { 
  initializeAttribution,
  getAttributionManager
} from '../utils/attribution';
import { 
  initializeSessionTracking,
  getSessionTracker
} from '../utils/sessionTracking';
import { 
  initializeEnhancedAnalytics,
  getEnhancedAnalytics,
  trackEnhancedPageView,
  trackEnhancedProductView,
  trackEnhancedAddToCart,
  trackEnhancedBeginCheckout,
  trackEnhancedPurchase,
  trackEnhancedSignup 
} from '../utils/enhancedAnalytics';
import { 
  AnalyticsConfig, 
  ProductData, 
  CartItem, 
  PurchaseData, 
  UserData,
  MetaPixelEvents,
  GA4Events 
} from '../types/analytics';
import { 
  AttributionData, 
  EnhancedPageView, 
  EnhancedConversionData,
  SessionData,
  CustomerJourney 
} from '../types/attribution';

interface AnalyticsContextType {
  isInitialized: boolean;
  config: AnalyticsConfig;
  
  // Tracking methods
  trackPageView: (pagePath?: string, pageTitle?: string) => void;
  trackProductView: (product: any) => void;
  trackAddToCart: (product: any, quantity?: number) => void;
  trackRemoveFromCart: (product: any, quantity?: number) => void;
  trackViewCart: (cartItems: any[]) => void;
  trackBeginCheckout: (cartItems: any[], coupon?: string) => void;
  trackAddShippingInfo: (cartItems: any[], shippingTier: string) => void;
  trackAddPaymentInfo: (cartItems: any[], paymentType: string) => void;
  trackPurchase: (order: any) => void;
  trackSignUp: (method?: string) => void;
  trackLogin: (method?: string) => void;
  trackSearch: (searchTerm: string) => void;
  
  // Custom design tool events
  trackStartDesignTool: (productId?: string, sourcePage?: string) => void;
  trackCustomizeProduct: (productId: string, designPosition: string, designType: string) => void;
  trackSaveDesign: (productId: string, designComplexity: string, timeSpent: number) => void;
  
  // NEW Standard events
  trackAddToWishlist: (product: any) => void;
  trackLead: (leadType: string, value?: number) => void;
  trackSubscribe: (subscriptionType: string, value?: number, predictedLtv?: number) => void;
  
  // User management
  setUser: (userData: UserData) => void;
  clearUser: () => void;
  
  // Utility methods
  isLoaded: () => boolean;
  getDebugInfo: () => any;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // Get configuration from environment variables
  const config: AnalyticsConfig = {
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
    ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID,
    googleAdsConversionId: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID,
    googleAdsPurchaseLabel: import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL,
    googleAdsSignupLabel: import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL,
    // Enable analytics by default if env var is not set (for production deployments)
    enabled: import.meta.env.VITE_ANALYTICS_ENABLED !== 'false',
    // Enable debug by default (disable by setting VITE_ANALYTICS_DEBUG=false)
    debug: import.meta.env.VITE_ANALYTICS_DEBUG !== 'false',
    testMode: import.meta.env.DEV
  };

  // Expose config to window immediately for debugging
  (window as any).analyticsConfig = config;
  
  // Log analytics config on load
  console.log('📊 Analytics Config:', {
    enabled: config.enabled,
    debug: config.debug,
    metaPixelId: config.metaPixelId,
    ga4MeasurementId: config.ga4MeasurementId,
    envVar: import.meta.env.VITE_ANALYTICS_ENABLED
  });
  console.log('💡 Tip: Run window.analyticsConfig in console to check config anytime');

  // Initialize analytics on mount
  useEffect(() => {
    if (!config.enabled) {
      if (config.debug) {
        console.log('Analytics: Disabled via configuration');
      }
      return;
    }

    try {
      // Check if HTML analytics are already loaded
      const htmlAnalyticsLoaded = !!(window as any).htmlAnalyticsLoaded;
      const metaPixelLoaded = !!(window as any).fbq;
      const gaLoaded = !!(window as any).gtag;

      if (config.debug) {
        console.log('Analytics: Initialization status check', {
          htmlAnalyticsLoaded,
          metaPixelLoaded,
          gaLoaded,
          configEnabled: config.enabled
        });
      }

      // Initialize Meta Pixel wrapper (works whether loaded via HTML or React)
      if (config.metaPixelId && config.metaPixelId !== 'your_meta_pixel_id_here') {
        if (metaPixelLoaded && config.debug) {
          console.log('Analytics: Meta Pixel already loaded via HTML, creating wrapper instance');
        }
        initializeMetaPixel(config.metaPixelId, config.debug);
        if (config.debug) {
          console.log('Analytics: Meta Pixel wrapper initialized', { 
            loadedViaHTML: metaPixelLoaded,
            instance: getMetaPixel()
          });
        }
      }

      // Only initialize Google Analytics if not already loaded via HTML
      if (!gaLoaded && config.ga4MeasurementId && config.ga4MeasurementId !== 'your_ga4_measurement_id_here') {
        initializeGA4(config.ga4MeasurementId, config.googleAdsConversionId, config.debug);
        if (config.debug) {
          console.log('Analytics: GA4 initialized via React');
        }
      } else if (gaLoaded && config.debug) {
        console.log('Analytics: GA4 already loaded via HTML');
      }

      // Initialize Attribution System
      initializeAttribution({
        debug_mode: config.debug,
        console_logging: config.debug,
        use_local_storage: true,
        enable_enhanced_conversions: true,
        hash_customer_data: true,
        default_model: 'last_click',
        click_through_window: 30,
        view_through_window: 1
      });
      
      // Initialize Session Tracking
      initializeSessionTracking(config.debug);
      
      // Initialize Enhanced Analytics
      initializeEnhancedAnalytics(config.debug);

      if (config.debug) {
        console.log('Analytics: React Context initialization complete', {
          metaPixelReady: !!(window as any).fbq,
          ga4Ready: !!(window as any).gtag,
          configDebug: config.debug
        });
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Analytics: Initialization failed:', error);
    }
  }, []);

  // Track page view
  const trackPageView = (pagePath?: string, pageTitle?: string) => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      // Meta Pixel page view
      if (metaPixel?.isLoaded()) {
        metaPixel.trackPageView();
      }

      // GA4 page view
      if (ga4?.isLoaded()) {
        ga4.trackPageView({
          page_title: pageTitle || document.title,
          page_location: window.location.href,
          page_path: pagePath || window.location.pathname
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Page view tracking failed:', error);
    }
  };

  // Track product view
  const trackProductView = (product: any) => {
    if (!config.enabled || !product) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      const productData: ProductData = {
        content_id: product._id || product.id || '',
        content_name: product.name || product.title || '',
        content_category: product.category || 'T-Shirt',
        value: product.price || 0,
        currency: 'INR'
      };

      // Meta Pixel view content
      if (metaPixel?.isLoaded()) {
        metaPixel.trackViewContent({
          content_type: 'product',
          content_ids: [productData.content_id],
          contents: [productData],
          value: productData.value,
          currency: productData.currency
        });
      }

      // GA4 view item
      if (ga4?.isLoaded()) {
        ga4.trackViewItem({
          currency: 'INR',
          value: productData.value,
          items: [{
            content_id: productData.content_id,
            content_name: productData.content_name,
            content_category: productData.content_category,
            value: productData.value,
            currency: 'INR',
            quantity: 1,
            item_id: productData.content_id,
            item_name: productData.content_name,
            item_category: productData.content_category,
            price: productData.value,
            item_brand: 'Attars',
            affiliation: 'Attars Fashion'
          }]
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Product view tracking failed:', error);
    }
  };

  // Track add to cart
  const trackAddToCart = (product: any, quantity: number = 1) => {
    if (config.debug) {
      console.log('🛒 AnalyticsContext: trackAddToCart called', { product, quantity, configEnabled: config.enabled });
    }
    
    if (!config.enabled || !product) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      const cartItem: CartItem = {
        content_id: product._id || product.id || '',
        content_name: product.name || product.title || '',
        content_category: product.category || 'T-Shirt',
        quantity: quantity,
        value: (product.price || 0) * quantity,
        currency: 'INR'
      };

      // Get attribution data for tracking
      const attributionManager = getAttributionManager();
      const attribution = attributionManager?.getCurrentAttribution();
      
      if (config.debug) {
        console.log('📤 Attribution retrieved:', attribution);
      }
      
      const attributionContext = attribution ? {
        external_id: '',  // Set from user context if available
        utm_campaign: attribution.utm_campaign,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        fbclid: attribution.fbclid,
        traffic_type: attribution.traffic_type,
        ad_platform: attribution.ad_platform
      } : undefined;

      if (config.debug) {
        console.log('📤 Sending AddToCart to Meta Pixel with attribution:', attributionContext);
      }

      // Meta Pixel add to cart
      if (metaPixel?.isLoaded()) {
        metaPixel.trackAddToCart({
          content_ids: [cartItem.content_id],
          contents: [cartItem],
          content_type: 'product',
          value: cartItem.value,
          currency: cartItem.currency
        }, attributionContext);
        if (config.debug) {
        console.log('📤 Added to cart sent to pixel');
      }
      }
      else{
        console.log('📤 meta pixel not loaded');
      }

      // GA4 add to cart
      if (ga4?.isLoaded()) {
        ga4.trackAddToCart({
          currency: 'INR',
          value: cartItem.value,
          items: [{
            content_id: cartItem.content_id,
            content_name: cartItem.content_name,
            content_category: cartItem.content_category,
            quantity: quantity,
            value: cartItem.value,
            currency: 'INR',
            item_id: cartItem.content_id,
            item_name: cartItem.content_name,
            item_category: cartItem.content_category,
            price: product.price || 0,
            item_brand: 'Attars',
            affiliation: 'Attars Fashion'
          }]
        });
      }

      // Google Ads add to cart conversion
      if (ga4?.isLoaded() && config.googleAdsConversionId) {
        ga4.trackGoogleAdsConversion('add_to_cart', {
          send_to: `${config.googleAdsConversionId}/ADD_TO_CART`,
          value: cartItem.value,
          currency: 'INR'
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Add to cart tracking failed:', error);
    }
  };

  // Track remove from cart
  const trackRemoveFromCart = (product: any, quantity: number = 1) => {
    if (config.debug) {
      console.log('🗑️ AnalyticsContext: trackRemoveFromCart called', { product, quantity, configEnabled: config.enabled });
    }
    
    if (!config.enabled || !product) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      const cartItem: CartItem = {
        content_id: product._id || product.id || '',
        content_name: product.name || product.title || '',
        content_category: product.category || 'T-Shirt',
        quantity: quantity,
        value: (product.price || 0) * quantity,
        currency: 'INR'
      };

      if (config.debug) {
        console.log('📤 Sending RemoveFromCart to Meta Pixel', cartItem);
      }

      // Meta Pixel remove from cart
      if (metaPixel?.isLoaded()) {
        metaPixel.trackRemoveFromCart({
          content_ids: [cartItem.content_id],
          contents: [cartItem],
          content_type: 'product',
          value: cartItem.value,
          currency: cartItem.currency
        });
      }

      // GA4 remove from cart
      if (ga4?.isLoaded()) {
        ga4.trackRemoveFromCart({
          currency: 'INR',
          value: cartItem.value,
          items: [{
            content_id: cartItem.content_id,
            content_name: cartItem.content_name,
            content_category: cartItem.content_category,
            quantity: quantity,
            value: cartItem.value,
            currency: 'INR',
            item_id: cartItem.content_id,
            item_name: cartItem.content_name,
            item_category: cartItem.content_category,
            price: product.price || 0,
            item_brand: 'Attars',
            affiliation: 'Attars Fashion'
          }]
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Remove from cart tracking failed:', error);
    }
  };

  // Track view cart
  const trackViewCart = (cartItems: any[]) => {
    if (!config.enabled || !cartItems.length) return;

    try {
      const ga4 = getGA4();
      
      const totalValue = cartItems.reduce((sum, item) => 
        sum + ((item.price || item.product?.price || 0) * (item.quantity || item.count || 1)), 0);

      // GA4 view cart
      if (ga4?.isLoaded()) {
        const items = cartItems.map(item => ({
          content_id: item._id || item.product?._id || item.id || '',
          content_name: item.name || item.product?.name || item.title || '',
          content_category: item.category || item.product?.category || 'T-Shirt',
          quantity: item.quantity || item.count || 1,
          value: (item.price || item.product?.price || 0) * (item.quantity || item.count || 1),
          currency: 'INR',
          item_id: item._id || item.product?._id || item.id || '',
          item_name: item.name || item.product?.name || item.title || '',
          item_category: item.category || item.product?.category || 'T-Shirt',
          price: item.price || item.product?.price || 0,
          item_brand: 'Attars',
          affiliation: 'Attars Fashion'
        }));

        ga4.trackViewCart({
          currency: 'INR',
          value: totalValue,
          items: items
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: View cart tracking failed:', error);
    }
  };

  // Track begin checkout
  const trackBeginCheckout = (cartItems: any[], coupon?: string) => {
    if (config.debug) {
      console.log('🏪 AnalyticsContext: trackBeginCheckout called', { cartItemsCount: cartItems.length, coupon, configEnabled: config.enabled });
    }
    
    if (!config.enabled || !cartItems.length) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      const totalValue = cartItems.reduce((sum, item) => 
        sum + ((item.price || item.product?.price || 0) * (item.quantity || item.count || 1)), 0);

      const contents = cartItems.map(item => ({
        content_id: item._id || item.product?._id || item.id || '',
        content_name: item.name || item.product?.name || item.title || '',
        content_category: item.category || item.product?.category || 'T-Shirt',
        quantity: item.quantity || item.count || 1,
        value: (item.price || item.product?.price || 0) * (item.quantity || item.count || 1),
        currency: 'INR'
      }));

      // Get attribution data for tracking
      const attributionManager = getAttributionManager();
      const attribution = attributionManager?.getCurrentAttribution();
      
      const attributionContext = attribution ? {
        external_id: '',  // Set from user context if available
        utm_campaign: attribution.utm_campaign,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        fbclid: attribution.fbclid,
        traffic_type: attribution.traffic_type,
        ad_platform: attribution.ad_platform
      } : undefined;

      // Meta Pixel initiate checkout
      if (metaPixel?.isLoaded()) {
        metaPixel.trackInitiateCheckout({
          content_ids: contents.map(c => c.content_id),
          contents: contents,
          content_type: 'product',
          value: totalValue,
          currency: 'INR',
          num_items: cartItems.length
        }, attributionContext);
      }

      // GA4 begin checkout
      if (ga4?.isLoaded()) {
        const items = cartItems.map(item => ({
          content_id: item._id || item.product?._id || item.id || '',
          content_name: item.name || item.product?.name || item.title || '',
          content_category: item.category || item.product?.category || 'T-Shirt',
          quantity: item.quantity || item.count || 1,
          value: (item.price || item.product?.price || 0) * (item.quantity || item.count || 1),
          currency: 'INR',
          item_id: item._id || item.product?._id || item.id || '',
          item_name: item.name || item.product?.name || item.title || '',
          item_category: item.category || item.product?.category || 'T-Shirt',
          price: item.price || item.product?.price || 0,
          item_brand: 'Attars',
          affiliation: 'Attars Fashion'
        }));

        ga4.trackBeginCheckout({
          currency: 'INR',
          value: totalValue,
          items: items,
          coupon: coupon
        });
      }

      // Google Ads begin checkout conversion
      if (ga4?.isLoaded() && config.googleAdsConversionId) {
        ga4.trackGoogleAdsConversion('begin_checkout', {
          send_to: `${config.googleAdsConversionId}/BEGIN_CHECKOUT`,
          value: totalValue,
          currency: 'INR'
        });
      }

      if (config.debug) {
        console.log('✅ Begin checkout tracking complete', { totalValue, itemCount: cartItems.length });
      }
    } catch (error) {
      console.error('Analytics: Begin checkout tracking failed:', error);
    }
  };

  // Track add shipping info
  const trackAddShippingInfo = (cartItems: any[], shippingTier: string) => {
    if (config.debug) {
      console.log('🚚 AnalyticsContext: trackAddShippingInfo called', { cartItemsCount: cartItems.length, shippingTier, configEnabled: config.enabled });
    }
    
    if (!config.enabled || !cartItems.length) return;

    try {
      const ga4 = getGA4();
      
      const totalValue = cartItems.reduce((sum, item) => 
        sum + ((item.price || item.product?.price || 0) * (item.quantity || item.count || 1)), 0);

      // GA4 add shipping info
      if (ga4?.isLoaded()) {
        const items = cartItems.map(item => ({
          content_id: item._id || item.product?._id || item.id || '',
          content_name: item.name || item.product?.name || item.title || '',
          content_category: item.category || item.product?.category || 'T-Shirt',
          quantity: item.quantity || item.count || 1,
          value: (item.price || item.product?.price || 0) * (item.quantity || item.count || 1),
          currency: 'INR',
          item_id: item._id || item.product?._id || item.id || '',
          item_name: item.name || item.product?.name || item.title || '',
          item_category: item.category || item.product?.category || 'T-Shirt',
          price: item.price || item.product?.price || 0,
          item_brand: 'Attars',
          affiliation: 'Attars Fashion'
        }));

        ga4.trackAddShippingInfo({
          currency: 'INR',
          value: totalValue,
          shipping_tier: shippingTier,
          items: items
        });
      }

      if (config.debug) {
        console.log('✅ Shipping info tracking complete', { totalValue, shippingTier });
      }
    } catch (error) {
      console.error('Analytics: Add shipping info tracking failed:', error);
    }
  };

  // Track add payment info
  const trackAddPaymentInfo = (cartItems: any[], paymentType: string) => {
    if (config.debug) {
      console.log('💳 AnalyticsContext: trackAddPaymentInfo called', { cartItemsCount: cartItems.length, paymentType, configEnabled: config.enabled });
    }
    
    if (!config.enabled || !cartItems.length) return;

    try {
      const ga4 = getGA4();
      
      const totalValue = cartItems.reduce((sum, item) => 
        sum + ((item.price || item.product?.price || 0) * (item.quantity || item.count || 1)), 0);

      // GA4 add payment info
      if (ga4?.isLoaded()) {
        const items = cartItems.map(item => ({
          content_id: item._id || item.product?._id || item.id || '',
          content_name: item.name || item.product?.name || item.title || '',
          content_category: item.category || item.product?.category || 'T-Shirt',
          quantity: item.quantity || item.count || 1,
          value: (item.price || item.product?.price || 0) * (item.quantity || item.count || 1),
          currency: 'INR',
          item_id: item._id || item.product?._id || item.id || '',
          item_name: item.name || item.product?.name || item.title || '',
          item_category: item.category || item.product?.category || 'T-Shirt',
          price: item.price || item.product?.price || 0,
          item_brand: 'Attars',
          affiliation: 'Attars Fashion'
        }));

        ga4.trackAddPaymentInfo({
          currency: 'INR',
          value: totalValue,
          payment_type: paymentType,
          items: items
        });
      }

      if (config.debug) {
        console.log('✅ Payment info tracking complete', { totalValue, paymentType });
      }
    } catch (error) {
      console.error('Analytics: Add payment info tracking failed:', error);
    }
  };

  // Track purchase
  const trackPurchase = (order: any) => {
    console.log('🛒 trackPurchase called with order:', order);
    
    if (!config.enabled) {
      console.warn('⚠️ Analytics disabled - Purchase not tracked');
      return;
    }
    
    if (!order) {
      console.warn('⚠️ No order data - Purchase not tracked');
      return;
    }

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      console.log('📊 Pixel/GA4 Status:', {
        metaPixelLoaded: metaPixel?.isLoaded(),
        ga4Loaded: ga4?.isLoaded()
      });

      const products = (order.products || []).map((product: any) => ({
        content_id: product._id || product.id || '',
        content_name: product.name || product.title || '',
        content_category: product.category || 'T-Shirt',
        value: product.price || 0,
        currency: 'INR',
        quantity: product.quantity || 1
      }));

      const purchaseData: PurchaseData = {
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

      console.log('💰 Purchase Data:', purchaseData);

      // Get attribution data for conversion tracking
      const attributionManager = getAttributionManager();
      const attribution = attributionManager?.getCurrentAttribution();
      
      // Prepare attribution context for Meta Pixel
      const attributionContext = attribution ? {
        external_id: order.user?._id || order.user?.id || order.email || '',
        utm_campaign: attribution.utm_campaign,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        fbclid: attribution.fbclid,
        traffic_type: attribution.traffic_type,
        ad_platform: attribution.ad_platform
      } : undefined;

      // Meta Pixel purchase
      if (metaPixel?.isLoaded()) {
        console.log('📤 Sending Purchase to Meta Pixel with attribution:', attributionContext);
        metaPixel.trackPurchase(purchaseData, attributionContext);
      } else {
        console.warn('⚠️ Meta Pixel not loaded - Purchase not sent to Meta');
      }

      // GA4 purchase
      if (ga4?.isLoaded()) {
        const items = products.map(product => ({
          item_id: product.content_id,
          item_name: product.content_name,
          item_category: product.content_category,
          price: product.value,
          quantity: product.quantity,
          currency: 'INR',
          item_brand: 'Attars',
          affiliation: 'Attars Fashion'
        }));

        console.log('📤 Sending Purchase to GA4');
        ga4.trackPurchase({
          transaction_id: purchaseData.transaction_id,
          value: purchaseData.value,
          currency: 'INR',
          tax: purchaseData.tax,
          shipping: purchaseData.shipping,
          items: items,
          coupon: purchaseData.coupon,
          affiliation: 'Attars Fashion'
        });
      } else {
        console.warn('⚠️ GA4 not loaded - Purchase not sent to GA4');
      }

      // Google Ads purchase conversion
      if (ga4?.isLoaded() && config.googleAdsConversionId && config.googleAdsPurchaseLabel) {
        console.log('📤 Sending Purchase to Google Ads');
        const conversionData = generateGoogleAdsConversionData(
          config.googleAdsConversionId,
          config.googleAdsPurchaseLabel,
          purchaseData.value,
          purchaseData.transaction_id
        );
        
        ga4.trackGoogleAdsConversion('purchase', conversionData);
      }

      console.log('✅ Purchase tracking complete');

      if (config.debug) {
        console.log('🐛 Debug mode - Purchase data:', purchaseData);
      }
    } catch (error) {
      console.error('❌ Analytics: Purchase tracking failed:', error);
    }
  };

  // Track user registration
  const trackSignUp = (method: string = 'email') => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      // Meta Pixel complete registration
      if (metaPixel?.isLoaded()) {
        metaPixel.trackCompleteRegistration({
          content_name: 'User Registration',
          status: true
        });
      }

      // GA4 sign up
      if (ga4?.isLoaded()) {
        ga4.trackSignUp({
          method: method
        });
      }

      // Google Ads signup conversion
      if (ga4?.isLoaded() && config.googleAdsConversionId && config.googleAdsSignupLabel) {
        ga4.trackGoogleAdsConversion('sign_up', {
          send_to: `${config.googleAdsConversionId}/${config.googleAdsSignupLabel}`,
          currency: 'INR'
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Sign up tracking failed:', error);
    }
  };

  // Track user login
  const trackLogin = (method: string = 'email') => {
    if (!config.enabled) return;

    try {
      const ga4 = getGA4();

      // GA4 login
      if (ga4?.isLoaded()) {
        ga4.trackLogin({
          method: method
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Login tracking failed:', error);
    }
  };

  // Track search
  const trackSearch = (searchTerm: string) => {
    if (!config.enabled || !searchTerm) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      // Meta Pixel search
      if (metaPixel?.isLoaded()) {
        metaPixel.trackSearch({
          search_string: searchTerm,
          content_type: 'product'
        });
      }

      // GA4 search
      if (ga4?.isLoaded()) {
        ga4.trackSearch({
          search_term: searchTerm,
          content_type: 'product'
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Search tracking failed:', error);
    }
  };

  // Track start design tool
  const trackStartDesignTool = (productId?: string, sourcePage: string = 'unknown') => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      // Meta Pixel custom event
      if (metaPixel?.isLoaded()) {
        metaPixel.trackStartDesignTool({
          content_id: productId,
          source_page: sourcePage
        });
      }

      // GA4 custom event
      if (ga4?.isLoaded()) {
        ga4.trackStartDesignTool({
          product_id: productId,
          source_page: sourcePage,
          engagement_time_msec: Date.now()
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Start design tool tracking failed:', error);
    }
  };

  // Track customize product
  const trackCustomizeProduct = (productId: string, designPosition: string, designType: string) => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      // Meta Pixel custom event
      if (metaPixel?.isLoaded()) {
        metaPixel.trackCustomizeProduct({
          content_id: productId,
          content_name: 'Product Customization',
          content_category: 'Custom Design',
          design_position: designPosition as 'front' | 'back',
          design_type: designType as 'text' | 'image' | 'logo'
        });
      }

      // GA4 custom event
      if (ga4?.isLoaded()) {
        ga4.trackCustomizeProduct({
          product_id: productId,
          design_position: designPosition,
          design_type: designType
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Customize product tracking failed:', error);
    }
  };

  // Track save design
  const trackSaveDesign = (productId: string, designComplexity: string, timeSpent: number) => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      // Meta Pixel custom event
      if (metaPixel?.isLoaded()) {
        metaPixel.trackSaveDesign({
          content_id: productId,
          design_elements: timeSpent > 300 ? 5 : timeSpent > 120 ? 3 : 1,
          design_complexity: designComplexity as 'simple' | 'medium' | 'complex'
        });
      }

      // GA4 custom event
      if (ga4?.isLoaded()) {
        ga4.trackSaveDesign({
          product_id: productId,
          design_complexity: designComplexity,
          time_spent: timeSpent
        });
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Save design tracking failed:', error);
    }
  };

  // Track add to wishlist (NEW - High Priority)
  const trackAddToWishlist = (product: any) => {
    if (!config.enabled || !product) return;

    try {
      const metaPixel = getMetaPixel();

      const productData: ProductData = {
        content_id: product._id || product.id || '',
        content_name: product.name || product.title || '',
        content_category: product.category || 'T-Shirt',
        value: product.price || 0,
        currency: 'INR'
      };

      // Meta Pixel add to wishlist
      if (metaPixel?.isLoaded()) {
        metaPixel.trackAddToWishlist({
          content_type: 'product',
          content_ids: [productData.content_id],
          contents: [productData],
          value: productData.value,
          currency: productData.currency
        });
      }

      if (config.debug) {
        console.log('Analytics: Add to wishlist tracked', productData);
      }
    } catch (error) {
      console.error('Analytics: Add to wishlist tracking failed:', error);
    }
  };

  // Track lead generation (NEW - Medium Priority)
  const trackLead = (leadType: string, value: number = 0) => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();

      // Meta Pixel lead event
      if (metaPixel?.isLoaded()) {
        metaPixel.trackLead({
          content_name: leadType,
          content_category: 'Lead Generation',
          value: value,
          currency: 'INR'
        });
      }

      if (config.debug) {
        console.log('Analytics: Lead tracked', { leadType, value });
      }
    } catch (error) {
      console.error('Analytics: Lead tracking failed:', error);
    }
  };

  // Track subscription (NEW - Medium Priority)
  const trackSubscribe = (subscriptionType: string, value: number = 0, predictedLtv: number = 0) => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();

      // Meta Pixel subscribe event
      if (metaPixel?.isLoaded()) {
        metaPixel.trackSubscribe({
          value: value,
          currency: 'INR',
          predicted_ltv: predictedLtv,
          content_name: subscriptionType
        });
      }

      if (config.debug) {
        console.log('Analytics: Subscribe tracked', { subscriptionType, value, predictedLtv });
      }
    } catch (error) {
      console.error('Analytics: Subscribe tracking failed:', error);
    }
  };

  // Set user data
  const setUser = (userData: UserData) => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      setCurrentUser(userData);

      // Meta Pixel advanced matching
      if (metaPixel?.isLoaded()) {
        metaPixel.setUserData(userData);
      }

      // GA4 user properties and ID
      if (ga4?.isLoaded()) {
        if (userData.customer_id) {
          ga4.setUserId(userData.customer_id);
        }
        ga4.setUserProperties(userData);
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Setting user data failed:', error);
    }
  };

  // Clear user data
  const clearUser = () => {
    if (!config.enabled) return;

    try {
      const metaPixel = getMetaPixel();
      const ga4 = getGA4();

      setCurrentUser(null);

      // Clear Meta Pixel user data
      if (metaPixel?.isLoaded()) {
        metaPixel.clearUserData();
      }

      // Clear GA4 user ID
      if (ga4?.isLoaded()) {
        ga4.clearUserId();
      }

      if (config.debug) {
      }
    } catch (error) {
      console.error('Analytics: Clearing user data failed:', error);
    }
  };

  // Check if analytics is loaded
  const isLoaded = () => {
    const metaPixel = getMetaPixel();
    const ga4 = getGA4();
    
    return (metaPixel?.isLoaded() || false) || (ga4?.isLoaded() || false);
  };

  // Get debug information
  const getDebugInfo = () => {
    const metaPixel = getMetaPixel();
    const ga4 = getGA4();
    
    return {
      config,
      isInitialized,
      currentUser,
      metaPixel: {
        loaded: metaPixel?.isLoaded() || false,
        pixelId: metaPixel?.getPixelId() || 'not configured'
      },
      ga4: {
        loaded: ga4?.isLoaded() || false,
        measurementId: ga4?.getMeasurementId() || 'not configured',
        googleAdsId: ga4?.getGoogleAdsConversionId() || 'not configured'
      }
    };
  };

  const contextValue: AnalyticsContextType = {
    isInitialized,
    config,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackPurchase,
    trackSignUp,
    trackLogin,
    trackSearch,
    trackStartDesignTool,
    trackCustomizeProduct,
    trackSaveDesign,
    trackAddToWishlist,
    trackLead,
    trackSubscribe,
    setUser,
    clearUser,
    isLoaded,
    getDebugInfo
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics context
export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsContext;
