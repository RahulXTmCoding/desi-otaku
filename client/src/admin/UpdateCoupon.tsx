import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Base from '../core/Base';
import { isAutheticated } from '../auth/helper/index';
import { getCoupon, updateCoupon } from '../core/helper/couponHelper';
import { Tag, Calendar, DollarSign, AlertCircle, Eye, EyeOff, Zap, Image } from 'lucide-react';

interface CouponForm {
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number;
  minimumPurchase: number;
  displayType: string;
  bannerImage: string;
  bannerText: string;
  autoApplyPriority: number;
  usageLimit: string;
  userLimit: number;
  firstTimeOnly: boolean;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const UpdateCoupon = () => {
  const navigate = useNavigate();
  const { couponId } = useParams<{ couponId: string }>();
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

  const [values, setValues] = useState<CouponForm>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: 0,
    minimumPurchase: 0,
    displayType: 'hidden',
    bannerImage: '',
    bannerText: '',
    autoApplyPriority: 0,
    usageLimit: '',
    userLimit: 1,
    firstTimeOnly: false,
    validFrom: '',
    validUntil: '',
    isActive: true
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCoupon, setLoadingCoupon] = useState(true);

  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minimumPurchase,
    displayType,
    bannerImage,
    bannerText,
    autoApplyPriority,
    usageLimit,
    userLimit,
    firstTimeOnly,
    validFrom,
    validUntil,
    isActive
  } = values;

  useEffect(() => {
    if (couponId) {
      preloadCoupon();
    }
  }, [couponId]);

  const preloadCoupon = () => {
    getCoupon(couponId!, user._id, token).then(data => {
      if (data?.error) {
        setError(data.error);
        setLoadingCoupon(false);
      } else {
        setValues({
          code: data.code || '',
          description: data.description || '',
          discountType: data.discountType || 'percentage',
          discountValue: data.discountValue || 0,
          maxDiscount: data.maxDiscount || 0,
          minimumPurchase: data.minimumPurchase || 0,
          displayType: data.displayType || 'hidden',
          bannerImage: data.bannerImage || '',
          bannerText: data.bannerText || '',
          autoApplyPriority: data.autoApplyPriority || 0,
          usageLimit: data.usageLimit ? String(data.usageLimit) : '',
          userLimit: data.userLimit || 1,
          firstTimeOnly: data.firstTimeOnly || false,
          validFrom: data.validFrom ? new Date(data.validFrom).toISOString().split('T')[0] : '',
          validUntil: data.validUntil ? new Date(data.validUntil).toISOString().split('T')[0] : '',
          isActive: data.isActive !== undefined ? data.isActive : true
        });
        setLoadingCoupon(false);
      }
    });
  };

  const handleChange = (name: keyof CouponForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value;
    setValues({ ...values, [name]: value });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    // Prepare data for API
    const couponData = {
      ...values,
      discountValue: Number(discountValue),
      maxDiscount: discountType === 'percentage' ? Number(maxDiscount) : undefined,
      minimumPurchase: Number(minimumPurchase),
      autoApplyPriority: displayType === 'auto-apply' ? Number(autoApplyPriority) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      userLimit: Number(userLimit)
    };

    updateCoupon(couponId!, user._id, token, couponData)
      .then(data => {
        if (data?.error) {
          setError(data.error);
          setSuccess(false);
        } else {
          setError('');
          setSuccess(true);
          setTimeout(() => {
            navigate('/admin/coupons');
          }, 1500);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to update coupon');
        setLoading(false);
      });
  };

  const successMessage = () => {
    return (
      <div
        className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4"
        style={{ display: success ? '' : 'none' }}
      >
        <h4 className="font-semibold">Coupon updated successfully!</h4>
        <p className="text-sm">Redirecting to manage coupons...</p>
      </div>
    );
  };

  const errorMessage = () => {
    return (
      <div
        className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
        style={{ display: error ? '' : 'none' }}
      >
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  };

  if (loadingCoupon) {
    return (
      <Base title="Loading..." description="">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading coupon details...</p>
        </div>
      </Base>
    );
  }

  return (
    <Base title="Update Coupon" description="Edit discount coupon details">
      <Link 
        to="/admin/dashboard" 
        className="btn bg-gray-700 hover:bg-gray-600 text-white mb-6 inline-block"
      >
        Admin Home
      </Link>

      <div className="bg-gray-800 rounded-xl p-6 shadow-xl max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Tag className="w-8 h-8 text-yellow-400" />
          Update Coupon
        </h2>

        {successMessage()}
        {errorMessage()}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coupon Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleChange('code')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={handleChange('description')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="e.g., Get 20% off on all products"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Type
                </label>
                <select
                  value={displayType}
                  onChange={handleChange('displayType')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="hidden">Hidden - Manual entry only</option>
                  <option value="promotional">Promotional - Show in banners</option>
                  <option value="auto-apply">Auto-Apply - Apply automatically</option>
                </select>
              </div>

              {displayType === 'promotional' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Banner Image URL
                    </label>
                    <input
                      type="text"
                      value={bannerImage}
                      onChange={handleChange('bannerImage')}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Banner Text
                    </label>
                    <input
                      type="text"
                      value={bannerText}
                      onChange={handleChange('bannerText')}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="Limited time offer!"
                    />
                  </div>
                </>
              )}

              {displayType === 'auto-apply' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auto-Apply Priority
                  </label>
                  <input
                    type="number"
                    value={autoApplyPriority}
                    onChange={handleChange('autoApplyPriority')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                    placeholder="Higher number = higher priority"
                    min="0"
                  />
                </div>
              )}
            </div>

            {/* Discount Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Discount Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={handleChange('discountType')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Value <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={handleChange('discountValue')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                    placeholder={discountType === 'percentage' ? '20' : '100'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : '999999'}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {discountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Purchase Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={minimumPurchase}
                    onChange={handleChange('minimumPurchase')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                    placeholder="0 for no minimum"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                </div>
              </div>

              {discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Discount Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={handleChange('maxDiscount')}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="e.g., 150 (for max ₹150 off)"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Leave 0 for no maximum limit
                  </p>
                </div>
              )}

              {/* Usage Limits */}
              <h3 className="text-lg font-semibold text-yellow-400 mt-6">Usage Limits</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={handleChange('usageLimit')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="Leave empty for unlimited"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Per User Limit
                </label>
                <input
                  type="number"
                  value={userLimit}
                  onChange={handleChange('userLimit')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="1"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="firstTimeOnly"
                  checked={firstTimeOnly}
                  onChange={handleChange('firstTimeOnly')}
                  className="w-4 h-4 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-400"
                />
                <label htmlFor="firstTimeOnly" className="text-sm text-gray-300">
                  First-time customers only
                </label>
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Validity Period</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valid From <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={handleChange('validFrom')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valid Until <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={handleChange('validUntil')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-yellow-400">Status</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={handleChange('isActive')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Coupon'}
            </button>
            <Link
              to="/admin/coupons"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold text-center transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Base>
  );
};

export default UpdateCoupon;
