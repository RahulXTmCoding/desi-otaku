import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Percent, Clock } from 'lucide-react';

interface BannerItem {
  icon: React.ReactNode;
  text: string;
}

const InfiniteScrollBanner: React.FC = () => {
  const bannerItems: BannerItem[] = [
    {
      icon: <Truck className="w-4 h-4" />,
      text: "FREE DELIVERY FROM ₹999"
    },
    {
      icon: <Percent className="w-4 h-4" />,
      text: "30-40% OFF ON ALL CLOTHING"
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      text: "GUARANTED PREMIUM QUALITY"
    },
    {
      icon: <Percent className="w-4 h-4" />,
      text: "BULK ORDERS - SPECIAL DISCOUNTS"
    },
    {
      icon: <Clock className="w-4 h-4" />,
      text: "24/7 CUSTOMER SUPPORT"
    },
    {
      icon: <RotateCcw className="w-4 h-4" />,
      text: "RETURNS ACCEPTED TILL 7 DAYS"
    }
  ];

  // Duplicate items for seamless loop
  const duplicatedItems = [...bannerItems, ...bannerItems];

  return (
    <div className="w-full bg-gray-900 text-white border-b border-gray-800 overflow-hidden relative z-50">
      <div className="flex animate-scroll">
        {duplicatedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-8 py-3 whitespace-nowrap text-sm font-medium"
          >
            <span className="text-yellow-400 flex-shrink-0">
              {item.icon}
            </span>
            <span className="text-gray-100">
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes infinite-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: infinite-scroll 30s linear infinite;
          width: fit-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .animate-scroll {
            animation-duration: 25s;
          }
        }
      `}</style>
    </div>
  );
};

export default InfiniteScrollBanner;
