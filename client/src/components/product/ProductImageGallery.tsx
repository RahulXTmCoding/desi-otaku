import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Award, Clock, TrendingUp } from 'lucide-react';
import { generateLightColorWithOpacity } from '../../utils/colorUtils';
import { convertImageUrl } from '../../utils/imageUtils';
import LiveViewersBadge from './LiveViewersBadge';

interface Product {
  _id: string;
  name: string;
  sold: number;
  stock: number;
  sizeStock?: {
    S: number;
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
  customTags?: string[];
  imageDisplayMode?: 'contain' | 'cover';
}

interface ProductImageGalleryProps {
  product: Product;
  productImages: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
    order?: number;
  }>;
  getProductImage: (product: any) => string;
  selectedSize?: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  productImages,
  getProductImage,
  selectedSize
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoomActive, setImageZoomActive] = useState(false);

  // Calculate stock urgency
  const totalStock = selectedSize && product.sizeStock 
    ? product.sizeStock[selectedSize as keyof typeof product.sizeStock] 
    : product.stock;
  const isLowStock = totalStock <= 5 && totalStock > 0;
  const isOutOfStock = totalStock === 0;

  return (
    <div className="animate-slide-in-left">
      {/* Professional E-commerce Gallery Layout */}
      
      {/* Desktop: Thumbnails on Left + Main Image on Right */}
      <div className="hidden lg:flex gap-6">
        {/* Left Thumbnails Column - Bigger for better UX */}
        <div className="flex flex-col gap-3 w-32">
          {productImages.length > 0 ? (
            productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 transform overflow-hidden`}
                style={{ 
                  backgroundColor: generateLightColorWithOpacity(product._id, 0.15),
                  borderColor: currentImageIndex === index ? 'var(--color-primary)' : 'var(--color-border)'
                }}
              >
                <img 
                  src={convertImageUrl(image.url, 'thumb')}
                  alt={image.caption || `${product.name} ${index + 1}`}
                  className={`w-full h-full ${product.imageDisplayMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  width={128}
                  height={128}
                />
              </button>
            ))
          ) : (
            <button
              className="aspect-square rounded-lg border-2 hover:scale-105 transform transition-all overflow-hidden"
              style={{ 
                backgroundColor: generateLightColorWithOpacity(product._id, 0.15),
                borderColor: 'var(--color-primary)'
              }}
            >
              <img 
                src={convertImageUrl(getProductImage(product), 'thumb')}
                alt={product.name}
                className={`w-full h-full ${product.imageDisplayMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                decoding="async"
                width={128}
                height={128}
              />
            </button>
          )}
        </div>

        {/* Main Image Display */}
        <div className="flex-1">
          <div className="relative rounded-2xl overflow-hidden group" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div 
              className="aspect-square relative cursor-zoom-in transition-transform duration-500" 
              style={{ backgroundColor: generateLightColorWithOpacity(product._id, 0.2) }}
            >
              {/* Enhanced Main Image — medium variant for fast load, original for zoom */}
              {(() => {
                const rawUrl = productImages.length > 0 && productImages[currentImageIndex]?.url
                  ? productImages[currentImageIndex].url
                  : getProductImage(product);
                const mediumUrl = convertImageUrl(rawUrl, 'medium');
                const originalUrl = rawUrl;
                return (
                  <img
                    src={mediumUrl}
                    srcSet={mediumUrl !== originalUrl ? `${mediumUrl} 500w, ${originalUrl} 1200w` : undefined}
                    sizes={mediumUrl !== originalUrl ? '(max-width: 768px) 100vw, 60vw' : undefined}
                    alt={productImages[currentImageIndex]?.caption || product.name}
                    className={`w-full h-full ${product.imageDisplayMode === 'cover' ? 'object-cover' : 'object-contain'} transition-transform duration-300 ${
                      imageZoomActive ? 'scale-150' : 'scale-100'
                    }`}
                    fetchPriority="high"
                    decoding="async"
                    width={600}
                    height={600}
                  />
                );
              })()}
              
              {/* Navigation Arrows (if multiple images) */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110 transform"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110 transform"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Enhanced Badges with Animation */}
              <div className="absolute top-4 right-4 space-y-2"> {/* Changed left-4 to right-4 */}
                <div className="flex flex-col gap-2 items-end"> {/* Added items-end for right alignment */}
                  {/* Custom Tags Display */}
                  {product.customTags && product.customTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end"> {/* Added justify-end for right alignment */}
                      {product.customTags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="bg-yellow-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <LiveViewersBadge className="text-sm text-green-400 font-medium" />
                  </div>
                  {isLowStock && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-sm">
                      <Clock className="w-3 h-3 text-orange-400" />
                      <span className="text-sm text-orange-400 font-medium">Only {totalStock} left!</span>
                    </div>
                  )}
                  {product.sold > 100 && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                      <span className="text-sm text-blue-400 font-medium">Trending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Main Image + Thumbnails on Bottom */}
      <div className="lg:hidden">
        {/* Main Image */}
        <div className="relative rounded-2xl overflow-hidden mb-4 group" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div 
            className="aspect-square relative cursor-zoom-in transition-transform duration-500" 
            style={{ backgroundColor: generateLightColorWithOpacity(product._id, 0.2) }}
          >
            {/* Enhanced Main Image — medium variant for fast load, original for zoom */}
              {(() => {
                const rawUrl = productImages.length > 0 && productImages[currentImageIndex]?.url
                  ? productImages[currentImageIndex].url
                  : getProductImage(product);
                const mediumUrl = convertImageUrl(rawUrl, 'medium');
                const originalUrl = rawUrl;
                return (
                  <img
                    src={mediumUrl}
                    srcSet={mediumUrl !== originalUrl ? `${mediumUrl} 500w, ${originalUrl} 1200w` : undefined}
                    sizes={mediumUrl !== originalUrl ? '100vw' : undefined}
                    alt={productImages[currentImageIndex]?.caption || product.name}
                    className={`w-full h-full ${product.imageDisplayMode === 'cover' ? 'object-cover' : 'object-contain'} transition-transform duration-300 ${
                      imageZoomActive ? 'scale-150' : 'scale-100'
                    }`}
                    fetchPriority="high"
                    decoding="async"
                    width={500}
                    height={500}
                  />
                );
              })()}
            
            {/* Navigation Arrows (if multiple images) */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110 transform"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:scale-110 transform"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Enhanced Badges with Animation */}
            <div className="absolute top-2 right-1 space-y-2"> {/* Changed left-1 to right-1 */}
              <div className="flex flex-col gap-2 items-end"> {/* Added items-end for right alignment */}
                {/* Custom Tags Display */}
                {product.customTags && product.customTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end"> {/* Added justify-end for right alignment */}
                    {product.customTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-yellow-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <LiveViewersBadge className="text-xs text-green-400 font-medium" />
                </div>
                {isLowStock && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-sm">
                    <Clock className="w-2.5 h-2.5 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">Only {totalStock} left!</span>
                  </div>
                )}
                {product.sold > 100 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                    <TrendingUp className="w-2.5 h-2.5 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">Trending</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Thumbnails */}
        <div className="grid grid-cols-4 gap-2">
          {productImages.length > 0 ? (
            productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 transform overflow-hidden`}
                style={{ 
                  backgroundColor: generateLightColorWithOpacity(product._id, 0.15),
                  borderColor: currentImageIndex === index ? 'var(--color-primary)' : 'var(--color-border)'
                }}
              >
                <img 
                  src={convertImageUrl(image.url, 'thumb')}
                  alt={image.caption || `${product.name} ${index + 1}`}
                  className="w-full h-full object-contain"
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  width={100}
                  height={100}
                />
              </button>
            ))
          ) : (
            <button
              className="aspect-square rounded-lg border-2 hover:scale-105 transform transition-all overflow-hidden"
              style={{ 
                backgroundColor: generateLightColorWithOpacity(product._id, 0.15),
                borderColor: 'var(--color-primary)'
              }}
            >
              <img 
                src={convertImageUrl(getProductImage(product), 'thumb')}
                alt={product.name}
                className="w-full h-full object-contain"
                decoding="async"
                width={100}
                height={100}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImageGallery;
