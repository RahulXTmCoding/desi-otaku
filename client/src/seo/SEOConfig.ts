// SEO Configuration for Attars Clothing - Premium Fashion Empire India

export interface SEOPageData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export const BASE_URL = 'https://attarsclothing.com'; // Update with your actual domain

export const DEFAULT_SEO = {
  siteName: 'Attars Clothing - Premium Fashion India',
  defaultTitle: 'Attars Clothing - Premium Fashion India | Designer Apparel, T-Shirts, Hoodies & More',
  defaultDescription: 'Discover premium fashion at Attars Clothing India. Shop our exclusive collection of designer t-shirts, hoodies, oversized clothing, and luxury apparel. Fast delivery across India with premium quality guaranteed.',
  defaultKeywords: [
    'premium fashion india',
    'designer clothing india',
    'attars clothing',
    'premium apparel india',
    'designer t-shirts india',
    'luxury fashion india',
    'premium hoodies india',
    'oversized clothing india',
    'designer wear india',
    'premium brand india',
    'luxury apparel india',
    'fashion store india'
  ],
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@attarsclothing',
  facebookAppId: '', // Add your Facebook App ID
};

// Dynamic Category Templates for Scalable SEO
export const CATEGORY_SEO_TEMPLATES = {
  tshirts: {
    title: 'Premium T-Shirts India - Designer Cotton Tees | Attars Clothing',
    description: 'Shop premium t-shirts India at Attars Clothing. Designer cotton tees, luxury prints, and custom designs. Free shipping across India. Sizes S-XXL available.',
    keywords: [
      'premium t-shirts india',
      'designer t-shirts india',
      'luxury t-shirts india',
      'premium cotton tees india',
      'designer tees india',
      'custom t-shirts india',
      'premium clothing india'
    ]
  },
  hoodies: {
    title: 'Designer Hoodies India - Premium Sweatshirts & Hoodies | Attars Clothing',
    description: 'Shop designer hoodies India at Attars Clothing. Premium sweatshirts, luxury hoodies, and comfortable designs. Express delivery across India.',
    keywords: [
      'designer hoodies india',
      'premium hoodies india',
      'luxury sweatshirts india',
      'premium hoodies india',
      'designer sweatshirts india',
      'winter wear india',
      'premium clothing india'
    ]
  },
  oversized: {
    title: 'Oversized Clothing India - Premium Loose Fit Fashion | Attars Clothing',
    description: 'Shop oversized clothing India at Attars Clothing. Premium loose fit t-shirts, hoodies, and contemporary streetwear. Comfortable luxury fashion.',
    keywords: [
      'oversized clothing india',
      'oversized t-shirts india',
      'oversized hoodies india',
      'loose fit clothing india',
      'streetwear india',
      'premium oversized india',
      'contemporary fashion india'
    ]
  },
  // Future categories - ready for expansion
  jeans: {
    title: 'Premium Jeans India - Designer Denim Collection | Attars Clothing',
    description: 'Shop premium jeans India at Attars Clothing. Designer denim, luxury fit, and contemporary styles. Premium quality jeans with India delivery.',
    keywords: [
      'premium jeans india',
      'designer jeans india',
      'luxury denim india',
      'premium denim india',
      'designer denim india',
      'fashion jeans india',
      'premium clothing india'
    ]
  },
  shirts: {
    title: 'Designer Shirts India - Premium Formal & Casual Shirts | Attars Clothing',
    description: 'Shop designer shirts India at Attars Clothing. Premium formal and casual shirts, luxury fabrics, and contemporary designs for modern India.',
    keywords: [
      'designer shirts india',
      'premium shirts india',
      'luxury shirts india',
      'formal shirts india',
      'casual shirts india',
      'premium clothing india',
      'designer wear india'
    ]
  }
};

// Enhanced Keywords for India Premium Fashion Market
export const INDIA_FASHION_KEYWORDS = {
  primary: [
    'premium fashion india',
    'designer clothing india',
    'luxury apparel india',
    'premium brand india',
    'designer wear india',
    'luxury fashion india'
  ],
  geographic: [
    'premium fashion mumbai',
    'designer clothing delhi',
    'luxury apparel bangalore',
    'premium fashion chennai',
    'designer wear kolkata',
    'luxury clothing pune'
  ],
  productSpecific: [
    'premium t-shirts india',
    'designer hoodies india',
    'oversized clothing india',
    'luxury streetwear india',
    'premium casual wear india',
    'designer fashion india'
  ]
};

