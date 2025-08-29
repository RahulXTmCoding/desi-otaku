import React, { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { initializePageSEO, updateCanonicalUrl, getCurrentCanonicalUrl } from '../utils/seoUtils';

interface SEOProviderProps {
  children: React.ReactNode;
}

// Route management component that handles canonical URLs
const RouteCanonicalManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize SEO on mount
    initializePageSEO();
  }, []);

  useEffect(() => {
    // Update canonical URL on route change
    const currentCanonical = getCurrentCanonicalUrl();
    updateCanonicalUrl(currentCanonical);
  }, [location.pathname, location.search]);

  return null; // This component doesn't render anything
};

const SEOProvider: React.FC<SEOProviderProps> = ({ children }) => {
  return (
    <HelmetProvider>
      <RouteCanonicalManager />
      {children}
    </HelmetProvider>
  );
};

export default SEOProvider;
