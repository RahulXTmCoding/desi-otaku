// Session Tracking and Customer Journey Management
import { 
  SessionData, 
  PageVisit, 
  AttributedEvent, 
  CustomerJourney,
  AttributionData,
  ATTRIBUTION_STORAGE_KEYS
} from '../types/attribution';

class SessionTracker {
  private currentSession: SessionData | null = null;
  private currentJourney: CustomerJourney | null = null;
  private pageStartTime: number = Date.now();
  private debug: boolean = false;

  constructor(debug: boolean = false) {
    this.debug = debug;
    this.initializeSession();
  }

  // Initialize or resume session
  private initializeSession(): void {
    try {
      // Try to load existing session from sessionStorage
      this.loadCurrentSession();
      
      // If no session or session expired, create new one
      if (!this.currentSession || this.isSessionExpired()) {
        this.startNewSession();
      }
      
      // Load or create customer journey
      this.loadCustomerJourney();
      
      if (this.debug) {
        console.log('Session tracker initialized:', {
          session: this.currentSession,
          journey: this.currentJourney
        });
      }
    } catch (error) {
      console.error('Session tracker initialization failed:', error);
      this.startNewSession();
    }
  }

  // Start a new session
  private startNewSession(): void {
    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      session_id: sessionId,
      start_time: Date.now(),
      attribution: this.getAttributionForSession(),
      pages_visited: [],
      events: [],
      conversion_value: 0,
      conversion_count: 0
    };
    
    this.saveCurrentSession();
    
