import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  product: string;
  date: string;
}

interface ReviewCarouselProps {
  reviews: Review[];
}

const ReviewCarousel: React.FC<ReviewCarouselProps> = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-[96%] mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--color-text)' }}>
          Reviews From Our Otaku's
        </h2>
        
        <div className="relative max-w-3xl mx-auto">
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-surface)', 
              border: '2px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all shadow-lg"
            style={{ 
              backgroundColor: 'var(--color-surface)', 
              border: '2px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="overflow-hidden px-12">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {reviews.map((review) => (
                <div key={review.id} className="w-full flex-shrink-0 text-center px-8">
                  <div 
                    className="rounded-2xl p-8 shadow-xl"
                    style={{ 
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex justify-center mb-4">
                      {renderStars(review.rating)}
                    </div>
                    <p 
                      className="text-lg italic mb-4 font-medium"
                      style={{ color: 'var(--color-text)', opacity: 0.9 }}
                    >
                      "{review.comment}"
                    </p>
                    <div className="text-sm">
                      <p className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                        {review.name}
                      </p>
                      <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                        {review.product}
                      </p>
                      <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                        {review.date}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center mt-6 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-yellow-400 w-6' 
                    : 'w-2'
                }`}
                style={{
                  backgroundColor: index === currentIndex ? undefined : 'var(--color-text)',
                  opacity: index === currentIndex ? 1 : 0.3
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewCarousel;