export const PAGE_SEO_DATA: Record<string, SEOPageData> = {
  home: {
    title: 'Attars Clothing - Premium Fashion India | Designer T-Shirts, Hoodies & Luxury Apparel',
    description: 'Discover premium fashion at Attars Clothing India. Shop our exclusive collection of designer t-shirts, hoodies, oversized clothing, and luxury apparel. Fast delivery across India with premium quality guaranteed.',
    keywords: [
      'premium fashion india',
      'designer clothing india',
      'luxury apparel india',
      'attars clothing',
      'premium brand india',
      'designer t-shirts india',
      'premium hoodies india',
      'oversized clothing india',
      'fashion store india',
      'luxury fashion india',
      'designer wear india',
      'premium apparel india'
    ],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Attars Clothing - Premium Fashion India',
      url: BASE_URL,
      description: 'Premium fashion brand offering designer t-shirts, hoodies, oversized clothing and luxury apparel across India',
      areaServed: 'IN',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/shop?search={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    }
  },
  shop: {
    title: 'Shop Premium Fashion India - Designer T-Shirts, Hoodies & Luxury Apparel | Attars Clothing',
    description: 'Browse our collection of premium fashion India. Designer t-shirts, hoodies, oversized clothing & luxury apparel. Free shipping across India. Sizes S-XXL available with express delivery.',
    keywords: [
      'shop premium fashion india',
      'buy designer clothing india',
      'luxury apparel india',
      'premium t-shirts india',
      'designer hoodies india',
      'oversized clothing india',
      'fashion store india',
      'premium wear india',
      'designer apparel india',
      'luxury fashion india'
    ]
  },
  product: {
    title: '{productName} - Premium Fashion India | Attars Clothing',
    description: 'Buy {productName} premium fashion item online in India. Superior quality, contemporary design, available in multiple colors & sizes (S-XXL). Express shipping across India.',
    keywords: [
      '{productName}',
      'premium fashion india',
      'designer clothing india',
      'luxury apparel india',
      'contemporary wear india',
      'fashion brand india',
      'premium quality india'
    ]
  },
  customize: {
    title: 'Custom Fashion Design India - Create Your Own Premium Apparel | Attars Clothing',
    description: 'Design your own custom fashion pieces in India with Attars Clothing. Upload your artwork, choose colors & create unique premium apparel. Quality guaranteed with India delivery.',
    keywords: [
      'custom fashion design india',
      'create custom clothing india',
      'design your own apparel india',
      'custom premium fashion india',
      'personalized clothing india',
      'custom printing india',
      'fashion designer online india',
      'make your own clothes india'
    ]
  },
  about: {
    title: 'About Attars Clothing - Premium Fashion Brand India',
    description: 'Attars Clothing is a premium fashion brand India offering high-quality designer apparel, t-shirts, hoodies & contemporary clothing. Discover our commitment to quality and style in India.',
    keywords: [
      'premium fashion brand india',
      'luxury clothing brand india',
      'designer apparel brand india',
      'about attars clothing',
      'fashion brand story india',
      'premium brand india'
    ]
  },
  contact: {
    title: 'Contact Attars Clothing India - Customer Support & Fashion Inquiries',
    description: 'Get in touch with Attars Clothing for orders, custom designs, bulk inquiries or support in India. We\'re here to help with your premium fashion needs across India.',
    keywords: [
      'contact attars clothing india',
      'customer support india',
      'fashion store contact india',
      'bulk order inquiry india',
      'premium fashion support',
      'designer clothing help india'
    ]
  }
};

// Product structured data template
export const getProductStructuredData = (product: any) => ({
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: product.name,
  image: product.images || [],
  description: product.description,
  sku: product._id,
  brand: {
    '@type': 'Brand',
    name: 'Attars Clothing'
  },
  offers: {
    '@type': 'Offer',
    url: `${BASE_URL}/product/${product._id}`,
    priceCurrency: 'INR',
    price: product.price,
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: 'Attars Clothing'
    }
  },
  aggregateRating: product.rating ? {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount || 0
  } : undefined
});

// Breadcrumb structured data
export const getBreadcrumbStructuredData = (items: Array<{name: string, url: string}>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

// Organization structured data
export const ORGANIZATION_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Attars Clothing',
  url: BASE_URL,
  logo: `${BASE_URL}/logo512.png`,
  description: 'Premium fashion store offering designer apparel, contemporary clothing, and curated fashion pieces',
  sameAs: [
    'https://www.facebook.com/attarsclothing',
    'https://www.instagram.com/attarsclothing',
    'https://twitter.com/attarsclothing'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXXXXXXXX', // Add your contact number
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['en', 'hi']
  }
};