    if (this.debug) {
      console.log('New session started:', this.currentSession);
    }
  }

  // Get attribution data for new session
  private getAttributionForSession(): AttributionData {
    try {
      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEYS.CURRENT_ATTRIBUTION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load attribution for session:', error);
    }
    
    // Fallback attribution
    return {
      landing_page: window.location.href,
      referrer: document.referrer || 'direct',
      first_visit_time: Date.now(),
      last_visit_time: Date.now(),
      attribution_model: 'last_click',
      session_id: this.currentSession?.session_id || this.generateSessionId(),
      visit_count: 1,
      traffic_type: 'direct'
    };
  }

  // Load current session from storage
  private loadCurrentSession(): void {
    try {
      const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEYS.SESSION_DATA);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
    }
  }

  // Save current session to storage
  private saveCurrentSession(): void {
    if (!this.currentSession) return;
    
    try {
      sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEYS.SESSION_DATA,
        JSON.stringify(this.currentSession)
      );
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  }

  // Load customer journey from storage
  private loadCustomerJourney(): void {
    try {
      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEYS.CUSTOMER_JOURNEY);
      if (stored) {
        this.currentJourney = JSON.parse(stored);
        
        // Add current session to journey if not already present
        if (this.currentSession && this.currentJourney) {
          const sessionExists = this.currentJourney.sessions.find(
            s => s.session_id === this.currentSession!.session_id
          );
          
          if (!sessionExists) {
            this.currentJourney.sessions.push(this.currentSession);
            this.saveCustomerJourney();
          }
        }
      } else if (this.currentSession) {
        // Create new customer journey
        this.currentJourney = {
          anonymous_id: this.generateAnonymousId(),
          sessions: [this.currentSession],
          total_conversion_value: 0,
          total_conversions: 0,
          first_attribution: this.currentSession.attribution,
          last_attribution: this.currentSession.attribution,
          journey_start: this.currentSession.start_time,
          attribution_windows: {
            view_through: 1,
            click_through: 30
          }
        };
        this.saveCustomerJourney();
      }
    } catch (error) {
      console.error('Failed to load customer journey:', error);
    }
  }

  // Save customer journey to storage
  private saveCustomerJourney(): void {
    if (!this.currentJourney) return;
    
    try {
      localStorage.setItem(
        ATTRIBUTION_STORAGE_KEYS.CUSTOMER_JOURNEY,
        JSON.stringify(this.currentJourney)
      );
    } catch (error) {
      console.error('Failed to save customer journey:', error);
    }
  }

  // Check if current session is expired (30 minutes)
  private isSessionExpired(): boolean {
    if (!this.currentSession) return true;
    
    const thirtyMinutes = 30 * 60 * 1000;
    const timeSinceStart = Date.now() - this.currentSession.start_time;
    
    return timeSinceStart > thirtyMinutes;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate anonymous ID for customer journey
  private generateAnonymousId(): string {
    return 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
  }

  // Public Methods

  // Track page visit
  trackPageVisit(pageData: {
    page_path: string;
    page_title: string;
    page_location: string;
  }): void {
    if (!this.currentSession) return;

    // Calculate time on previous page
    const timeOnPreviousPage = Date.now() - this.pageStartTime;
    
    // Update time on previous page if there was one
    if (this.currentSession.pages_visited.length > 0) {
      const lastPage = this.currentSession.pages_visited[this.currentSession.pages_visited.length - 1];
      lastPage.time_on_page = timeOnPreviousPage;
    }

    // Add new page visit
    const pageVisit: PageVisit = {
      page_path: pageData.page_path,
      page_title: pageData.page_title,
      page_location: pageData.page_location,
      timestamp: Date.now(),
      referrer: document.referrer || ''
    };

    this.currentSession.pages_visited.push(pageVisit);
    this.pageStartTime = Date.now();
    
    // Update session storage
    this.saveCurrentSession();
    
    // Update customer journey
    this.updateCustomerJourney();

    if (this.debug) {
      console.log('Page visit tracked:', pageVisit);
    }
  }

  // Track attributed event
  trackEvent(eventData: {
    event_name: string;
    event_data: any;
    value?: number;
  }): void {
    if (!this.currentSession) return;

    const attributedEvent: AttributedEvent = {
      event_name: eventData.event_name,
      event_data: eventData.event_data,
      timestamp: Date.now(),
      attribution: this.currentSession.attribution,
      page_path: window.location.pathname,
      value: eventData.value
    };

    this.currentSession.events.push(attributedEvent);
    
    // Update conversion metrics if it's a conversion event
    if (this.isConversionEvent(eventData.event_name)) {
      this.currentSession.conversion_count += 1;
      this.currentSession.conversion_value += eventData.value || 0;
    }
    
    // Update session storage
    this.saveCurrentSession();
    
    // Update customer journey
    this.updateCustomerJourney();

    if (this.debug) {
      console.log('Event tracked:', attributedEvent);
    }
  }

  // Check if event is a conversion event
  private isConversionEvent(eventName: string): boolean {
    const conversionEvents = [
      'purchase',
      'sign_up',
      'complete_registration',
      'lead',
      'add_to_cart',
      'begin_checkout'
    ];
    
    return conversionEvents.includes(eventName);
  }

  // Update customer journey with current session data
  private updateCustomerJourney(): void {
    if (!this.currentJourney || !this.currentSession) return;

    // Update session in journey
    const sessionIndex = this.currentJourney.sessions.findIndex(
      s => s.session_id === this.currentSession!.session_id
    );
    
    if (sessionIndex >= 0) {
      this.currentJourney.sessions[sessionIndex] = { ...this.currentSession };
    }

    // Update journey totals
    this.currentJourney.total_conversion_value = this.currentJourney.sessions.reduce(
      (total, session) => total + session.conversion_value, 0
    );
    
    this.currentJourney.total_conversions = this.currentJourney.sessions.reduce(
      (total, session) => total + session.conversion_count, 0
    );

    // Update last attribution
    this.currentJourney.last_attribution = this.currentSession.attribution;

    // Save updated journey
    this.saveCustomerJourney();
  }

  // Set customer ID when user logs in/registers
  setCustomerId(customerId: string): void {
    if (this.currentJourney) {
      this.currentJourney.customer_id = customerId;
      this.saveCustomerJourney();
      
      if (this.debug) {
        console.log('Customer ID set:', customerId);
      }
    }
  }

  // Get current session data
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  // Get customer journey data
  getCustomerJourney(): CustomerJourney | null {
    return this.currentJourney;
  }

  // Get conversion path (pages visited leading to conversion)
  getConversionPath(): string[] {
    if (!this.currentSession) return [];
    
    return this.currentSession.pages_visited.map(page => page.page_path);
  }

  // Get attribution data for current session
  getSessionAttribution(): AttributionData | null {
    return this.currentSession?.attribution || null;
  }

  // Get time spent on current page
  getTimeOnCurrentPage(): number {
    return Date.now() - this.pageStartTime;
  }

  // Check if user has converted in this journey
  hasConverted(): boolean {
    return (this.currentJourney?.total_conversions || 0) > 0;
  }

  // Get total journey value
  getTotalJourneyValue(): number {
    return this.currentJourney?.total_conversion_value || 0;
  }

  // End current session
  endSession(): void {
    if (this.currentSession) {
      this.currentSession.end_time = Date.now();
      
      // Update time on last page
      if (this.currentSession.pages_visited.length > 0) {
        const lastPage = this.currentSession.pages_visited[this.currentSession.pages_visited.length - 1];
        lastPage.time_on_page = this.getTimeOnCurrentPage();
      }
      
      this.saveCurrentSession();
      this.updateCustomerJourney();
      
      if (this.debug) {
        console.log('Session ended:', this.currentSession);
      }
    }
  }

  // Clear all tracking data (for privacy/testing)
  clearAll(): void {
    try {
      sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEYS.SESSION_DATA);
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEYS.CUSTOMER_JOURNEY);
      
      this.currentSession = null;
      this.currentJourney = null;
      
      if (this.debug) {
        console.log('All tracking data cleared');
      }
    } catch (error) {
      console.error('Failed to clear tracking data:', error);
    }
  }

  // Get debug information
  getDebugInfo(): any {
    return {
      currentSession: this.currentSession,
      customerJourney: this.currentJourney,
      timeOnCurrentPage: this.getTimeOnCurrentPage(),
      hasConverted: this.hasConverted(),
      totalJourneyValue: this.getTotalJourneyValue(),
      conversionPath: this.getConversionPath()
    };
  }
}

// Export singleton instance
let sessionTracker: SessionTracker | null = null;

export const initializeSessionTracking = (debug: boolean = false): SessionTracker => {
  if (!sessionTracker) {
    sessionTracker = new SessionTracker(debug);
  }
  return sessionTracker;
};

export const getSessionTracker = (): SessionTracker | null => {
  return sessionTracker;
};

// Utility functions
export const trackPageVisit = (pageData: {
  page_path: string;
  page_title: string;
  page_location: string;
}): void => {
  const tracker = getSessionTracker();
  if (tracker) {
    tracker.trackPageVisit(pageData);
  }
};

export const trackAttributedEvent = (eventData: {
  event_name: string;
  event_data: any;
  value?: number;
}): void => {
  const tracker = getSessionTracker();
  if (tracker) {
    tracker.trackEvent(eventData);
  }
};

export const getCurrentAttribution = (): AttributionData | null => {
  const tracker = getSessionTracker();
  return tracker ? tracker.getSessionAttribution() : null;
};

export const getConversionPath = (): string[] => {
  const tracker = getSessionTracker();
  return tracker ? tracker.getConversionPath() : [];
};

export const hasUserConverted = (): boolean => {
  const tracker = getSessionTracker();
  return tracker ? tracker.hasConverted() : false;
};

export default SessionTracker;
