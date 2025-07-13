import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Sparkles, X, Check, ShoppingCart, Heart, Headphones, Globe, Package, Award, Users, Zap } from 'lucide-react';
import Base from '../core/Base';
import PromotionalBanner from '../components/home/PromotionalBanner';
import ProductCarousel from '../components/home/ProductCarousel';
import CategoryCard from '../components/home/CategoryCard';
import FeatureSection from '../components/home/FeatureSection';
import ReviewCarousel from '../components/home/ReviewCarousel';
import { useCart } from '../context/CartContext';
import { getFilteredProducts } from '../core/helper/shopApiCalls';
import { getCategories } from '../core/helper/coreapicalls';
import { API } from '../backend';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts, mockCategories, getMockProductImage } from '../data/mockData';
import QuickViewModal from '../components/QuickViewModal';
import { toast } from 'react-hot-toast';
import { addToWishlist } from '../core/helper/wishlistHelper';
import { isAutheticated } from '../auth/helper';
import { getDesigns } from '../admin/helper/designapicall';
import RealTShirtPreview from '../components/RealTShirtPreview';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  stock: number;
  sold: number;
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  _id: string;
  name: string;
  slug?: string;
  parentCategory?: string | null;
  level?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  product: string;
  date: string;
}

const HomeEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const { addToCart } = useCart();
  const [showBanner, setShowBanner] = useState(true);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [mostDemandProducts, setMostDemandProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [animeCategories, setAnimeCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quick View Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  // Random design modal state
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomSelection, setRandomSelection] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRandomColor, setSelectedRandomColor] = useState<any>(null);
  const [selectedRandomSize, setSelectedRandomSize] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);

  // Sample reviews data
  const reviews: Review[] = [
    { id: 1, name: "Rahul K.", rating: 5, comment: "Amazing quality! The anime print is crystal clear.", product: "Gojo Satoru T-shirt", date: "2 days ago" },
    { id: 2, name: "Priya S.", rating: 5, comment: "Love the oversized fit. Perfect for anime fans!", product: "Attack on Titan Hoodie", date: "1 week ago" },
    { id: 3, name: "Ankit M.", rating: 4, comment: "Great design and comfortable fabric.", product: "One Piece Collection", date: "2 weeks ago" },
    { id: 4, name: "Sneha P.", rating: 5, comment: "Best anime merch store in India!", product: "Demon Slayer Tee", date: "3 weeks ago" },
    { id: 5, name: "Arjun V.", rating: 5, comment: "The custom design feature is awesome!", product: "Custom Naruto Design", date: "1 month ago" }
  ];

  // Visual category data
  const visualCategories = [
    { 
      name: "T-Shirts", 
      icon: "👕", 
      image: "/api/placeholder/300/200", 
      link: "/shop?type=tshirt",
      productCount: 156
    },
    { 
      name: "Hoodies", 
      icon: "🧥", 
      image: "/api/placeholder/300/200", 
      link: "/shop?type=hoodie",
      productCount: 89
    },
    { 
      name: "Combos", 
      icon: "🎁", 
      image: "/api/placeholder/300/200", 
      link: "/shop?type=combo",
      productCount: 45
    },
    { 
      name: "Custom Design", 
      icon: "🎨", 
      image: "/api/placeholder/300/200", 
      link: "/customize",
      productCount: undefined
    }
  ];

  // Placeholder anime images - these would be replaced with actual category images
  const animeImages: { [key: string]: string } = {
    "naruto": "/api/placeholder/200/200",
    "one piece": "/api/placeholder/200/200",
    "demon slayer": "/api/placeholder/200/200",
    "attack on titan": "/api/placeholder/200/200",
    "jujutsu kaisen": "/api/placeholder/200/200",
    "dragon ball": "/api/placeholder/200/200"
  };

  useEffect(() => {
    loadAllProducts();
    loadCategories();
  }, [isTestMode]);

  const loadAllProducts = async () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      setTimeout(() => {
        const allProducts = [...mockProducts];
        
        // Add variations for demo
        const productsWithVariations = allProducts.map((product, index) => ({
          ...product,
          originalPrice: index % 3 === 0 ? product.price * 1.5 : undefined,
          isNew: index < 5,
          sold: Math.floor(Math.random() * 100),
          rating: 4 + Math.random()
        }));
        
        setNewProducts(productsWithVariations.slice(0, 8));
        setTrendingProducts(productsWithVariations.slice(4, 12));
        setMostDemandProducts(productsWithVariations.slice(8, 12));
        setLoading(false);
      }, 500);
    } else {
      try {
        const [newData, trendingData, demandData] = await Promise.all([
          getFilteredProducts({ sortBy: 'newest', sortOrder: 'desc', limit: 8 }),
          getFilteredProducts({ sortBy: 'sold', sortOrder: 'desc', limit: 8 }),
          getFilteredProducts({ sortBy: 'popularity', sortOrder: 'desc', limit: 4 })
        ]);

        if (newData && newData.products) {
          setNewProducts(newData.products.map((p: Product, i: number) => ({ 
            ...p, 
            isNew: i < 5,
            originalPrice: p.price * 1.2,
            rating: 4.5
          })));
        }
        if (trendingData && trendingData.products) {
          setTrendingProducts(trendingData.products);
        }
        if (demandData && demandData.products) {
          setMostDemandProducts(demandData.products);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load products');
        setLoading(false);
      }
    }
  };

  const loadCategories = async () => {
    if (isTestMode) {
      setCategories(mockCategories);
      // Mock anime categories
      setAnimeCategories([
        { _id: '1', name: 'Naruto', slug: 'naruto' },
        { _id: '2', name: 'One Piece', slug: 'one-piece' },
        { _id: '3', name: 'Demon Slayer', slug: 'demon-slayer' },
        { _id: '4', name: 'Attack on Titan', slug: 'attack-on-titan' },
        { _id: '5', name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen' },
        { _id: '6', name: 'Dragon Ball', slug: 'dragon-ball' }
      ]);
    } else {
      try {
        const data = await getCategories();
        if (data && !data.error) {
          setCategories(data);
          
          // Find anime main category and load its subcategories
          const animeCategory = data.find((cat: Category) => 
            cat.name.toLowerCase() === 'anime' && cat.level === 0
          );
          
          if (animeCategory) {
            // Load subcategories of anime
            const allCategories = await getCategories();
            const animeSubcategories = allCategories.filter((cat: Category) => 
              cat.parentCategory === animeCategory._id
            );
            setAnimeCategories(animeSubcategories.slice(0, 6)); // Take first 6
          }
        }
      } catch (err) {
        console.log('Error loading categories:', err);
      }
    }
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleRandomSurprise = async () => {
    // Randomly decide: 50% chance for custom design, 50% for random product
    const isCustomDesign = Math.random() < 0.5;
    
    if (isCustomDesign) {
      // Generate random custom design
      handleRandomDesign();
    } else {
      // Navigate to random product
      const allProducts = [...newProducts, ...trendingProducts];
      if (allProducts.length > 0) {
        const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
        navigate(`/product/${randomProduct._id}`);
      }
    }
  };

  const handleRandomDesign = async () => {
    setIsGenerating(true);
    setShowRandomModal(true);
    setAddedToCart(false);
    
    // Simulate loading animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Get all available designs
      let designList = [];
      
      if (isTestMode) {
        // Use mock products as designs in test mode
        designList = mockProducts.map(p => ({
          _id: p._id,
          name: p.name,
          imageUrl: getMockProductImage(p._id),
          price: 150,
          category: p.category,
          isActive: true
        }));
      } else {
        // Fetch real designs
        const designsData = await getDesigns(1, 100, {});
        designList = designsData.designs || designsData || [];
      }
      
      if (!Array.isArray(designList) || designList.length === 0) {
        setIsGenerating(false);
        return;
      }
      
      // Random selections
      const randomDesign = designList[Math.floor(Math.random() * designList.length)];
      const colors = [
        { name: 'White', value: '#FFFFFF' },
        { name: 'Black', value: '#000000' },
        { name: 'Navy', value: '#1E3A8A' },
        { name: 'Red', value: '#DC2626' },
        { name: 'Gray', value: '#6B7280' },
        { name: 'Green', value: '#059669' },
        { name: 'Yellow', value: '#F59E0B' },
        { name: 'Purple', value: '#7C3AED' }
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      
      // Randomly decide front or back (not both)
      const positions = ['front', 'back'];
      const randomPosition = positions[Math.floor(Math.random() * positions.length)];
      
      // Randomly decide center or center-bottom
      const designPositions = ['center', 'center-bottom'];
      const randomDesignPosition = designPositions[Math.floor(Math.random() * designPositions.length)];
      
      const selection = {
        design: randomDesign,
        color: randomColor,
        size: randomSize,
        position: randomPosition,
        designPosition: randomDesignPosition,
        price: 499 + 150 // Base + design price (single side only)
      };
      
      setRandomSelection(selection);
      setSelectedRandomColor(randomColor);
      setSelectedRandomSize(randomSize);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating random design:', error);
      setIsGenerating(false);
    }
  };

  const handleAddRandomToCart = async () => {
    if (!randomSelection || !selectedRandomColor || !selectedRandomSize) return;
    
    try {
      const designName = `${randomSelection.position === 'front' ? 'Front' : 'Back'}: ${randomSelection.design.name}`;
      
      const cartItem = {
        name: `Custom T-Shirt - ${designName}`,
        price: randomSelection.price,
        size: selectedRandomSize,
        color: selectedRandomColor.value,
        quantity: 1,
        isCustom: true,
        customization: {
          frontDesign: randomSelection.position === 'front' ? {
            designId: randomSelection.design._id,
            designImage: getDesignImageUrl(randomSelection.design),
            position: randomSelection.designPosition,
            price: 150
          } : undefined,
          backDesign: randomSelection.position === 'back' ? {
            designId: randomSelection.design._id,
            designImage: getDesignImageUrl(randomSelection.design),
            position: randomSelection.designPosition,
            price: 150
          } : undefined
        }
      };

      await addToCart(cartItem);
      setAddedToCart(true);
      
      setTimeout(() => {
        setShowRandomModal(false);
        setRandomSelection(null);
        setSelectedRandomColor(null);
        setSelectedRandomSize('');
        setAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const getDesignImageUrl = (design: any) => {
    if (design.imageUrl && (design.imageUrl.startsWith('http') || design.imageUrl.startsWith('data:'))) {
      return design.imageUrl;
    }
    return `${API}/design/image/${design._id}`;
  };

  const tshirtColors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Navy', value: '#1E3A8A' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Green', value: '#059669' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#7C3AED' }
  ];

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({
        name: product.name,
        price: product.price,
        size: 'M', // Default size
        color: '#000000', // Default color
        quantity: 1,
        isCustom: false // This is a regular product, not custom
      });
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    const authData = isAutheticated();
    if (!authData) {
      toast.error('Please login to add to wishlist');
      navigate('/signin');
      return;
    }

    try {
      await addToWishlist(authData.user._id, authData.token, product._id);
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  return (
    <Base title="" description="">
      {/* Promotional Banner */}
      {showBanner && (
        <PromotionalBanner
          message="Buy 2 Get 10% Off Code"
          code="FANS10"
          onClose={() => setShowBanner(false)}
        />
      )}

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative px-6 py-20 overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-gray-900">
          <div className="absolute top-10 right-10 grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-cyan-400 rounded-full opacity-60"></div>
            ))}
          </div>

          <div className="relative w-[96%] mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Express Your
              <span className="block bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Anime Passion
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Premium anime merchandise with custom design options. Join the Otaku community!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/customize')}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105"
              >
                Create Custom Design
              </button>
              <button 
                onClick={() => navigate('/shop')}
                className="border border-yellow-400 text-yellow-400 px-8 py-4 rounded-full font-semibold hover:bg-yellow-400 hover:text-gray-900 transition-all"
              >
                Shop Collection
              </button>
              <button 
                onClick={handleRandomSurprise}
                className="border border-purple-400 text-purple-400 px-8 py-4 rounded-full font-semibold hover:bg-purple-400 hover:text-gray-900 transition-all flex items-center gap-2 group"
              >
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                Surprise Me!
              </button>
            </div>
          </div>
        </section>

        {/* Most In Demand Categories */}
        <section className="py-16">
          <div className="w-[96%] mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">MOST IN DEMAND</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {visualCategories.map((category, index) => (
                <CategoryCard
                  key={index}
                  name={category.name}
                  icon={category.icon}
                  image={category.image}
                  productCount={category.productCount}
                  link={category.link}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Newly Launched Products */}
        <section className="py-8">
          <div className="w-[96%] mx-auto">
            <ProductCarousel
              title="Newly Launched"
              products={newProducts}
              viewAllLink="/shop?sort=newest"
              loading={loading}
              onQuickView={handleQuickView}
            />
          </div>
        </section>

        {/* Shop By Anime */}
        <section className="py-16 bg-gray-800/30">
          <div className="w-[96%] mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Shop By Anime</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {animeCategories.length > 0 ? (
                animeCategories.map((anime) => (
                  <CategoryCard
                    key={anime._id}
                    name={anime.name}
                    image={animeImages[anime.name.toLowerCase()] || "/api/placeholder/200/200"}
                    link={`/shop?category=${anime.parentCategory || anime._id}&subcategory=${anime._id}`}
                  />
                ))
              ) : (
                // Fallback static anime categories if none loaded from backend
                [
                  { name: "Naruto", slug: "naruto" },
                  { name: "One Piece", slug: "one-piece" },
                  { name: "Demon Slayer", slug: "demon-slayer" },
                  { name: "Attack on Titan", slug: "attack-on-titan" },
                  { name: "Jujutsu Kaisen", slug: "jujutsu-kaisen" },
                  { name: "Dragon Ball", slug: "dragon-ball" }
                ].map((anime, index) => (
                  <CategoryCard
                    key={index}
                    name={anime.name}
                    image={animeImages[anime.name.toLowerCase()] || "/api/placeholder/200/200"}
                    link={`/shop?search=${encodeURIComponent(anime.name)}`}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-8">
          <div className="w-[96%] mx-auto">
            <ProductCarousel
              title="Trending Products"
              products={trendingProducts}
              viewAllLink="/shop?sort=trending"
              loading={loading}
              onQuickView={handleQuickView}
            />
          </div>
        </section>

        {/* About Us Section */}
        <section className="py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          <div className="w-[96%] mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold mb-4">ABOUT US</h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Welcome to <span className="text-yellow-400 font-bold">DESI OTAKU</span>! Your Ultimate Destination for Anime Fashion! 
                At Desi Otaku, we bring your favorite anime characters and iconic series to life through our exclusive and stylish 
                clothing collections. Dive into a world where fashion meets fandom, and express your love for anime 
                with our premium apparel.
              </p>
              <button 
                onClick={() => navigate('/about')}
                className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                KNOW MORE
              </button>
            </div>
            <div className="relative">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 transform -rotate-6 hover:rotate-0 transition-transform">
                    <img src="/api/placeholder/150/200" alt="Anime Tee 1" className="rounded-lg" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-gradient-to-br from-gray-200 to-white rounded-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform">
                    <img src="/api/placeholder/150/200" alt="Anime Tee 2" className="rounded-lg" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">DESI</h3>
                    <h3 className="text-3xl font-bold">OTAKU</h3>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">HUB</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-4 transform rotate-6 hover:rotate-0 transition-transform">
                    <img src="/api/placeholder/150/200" alt="Anime Tee 3" className="rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 bg-gray-800/50">
          <div className="w-[96%] mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Desi Otaku?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
              {[
                { icon: <Heart className="w-8 h-8" />, title: "Community Focus", color: "bg-red-500" },
                { icon: <Headphones className="w-8 h-8" />, title: "Customer Service", color: "bg-red-500" },
                { icon: <Globe className="w-8 h-8" />, title: "Eco-Friendly", color: "bg-red-500" },
                { icon: <Package className="w-8 h-8" />, title: "Exclusive Designs", color: "bg-red-500" },
                { icon: <Award className="w-8 h-8" />, title: "High Quality Apparel", color: "bg-red-500" },
                { icon: <Users className="w-8 h-8" />, title: "Trendy New Designs", color: "bg-red-500" },
                { icon: <Zap className="w-8 h-8" />, title: "Variety of Products", color: "bg-red-500" }
              ].map((feature, index) => (
                <div key={index} className="text-center group">
                  <div className={`${feature.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transform group-hover:scale-110 transition-all duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-300">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeatureSection />

        {/* Customer Reviews */}
        <ReviewCarousel reviews={reviews} />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900">
          <div className="w-[96%] mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Join The Otaku Revolution
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get exclusive deals and be the first to know about new drops
            </p>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-yellow-300 transition-all transform hover:scale-105"
            >
              Sign Up Now
            </button>
          </div>
        </section>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setSelectedProduct(null);
        }}
      />

      {/* Random Design Modal */}
      {showRandomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-3xl max-w-2xl w-full border border-gray-700 transform transition-all duration-500 scale-100 max-h-[90vh] overflow-hidden flex flex-col relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowRandomModal(false);
                setRandomSelection(null);
                setSelectedRandomColor(null);
                setSelectedRandomSize('');
              }}
              className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Modal Header */}
            
            {isGenerating ? (
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <Shuffle className="w-16 h-16 text-yellow-400 animate-spin" />
                  <Sparkles className="w-8 h-8 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Generating Your Random Design...</h3>
                <p className="text-gray-400">Our AI is picking the perfect combination for you!</p>
              </div>
            ) : null}
            
            
            {/* Modal Content - Scrollable */}
            {randomSelection && !isGenerating && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column - Preview */}
                  <div className="lg:w-1/2">
                    <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
                      {/* T-Shirt Preview - Full height */}
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-sm">
                          <RealTShirtPreview
                              selectedDesign={randomSelection.design ? {
                                ...randomSelection.design,
                                image: getDesignImageUrl(randomSelection.design)
                              } : null}
                              selectedColor={selectedRandomColor?.value || '#FFFFFF'}
                              selectedColorName={selectedRandomColor?.name || 'White'}
                              selectedSize={selectedRandomSize || 'M'}
                              position={randomSelection.designPosition}
                              side={randomSelection.position}
                              frontDesign={
                                randomSelection.position === 'front' && randomSelection.design
                                  ? {
                                      ...randomSelection.design,
                                      image: getDesignImageUrl(randomSelection.design),
                                      position: randomSelection.designPosition
                                    }
                                  : null
                              }
                              backDesign={
                                randomSelection.position === 'back' && randomSelection.design
                                  ? {
                                      ...randomSelection.design,
                                      image: getDesignImageUrl(randomSelection.design),
                                      position: randomSelection.designPosition
                                    }
                                  : null
                              }
                            />
                        </div>
                      </div>
                      
                      {/* Design Info - Separated from preview */}
                      <div className="text-center p-3 bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-sm">{randomSelection.design.name}</h4>
                        <p className="text-gray-400 text-xs mt-1">
                          {randomSelection.position === 'front' ? 'Front' : 'Back'} - {randomSelection.designPosition === 'center-bottom' ? 'Bottom' : 'Center'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Options */}
                  <div className="lg:w-1/2 space-y-4">
                    {/* Color Selection */}
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-3">T-Shirt Color</p>
                      <div className="flex gap-2 flex-wrap">
                        {tshirtColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setSelectedRandomColor(color)}
                            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                              selectedRandomColor?.value === color.value 
                                ? 'border-yellow-400 scale-110' 
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {selectedRandomColor?.value === color.value && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-lg" 
                                  style={{ 
                                    filter: color.value === '#FFFFFF' ? 'invert(1)' : 'none' 
                                  }}
                                />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-3">Size</p>
                      <div className="grid grid-cols-5 gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedRandomSize(size)}
                            className={`py-2 text-sm rounded-lg font-medium transition-all ${
                              selectedRandomSize === size
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm">Total Price</p>
                      <p className="text-2xl font-bold text-yellow-400">₹{randomSelection.price}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Base ₹499 + Design ₹150
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => {
                          setRandomSelection(null);
                          setSelectedRandomColor(null);
                          setSelectedRandomSize('');
                          handleRandomDesign();
                        }}
                        className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Shuffle className="w-5 h-5" />
                        Try Again
                      </button>
                      <button
                        onClick={handleAddRandomToCart}
                        disabled={addedToCart}
                        className={`py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                          addedToCart 
                            ? 'bg-green-500 text-white' 
                            : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
                        }`}
                      >
                        {addedToCart ? (
                          <>
                            <Check className="w-5 h-5" />
                            Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Base>
  );
};

export default HomeEnhanced;
