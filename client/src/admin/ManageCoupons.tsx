import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Base from '../core/Base';
import { isAutheticated } from '../auth/helper/index';
import { getAllCoupons, deleteCoupon } from '../core/helper/couponHelper';
import { Plus, Edit, Trash2, Tag, Calendar, Users } from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minimumPurchase: number;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = isAutheticated();
  
  if (!auth) {
    return (
      <Base title="Unauthorized" description="Please login to access this page">
        <div className="text-center py-8">
          <p className="text-red-400">You need to be logged in as admin to access this page.</p>
        </div>
      </Base>
    );
  }
  
  const { user, token } = auth;

  const preloadCoupons = () => {
    setLoading(true);
    getAllCoupons(user._id, token).then(data => {
      if (data?.error) {
        setError(data.error);
      } else {
        setCoupons(data || []);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    preloadCoupons();
  }, []);

  const deleteThisCoupon = (couponId: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCoupon(couponId, user._id, token).then(data => {
        if (data?.error) {
          setError(data.error);
        } else {
          preloadCoupons();
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <Base title="Manage Coupons" description="Create and manage discount coupons">
      <Link 
        to="/admin/dashboard" 
        className="btn bg-gray-700 hover:bg-gray-600 text-white mb-6 inline-block"
      >
        Admin Home
      </Link>

      <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">All Coupons</h2>
          <Link
            to="/admin/coupon/create"
            className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Coupon
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading coupons...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No coupons created yet</p>
            <Link
              to="/admin/coupon/create"
              className="text-yellow-400 hover:text-yellow-300 mt-2 inline-block"
            >
              Create your first coupon
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map(coupon => (
              <div
                key={coupon._id}
                className={`border rounded-lg p-6 transition-all ${
                  !coupon.isActive || isExpired(coupon.validUntil)
                    ? 'bg-gray-900 border-gray-700 opacity-60'
                    : 'bg-gray-700 border-gray-600 hover:border-yellow-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-yellow-400">
                        {coupon.code}
                      </h3>
                      {(!coupon.isActive || isExpired(coupon.validUntil)) && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          {!coupon.isActive ? 'Inactive' : 'Expired'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-3">{coupon.description}</p>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Discount</p>
                        <p className="text-white font-semibold">
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}%` 
                            : `₹${coupon.discountValue}`} OFF
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400">Min. Purchase</p>
                        <p className="text-white font-semibold">
                          {coupon.minimumPurchase > 0 ? `₹${coupon.minimumPurchase}` : 'No minimum'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400">Usage</p>
                        <p className="text-white font-semibold">
                          {coupon.usageCount} / {coupon.usageLimit || '∞'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Valid: {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/admin/coupon/update/${coupon._id}`}
                      className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deleteThisCoupon(coupon._id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Base>
  );
};

export default ManageCoupons;
