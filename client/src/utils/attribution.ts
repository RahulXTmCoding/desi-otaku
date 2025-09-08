// Attribution Utility - UTM Parameter and Click ID Capture System
import { 
  AttributionData, 
  AttributionConfig, 
  URLParameters,
  ATTRIBUTION_STORAGE_KEYS,
  DEFAULT_ATTRIBUTION_CONFIG,
  AttributionSource
} from '../types/attribution';

class AttributionManager {
  private config: AttributionConfig;
  private currentAttribution: AttributionData | null = null;
  private sessionId: string;

  constructor(config?: Partial<AttributionConfig>) {
    this.config = { ...DEFAULT_ATTRIBUTION_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  // Initialize attribution system
  private initialize(): void {
    try {
      // Load existing attribution from storage
      this.loadAttributionFromStorage();
      
      // Check for new attribution parameters in current URL
      const urlAttribution = this.extractAttributionFromURL();
      
      if (urlAttribution) {
        // New attribution found - update current attribution
        this.updateAttribution(urlAttribution);
      } else if (!this.currentAttribution) {
        // No existing attribution and no new attribution - create organic attribution
        this.createOrganicAttribution();
      }

      if (this.config.debug_mode && this.config.console_logging) {
        console.log('Attribution Manager initialized:', this.currentAttribution);
      }
    } catch (error) {
      console.error('Attribution Manager initialization failed:', error);
      this.createOrganicAttribution();
    }
  }

  // Extract attribution parameters from current URL
  private extractAttributionFromURL(): Partial<AttributionData> | null {
    const urlParams = this.getURLParameters();
    const hasAttributionParams = this.hasAttributionParameters(urlParams);
    
    if (!hasAttributionParams) {
      return null;
    }

    const attribution: Partial<AttributionData> = {
      // UTM Parameters
      utm_source: urlParams.utm_source,
      utm_medium: urlParams.utm_medium,
      utm_campaign: urlParams.utm_campaign,
      utm_term: urlParams.utm_term,
      utm_content: urlParams.utm_content,
      
      // Click IDs
      gclid: urlParams.gclid,
      fbclid: urlParams.fbclid,
      ttclid: urlParams.ttclid,
      msclkid: urlParams.msclkid,
      
      // Metadata
      landing_page: window.location.href,
      referrer: document.referrer || 'direct',
      first_visit_time: Date.now(),
      last_visit_time: Date.now(),
      session_id: this.sessionId,
      visit_count: 1
    };

    // Classify traffic type and platform
    this.classifyTraffic(attribution);

    return attribution;
  }

  // Get URL parameters
  private getURLParameters(): URLParameters {
    const params: URLParameters = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of urlSearchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  }

  // Check if URL has attribution parameters
  private hasAttributionParameters(params: URLParameters): boolean {
    const attributionKeys = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'ttclid', 'msclkid'
    ];
    
    return attributionKeys.some(key => params[key]);
  }

  // Classify traffic type and ad platform
  private classifyTraffic(attribution: Partial<AttributionData>): void {
    // Determine ad platform from click IDs
    if (attribution.gclid) {
      attribution.ad_platform = 'google';
      attribution.traffic_type = 'paid';
    } else if (attribution.fbclid) {
      attribution.ad_platform = 'meta';
      attribution.traffic_type = 'paid';
    } else if (attribution.ttclid) {
      attribution.ad_platform = 'tiktok';
      attribution.traffic_type = 'paid';
    } else if (attribution.msclkid) {
      attribution.ad_platform = 'microsoft';
      attribution.traffic_type = 'paid';
    }

    // Determine traffic type from UTM parameters
    if (attribution.utm_medium) {
      const medium = attribution.utm_medium.toLowerCase();
      
      if (['cpc', 'ppc', 'paid', 'adwords', 'ads'].includes(medium)) {
        attribution.traffic_type = 'paid';
      } else if (['social', 'facebook', 'instagram', 'twitter', 'linkedin'].includes(medium)) {
        attribution.traffic_type = 'social';
      } else if (['email', 'newsletter'].includes(medium)) {
        attribution.traffic_type = 'email';
      } else if (['referral', 'affiliate'].includes(medium)) {
        attribution.traffic_type = 'referral';
      } else {
        attribution.traffic_type = 'organic';
      }
    }

    // Determine ad platform from UTM source
    if (attribution.utm_source && !attribution.ad_platform) {
      const source = attribution.utm_source.toLowerCase();
      
      if (['google', 'googleads', 'adwords'].includes(source)) {
        attribution.ad_platform = 'google';
      } else if (['facebook', 'fb', 'meta', 'instagram'].includes(source)) {
        attribution.ad_platform = 'meta';
      } else if (['tiktok', 'tiktokads'].includes(source)) {
        attribution.ad_platform = 'tiktok';
      } else if (['bing', 'microsoft', 'microsoftads'].includes(source)) {
        attribution.ad_platform = 'microsoft';
      }
    }

    // Default traffic classification
    if (!attribution.traffic_type) {
      const referrer = attribution.referrer || '';
      
      if (!referrer || referrer === 'direct') {
        attribution.traffic_type = 'direct';
      } else if (this.isSearchEngine(referrer)) {
        attribution.traffic_type = 'organic';
      } else if (this.isSocialMedia(referrer)) {
        attribution.traffic_type = 'social';
      } else {
        attribution.traffic_type = 'referral';
      }
    }
  }

  // Check if referrer is a search engine
  private isSearchEngine(referrer: string): boolean {
    const searchEngines = [
      'google.', 'bing.', 'yahoo.', 'duckduckgo.', 'baidu.',
      'yandex.', 'ask.', 'aol.', 'startpage.', 'searx.'
    ];
    
    return searchEngines.some(engine => referrer.includes(engine));
  }

  // Check if referrer is social media
  private isSocialMedia(referrer: string): boolean {
    const socialPlatforms = [
      'facebook.', 'instagram.', 'twitter.', 'linkedin.', 'youtube.',
      'tiktok.', 'snapchat.', 'pinterest.', 'reddit.', 'whatsapp.'
    ];
    
    return socialPlatforms.some(platform => referrer.includes(platform));
  }

  // Update current attribution
  private updateAttribution(newAttribution: Partial<AttributionData>): void {
    const existingAttribution = this.currentAttribution;
    
    // Create new attribution data
    this.currentAttribution = {
      ...newAttribution,
      attribution_model: this.config.default_model,
      session_id: this.sessionId,
      visit_count: existingAttribution ? existingAttribution.visit_count + 1 : 1
    } as AttributionData;

    // Apply attribution model logic
    if (existingAttribution && this.config.default_model === 'first_click') {
      // Keep first attribution for first-click model
      this.currentAttribution = {
        ...existingAttribution,
        last_visit_time: Date.now(),
        visit_count: existingAttribution.visit_count + 1,
        session_id: this.sessionId
      };
    }

    // Save to storage
    this.saveAttributionToStorage();
    
    if (this.config.debug_mode && this.config.console_logging) {
      console.log('Attribution updated:', this.currentAttribution);
    }
  }

  // Create organic attribution for non-attributed traffic
  private createOrganicAttribution(): void {
    this.currentAttribution = {
      landing_page: window.location.href,
      referrer: document.referrer || 'direct',
      first_visit_time: Date.now(),
      last_visit_time: Date.now(),
      attribution_model: this.config.default_model,
      session_id: this.sessionId,
      visit_count: 1,
      traffic_type: document.referrer ? 'referral' : 'direct'
    };

    this.classifyTraffic(this.currentAttribution);
    this.saveAttributionToStorage();
  }

  // Load attribution from storage
  private loadAttributionFromStorage(): void {
    if (!this.config.use_local_storage) return;

    try {
      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEYS.CURRENT_ATTRIBUTION);
      if (stored) {
        const attribution = JSON.parse(stored);
        
        // Check if attribution is within window
        const daysSinceAttribution = (Date.now() - attribution.first_visit_time) / (1000 * 60 * 60 * 24);
        
        if (daysSinceAttribution <= this.config.click_through_window) {
          this.currentAttribution = attribution;
        }
      }
    } catch (error) {
      console.error('Failed to load attribution from storage:', error);
    }
  }

