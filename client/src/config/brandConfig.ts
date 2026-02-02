/**
 * Centralized Brand Configuration
 *
 * This file contains all brand-related settings that can be easily changed
 * when rebranding or white-labeling the application.
 *
 * To rebrand:
 * 1. Update values in this file
 * 2. Replace logo files in /public (brand.png, logo512.png, favicon.ico, etc.)
 * 3. Update manifest.json with new brand name
 * 4. Update index.html meta tags (or they'll use these values via SEOHead)
 */

export interface BrandConfig {
  // Basic brand info
  name: string;
  shortName: string;
  tagline: string;
  description: string;

  // Domain & URLs
  domain: string;
  baseUrl: string;
  backendUrl: string;

  // Contact info
  email: string;
  supportEmail: string;
  phone?: string;

  // Logo & images
  logoPath: string;
  logoAlt: string;
  faviconPath: string;
  ogImagePath: string;

  // Social media
  socialLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    discord?: string;
    youtube?: string;
    linkedin?: string;
  };
  socialHandles: {
    twitter?: string; // e.g., @attars_club
    instagram?: string;
  };

  // Theme colors
  theme: {
    primary: string; // Main brand color
    secondary: string; // Secondary color
    accent: string; // Accent/highlight color
    background: string; // Main background
    text: string; // Primary text color
  };

  // SEO defaults
  seo: {
    siteName: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
    facebookAppId?: string;
  };

  // Business info (for invoices, legal docs)
  business: {
    legalName: string;
    gstNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    postalCode?: string;
  };

  // Copyright
  copyright: {
    year: number;
    text: string;
  };
}

export const brandConfig: BrandConfig = {
  // Basic brand info
  name: "Attars Club",
  shortName: "Attars",
  tagline: "Premium Streetwear Brand India",
  description:
    "India's premium streetwear brand for anime merchandise, Indian culture apparel & original designs",

  // Domain & URLs
  domain: "attars.club",
  baseUrl: "https://attars.club",
  backendUrl: "https://backend.attars.club",

  // Contact info
  email: "hello@attars.club",
  supportEmail: "support@attars.club",

  // Logo & images
  logoPath: "/brand.png",
  logoAlt: "Attars Club Logo",
  faviconPath: "/favicon.ico",
  ogImagePath: "/og-image.jpg",

  // Social media
  socialLinks: {
    instagram: "https://instagram.com/attars.club/",
    twitter: "https://x.com/Attars_club",
    discord: "https://discord.gg/aVq4WaRF",
  },
  socialHandles: {
    twitter: "@attars_club",
    instagram: "@attars.club",
  },

  // Theme colors
  theme: {
    primary: "#FBBF24", // Yellow-400
    secondary: "#1F2937", // Gray-800
    accent: "#F59E0B", // Yellow-500
    background: "#111827", // Gray-900
    text: "#FFFFFF", // White
  },

  // SEO defaults
  seo: {
    siteName: "Attars Club - Premium Fashion India",
    defaultTitle:
      "Attars Club – Official Website | Premium Streetwear Brand India",
    defaultDescription:
      "Attars Club – Official Website. India's premium streetwear brand for anime merchandise, Indian culture apparel & original designs. Shop authentic Attars Club clothing with fast delivery across India.",
    defaultKeywords: [
      "attars",
      "attars club",
      "attars fashion",
      "attars clothing",
      "attars india",
      "premium streetwear india",
      "anime merchandise india",
      "indian culture apparel",
      "tv show merchandise india",
      "original streetwear designs",
      "premium fashion india",
      "designer clothing india",
      "streetwear brand india",
      "anime t-shirts india",
      "premium hoodies india",
      "oversized clothing india",
    ],
    facebookAppId: "", // Add your Facebook App ID if needed
  },

  // Business info
  business: {
    legalName: "Attars Club",
    country: "India",
  },

  // Copyright
  copyright: {
    year: new Date().getFullYear(),
    text: "Attars Club. All rights reserved. Made with ❤️ for fashion enthusiasts.",
  },
};

// Helper functions for common brand-related operations
export const getBrandUrl = (path: string): string => {
  return `${brandConfig.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getBrandImageUrl = (imagePath: string): string => {
  return getBrandUrl(imagePath);
};

export const getLogoUrl = (): string => {
  return brandConfig.logoPath;
};

export const getSocialUrl = (
  platform: keyof typeof brandConfig.socialLinks,
): string | undefined => {
  return brandConfig.socialLinks[platform];
};

// Export default for convenience
export default brandConfig;
