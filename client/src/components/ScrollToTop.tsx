import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
    
    // Track page view for analytics (Meta Pixel + GA4)
    // This ensures every page navigation is tracked, not just initial load
    trackPageView(pathname);
  }, [pathname, trackPageView]);

  return null;
}
