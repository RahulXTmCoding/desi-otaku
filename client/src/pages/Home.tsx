import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../types';
import { addItemToCart } from '../core/helper/cartHelper';
import { getProducts } from '../core/helper/coreapicalls';
import { useDevMode } from '../context/DevModeContext';
import { mockProducts } from '../data/mockData';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isTestMode } = useDevMode();

  useEffect(() => {
    loadProducts();
  }, [isTestMode]);

  const loadProducts = () => {
    setLoading(true);
    
    if (isTestMode) {
      // Use mock data
      setTimeout(() => {
        setProducts(mockProducts.slice(0, 4)); // Show only 4 products
        setLoading(false);
      }, 500);
    } else {
      // Use real backend
      getProducts()
        .then((data: any) => {
          if (data && !data.error) {
            setProducts(data.slice(0, 4)); // Show only 4 products
          }
          setLoading(false);
        })
        .catch((err: any) => {
          console.log(err);
          setLoading(false);
        });
    }
  };


  return (
    <>
        <section className="relative text-left py-20 px-8 md:px-20 overflow-hidden bg-gray-900">
          <div className="absolute top-0 right-0 -mt-20 -mr-40 w-96 h-96 bg-purple-900 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-40 w-96 h-96 bg-yellow-400 rounded-full opacity-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center">
            <div className="max-w-xl mb-8 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white">
                Design Your<br />
                <span className="text-yellow-400">Own Otakool T-Shirt</span>
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                Create unique anime-inspired designs or choose from our collection
              </p>
              <Link 
                to="/customize" 
                className="inline-block bg-yellow-400 text-gray-900 font-bold py-4 px-8 rounded-full text-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
              >
                Customize Now
              </Link>
            </div>
            <div className="relative ml-0 md:ml-20">
              <div className="text-8xl animate-pulse">👕</div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 grid grid-cols-3 gap-1">
                {Array(9).fill(0).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="shop" className="py-16 px-8 md:px-20 bg-gray-900">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 md:mb-0">Trending T-Shirts</h2>
            <Link 
              to="/shop" 
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
            >
              View All Products →
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
    </>
  );
}
