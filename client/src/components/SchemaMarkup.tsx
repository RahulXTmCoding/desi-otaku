import React from 'react';
import { brandConfig } from '../config/brandConfig';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  images?: Array<{ url?: string }>;
  category: { name: string };
  stock: number;
  averageRating?: number;
  totalReviews?: number;
  slug?: string;
}

interface SchemaMarkupProps {
  product: Product;
}

const SchemaMarkup: React.FC<SchemaMarkupProps> = ({ product }) => {
  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.[0]?.url || '',
    description: product.description,
    sku: product._id,
    mpn: product._id,
    brand: {
      '@type': 'Brand',
      name: brandConfig.name,
    },
    offers: {
      '@type': 'Offer',
      url: `${brandConfig.baseUrl}/product/${product.slug || product._id}`,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: brandConfig.name,
      },
    },
    aggregateRating: product.averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.totalReviews,
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default SchemaMarkup;
