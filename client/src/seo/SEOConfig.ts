// SEO Configuration for Desi Otaku - Custom T-Shirt Shop

export interface SEOPageData {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

export const BASE_URL = 'https://desiotaku.com'; // Update with your actual domain

export const DEFAULT_SEO = {
  siteName: 'Desi Otaku - Custom Anime T-Shirts & Merchandise',
  defaultTitle: 'Desi Otaku - Custom Anime T-Shirts, Oversized Tees & Hoodies India',
  defaultDescription: 'Shop premium anime t-shirts, oversized tees, hoodies & custom merchandise in India. Express your anime passion with Naruto, One Piece, Demon Slayer designs. Free shipping on orders above ₹999.',
  defaultKeywords: [
    'anime t-shirts india',
    'custom t-shirt design',
    'oversized t-shirts',
    'anime merchandise india',
    'anime hoodies',
    'otaku clothing',
    'custom anime shirts',
    'printed t-shirts online',
    'anime clothing brand india',
    'oversized anime tees',
    'graphic t-shirts',
    'anime merch store'
  ],
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@desiotaku',
  facebookAppId: '', // Add your Facebook App ID
};

export const PAGE_SEO_DATA: Record<string, SEOPageData> = {
  home: {
    title: 'Desi Otaku - Custom Anime T-Shirts, Oversized Tees & Hoodies India',
    description: 'Shop premium anime t-shirts, oversized tees & custom merchandise. Express your anime passion with designs from Naruto, One Piece, Demon Slayer & more. Free shipping on orders above ₹999.',
    keywords: [
      'anime t-shirts india',
      'custom t-shirt printing',
      'oversized t-shirts online',
      'anime merchandise',
      'otaku store india',
      'anime hoodies india',
      'custom design t-shirts',
      'printed t-shirts',
      'anime clothing brand'
    ],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Desi Otaku',
      url: BASE_URL,
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
    title: 'Shop Anime T-Shirts, Oversized Tees & Hoodies - Desi Otaku',
    description: 'Browse our collection of anime t-shirts, oversized tees, hoodies & sweatshirts. Find designs from popular anime like Naruto, One Piece, Attack on Titan. Sizes S-XXL available.',
    keywords: [
      'buy anime t-shirts',
      'oversized t-shirts india',
      'anime hoodies online',
      'graphic tees india',
      'printed t-shirts',
      'anime clothing',
      'otaku merchandise',
      'anime sweatshirts'
    ]
  },
  product: {
    title: '{productName} - Anime T-Shirt | Desi Otaku',
    description: 'Buy {productName} anime t-shirt online. Premium quality, 100% cotton, available in multiple colors & sizes (S-XXL). Express shipping across India.',
    keywords: [
      '{productName} t-shirt',
      'anime t-shirt',
      'printed t-shirt india',
      'graphic tee',
      'cotton t-shirt',
      'anime merchandise'
    ]
  },
  customize: {
    title: 'Create Custom Anime T-Shirt Design Online - Desi Otaku',
    description: 'Design your own custom anime t-shirt with our easy-to-use designer. Upload your artwork, add text, choose colors & create unique anime merchandise. No minimum order.',
    keywords: [
      'custom t-shirt design',
      'create custom t-shirt',
      'design your own t-shirt',
      'custom anime shirts',
      'personalized t-shirts',
      'custom printing india',
      't-shirt designer online',
      'make your own t-shirt'
    ]
  },
  about: {
    title: 'About Desi Otaku - Premium Anime Clothing Brand India',
    description: 'Desi Otaku is India\'s premier anime clothing brand offering high-quality t-shirts, hoodies & merchandise. Join the otaku community and express your anime passion.',
    keywords: [
      'anime clothing brand',
      'otaku store india',
      'anime merchandise india',
      'about desi otaku',
      'anime fashion brand'
    ]
  },
  contact: {
    title: 'Contact Desi Otaku - Customer Support & Inquiries',
    description: 'Get in touch with Desi Otaku for orders, custom designs, bulk inquiries or support. We\'re here to help with your anime merchandise needs.',
    keywords: [
      'contact desi otaku',
      'customer support',
      'anime store contact',
      'bulk order inquiry'
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
    name: 'Desi Otaku'
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
      name: 'Desi Otaku'
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
  name: 'Desi Otaku',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: 'Premium anime clothing brand in India offering custom t-shirts, hoodies, and merchandise',
  sameAs: [
    'https://www.facebook.com/desiotaku',
    'https://www.instagram.com/desiotaku',
    'https://twitter.com/desiotaku'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXXXXXXXX', // Add your contact number
    contactType: 'customer service',
    areaServed: 'IN',
    availableLanguage: ['en', 'hi']
  }
};

// FAQ structured data for common questions
export const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What sizes are available for anime t-shirts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our anime t-shirts are available in sizes S, M, L, XL, and XXL. We offer both regular fit and oversized options.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I create custom anime t-shirt designs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! You can create custom anime t-shirt designs using our online designer. Upload your artwork or choose from our design library.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the delivery time for orders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard delivery takes 5-7 business days. Express shipping (2-3 days) is available. Custom designs may take an additional 2-3 days.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you offer international shipping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Currently, we ship across India. International shipping will be available soon.'
      }
    }
  ]
};
