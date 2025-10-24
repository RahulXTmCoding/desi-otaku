import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  material?: string;
  features?: string[];
  careInstructions?: string[];
}

interface ProductTabsProps {
  product: Product;
  productType: string;
  defaultMaterial: string;
  // defaultFeatures: string[];
  defaultCareInstructions: string[];
}

const ProductTabs: React.FC<ProductTabsProps> = ({
  product,
  productType,
  defaultMaterial,
  // defaultFeatures,
  defaultCareInstructions
}) => {
  const [activeTab, setActiveTab] = useState('description');

  const tabs = [
    { id: 'description', label: 'Description' },
    // { id: 'features', label: 'Features' },
    { id: 'care', label: 'Care Instructions' }
  ];

  return (
    <div className="md:mt-12 mt-8">
      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 capitalize font-medium transition-all relative hover:scale-105 transform`}
              style={{ 
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-textMuted)' 
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" 
                  style={{ backgroundColor: 'var(--color-primary)' }} 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === 'description' && (
          <div className="prose prose-invert max-w-none">
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-lg leading-relaxed mb-4" style={{ color: 'var(--color-text)' }}>
                {product.description}
              </p>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-xl" style={{ color: 'var(--color-text)' }}>
                  Material & Quality
                </h4>
                <p className="text-lg" style={{ color: 'var(--color-text)' }}>
                  {product.material || defaultMaterial}
                </p>
                
                {productType !== 'default' && (
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                      Product Type: {productType === 'printed-tee' ? 'Premium T-Shirt' : 
                                   productType === 'oversized' ? 'Oversized Fit' : 
                                   productType === 'hoodie' ? 'Hoodie/Sweatshirt' : 'Standard'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* {activeTab === 'features' && (
          <div className="grid md:grid-cols-2 gap-6">
            {(product.features || defaultFeatures).map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 p-4 rounded-xl hover:scale-105 transform transition-all"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <Check className="w-4 h-4" style={{ color: 'var(--color-primaryText)' }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {feature}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )} */}

        {activeTab === 'care' && (
          <div className="grid md:grid-cols-2 gap-4">
            {(product.careInstructions || defaultCareInstructions).map((instruction, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 p-4 rounded-xl hover:scale-105 transform transition-all"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div 
                  className="w-3 h-3 rounded-full mt-2 flex-shrink-0" 
                  style={{ backgroundColor: 'var(--color-primary)' }} 
                />
                <p style={{ color: 'var(--color-text)' }}>
                  {instruction}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quality Guarantee Section */}
      <div className="mt-1 p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h4 className="font-bold text-lg mb-3" style={{ color: 'var(--color-primary)' }}>Quality Guarantee</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Check className="w-4 h-4" style={{ color: 'var(--color-primaryText)' }} />
            </div>
            <span style={{ color: 'var(--color-text)' }}>Premium Materials</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Check className="w-4 h-4" style={{ color: 'var(--color-primaryText)' }} />
            </div>
            <span style={{ color: 'var(--color-text)' }}>Quality Tested</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Check className="w-4 h-4" style={{ color: 'var(--color-primaryText)' }} />
            </div>
            <span style={{ color: 'var(--color-text)' }}>Satisfaction Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTabs;
