import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  name: string;
  icon?: string;
  image?: string;
  productCount?: number;
  link: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  name, 
  icon, 
  image, 
  productCount, 
  link 
}) => {
  return (
    <Link to={link}>
      <div className="relative bg-gray-800 rounded-2xl overflow-hidden group hover:scale-105 transition-all duration-300 cursor-pointer border border-gray-700 hover:border-yellow-400/50">
        {image ? (
          <>
            <div className="relative h-48 overflow-hidden">
              <img 
                src={image} 
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-bold text-lg mb-1">{name}</h3>
              {productCount !== undefined && (
                <p className="text-gray-300 text-sm">{productCount} Products</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            {icon && <div className="text-4xl mb-4">{icon}</div>}
            <h3 className="font-semibold mb-2">{name}</h3>
            {productCount !== undefined && (
              <p className="text-gray-400 text-sm">{productCount} designs</p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
