const msg91 = require('msg91').default;

class SMSService {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG91_SENDER_ID || 'ATTARS';
    this.flowId = process.env.MSG91_TEMPLATE_ID; // Flow ID for SDK
    
    // Initialize MSG91 SDK
    if (this.authKey) {
      try {
        msg91.initialize({ authKey: this.authKey });
        this.sms = msg91.getSMS();
        console.log('✅ MSG91 SDK initialized successfully');
      } catch (error) {
        console.warn('⚠️ MSG91 SDK initialization failed:', error.message);
        this.sms = null;
      }
    } else {
      console.warn('⚠️ MSG91_AUTH_KEY not found. SMS service will run in development mode.');
      this.sms = null;
    }
  }

  /**
   * Normalize phone number for MSG91
   * @param {string} phone - Phone number with or without country code
   * @returns {string} - Normalized phone number with country code
   */
  normalizePhoneNumber(phone) {
    // Remove any spaces, dashes, or special characters
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove +91 prefix if present
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Ensure it's a valid 10-digit Indian number
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error('Invalid Indian mobile number format');
    }
    
    // Return with country code for MSG91 SDK
    return `91${cleanPhone}`;
  }

  /**
   * Send OTP via MSG91 SMS using official SDK
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} - MSG91 response
   */
  async sendOTP(phone, otp) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phone);
      
      // Check if running in production with valid credentials
      if (!this.sms || process.env.NODE_ENV !== 'production') {
        console.log(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
        return {
          success: true,
          message: 'Development mode - OTP logged to console',
          requestId: `dev_${Date.now()}`,
          developmentOtp: otp // Include OTP in response for testing
        };
      }

      console.log(`📱 Sending OTP via MSG91 SDK to ${phone}...`);
      console.log(`🔧 Using Flow ID: ${this.flowId}`);
      console.log(`📞 Normalized phone: ${normalizedPhone}`);
      
      // Send SMS using MSG91 SDK with flow
      const response = await this.sms.send(this.flowId, {
        mobile: normalizedPhone,
        OTP: otp, // Variable for OTP in your MSG91 template
        VAR1: otp, // Backup variable name
        COMPANY: "Attars Fashion" // Company name variable
      });

      console.log('✅ MSG91 SDK response:', response);

      return {
        success: true,
        message: 'OTP sent successfully via MSG91 SDK',
        requestId: response.requestId || response.message || `msg91_${Date.now()}`,
        type: 'success',
        details: response
      };

    } catch (error) {
      console.error('❌ MSG91 SDK SMS sending failed:', {
        phone,
        error: error.message,
        stack: error.stack
      });

      // For development, still return success so the flow continues
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 [DEV FALLBACK] OTP for ${phone}: ${otp}`);
        return {
          success: true,
          message: 'Development fallback - OTP available in console',
          requestId: `dev_fallback_${Date.now()}`,
          developmentOtp: otp,
          error: error.message
        };
      }

      // Don't fail the OTP process - log error and continue
      return {
        success: false,
        message: 'SMS delivery may be delayed',
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Check delivery status of sent SMS
   * @param {string} requestId - MSG91 request ID
   * @returns {Promise<Object>} - Delivery status
   */
  async checkDeliveryStatus(requestId) {
    try {
      if (!this.sms || process.env.NODE_ENV !== 'production') {
        return { status: 'delivered', description: 'Development mode' };
      }

      // Note: MSG91 SDK might have different status check methods
      // This is a placeholder - check MSG91 SDK documentation for actual method
      console.log('📊 Checking delivery status for:', requestId);
      return { status: 'sent', description: 'Status check via SDK' };
      
    } catch (error) {
      console.error('Failed to check delivery status:', error.message);
      return { status: 'unknown', error: error.message };
    }
  }

  /**
   * Get account balance from MSG91
   * @returns {Promise<Object>} - Account balance info
   */
  async getBalance() {
    try {
      if (!this.sms) {
        return { balance: 'N/A', type: 'Development mode' };
      }

      // Note: Check MSG91 SDK documentation for balance check method
      console.log('💰 Checking MSG91 account balance...');
      return { balance: 'Available', type: 'SDK method' };
      
    } catch (error) {
      console.error('Failed to get MSG91 balance:', error.message);
      return { balance: 'Error', error: error.message };
    }
  }
}

// Rate limiting for SMS sending
const smsRateLimit = new Map();

/**
 * Check if phone number is within SMS rate limits
 * @param {string} phone - Phone number
 * @returns {Object} - Rate limit status
 */
function checkSMSRateLimit(phone) {
  const key = `sms_${phone}`;
  const attempts = smsRateLimit.get(key) || [];
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  const maxAttemptsPerHour = 3; // Maximum 3 SMS per hour per phone number

  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(time => now - time < oneHour);

  if (recentAttempts.length >= maxAttemptsPerHour) {
    const oldestAttempt = Math.min(...recentAttempts);
    const timeUntilReset = oneHour - (now - oldestAttempt);
    
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      attemptsLeft: 0,
      resetIn: Math.ceil(timeUntilReset / 60000) // in minutes
    };
  }

  // Add current attempt
  recentAttempts.push(now);
  smsRateLimit.set(key, recentAttempts);

  return {
    allowed: true,
    attemptsLeft: maxAttemptsPerHour - recentAttempts.length,
    resetIn: 60 // Reset in 1 hour
  };
}

// Export singleton instance
const smsService = new SMSService();

module.exports = {
  smsService,
  checkSMSRateLimit,
  SMSService
};
