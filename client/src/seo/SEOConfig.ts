// SEO Configuration for Attars Clothing - Premium Fashion Empire India

export interface SEOPageData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export const BASE_URL = 'https://attars.club'; // Production domain

export const DEFAULT_SEO = {
  siteName: 'Attars Club - Premium Fashion India',
  defaultTitle: 'Attars Club - Premium Fashion India | Attars',
  defaultDescription: 'Attars Club - Premium fashion destination in India. Shop at Attars for exclusive Streetwear, Anime, Indian Culture, TV Shows & Original Designs. Attars Fashion brings you the best in contemporary style with fast delivery across India.',
  defaultKeywords: [
    'attars',
    'attars club',
    'attars fashion',
    'attars clothing',
    'attars india',
    'premium fashion india',
    'premium streetwear india',
    'anime merchandise india',
    'indian culture apparel',
    'tv show merchandise india',
    'original streetwear designs',
    'designer clothing india',
    'streetwear brand india',
    'anime t-shirts india',
    'premium hoodies india',
    'oversized clothing india',
    'contemporary streetwear',
    'designer apparel india'
  ],
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@attars.club',
  facebookAppId: '', // Add your Facebook App ID
};

// Dynamic Category Templates for Scalable SEO
export const CATEGORY_SEO_TEMPLATES = {
  tshirts: {
    title: 'T-Shirts at Attars - Premium Anime & Culture Designs | Attars Club',
    description: 'Shop premium t-shirts at Attars Club. Browse Attars Fashion collection - anime merchandise, Indian culture designs, TV show apparel. Attars Clothing delivers premium quality across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars t-shirts',
      'premium t-shirts india',
      'anime t-shirts india',
      'indian culture t-shirts',
      'tv show merchandise india',
      'original design t-shirts',
      'streetwear t-shirts india',
      'designer tees india',
      'premium clothing india'
    ]
  },
  hoodies: {
    title: 'Hoodies at Attars - Premium Anime & Streetwear | Attars Club',
    description: 'Shop premium hoodies at Attars Club. Explore Attars Fashion hoodie collection - anime hoodies, streetwear designs, Indian culture prints. Attars Clothing delivers contemporary sweatshirts across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars hoodies',
      'premium hoodies india',
      'anime hoodies india',
      'streetwear hoodies india',
      'designer sweatshirts india',
      'indian culture hoodies',
      'original design hoodies',
      'contemporary streetwear india',
      'premium clothing india'
    ]
  },
  oversized: {
    title: 'Oversized Fashion at Attars - Premium Loose Fit | Attars Club',
    description: 'Shop oversized streetwear at Attars Club. Discover Attars Fashion oversized collection - loose fit t-shirts, hoodies, anime designs. Attars Clothing offers comfortable luxury fashion across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars oversized',
      'oversized streetwear india',
      'oversized t-shirts india',
      'oversized hoodies india',
      'loose fit clothing india',
      'premium oversized india',
      'contemporary streetwear',
      'anime oversized clothing',
      'designer oversized india'
    ]
  },
  anime: {
    title: 'Anime Merchandise at Attars - Premium Anime Fashion | Attars Club',
    description: 'Shop premium anime merchandise at Attars Club. Browse Attars Fashion anime collection - authentic anime t-shirts, hoodies, and streetwear. Attars Clothing delivers high-quality anime apparel across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars anime',
      'anime merchandise india',
      'anime t-shirts india',
      'anime hoodies india',
      'anime clothing india',
      'anime streetwear india',
      'premium anime apparel',
      'anime fashion india',
      'otaku merchandise india'
    ]
  },
  'indian-culture': {
    title: 'Indian Culture Apparel at Attars - Premium Heritage | Attars Club',
    description: 'Shop Indian culture apparel at Attars Club. Explore Attars Fashion heritage collection - cultural streetwear, traditional modern designs. Attars Clothing celebrates Indian culture with premium fashion.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars indian culture',
      'indian culture apparel',
      'heritage streetwear india',
      'cultural clothing india',
      'indian design t-shirts',
      'premium cultural wear',
      'traditional modern fashion',
      'india pride clothing',
      'desi streetwear'
    ]
  },
  'tv-shows': {
    title: 'TV Show Merchandise at Attars - Premium Pop Culture | Attars Club',
    description: 'Shop TV show merchandise at Attars Club. Browse Attars Fashion pop culture collection - series-inspired designs, entertainment fashion. Attars Clothing delivers premium pop culture apparel across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars tv shows',
      'tv show merchandise india',
      'pop culture apparel india',
      'series merchandise india',
      'entertainment clothing',
      'premium pop culture wear',
      'tv series t-shirts india',
      'show inspired fashion',
      'pop culture streetwear'
    ]
  },
  // Future categories - ready for expansion
  jeans: {
    title: 'Premium Jeans at Attars - Designer Denim Collection | Attars Club',
    description: 'Shop premium jeans at Attars Club. Discover Attars Fashion denim collection - designer jeans, luxury fit, contemporary styles. Attars Clothing delivers premium quality jeans across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars jeans',
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
    title: 'Designer Shirts at Attars - Premium Formal & Casual | Attars Club',
    description: 'Shop designer shirts at Attars Club. Browse Attars Fashion shirt collection - premium formal and casual shirts, luxury fabrics. Attars Clothing delivers contemporary designs for modern India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars shirts',
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
    title: 'Attars Club - Premium Fashion India | Attars',
    description: 'Attars Club - Premium fashion destination in India. Shop at Attars for exclusive streetwear, anime designs, and luxury apparel. Attars Fashion brings you the best in contemporary style with fast delivery across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars india',
      'premium fashion india',
      'designer clothing india',
      'luxury apparel india',
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
      name: 'Attars Club',
      alternateName: ['Attars', 'Attars Fashion', 'Attars Clothing'],
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
    title: 'Shop at Attars - Premium Fashion India | Attars Club',
    description: 'Shop at Attars Club for premium fashion India. Browse Attars Fashion collection - designer t-shirts, hoodies, oversized clothing & luxury apparel. Attars Clothing delivers across India with express shipping.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'shop attars',
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
    title: '{productName} - Buy at Attars | Attars Fashion',
    description: 'Buy {productName} at Attars Club - premium fashion item from Attars Fashion collection. Superior quality from Attars Clothing, available in multiple colors & sizes. Express shipping across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      '{productName}',
      'buy at attars',
      'premium fashion india',
      'designer clothing india',
      'luxury apparel india',
      'contemporary wear india',
      'fashion brand india',
      'premium quality india'
    ]
  },
  customize: {
    title: 'Custom Design at Attars - Create Your Fashion | Attars Club',
    description: 'Design custom fashion at Attars Club. Create your own Attars Fashion pieces with our design studio. Attars Clothing offers personalized premium apparel with quality guaranteed across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'custom design attars',
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
    title: 'About Attars - Premium Fashion Brand | Attars Club',
    description: 'About Attars Club - premium fashion brand India. Learn about Attars Fashion journey, Attars Clothing quality commitment, and our mission to deliver exceptional designer apparel across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'about attars',
      'premium fashion brand india',
      'luxury clothing brand india',
      'designer apparel brand india',
      'about attars clothing',
      'fashion brand story india',
      'premium brand india'
    ]
  },
  contact: {
    title: 'Contact Attars - Customer Support | Attars Club',
    description: 'Contact Attars Club for orders, support, and inquiries. Reach Attars Fashion team for custom designs and bulk orders. Attars Clothing customer service across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'contact attars',
      'contact attars clothing india',
      'customer support india',
      'fashion store contact india',
      'bulk order inquiry india',
      'premium fashion support',
      'designer clothing help india'
    ]
  },
  'size-guide': {
    title: 'Size Guide - Attars Fashion Sizing | Attars Club',
    description: 'Attars size guide for perfect fit. Find your size for Attars Fashion t-shirts, hoodies, and apparel. Attars Clothing size chart with measurements for all products.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars size guide',
      'size chart india',
      'clothing size guide',
      't-shirt size guide',
      'hoodie size guide',
      'fashion size chart'
    ]
  },
  'shipping-policy': {
    title: 'Shipping Policy - Attars Delivery | Attars Club',
    description: 'Attars Club shipping policy for India. Learn about Attars Fashion delivery options, Attars Clothing shipping times, and express delivery across India.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars shipping',
      'shipping policy india',
      'delivery policy',
      'fashion delivery india',
      'express shipping',
      'india delivery'
    ]
  },
  'return-policy': {
    title: 'Return Policy - Attars Returns & Exchange | Attars Club',
    description: 'Attars Club return policy for easy returns and exchanges. Return Attars Fashion items hassle-free. Attars Clothing return process for customer satisfaction.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars returns',
      'return policy india',
      'exchange policy',
      'fashion returns',
      'clothing exchange',
      'return process'
    ]
  },
  'cancellation-policy': {
    title: 'Cancellation Policy - Attars Order Cancellation | Attars Club',
    description: 'Attars Club cancellation policy for order changes. Cancel Attars Fashion orders easily. Attars Clothing cancellation process and refund policy.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars cancellation',
      'cancellation policy',
      'order cancellation',
      'cancel order',
      'refund policy',
      'order changes'
    ]
  },
  'terms-of-service': {
    title: 'Terms of Service - Attars Legal Terms | Attars Club',
    description: 'Attars Club terms of service and conditions. Legal terms for shopping at Attars Fashion. Attars Clothing terms and conditions for India customers.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars terms',
      'terms of service',
      'legal terms',
      'terms and conditions',
      'service terms',
      'website terms'
    ]
  },
  'privacy-policy': {
    title: 'Privacy Policy - Attars Data Protection | Attars Club',
    description: 'Attars Club privacy policy for customer data protection. How Attars Fashion protects your privacy. Attars Clothing data security and privacy commitment.',
    keywords: [
      'attars',
      'attars club',
      'attars fashion',
      'attars clothing',
      'attars privacy',
      'privacy policy',
      'data protection',
      'customer privacy',
      'data security',
      'privacy terms'
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
  name: 'Attars Club',
  alternateName: ['Attars', 'Attars Clothing', 'Attars Fashion', 'Attars India'],
  url: BASE_URL,
  logo: `${BASE_URL}/logo512.png`,
  description: 'Premium fashion store offering designer apparel, contemporary clothing, and curated fashion pieces',
  sameAs: [
    'https://www.facebook.com/attars.club',
    'https://www.instagram.com/attars.club',
    'https://twitter.com/attars.club'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-8299716657',
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
