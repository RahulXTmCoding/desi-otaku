import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Tag, Clock, Copy } from 'lucide-react';
import { getPromotionalCoupons } from '../../core/helper/couponHelper';
import { useNavigate } from 'react-router-dom';

interface PromotionalCoupon {
  _id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minimumPurchase: number;
  bannerImage?: string;
  bannerText?: string;
  validUntil: string;
}

const PromotionalCouponBanner: React.FC = () => {
  const [coupons, setCoupons] = useState<PromotionalCoupon[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPromotionalCoupons();
  }, []);

  const loadPromotionalCoupons = async () => {
    try {
      const data = await getPromotionalCoupons();
      if (data && Array.isArray(data)) {
        setCoupons(data);
      }
    } catch (error) {
      console.error('Error loading promotional coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? coupons.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === coupons.length - 1 ? 0 : prev + 1));
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`;
  };

  const daysUntilExpiry = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading || coupons.length === 0) {
    return null;
  }

  const currentCoupon = coupons[currentIndex];

  return (
    <div className="relative w-full mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900">
        {currentCoupon.bannerImage ? (
          <div className="relative h-64 md:h-80">
            <img
              src={currentCoupon.bannerImage}
              alt={currentCoupon.code}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {currentCoupon.bannerText || currentCoupon.description}
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold">
                    <Tag className="w-5 h-5" />
                    <span className="text-lg">{formatDiscount(currentCoupon.discountType, currentCoupon.discountValue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(currentCoupon.code)}
                      className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
                    >
                      <span>CODE: {currentCoupon.code}</span>
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedCode === currentCoupon.code && (
                      <span className="text-green-400 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    {currentCoupon.bannerText || currentCoupon.description}
                  </h2>
                  <div className="flex items-center gap-4 text-white/80">
                    {currentCoupon.minimumPurchase > 0 && (
                      <span>Min. Purchase: ₹{currentCoupon.minimumPurchase}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {daysUntilExpiry(currentCoupon.validUntil)} days left
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-yellow-400 mb-1">
                      {formatDiscount(currentCoupon.discountType, currentCoupon.discountValue)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(currentCoupon.code)}
                      className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-300 transition-all flex items-center gap-2"
                    >
                      <Tag className="w-5 h-5" />
                      <span>{currentCoupon.code}</span>
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedCode === currentCoupon.code && (
                      <span className="text-green-400 text-sm mt-1 block">Copied!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {coupons.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {coupons.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {coupons.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Shop Now Button */}
      <button
        onClick={() => navigate('/shop')}
        className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all"
      >
        Shop Now →
      </button>
    </div>
  );
};

export default PromotionalCouponBanner;
