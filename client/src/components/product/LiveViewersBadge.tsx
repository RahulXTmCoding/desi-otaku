import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

/**
 * Self-contained "live viewers" badge.
 * Keeps its own interval so it doesn't trigger re-renders in the parent.
 */
const LiveViewersBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 15) + 8);

  useEffect(() => {
    // Use a stable interval — random delay only on mount, not on every tick
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(5, Math.min(25, prev + change));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      <Eye className="w-3 h-3 inline mr-1" />
      {count} viewing now
    </span>
  );
};

export default LiveViewersBadge;
