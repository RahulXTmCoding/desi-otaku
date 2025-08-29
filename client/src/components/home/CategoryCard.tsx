import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  name: string;
  icon?: string;
  image?: string;
  productCount?: number;
  link: string;
}

const getCardGradient = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('t-shirt') || name.includes('tshirt')) {
    // Cool blue gradient for T-Shirts
    return 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, rgba(29, 78, 216, 0.2) 70%, rgba(30, 58, 138, 0.1) 100%)';
  } else if (name.includes('hoodie') || name.includes('sweatshirt')) {
    // Deep purple gradient for Hoodies
    return 'radial-gradient(circle at center, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.2) 70%, rgba(88, 28, 135, 0.1) 100%)';
  } else if (name.includes('oversized') || name.includes('oversize')) {
    // Warm orange gradient for Oversized
    return 'radial-gradient(circle at center, rgba(249, 115, 22, 0.3) 0%, rgba(234, 88, 12, 0.2) 70%, rgba(194, 65, 12, 0.1) 100%)';
  } else if (name.includes('custom') || name.includes('design')) {
    // Creative green gradient for Custom
    return 'radial-gradient(circle at center, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.2) 70%, rgba(21, 128, 61, 0.1) 100%)';
  } else if (name.includes('naruto')) {
    // Orange gradient for Naruto
    return 'radial-gradient(circle at center, rgba(251, 146, 60, 0.4) 0%, rgba(249, 115, 22, 0.3) 70%, rgba(194, 65, 12, 0.2) 100%)';
  } else if (name.includes('one piece')) {
    // Blue gradient for One Piece
    return 'radial-gradient(circle at center, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 70%, rgba(29, 78, 216, 0.2) 100%)';
  } else if (name.includes('demon slayer')) {
    // Red gradient for Demon Slayer (like reference image)
    return 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.3) 70%, rgba(185, 28, 28, 0.2) 100%)';
  } else if (name.includes('attack on titan')) {
    // Military green gradient for Attack on Titan
    return 'radial-gradient(circle at center, rgba(101, 163, 13, 0.4) 0%, rgba(77, 124, 15, 0.3) 70%, rgba(63, 98, 18, 0.2) 100%)';
  } else if (name.includes('jujutsu kaisen')) {
    // Dark purple gradient for Jujutsu Kaisen
    return 'radial-gradient(circle at center, rgba(124, 58, 237, 0.4) 0%, rgba(109, 40, 217, 0.3) 70%, rgba(91, 33, 182, 0.2) 100%)';
  } else if (name.includes('dragon ball')) {
    // Golden gradient for Dragon Ball
    return 'radial-gradient(circle at center, rgba(245, 158, 11, 0.4) 0%, rgba(217, 119, 6, 0.3) 70%, rgba(180, 83, 9, 0.2) 100%)';
  } else {
    // Default subtle gray gradient
    return 'radial-gradient(circle at center, rgba(156, 163, 175, 0.3) 0%, rgba(107, 114, 128, 0.2) 70%, rgba(75, 85, 99, 0.1) 100%)';
  }
};

const getAccessibleAltText = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // For anime categories
  if (['naruto', 'one piece', 'demon slayer', 'attack on titan', 'jujutsu kaisen', 'dragon ball'].some(anime => 
    lowerName.includes(anime.replace(' ', '')))) {
    return `${name} anime merchandise collection`;
  }
  
  // For product types
  if (lowerName.includes('custom')) {
    return `${name} studio preview`;
  }
  
  if (lowerName.includes('t-shirt') || lowerName.includes('tshirt')) {
    return `${name} collection showcase`;
  }
  
  if (lowerName.includes('hoodie')) {
    return `${name} collection preview`;
  }
  
  if (lowerName.includes('oversized')) {
    return `${name} collection display`;
  }
  
  // Default for other categories
  return `${name} collection showcase`;
};

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
            <div className="relative h-80 sm:h-96 overflow-hidden" style={{ background: getCardGradient(name) }}>
              <img 
                src={image} 
                alt={getAccessibleAltText(name)}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {/* <div className="absolute inset-0 bg-gradient-to-t to-transparent"></div> */}
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
