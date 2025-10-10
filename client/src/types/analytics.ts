// Analytics Types for Meta Pixel, Google Analytics 4, and Google Ads

export interface ProductData {
  content_id: string;
  content_name: string;
  content_category: string;
  value: number;
  currency: string;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_id?: string;
  item_name?: string;
  price?: number;
  custom_design?: boolean;
  design_type?: 'front' | 'back' | 'both' | 'none';
  affiliation?: string;
}

export interface CartItem {
  content_id: string;
  content_name: string;
  content_category: string;
  quantity: number;
  value: number;
  currency: string;
  custom_design?: boolean;
  design_type?: 'front' | 'back' | 'both' | 'none';
  // GA4 compatible fields
  item_id?: string;
  item_name?: string;
  item_category?: string;
  price?: number;
  item_brand?: string;
  affiliation?: string;
}

export interface PurchaseData {
  content_ids: string[];
  content_type: 'product';
  contents: ProductData[];
  currency: string;
  value: number;
  transaction_id: string;
  affiliation?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  payment_method?: string;
  customer_type: 'guest' | 'registered';
  order_id: string;
  discount_amount?: number;
  reward_points_used?: number;
}

export interface UserData {
  customer_id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  customer_type: 'guest' | 'registered';
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}

// Meta Pixel Events
export interface MetaPixelEvents {
  PageView: void;
  ViewContent: {
    content_type: 'product' | 'product_group';
    content_ids: string[];
    contents?: ProductData[];
    value?: number;
    currency?: string;
  };
  AddToCart: {
    content_ids: string[];
    contents: CartItem[];
    content_type: 'product';
    value: number;
    currency: string;
  };
  RemoveFromCart: {
    content_ids: string[];
    contents: CartItem[];
    content_type: 'product';
    value: number;
    currency: string;
  };
  InitiateCheckout: {
    content_ids: string[];
    contents: CartItem[];
    content_type: 'product';
    value: number;
    currency: string;
    num_items: number;
  };
  Purchase: PurchaseData;
  CompleteRegistration: {
    content_name?: string;
    currency?: string;
    value?: number;
    status?: boolean;
  };
  Search: {
    content_type?: 'product';
    content_ids?: string[];
    search_string: string;
  };
  Contact: {
    content_type?: 'contact';
    content_name?: string;
  };
  // Custom Events for Design Tool
  CustomizeProduct: {
    content_id: string;
    content_name: string;
    content_category: string;
    design_position: 'front' | 'back';
    design_type: 'text' | 'image' | 'logo';
    value?: number;
    currency?: string;
  };
  StartDesignTool: {
    content_id?: string;
    content_name?: string;
    source_page: string;
  };
  SaveDesign: {
    content_id: string;
    design_elements: number;
    design_complexity: 'simple' | 'medium' | 'complex';
  };
  // NEW Standard Events
  AddPaymentInfo: {
    content_type?: 'product';
    content_ids?: string[];
    contents?: CartItem[];
    value?: number;
    currency?: string;
  };
  AddToWishlist: {
    content_type?: 'product';
    content_ids?: string[];
    contents?: ProductData[];
    value?: number;
    currency?: string;
  };
  Lead: {
    content_name?: string;
    content_category?: string;
    value?: number;
    currency?: string;
  };
  Subscribe: {
    value?: number;
    currency?: string;
    predicted_ltv?: number;
    content_name?: string;
  };
}

// Google Analytics 4 Events
export interface GA4Events {
  page_view: {
    page_title?: string;
    page_location?: string;
    page_path?: string;
    content_group1?: string;
    content_group2?: string;
  };
  view_item: {
    currency: string;
    value: number;
    items: ProductData[];
  };
  add_to_cart: {
    currency: string;
    value: number;
    items: CartItem[];
  };
  remove_from_cart: {
    currency: string;
    value: number;
    items: CartItem[];
  };
  begin_checkout: {
    currency: string;
    value: number;
    items: CartItem[];
    coupon?: string;
  };
  purchase: {
    transaction_id: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    items: ProductData[];
    coupon?: string;
    affiliation?: string;
  };
  sign_up: {
    method?: string;
    content_type?: string;
  };
  login: {
    method?: string;
  };
  search: {
    search_term: string;
    content_type?: string;
  };
  // Custom events
  start_design_tool: {
    product_id?: string;
    source_page: string;
    engagement_time_msec?: number;
  };
  customize_product: {
    product_id: string;
    design_position: string;
    design_type: string;
    value?: number;
    currency?: string;
  };
  save_design: {
    product_id: string;
    design_complexity: string;
    time_spent: number;
  };
  view_cart: {
    currency: string;
    value: number;
    items: CartItem[];
  };
  add_shipping_info: {
    currency: string;
    value: number;
    shipping_tier: string;
    items: CartItem[];
  };
  add_payment_info: {
    currency: string;
    value: number;
    payment_type: string;
    items: CartItem[];
  };
}

// Google Ads Conversion Events
export interface GoogleAdsEvents {
  purchase: {
    send_to: string; // AW-CONVERSION_ID/CONVERSION_LABEL
    value: number;
    currency: string;
    transaction_id: string;
  };
  sign_up: {
    send_to: string; // AW-CONVERSION_ID/CONVERSION_LABEL
    value?: number;
    currency?: string;
  };
  add_to_cart: {
    send_to: string;
    value: number;
    currency: string;
  };
  begin_checkout: {
    send_to: string;
    value: number;
    currency: string;
  };
}

// Analytics Configuration
export interface AnalyticsConfig {
  metaPixelId?: string;
  ga4MeasurementId?: string;
  googleAdsConversionId?: string;
  googleAdsPurchaseLabel?: string;
  googleAdsSignupLabel?: string;
  enabled: boolean;
  debug: boolean;
  testMode?: boolean;
}

// Enhanced E-commerce Item
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price?: number;
  quantity?: number;
  custom_design?: boolean;
  design_position?: string;
}

// Event Tracking Parameters
export interface EventParameters {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  custom_parameter?: string;
}

// Customer Lifetime Value Data
export interface CustomerLTVData {
  customer_id?: string;
  customer_lifetime_value?: number;
  predicted_ltv?: number;
  acquisition_date?: string;
  last_purchase_date?: string;
  total_orders?: number;
  average_order_value?: number;
  customer_segment?: 'high_value' | 'medium_value' | 'low_value' | 'at_risk' | 'new';
}

// Audience Segment Data
export interface AudienceSegment {
  segment_id: string;
  segment_name: string;
  criteria: {
    purchase_behavior?: 'frequent' | 'occasional' | 'one_time';
    product_preference?: 'anime' | 'custom_design' | 'brand';
    value_tier?: 'high' | 'medium' | 'low';
    geographic?: string;
    device_type?: 'mobile' | 'desktop' | 'tablet';
  };
}

// Attribution Data
export interface AttributionData {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  click_id?: string;
  referrer?: string;
  landing_page?: string;
  session_id?: string;
  user_id?: string;
}

export type AnalyticsEventName = keyof MetaPixelEvents | keyof GA4Events | keyof GoogleAdsEvents;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  parameters: any;
  timestamp?: number;
  user_data?: UserData;
  attribution?: AttributionData;
}
