export interface MockProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  stock: number;
  sold: number;
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
    description: 'Premium quality t-shirt featuring Naruto in Sage Mode. Made from 100% cotton with vibrant print quality.',
    category: { _id: '1', name: 'Anime' },
    stock: 25,
    sold: 45,
    createdAt: '2024-01-15',
  },
  {
    _id: '2',
    name: 'Attack on Titan Wings',
    price: 649,
    description: 'Show your dedication with the Wings of Freedom design. Comfortable fit with lasting print quality.',
    category: { _id: '1', name: 'Anime' },
    stock: 15,
    sold: 30,
    createdAt: '2024-01-20',
  },
  {
    _id: '3',
    name: 'Brand Logo Classic',
    price: 449,
    description: 'Our classic brand logo t-shirt. Minimalist design for everyday wear.',
    category: { _id: '2', name: 'Brand' },
    stock: 50,
    sold: 20,
    createdAt: '2024-01-10',
  },
  {
    _id: '4',
    name: 'Demon Slayer Pattern',
    price: 699,
    description: 'Intricate pattern design inspired by Demon Slayer. Premium fabric with detailed printing.',
    category: { _id: '1', name: 'Anime' },
    stock: 5,
    sold: 60,
    createdAt: '2024-01-25',
  },
  {
    _id: '5',
    name: 'One Piece Straw Hat',
    price: 549,
    description: 'Join the Straw Hat crew with this iconic design. Comfortable and stylish.',
    category: { _id: '1', name: 'Anime' },
    stock: 30,
    sold: 35,
    createdAt: '2024-01-18',
  },
  {
    _id: '6',
    name: 'Neon Brand Limited',
    price: 899,
    description: 'Limited edition neon design. Only 100 pieces available worldwide.',
    category: { _id: '3', name: 'Limited Edition' },
    stock: 3,
    sold: 97,
    createdAt: '2024-02-01',
  },
  {
    _id: '7',
    name: 'Summer Vibes Collection',
    price: 499,
    description: 'Light and breezy design perfect for summer. Made with moisture-wicking fabric.',
    category: { _id: '4', name: 'Summer Collection' },
    stock: 40,
    sold: 15,
    createdAt: '2024-01-30',
  },
  {
    _id: '8',
    name: 'My Hero Academia Plus Ultra',
    price: 599,
    description: 'Go beyond with this Plus Ultra design. Show your hero spirit!',
    category: { _id: '1', name: 'Anime' },
    stock: 0,
    sold: 50,
    createdAt: '2024-01-22',
  },
  {
    _id: '9',
    name: 'Tokyo Ghoul Mask',
    price: 679,
    description: 'Mysterious and stylish Tokyo Ghoul mask design. Dark theme for anime fans.',
    category: { _id: '1', name: 'Anime' },
    stock: 20,
    sold: 25,
    createdAt: '2024-01-28',
  },
  {
    _id: '10',
    name: 'Brand Minimalist Black',
    price: 399,
    description: 'Simple yet elegant black t-shirt with subtle branding. Perfect for any occasion.',
    category: { _id: '2', name: 'Brand' },
    stock: 100,
    sold: 10,
    createdAt: '2024-01-05',
  },
];

// Helper function to get mock product image
export const getMockProductImage = (productId: string): string => {
  // Return a placeholder image URL - you can replace with actual images later
  return `/api/placeholder/300/350`;
};
