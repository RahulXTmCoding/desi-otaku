import React from 'react';
import { Sparkles, Star, Zap, Crown, Heart } from 'lucide-react';

interface BannerItem {
  icon: React.ReactNode;
  text: string;
}

const FashionScrollBanner: React.FC = () => {
  const bannerItems: BannerItem[] = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      text: "FEEL TRENDY"
    },
    {
      icon: <Star className="w-6 h-6" />,
      text: "FEEL AUTHENTIC"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      text: "FEEL CONFIDENT"
    },
    {
      icon: <Crown className="w-6 h-6" />,
      text: "FEEL PREMIUM"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      text: "FEEL STYLISH"
    },
    {
      icon: <Star className="w-6 h-6" />,
      text: "FEEL UNIQUE"
    }
  ];

  // Duplicate items for seamless loop
  const duplicatedItems = [...bannerItems, ...bannerItems];

  return (
    <div className="w-full bg-black text-white overflow-hidden relative z-40 py-4">
      <div className="flex animate-scroll">
        {duplicatedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-12 whitespace-nowrap"
          >
            <span className="text-white flex-shrink-0">
              {item.icon}
            </span>
            <span className="text-white text-3xl md:text-4xl lg:text-5xl font-bold tracking-wider">
              {item.text}
            </span>
            <span className="text-white text-3xl md:text-4xl lg:text-5xl mx-8">
              ✱
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

export default FashionScrollBanner;
