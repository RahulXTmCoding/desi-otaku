import React, { useState, useEffect, useRef } from 'react';
import ProgressiveBanner from '../ProgressiveBanner'; // Import ProgressiveBanner

interface Banner {
  highQualityDesktop: string;
  highQualityMobile: string;
  finalFallbackDesktop: string;
  finalFallbackMobile: string;
  alt: string;
  targetUrl: string;
  hasFlyingBird?: boolean;
}

interface MultiImageBannerProps {
  banners: Banner[];
  interval?: number; // Interval in milliseconds for automatic banner change
}

const MultiImageBanner: React.FC<MultiImageBannerProps> = ({ banners, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (banners.length > 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, interval);
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, banners, interval]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={index} className="w-full flex-shrink-0">
            <ProgressiveBanner
              highQualityDesktop={banner.highQualityDesktop}
              highQualityMobile={banner.highQualityMobile}
              finalFallbackDesktop={banner.finalFallbackDesktop}
              finalFallbackMobile={banner.finalFallbackMobile}
              alt={banner.alt}
              onClick={() => window.location.href = banner.targetUrl}
              showFlyingBirds={banner.hasFlyingBird}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  currentIndex === index ? 'bg-white' : 'bg-gray-500'
                } hover:bg-white transition-colors`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MultiImageBanner;