  // Save attribution to storage
  private saveAttributionToStorage(): void {
    if (!this.config.use_local_storage || !this.currentAttribution) return;

    try {
      localStorage.setItem(
        ATTRIBUTION_STORAGE_KEYS.CURRENT_ATTRIBUTION,
        JSON.stringify(this.currentAttribution)
      );
    } catch (error) {
      console.error('Failed to save attribution to storage:', error);
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Hash string for enhanced conversions (simple implementation)
  private hashString(str: string): string {
    if (!this.config.hash_customer_data) return str;
    
    // Simple hash for demo - in production, use proper SHA-256
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Public Methods

  // Get current attribution
  getCurrentAttribution(): AttributionData | null {
    return this.currentAttribution;
  }

  // Update session ID (for new page loads)
  updateSession(): void {
    this.sessionId = this.generateSessionId();
    
    if (this.currentAttribution) {
      this.currentAttribution.session_id = this.sessionId;
      this.currentAttribution.last_visit_time = Date.now();
      this.saveAttributionToStorage();
    }
  }

  // Check if current traffic is attributed
  isAttributedTraffic(): boolean {
    return this.currentAttribution?.traffic_type === 'paid' || 
           !!(this.currentAttribution?.utm_source || 
              this.currentAttribution?.gclid || 
              this.currentAttribution?.fbclid);
  }

  // Get attribution source
  getAttributionSource(): AttributionSource | null {
    if (!this.currentAttribution) return null;
    
    return this.currentAttribution.ad_platform || 
           (this.currentAttribution.traffic_type as AttributionSource) || 
           null;
  }

  // Get campaign name
  getCampaignName(): string | null {
    return this.currentAttribution?.utm_campaign || null;
  }

  // Get enhanced conversion data for hashing
  getEnhancedConversionData(customerData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }): any {
    if (!this.config.enable_enhanced_conversions) return {};

    const enhancedData: any = {};

    if (customerData.email) {
      enhancedData.email = this.hashString(customerData.email.toLowerCase().trim());
    }
    
    if (customerData.phone) {
      // Remove all non-digits and hash
      const cleanPhone = customerData.phone.replace(/\D/g, '');
      enhancedData.phone_number = this.hashString(cleanPhone);
    }
    
    if (customerData.firstName) {
      enhancedData.first_name = this.hashString(customerData.firstName.toLowerCase().trim());
    }
    
    if (customerData.lastName) {
      enhancedData.last_name = this.hashString(customerData.lastName.toLowerCase().trim());
    }

    return enhancedData;
  }

  // Clear attribution (for testing or privacy)
  clearAttribution(): void {
    this.currentAttribution = null;
    
    if (this.config.use_local_storage) {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEYS.CURRENT_ATTRIBUTION);
    }
    
    if (this.config.debug_mode && this.config.console_logging) {
      console.log('Attribution cleared');
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<AttributionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.debug_mode && this.config.console_logging) {
      console.log('Attribution config updated:', this.config);
    }
  }

  // Get configuration
  getConfig(): AttributionConfig {
    return { ...this.config };
  }

  // Get debug information
  getDebugInfo(): any {
    return {
      config: this.config,
      currentAttribution: this.currentAttribution,
      sessionId: this.sessionId,
      urlParameters: this.getURLParameters(),
      isAttributedTraffic: this.isAttributedTraffic(),
      attributionSource: this.getAttributionSource(),
      campaignName: this.getCampaignName()
    };
  }
}

// Export singleton instance
let attributionManager: AttributionManager | null = null;

export const initializeAttribution = (config?: Partial<AttributionConfig>): AttributionManager => {
  if (!attributionManager) {
    attributionManager = new AttributionManager(config);
  }
  return attributionManager;
};

export const getAttributionManager = (): AttributionManager | null => {
  return attributionManager;
};

// Utility functions
export const extractUTMParameters = (): URLParameters => {
  const params: URLParameters = {};
  const urlSearchParams = new URLSearchParams(window.location.search);
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmKeys.forEach(key => {
    const value = urlSearchParams.get(key);
    if (value) params[key] = value;
  });
  
  return params;
};

export const extractClickIDs = (): URLParameters => {
  const params: URLParameters = {};
  const urlSearchParams = new URLSearchParams(window.location.search);
  
  const clickIdKeys = ['gclid', 'fbclid', 'ttclid', 'msclkid'];
  
  clickIdKeys.forEach(key => {
    const value = urlSearchParams.get(key);
    if (value) params[key] = value;
  });
  
  return params;
};

export const isFromAds = (): boolean => {
  const manager = getAttributionManager();
  return manager ? manager.isAttributedTraffic() : false;
};

export const getAdPlatform = (): AttributionSource | null => {
  const manager = getAttributionManager();
  return manager ? manager.getAttributionSource() : null;
};

export const getCampaign = (): string | null => {
  const manager = getAttributionManager();
  return manager ? manager.getCampaignName() : null;
};

export default AttributionManager;