// FAQ structured data for common questions - AI Platform Optimized
export const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What premium fashion items does Attars Clothing offer in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Attars Clothing offers premium fashion including designer t-shirts, hoodies, oversized clothing, and plans to expand to jeans and shirts. All items feature luxury quality and contemporary designs delivered across India.'
      }
    },
    {
      '@type': 'Question',
      name: 'What sizes are available for premium fashion items?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our premium fashion items are available in sizes S, M, L, XL, and XXL. We offer both regular fit and oversized options for different style preferences across all our designer clothing.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I create custom premium fashion designs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can create custom premium fashion designs using our online designer. Upload your artwork, choose from our design library, and create personalized luxury apparel with guaranteed quality.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the delivery time for premium fashion orders in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard delivery takes 5-7 business days across India. Express shipping (2-3 days) is available for faster delivery. Custom premium designs may take an additional 2-3 days for personalization.'
      }
    },
    {
      '@type': 'Question',
      name: 'Why choose Attars Clothing for premium fashion in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Attars Clothing offers authentic premium fashion with designer quality, luxury materials, contemporary designs, custom options, and reliable delivery across India. We focus on premium craftsmanship and customer satisfaction.'
      }
    }
  ]
};

// AI Platform Optimization - Comprehensive Brand Data
export const AI_PLATFORM_DATA = {
  brand: {
    name: 'Attars Clothing',
    description: 'Premium fashion brand specializing in designer apparel across India',
    categories: ['t-shirts', 'hoodies', 'oversized-clothing', 'jeans', 'shirts'],
    targetMarket: 'India',
    priceSegment: 'Premium',
    specialties: [
      'Premium quality materials',
      'Contemporary designs', 
      'Custom fashion design',
      'Express delivery across India',
      'Designer craftsmanship'
    ],
    productRange: {
      current: ['Premium T-Shirts', 'Designer Hoodies', 'Oversized Clothing'],
      upcoming: ['Premium Jeans', 'Designer Shirts', 'Luxury Accessories']
    },
    serviceAreas: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'All India'],
    keyFeatures: [
      'Premium fashion India',
      'Designer clothing online',
      'Custom apparel design',
      'Luxury quality guarantee',
      'Fast India delivery'
    ]
  }
};

// Dynamic Category Structured Data Generator
export const getCategoryStructuredData = (categoryName: string, products: any[]) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `Premium ${categoryName} India - Attars Clothing`,
  description: `Shop premium ${categoryName} collection in India. Designer quality, luxury materials, contemporary designs with express delivery.`,
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        category: `Fashion/${categoryName}`,
        brand: 'Attars Clothing',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: product.price,
          availability: 'https://schema.org/InStock'
        }
      }
    }))
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${BASE_URL}/shop`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Premium ${categoryName}`,
        item: `${BASE_URL}/shop/${categoryName}`
      }
    ]
  }
});

// Enhanced Product Structured Data with AI Optimization
export const getEnhancedProductStructuredData = (product: any, category?: string) => ({
  '@context': 'https://schema.org/',
  '@type': 'Product',
  name: product.name,
  description: product.description || `Premium ${category || 'fashion'} item from Attars Clothing India. Designer quality with luxury materials and contemporary design.`,
  image: product.images || [],
  sku: product._id,
  category: `Fashion/${category || 'Apparel'}`,
  brand: {
    '@type': 'Brand',
    name: 'Attars Clothing',
    description: 'Premium fashion brand India'
  },
  manufacturer: {
    '@type': 'Organization',
    name: 'Attars Clothing',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN'
    }
  },
  offers: {
    '@type': 'Offer',
    url: `${BASE_URL}/product/${product._id}`,
    priceCurrency: 'INR',
    price: product.price,
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    availability: product.totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'IN'
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 1,
          maxValue: 2,
          unitCode: 'DAY'
        },
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: 3,
          maxValue: 7,
          unitCode: 'DAY'
        }
      }
    },
    seller: {
      '@type': 'Organization',
      name: 'Attars Clothing',
      url: BASE_URL
    }
  },
  aggregateRating: product.averageRating ? {
    '@type': 'AggregateRating',
    ratingValue: product.averageRating,
    reviewCount: product.totalReviews || 0,
    bestRating: 5,
    worstRating: 1
  } : undefined,
  additionalProperty: [
    {
      '@type': 'PropertyValue',
      name: 'Material Quality',
      value: 'Premium'
    },
    {
      '@type': 'PropertyValue', 
      name: 'Design Style',
      value: 'Contemporary'
    },
    {
      '@type': 'PropertyValue',
      name: 'Target Market',
      value: 'India'
    }
  ]
});
