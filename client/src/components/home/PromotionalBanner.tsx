import React from 'react';
import { X } from 'lucide-react';

interface PromotionalBannerProps {
  message: string;
  code?: string;
  onClose?: () => void;
}

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ message, code, onClose }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 text-center relative">
      <p className="text-sm font-medium">
        {message}{' '}
        {code && (
          <span className="font-bold bg-white/20 px-2 py-1 rounded ml-2">
            {code}
          </span>
        )}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default PromotionalBanner;
