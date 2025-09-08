// Attribution and Customer Journey Type Definitions
export interface AttributionData {
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Click IDs for platform attribution
  gclid?: string;  // Google Ads Click ID
  fbclid?: string; // Meta/Facebook Click ID
  ttclid?: string; // TikTok Click ID
  msclkid?: string; // Microsoft Ads Click ID
  
  // Attribution Metadata
  landing_page: string;
  referrer: string;
  first_visit_time: number;
  last_visit_time: number;
  attribution_model: 'first_click' | 'last_click' | 'linear' | 'time_decay';
  session_id: string;
  visit_count: number;
  
  // Traffic Classification
  traffic_type: 'organic' | 'paid' | 'direct' | 'referral' | 'social' | 'email';
  ad_platform?: 'google' | 'meta' | 'tiktok' | 'microsoft' | 'other';
  
  // Conversion Attribution
  conversion_value?: number;
  conversion_timestamp?: number;
  is_attributed_conversion?: boolean;
}

export interface SessionData {
  session_id: string;
  start_time: number;
  end_time?: number;
  attribution: AttributionData;
  pages_visited: PageVisit[];
  events: AttributedEvent[];
  conversion_value: number;
  conversion_count: number;
}

export interface PageVisit {
  page_path: string;
  page_title: string;
  page_location: string;
  timestamp: number;
  referrer: string;
  time_on_page?: number;
}

export interface AttributedEvent {
  event_name: string;
  event_data: any;
  timestamp: number;
  attribution: AttributionData;
  page_path: string;
  value?: number;
}

export interface CustomerJourney {
  customer_id?: string;
  anonymous_id: string;
  sessions: SessionData[];
  total_conversion_value: number;
  total_conversions: number;
  first_attribution: AttributionData;
  last_attribution: AttributionData;
  journey_start: number;
  journey_end?: number;
  attribution_windows: {
    view_through: number; // days
    click_through: number; // days
  };
}

export interface EnhancedPageView {
  // Standard Page Data
  page_title: string;
  page_location: string;
  page_path: string;
  
  // Attribution Data
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Click IDs
  gclid?: string;
  fbclid?: string;
  
  // Traffic Classification
  traffic_type: 'organic' | 'paid' | 'direct' | 'referral' | 'social' | 'email';
  ad_platform?: 'google' | 'meta' | 'tiktok' | 'microsoft' | 'other';
  
  // Session Data
  session_id: string;
  visit_number: number;
  is_new_visitor: boolean;
  time_on_previous_page?: number;
  
  // Attribution Context
  is_attributed_visit: boolean;
  attribution_source?: string;
  attribution_campaign?: string;
}

export interface EnhancedConversionData {
  // Standard Conversion Data
  transaction_id: string;
  value: number;
  currency: string;
  items: any[];
  
  // Attribution Data
  attribution: AttributionData;
  customer_journey_id: string;
  session_id: string;
  
  // Enhanced Conversion Data for Google Ads
  customer_email?: string; // hashed
  customer_phone?: string; // hashed
  customer_address?: {
    first_name?: string; // hashed
    last_name?: string; // hashed
    street?: string; // hashed
    city?: string; // hashed
    region?: string; // hashed
    postal_code?: string; // hashed
    country?: string; // hashed
  };
  
  // Attribution Context
  conversion_type: 'purchase' | 'signup' | 'lead' | 'add_to_cart' | 'begin_checkout';
  attribution_window_type: 'click_through' | 'view_through';
  days_since_attribution: number;
  touchpoint_count: number;
  conversion_path: string[]; // pages visited leading to conversion
}

export interface AttributionConfig {
  // Attribution Windows (in days)
  click_through_window: number;
  view_through_window: number;
  
  // Attribution Models
  default_model: 'first_click' | 'last_click' | 'linear' | 'time_decay';
  
  // Storage Settings
  storage_duration: number; // days
  use_local_storage: boolean;
  use_session_storage: boolean;
  
  // Platform Settings
  track_google_ads: boolean;
  track_meta_ads: boolean;
  track_tiktok_ads: boolean;
  
  // Enhanced Conversions
  enable_enhanced_conversions: boolean;
  hash_customer_data: boolean;
  
  // Debug Settings
  debug_mode: boolean;
  console_logging: boolean;
}

export interface AttributionMetrics {
  // Campaign Performance
  campaign_conversions: Record<string, number>;
  campaign_revenue: Record<string, number>;
  campaign_roas: Record<string, number>;
  
  // Platform Performance
  platform_conversions: Record<string, number>;
  platform_revenue: Record<string, number>;
  platform_roas: Record<string, number>;
  
  // Attribution Analysis
  first_click_revenue: number;
  last_click_revenue: number;
  assisted_conversions: number;
  
  // Customer Journey
  average_touchpoints: number;
  average_days_to_conversion: number;
  conversion_paths: Record<string, number>;
}

// Utility Types
export type AttributionSource = 'google' | 'meta' | 'tiktok' | 'microsoft' | 'organic' | 'direct' | 'referral' | 'other';
export type ConversionWindow = 'click_through' | 'view_through';
export type AttributionModel = 'first_click' | 'last_click' | 'linear' | 'time_decay' | 'position_based';

// Constants
export const ATTRIBUTION_STORAGE_KEYS = {
  CURRENT_ATTRIBUTION: 'attars_current_attribution',
  SESSION_DATA: 'attars_session_data',
  CUSTOMER_JOURNEY: 'attars_customer_journey',
  ATTRIBUTION_CONFIG: 'attars_attribution_config'
} as const;

export const DEFAULT_ATTRIBUTION_CONFIG: AttributionConfig = {
  click_through_window: 30,
  view_through_window: 1,
  default_model: 'last_click',
  storage_duration: 30,
  use_local_storage: true,
  use_session_storage: true,
  track_google_ads: true,
  track_meta_ads: true,
  track_tiktok_ads: true,
  enable_enhanced_conversions: true,
  hash_customer_data: true,
  debug_mode: false,
  console_logging: false
};

// Helper type for URL parameter extraction
export interface URLParameters {
  [key: string]: string | undefined;
}
