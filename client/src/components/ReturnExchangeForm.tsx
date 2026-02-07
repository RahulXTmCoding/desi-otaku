import React, { useState, useEffect } from 'react';
import { Send, Package, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';

interface ReturnExchangeFormProps {
  onClose?: () => void;
}

const ReturnExchangeForm: React.FC<ReturnExchangeFormProps> = ({ onClose }) => {
  const authData = isAutheticated();
  const user = authData && typeof authData !== 'boolean' ? authData.user : null;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    orderId: '',
    name: '',
    email: '',
    phone: '',
    requestType: 'return' as 'return' | 'exchange',
    reason: '',
    issueDescription: '',
    productDetails: ''
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.orderId.trim()) {
      setError('Order ID is required');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone.replace(/[\s-+()]/g, ''))) {
      setError('Valid 10-digit phone number is required');
      return false;
    }
    if (!formData.reason.trim()) {
      setError('Please select a reason');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/return-exchange/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          if (onClose) {
            onClose();
          } else {
            setSuccess(false);
            setFormData({
              orderId: '',
              name: user ? user.name || '' : '',
              email: user ? user.email || '' : '',
              phone: '',
              requestType: 'return',
              reason: '',
              issueDescription: '',
              productDetails: ''
            });
          }
        }, 3000);
      } else {
        setError(data.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting return/exchange request:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const commonReasons = {
    return: [
      'Defective/faulty product',
      'Wrong size delivered',
      'Faulty print quality',
      'Wrong product delivered'
    ],
    exchange: [
      'Defective product - need replacement',
      'Wrong size delivered - need correct size',
      'Wrong size ordered - willing to pay delivery charges',
      'Damaged product - need exchange',
      'Print issue - need replacement'
    ]
  };

  if (success) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-green-400/30">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Request Submitted!</h3>
          <p className="text-gray-300 mb-6">
            We've received your {formData.requestType} request. Our team will contact you within 24 hours.
          </p>
          <p className="text-sm text-gray-400">
            Order ID: <span className="text-yellow-400 font-semibold">{formData.orderId}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <Package className="w-6 h-6 text-yellow-400 mr-3" />
        <h3 className="text-2xl font-bold text-white">Submit Return/Exchange Request</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Request Type *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, requestType: 'return', reason: '' }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.requestType === 'return'
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-lg font-semibold">🔄 Return</div>
              <div className="text-xs mt-1">Get refund</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, requestType: 'exchange', reason: '' }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.requestType === 'exchange'
                  ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-lg font-semibold">🔁 Exchange</div>
              <div className="text-xs mt-1">Get replacement</div>
            </button>
          </div>
        </div>

        {/* Order ID */}
        <div>
          <label htmlFor="orderId" className="block text-sm font-semibold text-gray-300 mb-2">
            Order ID *
          </label>
          <input
            type="text"
            id="orderId"
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            placeholder="e.g., 674a1234567890abcd"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Find this in your order confirmation email</p>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2">
            Contact Number *
          </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.startsWith('91') && value.length > 10) {
                  value = value.substring(2);
                } else if (value.startsWith('0') && value.length > 10) {
                  value = value.substring(1);
                }
                value = value.slice(0, 10);
                setFormData(prev => ({ ...prev, phone: value }));
              }}
              placeholder="10-digit mobile number without country code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={13}
              className={`w-full px-4 py-3 pr-16 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                formData.phone.length === 10 && /^[6-9]/.test(formData.phone)
                  ? 'border-green-500 focus:border-green-500'
                  : 'border-gray-600 focus:border-yellow-400'
              }`}
              required
            />
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block text-sm font-semibold text-gray-300 mb-2">
            Reason for {formData.requestType === 'return' ? 'Return' : 'Exchange'} *
          </label>
          <select
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
            required
          >
            <option value="">Select a reason</option>
            {commonReasons[formData.requestType].map((reason, index) => (
              <option key={index} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        {/* Issue Description */}
        <div>
          <label htmlFor="issueDescription" className="block text-sm font-semibold text-gray-300 mb-2">
            Describe the Issue
          </label>
          <textarea
            id="issueDescription"
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleChange}
            placeholder="Please provide details about the issue..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
          />
        </div>

        {/* Product Details */}
        <div>
          <label htmlFor="productDetails" className="block text-sm font-semibold text-gray-300 mb-2">
            Product Details (Optional)
          </label>
          <input
            type="text"
            id="productDetails"
            name="productDetails"
            value={formData.productDetails}
            onChange={handleChange}
            placeholder="Which product(s) from your order?"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank if all products need {formData.requestType}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            loading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-500 hover:to-orange-600 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit {formData.requestType === 'return' ? 'Return' : 'Exchange'} Request
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By submitting, you agree to our return and exchange policy. We'll contact you within 24 hours.
        </p>
      </form>
    </div>
  );
};

export default ReturnExchangeForm;
