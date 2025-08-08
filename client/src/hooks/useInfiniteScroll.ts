import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export const useInfiniteScroll = ({ 
  hasMore, 
  isLoading, 
  onLoadMore, 
  threshold = 300 
}: UseInfiniteScrollProps) => {
  const [isFetching, setIsFetching] = useState(false);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (loadingRef.current || !hasMore || isLoading) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // If user has scrolled to within threshold pixels of the bottom
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadingRef.current = true;
      setIsFetching(true);
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, threshold]);

  useEffect(() => {
    if (!isFetching) return;
    
    // Reset loading state after load more is called
    const timer = setTimeout(() => {
      setIsFetching(false);
      loadingRef.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [isFetching]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset loading ref when hasMore changes
  useEffect(() => {
    if (!hasMore) {
      loadingRef.current = false;
      setIsFetching(false);
    }
  }, [hasMore]);

  return { isFetching };
};
