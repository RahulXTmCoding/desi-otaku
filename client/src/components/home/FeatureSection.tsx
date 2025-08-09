import React from 'react';
import { Package, Shield, Headphones, Star, TrendingUp, Clock } from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureSection: React.FC = () => {
  const features: Feature[] = [
    {
      icon: <Package className="w-8 h-8 text-yellow-400" />,
      title: "FREE SHIPPING & RETURN",
      description: "We provide free shipping all over India and hassle-free 10 days return."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-400" />,
      title: "Assured Premium Quality",
      description: "Loved by more than 1 lakh+ fashion enthusiasts and counting."
    },
    {
      icon: <Headphones className="w-8 h-8 text-blue-400" />,
      title: "Full Customer Support",
      description: "Our passionate team is available to resolve your query."
    }
  ];

  return (
    <section className="py-12 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="w-[96%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="text-center group p-6 rounded-xl transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
