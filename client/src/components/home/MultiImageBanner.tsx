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
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (banners.length > 1 && !isDragging) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, interval);
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, banners, interval, isDragging]);

  // Handle drag/swipe start
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartPos(clientX);
    setDragStartTime(Date.now());
    resetTimeout();
  };

  // Handle drag/swipe move
  const handleDragMove = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const currentPosition = clientX;
    const diff = currentPosition - startPos;
    const containerWidth = containerRef.current.offsetWidth;
    
    // Calculate translate based on current index and drag distance
    const baseTranslate = -currentIndex * containerWidth;
    setCurrentTranslate(baseTranslate + diff);
  };

  // Handle drag/swipe end
  const handleDragEnd = () => {
    if (!isDragging || !containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const movedBy = currentTranslate + currentIndex * containerWidth;
    const dragDuration = Date.now() - dragStartTime;
    
    setIsDragging(false);
    
    // Determine if it was a click (short duration and minimal movement)
    const isClick = dragDuration < 200 && Math.abs(movedBy) < 5;
    
    if (isClick) {
      // Navigate to target URL on click
      window.location.href = banners[currentIndex].targetUrl;
      return;
    }
    
    // Swipe threshold - 30% of container width or fast swipe
    const swipeThreshold = containerWidth * 0.3;
    const velocity = Math.abs(movedBy) / dragDuration;
    const isFastSwipe = velocity > 0.5;
    
    let newIndex = currentIndex;
    
    if (movedBy < -swipeThreshold || (isFastSwipe && movedBy < 0)) {
      // Swipe left - next slide (with infinite loop)
      newIndex = (currentIndex + 1) % banners.length;
    } else if (movedBy > swipeThreshold || (isFastSwipe && movedBy > 0)) {
      // Swipe right - previous slide (with infinite loop)
      newIndex = (currentIndex - 1 + banners.length) % banners.length;
    }
    
    setCurrentIndex(newIndex);
    setCurrentTranslate(-newIndex * containerWidth);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative w-full overflow-hidden select-none"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="flex"
        style={{ 
          transform: isDragging 
            ? `translateX(${currentTranslate}px)` 
            : `translateX(-${currentIndex * 100}%)`,
          transition: isDragging ? 'none' : 'transform 500ms ease-in-out'
        }}
      >
        {banners.map((banner, index) => (
          <div key={index} className="w-full flex-shrink-0 pointer-events-none">
            <ProgressiveBanner
              highQualityDesktop={banner.highQualityDesktop}
              highQualityMobile={banner.highQualityMobile}
              finalFallbackDesktop={banner.finalFallbackDesktop}
              finalFallbackMobile={banner.finalFallbackMobile}
              alt={banner.alt}
              onClick={() => {}} // Handled by container
              showFlyingBirds={banner.hasFlyingBird}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10 pointer-events-auto">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
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
