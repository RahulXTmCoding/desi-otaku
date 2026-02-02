/**
 * Centralized Brand Configuration for Backend
 * 
 * This file contains all brand-related settings used in backend services
 * such as emails, invoices, sitemap, etc.
 * 
 * To rebrand:
 * 1. Update values in this file
 * 2. Update corresponding client/src/config/brandConfig.ts
 * 3. Restart the server
 */

const brandConfig = {
  // Basic brand info
  name: 'Attars Club',
  shortName: 'Attars',
  tagline: 'Premium Streetwear Brand India',
  description: "India's premium streetwear brand for anime merchandise, Indian culture apparel & original designs",
  
  // Domain & URLs
  domain: 'attars.club',
  baseUrl: process.env.BASE_URL || 'https://attars.club',
  backendUrl: process.env.BACKEND_URL || 'https://backend.attars.club',
  
  // Contact info
  email: process.env.COMPANY_EMAIL || 'hello@attars.club',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@attars.club',
  noReplyEmail: process.env.NOREPLY_EMAIL || 'noreply@attars.club',
  
  // Logo & images
  logoUrl: 'https://attars.club/logo512.png',
  
  // Social media
  socialLinks: {
    instagram: 'https://instagram.com/attars.club/',
    twitter: 'https://x.com/Attars_club',
    facebook: 'https://www.facebook.com/attars.club',
    discord: 'https://discord.gg/aVq4WaRF',
  },
  
  // Business info (for invoices, legal docs)
  business: {
    legalName: 'Attars Club',
    gstNumber: process.env.GST_NUMBER || '',
    address: process.env.COMPANY_ADDRESS || '',
    city: process.env.COMPANY_CITY || '',
    state: process.env.COMPANY_STATE || '',
    country: 'India',
    postalCode: process.env.COMPANY_POSTAL_CODE || '',
  },
  
  // Email settings
  email: {
    senderName: 'Attars Club',
    from: process.env.EMAIL_FROM || 'Attars <noreply@attars.club>',
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@attars.club',
  },
  
  // Copyright
  copyright: {
    year: new Date().getFullYear(),
    text: 'Attars Club. All rights reserved.',
  },
};

// Helper functions
const getBrandUrl = (path) => {
  return `${brandConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const getBackendUrl = (path) => {
  return `${brandConfig.backendUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

module.exports = {
  brandConfig,
  getBrandUrl,
  getBackendUrl,
};
