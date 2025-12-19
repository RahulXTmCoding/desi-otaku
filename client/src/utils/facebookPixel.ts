// Meta Pixel (Facebook Pixel) Integration Utilities
import {
  MetaPixelEvents,
  ProductData,
  CartItem,
  PurchaseData,
  UserData,
} from "../types/analytics";

// Declare global fbq function
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// Generate unique event ID for deduplication
const generateEventID = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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
    if (
      this.isInitialized ||
      !this.pixelId ||
      this.pixelId === "your_meta_pixel_id_here"
    ) {
      if (this.isDebugEnabled()) {
        console.log(
          "Meta Pixel: Skipping init - already initialized or invalid pixel ID"
        );
      }
      return;
    }

    try {
      // Check if fbq is already loaded via HTML script (e.g., in index.html)
      if (window.fbq) {
        // Pixel script is already loaded, just mark as initialized
        this.isInitialized = true;
        if (this.isDebugEnabled()) {
          console.log(
            "Meta Pixel: Already loaded via HTML, skipping script injection"
          );
        }
        return;
      }

      // Facebook Pixel Code - only load if not already present
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
      })(
        window,
        document,
        "script",
        "https://connect.facebook.net/en_US/fbevents.js"
      );

      // Initialize the pixel
      window.fbq("init", this.pixelId);

      // Track initial page view
      window.fbq("track", "PageView");

      this.isInitialized = true;

      if (this.isDebugEnabled()) {
        console.log("Meta Pixel: Initialized successfully");
      }
    } catch (error) {
      console.error("Meta Pixel: Initialization failed:", error);
    }
  }

  // Track page view
  trackPageView(): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "PageView");

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: PageView tracking failed:", error);
    }
  }

  // Track product view
  trackViewContent(data: MetaPixelEvents["ViewContent"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "ViewContent", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: ViewContent tracking failed:", error);
    }
  }

  // Track add to cart
  trackAddToCart(
    data: MetaPixelEvents["AddToCart"],
    attributionData?: any
  ): void {
    if (!this.isReady()) return;

    try {
      // Generate unique event ID for deduplication
      const eventID = generateEventID();

      // Enhance with attribution context
      const enhancedData = {
        ...data,
        eventID: eventID,
        ...(attributionData?.external_id && {
          external_id: attributionData.external_id,
        }),
        ...(attributionData?.utm_campaign && {
          utm_campaign: attributionData.utm_campaign,
        }),
        ...(attributionData?.utm_source && {
          utm_source: attributionData.utm_source,
        }),
        ...(attributionData?.utm_medium && {
          utm_medium: attributionData.utm_medium,
        }),
      };

      window.fbq("track", "AddToCart", enhancedData);

      if (this.isDebugEnabled()) {
        console.log("Meta Pixel: AddToCart tracked with attribution", {
          eventID,
          value: data.value,
          attribution: attributionData,
        });
      }
    } catch (error) {
      console.error("Meta Pixel: AddToCart tracking failed:", error);
    }
  }

  // Track remove from cart
  trackRemoveFromCart(data: MetaPixelEvents["RemoveFromCart"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "RemoveFromCart", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: RemoveFromCart tracking failed:", error);
    }
  }

  // Track checkout initiation
  trackInitiateCheckout(
    data: MetaPixelEvents["InitiateCheckout"],
    attributionData?: any
  ): void {
    if (!this.isReady()) return;

    try {
      // Generate unique event ID for deduplication
      const eventID = generateEventID();

      // Enhance with attribution context
      const enhancedData = {
        ...data,
        eventID: eventID,
        ...(attributionData?.external_id && {
          external_id: attributionData.external_id,
        }),
        ...(attributionData?.utm_campaign && {
          utm_campaign: attributionData.utm_campaign,
        }),
        ...(attributionData?.utm_source && {
          utm_source: attributionData.utm_source,
        }),
        ...(attributionData?.utm_medium && {
          utm_medium: attributionData.utm_medium,
        }),
      };

      window.fbq("track", "InitiateCheckout", enhancedData);

      if (this.isDebugEnabled()) {
        console.log("Meta Pixel: InitiateCheckout tracked with attribution", {
          eventID,
          value: data.value,
          attribution: attributionData,
        });
      }
    } catch (error) {
      console.error("Meta Pixel: InitiateCheckout tracking failed:", error);
    }
  }

  // Track purchase
  trackPurchase(
    data: MetaPixelEvents["Purchase"],
    attributionData?: any
  ): void {
    if (!this.isReady()) return;

    try {
      // Generate unique event ID for server-side deduplication
      const eventID = generateEventID();

      // Enhance purchase data with attribution context
      const enhancedData = {
        ...data,
        // Add event metadata
        eventID: eventID,
        // Add attribution data if available
        ...(attributionData?.external_id && {
          external_id: attributionData.external_id,
        }),
        // Include campaign data for reporting
        ...(attributionData?.utm_campaign && {
          utm_campaign: attributionData.utm_campaign,
        }),
        ...(attributionData?.utm_source && {
          utm_source: attributionData.utm_source,
        }),
        ...(attributionData?.utm_medium && {
          utm_medium: attributionData.utm_medium,
        }),
      };

      // Send Purchase event with enhanced data
      window.fbq("track", "Purchase", enhancedData);

      if (this.isDebugEnabled()) {
        console.log("Meta Pixel: Purchase tracked with attribution", {
          eventID,
          value: data.value,
          transaction_id: data.transaction_id,
          attribution: attributionData,
        });
      }
    } catch (error) {
      console.error("Meta Pixel: Purchase tracking failed:", error);
    }
  }

  // Track user registration
  trackCompleteRegistration(
    data: MetaPixelEvents["CompleteRegistration"]
  ): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "CompleteRegistration", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: CompleteRegistration tracking failed:", error);
    }
  }

  // Track search
  trackSearch(data: MetaPixelEvents["Search"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "Search", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: Search tracking failed:", error);
    }
  }

  // Track contact
  trackContact(data: MetaPixelEvents["Contact"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "Contact", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: Contact tracking failed:", error);
    }
  }

  // Track custom events for design tool
  trackCustomizeProduct(data: MetaPixelEvents["CustomizeProduct"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("trackCustom", "CustomizeProduct", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: CustomizeProduct tracking failed:", error);
    }
  }

  trackStartDesignTool(data: MetaPixelEvents["StartDesignTool"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("trackCustom", "StartDesignTool", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: StartDesignTool tracking failed:", error);
    }
  }

  trackSaveDesign(data: MetaPixelEvents["SaveDesign"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("trackCustom", "SaveDesign", data);

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: SaveDesign tracking failed:", error);
    }
  }

  // Track add payment info (NEW - High Priority)
  trackAddPaymentInfo(data: MetaPixelEvents["AddPaymentInfo"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "AddPaymentInfo", data);

      if (this.debug) {
        console.log("Meta Pixel: AddPaymentInfo tracked", data);
      }
    } catch (error) {
      console.error("Meta Pixel: AddPaymentInfo tracking failed:", error);
    }
  }

  // Track add to wishlist (NEW - High Priority)
  trackAddToWishlist(data: MetaPixelEvents["AddToWishlist"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "AddToWishlist", data);

      if (this.debug) {
        console.log("Meta Pixel: AddToWishlist tracked", data);
      }
    } catch (error) {
      console.error("Meta Pixel: AddToWishlist tracking failed:", error);
    }
  }

  // Track lead generation (NEW - Medium Priority)
  trackLead(data: MetaPixelEvents["Lead"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "Lead", data);

      if (this.debug) {
        console.log("Meta Pixel: Lead tracked", data);
      }
    } catch (error) {
      console.error("Meta Pixel: Lead tracking failed:", error);
    }
  }

  // Track subscription (NEW - Medium Priority)
  trackSubscribe(data: MetaPixelEvents["Subscribe"]): void {
    if (!this.isReady()) return;

    try {
      window.fbq("track", "Subscribe", data);

      if (this.debug) {
        console.log("Meta Pixel: Subscribe tracked", data);
      }
    } catch (error) {
      console.error("Meta Pixel: Subscribe tracking failed:", error);
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
        window.fbq("setUserData", advancedMatchingData);

        if (this.debug) {
        }
      }
    } catch (error) {
      console.error("Meta Pixel: Setting user data failed:", error);
    }
  }

  // Clear user data
  clearUserData(): void {
    if (!this.isReady()) return;

    try {
      window.fbq("setUserData", {});

      if (this.debug) {
      }
    } catch (error) {
      console.error("Meta Pixel: Clearing user data failed:", error);
    }
  }

  // Check debug setting dynamically from global config
  private isDebugEnabled(): boolean {
    return this.debug || (window as any).analyticsConfig?.debug || false;
  }

  // Check if pixel is ready
  private isReady(): boolean {
    if (!this.isInitialized) {
      if (this.isDebugEnabled()) {
        console.warn("Meta Pixel: Not initialized");
      }
      return false;
    }

    if (!window.fbq) {
      if (this.isDebugEnabled()) {
        console.warn("Meta Pixel: fbq function not available");
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
    content_id: product._id || product.id || "",
    content_name: product.name || product.title || "",
    content_category: product.category || "T-Shirt",
    value: product.price || 0,
    currency: "INR",
    quantity: product.quantity || 1,
    item_brand: "Attars",
    item_category: product.category || "T-Shirt",
    item_category2: product.subcategory || "",
    item_id: product._id || product.id || "",
    item_name: product.name || product.title || "",
    price: product.price || 0,
    custom_design: !!(product.customization || product.isCustom),
    design_type: product.customization
      ? product.customization.frontDesign && product.customization.backDesign
        ? "both"
        : product.customization.frontDesign
        ? "front"
        : product.customization.backDesign
        ? "back"
        : "none"
      : "none",
  };
};

export const convertToMetaPixelCartItem = (cartItem: any): CartItem => {
  return {
    content_id: cartItem._id || cartItem.product?._id || cartItem.id || "",
    content_name:
      cartItem.name || cartItem.product?.name || cartItem.title || "",
    content_category:
      cartItem.category || cartItem.product?.category || "T-Shirt",
    quantity: cartItem.quantity || cartItem.count || 1,
    value:
      (cartItem.price || cartItem.product?.price || 0) *
      (cartItem.quantity || cartItem.count || 1),
    currency: "INR",
    custom_design: !!(cartItem.customization || cartItem.isCustom),
    design_type: cartItem.customization
      ? cartItem.customization.frontDesign && cartItem.customization.backDesign
        ? "both"
        : cartItem.customization.frontDesign
        ? "front"
        : cartItem.customization.backDesign
        ? "back"
        : "none"
      : "none",
  };
};

export const convertToPurchaseData = (order: any): PurchaseData => {
  const products = (order.products || []).map((product: any) =>
    convertToMetaPixelProduct(product)
  );

  return {
    content_ids: products.map((p) => p.content_id),
    content_type: "product",
    contents: products,
    currency: "INR",
    value: order.amount || order.finalAmount || 0,
    transaction_id: order._id || order.id || "",
    affiliation: "Attars Fashion",
    tax: order.tax || 0,
    shipping: order.shipping?.shippingCost || 0,
    coupon: order.coupon?.code || "",
    payment_method: order.paymentMethod || "unknown",
    customer_type: order.user ? "registered" : "guest",
    order_id: order._id || order.id || "",
    discount_amount: order.discount || 0,
    reward_points_used: order.rewardPointsRedeemed || 0,
  };
};

// Export singleton instance
let metaPixelInstance: MetaPixel | null = null;

export const initializeMetaPixel = (
  pixelId: string,
  debug: boolean = false
): MetaPixel => {
  if (!metaPixelInstance) {
    metaPixelInstance = new MetaPixel(pixelId, debug);
    metaPixelInstance.init();
  }
  return metaPixelInstance;
};

export const getMetaPixel = (): MetaPixel | null => {
  return metaPixelInstance;
};

// Expose to window for debugging
if (typeof window !== "undefined") {
  (window as any).getMetaPixel = getMetaPixel;
}

export default MetaPixel;
