import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProgressiveBannerProps {
  highQualityDesktop: string;
  highQualityMobile: string;
  finalFallbackDesktop: string;
  finalFallbackMobile: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}

const ProgressiveBanner: React.FC<ProgressiveBannerProps> = ({
  highQualityDesktop,
  highQualityMobile,
  finalFallbackDesktop,
  finalFallbackMobile,
  alt,
  onClick,
  className = ""
}) => {
  const navigate = useNavigate();
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [showHighQuality, setShowHighQuality] = useState(false);
  const [hasHighQualityError, setHasHighQualityError] = useState(false);
  const [showStyledFallback, setShowStyledFallback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect device type on mount and window resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkIsMobile();
    
    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Preload high-quality images - Only load the image needed for current device
  const preloadHighQualityImages = useCallback(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    
    // Common completion handler
    const handleImageLoaded = (delay) => { 
      return (() => {
        setIsHighQualityLoaded(true);
        // Small delay to ensure high-quality image is rendered before starting fade-out
        setTimeout(() => {
          setShowHighQuality(true);
        }, delay);
      });
    };
    
    const handleImageError = () => {
      setHasHighQualityError(true);
    };

    if (isMobile) {
      // On mobile, ONLY load mobile image (saves bandwidth)
      const mobileImg = new Image();
      mobileImg.onload = handleImageLoaded(2000);
      mobileImg.onerror = handleImageError;
      mobileImg.src = highQualityMobile;
    } else {
      // On desktop, ONLY load desktop image (saves bandwidth)
      const desktopImg = new Image();
      desktopImg.onload = handleImageLoaded(1000);
      desktopImg.onerror = handleImageError;
      desktopImg.src = highQualityDesktop;
    }
  }, [highQualityDesktop, highQualityMobile]);

  useEffect(() => {
    // Start preloading high-quality images immediately
    preloadHighQualityImages();
  }, [preloadHighQualityImages]);

  const handleImageError = (isMobile: boolean) => {
    if (!hasHighQualityError) {
      // If high-quality hasn't failed yet, this is likely the low-quality image failing
      // Switch to final fallback
      setHasHighQualityError(true);
    } else if (isMobile) {
      // If both high-quality and fallback failed on mobile, show styled fallback
      setShowStyledFallback(true);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/shop');
    }
  };

  // CSS-based placeholder components (load instantly)
  const DesktopPlaceholder = () => (
    <div 
      className="w-full aspect-[1434/530] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 relative overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
      onClick={handleClick}
    >
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-16 h-16 bg-gray-600 rounded-full opacity-20"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 bg-gray-600 rounded-full opacity-15"></div>
      <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-gray-600 transform rotate-45 opacity-10"></div>
      
      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          ATTARS CLOTHING
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-6">Premium Fashion & Custom Designs</p>
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Loading high-quality banner...</span>
        </div>
      </div>
      
      {/* Loading bar */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );

  const MobilePlaceholder = () => (
    <div 
      className="w-full aspect-[965/913] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 relative overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
      onClick={handleClick}
    >
      {/* Decorative background elements */}
      <div className="absolute top-8 right-8 grid grid-cols-4 gap-1">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-40"></div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">
          Express Your
          <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Unique Style
          </span>
        </h1>
        <p className="text-base text-gray-300 mb-6">Premium fashion apparel with custom design options</p>
        <div className="flex items-center gap-2 text-gray-400 mb-4">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    </div>
  );

  // Styled Fallback Component (for mobile when all images fail)
  const StyledFallback = () => (
    <section 
      className={`block md:hidden relative px-6 py-20 overflow-hidden cursor-pointer hover:opacity-95 transition-opacity ${className}`}
      style={{ backgroundColor: 'var(--color-surface)' }}
      onClick={handleClick}
    >
      <div className="absolute top-10 right-10 grid grid-cols-4 gap-2">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
        ))}
      </div>

      <div className="relative w-[96%] mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">
          Express Your
          <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Unique Style
          </span>
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Premium fashion apparel with custom design options.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/customize');
            }}
            className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105"
          >
            Create Custom Design
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/shop');
            }}
            className="border border-yellow-400 text-yellow-400 px-6 py-3 rounded-full font-semibold hover:bg-yellow-400 hover:text-gray-900 transition-all"
          >
            Shop Collection
          </button>
        </div>
      </div>
    </section>
  );

  if (showStyledFallback) {
    return <StyledFallback />;
  }

  const currentDesktopSrc = isHighQualityLoaded && !hasHighQualityError ? highQualityDesktop : finalFallbackDesktop;
  const currentMobileSrc = isHighQualityLoaded && !hasHighQualityError ? highQualityMobile : finalFallbackMobile;

  return (
    <section className={`w-full ${className}`}>
      <div className="relative w-full">
        {/* Conditionally render ONLY the appropriate device images */}
        {!isMobile ? (
          // Desktop Banner - Only rendered on desktop
          <div className="relative overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: '1434/530' }}>
              {/* Low-quality placeholder */}
              <img 
                src="/lq-banner.png"
                alt="Loading banner..."
                className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity duration-1000 ease-in-out ${
                  showHighQuality ? 'opacity-0' : 'opacity-100'
                }`}
                loading="eager"
                onClick={handleClick}
                onError={(e) => {
                  e.currentTarget.src = finalFallbackDesktop;
                }}
              />
              
              {/* High-quality desktop image */}
              <img 
                src={currentDesktopSrc}
                alt={alt}
                className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity duration-500 ease-in-out ${
                  isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="eager"
                onClick={handleClick}
                onError={() => handleImageError(false)}
              />
            </div>
          </div>
        ) : (
          // Mobile Banner - Only rendered on mobile
          <div className="relative overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: '965/913' }}>
              {/* Low-quality placeholder */}
              <img 
                src="/lq-mobile-banner.png"
                alt="Loading banner..."
                className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity duration-1000 ease-in-out ${
                  showHighQuality ? 'opacity-0' : 'opacity-100'
                }`}
                loading="eager"
                onClick={handleClick}
                onError={(e) => {
                  e.currentTarget.src = finalFallbackMobile;
                }}
              />
              
              {/* High-quality mobile image */}
              <img 
                src={currentMobileSrc}
                alt={`${alt} Mobile`}
                className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity duration-500 ease-in-out ${
                  isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="eager"
                onClick={handleClick}
                onError={() => handleImageError(true)}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProgressiveBanner;
