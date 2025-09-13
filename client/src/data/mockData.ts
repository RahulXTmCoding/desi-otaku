export interface MockProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
  photoUrl?: string;
  images?: Array<{
    url?: string;
    isPrimary?: boolean;
  }>;
  category: {
    _id: string;
    name: string;
  };
  stock: number;
  sold: number;
  mrp?: number;
  discount?: number;
  discountPercentage?: number;
  rating?: number;
  reviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MockCategory {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export const mockCategories: MockCategory[] = [
  { _id: '1', name: 'Anime', createdAt: '2024-01-01' },
  { _id: '2', name: 'Brand', createdAt: '2024-01-01' },
  { _id: '3', name: 'Limited Edition', createdAt: '2024-01-01' },
  { _id: '4', name: 'Summer Collection', createdAt: '2024-01-01' },
];

export const mockProducts: MockProduct[] = [
  {
    _id: '1',
    name: 'Naruto Sage Mode Premium',
    price: 599,
    mrp: 799,
    description: 'Premium quality t-shirt featuring Naruto in Sage Mode. Made from 100% cotton with vibrant print quality.',
    images: [
      { url: '/front-black.avif', isPrimary: true },
      { url: '/back-black.avif', isPrimary: false }
    ],
    category: { _id: '1', name: 'Anime' },
    stock: 25,
    sold: 45,
    rating: 4.5,
    reviews: 45,
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    name: 'Attack on Titan Wings',
    price: 649,
    mrp: 899,
    description: 'Show your dedication with the Wings of Freedom design. Comfortable fit with lasting print quality.',
    images: [
      { url: '/front-gray.avif', isPrimary: true },
      { url: '/back-gray.avif', isPrimary: false }
    ],
    category: { _id: '1', name: 'Anime' },
    stock: 15,
    sold: 30,
    rating: 4.7,
    reviews: 30,
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    name: 'Brand Logo Classic',
    price: 449,
    mrp: 599,
    description: 'Our classic brand logo t-shirt. Minimalist design for everyday wear.',
    images: [
      { url: '/front-white.avif', isPrimary: true },
      { url: '/back-white.avif', isPrimary: false }
    ],
    category: { _id: '2', name: 'Brand' },
    stock: 50,
    sold: 20,
    rating: 4.2,
    reviews: 20,
    createdAt: '2024-01-10',
  },
  {
    _id: '4',
    name: 'Demon Slayer Pattern',
    price: 699,
    mrp: 999,
    description: 'Intricate pattern design inspired by Demon Slayer. Premium fabric with detailed printing.',
    images: [
      { url: '/front-red.avif', isPrimary: true },
      { url: '/back-red.avif', isPrimary: false }
    ],
    category: { _id: '1', name: 'Anime' },
    stock: 5,
    sold: 60,
    rating: 4.8,
    reviews: 60,
    createdAt: '2024-01-25',
  },
  {
    _id: '5',
    name: 'One Piece Straw Hat',
    price: 549,
    mrp: 749,
    description: 'Join the Straw Hat crew with this iconic design. Comfortable and stylish.',
    images: [
      { url: '/front-navy.avif', isPrimary: true },
      { url: '/back-navy.avif', isPrimary: false }
    ],
    category: { _id: '1', name: 'Anime' },
    stock: 30,
    sold: 35,
    rating: 4.4,
    reviews: 35,
    createdAt: '2024-01-18',
  },
  {
    _id: '6',
    name: 'Neon Brand Limited',
    price: 899,
    mrp: 1299,
    description: 'Limited edition neon design. Only 100 pieces available worldwide.',
    images: [
      { url: '/front-yellow.avif', isPrimary: true },
      { url: '/back-yellow.avif', isPrimary: false }
    ],
    category: { _id: '3', name: 'Limited Edition' },
    stock: 3,
    sold: 97,
    rating: 4.9,
    reviews: 97,
    createdAt: '2024-02-01',
  },
  {
    _id: '7',
    name: 'Summer Vibes Collection',
    price: 499,
    mrp: 699,
    description: 'Light and breezy design perfect for summer. Made with moisture-wicking fabric.',
    images: [
      { url: '/front-green.avif', isPrimary: true },
      { url: '/back-green.avif', isPrimary: false }
    ],
    category: { _id: '4', name: 'Summer Collection' },
    stock: 40,
    sold: 15,
    rating: 4.1,
    reviews: 15,
    createdAt: '2024-01-30',
  },
  {
    _id: '8',
    name: 'My Hero Academia Plus Ultra',
    price: 599,
    mrp: 799,
    description: 'Go beyond with this Plus Ultra design. Show your hero spirit!',
    images: [
      { url: '/front-purple.avif', isPrimary: true },
      { url: '/back-purple.avif', isPrimary: false }
    ],
    category: { _id: '1', name: 'Anime' },
    stock: 0,
    sold: 50,
    rating: 4.6,
    reviews: 50,
    createdAt: '2024-01-22',
  },
  {
    _id: '9',
    name: 'Tokyo Ghoul Mask',
    price: 679,
    mrp: 899,
    description: 'Mysterious and stylish Tokyo Ghoul mask design. Dark theme for anime fans.',
    images: [
      { url: '/front-black.avif', isPrimary: true },
      { url: '/back-black.avif', isPrimary: false }
    ],
    category: { _id: '1', name: 'Anime' },
    stock: 20,
    sold: 25,
    rating: 4.3,
    reviews: 25,
    createdAt: '2024-01-28',
  },
  {
    _id: '10',
    name: 'Brand Minimalist Black',
    price: 399,
    mrp: 499,
    description: 'Simple yet elegant black t-shirt with subtle branding. Perfect for any occasion.',
    images: [
      { url: '/front-black.avif', isPrimary: true },
      { url: '/back-black.avif', isPrimary: false }
    ],
    category: { _id: '2', name: 'Brand' },
    stock: 100,
    sold: 10,
    rating: 4.0,
    reviews: 10,
    createdAt: '2024-01-05',
  },
];

// Helper function to get mock product image
export const getMockProductImage = (productId: string): string => {
  // Return a placeholder image URL - you can replace with actual images later
  return `/api/placeholder/300/350`;
};
