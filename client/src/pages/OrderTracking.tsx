import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Mail, Eye, EyeOff, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { API } from '../backend';
import { 
  calculateCouponDiscountAmount, 
  getCouponDiscountText, 
  calculateTotalSavings, 
  formatPrice 
} from '../utils/orderUtils';
import OrderDiscountBreakdown from '../components/OrderDiscountBreakdown';
import { getColorName } from '../utils/colorUtils';

interface Order {
  _id: string;
  products: Array<{
    name: string;
    count: number;
    price: number;
    size?: string;
    color?: string;
    customization?: any;
  }>;
  amount: number;
  originalAmount?: number;
  discount?: number;
  status: string;
  createdAt: string;
  address: string;
  shipping?: {
    courier?: string;
    trackingId?: string;
    estimatedDelivery?: string;
    shippingCost?: number;
  };
  quantityDiscount?: {
    amount: number;
    percentage: number;
    totalQuantity: number;
    tier?: {
      minQuantity: number;
      maxQuantity: number;
      discount: number;
    };
    message?: string;
  };
  coupon?: {
    code: string;
    discountType?: string;
    discountValue?: number;
  };
  rewardPointsRedeemed?: number;
  rewardPointsDiscount?: number;
  user?: {
    name: string;
    email: string;
  };
  guestInfo?: {
    name: string;
    email: string;
  };
}

interface AccessInfo {
  accessedAt: string;
  accessCount: number;
  remainingAttempts?: number;
}

const OrderTracking: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State management
  const [order, setOrder] = useState<Order | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [magicLink, setMagicLink] = useState<string>('');
  
  // PIN verification form state
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinForm, setPinForm] = useState({
    orderId: '',
    email: '',
    pin: ''
  });
  const [showPin, setShowPin] = useState(false);
  
  // Email request form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    orderId: '',
    email: ''
  });
  const [emailSent, setEmailSent] = useState(false);

  // Handle magic link access on component mount
  useEffect(() => {
    if (token) {
      // Decode base64url encoded token back to original JWT
      try {
        // Convert base64url to base64 (replace - with + and _ with /)
        const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        // Decode from base64
        const decodedToken = atob(padded);
        handleMagicLinkAccess(decodedToken);
      } catch (error) {
        console.error('Failed to decode token:', error);
        setError('Invalid tracking link format.');
        setShowPinForm(true);
      }
    }
  }, [token]);

  // Handle magic link access
  const handleMagicLinkAccess = async (accessToken: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API}/secure-order/track/${accessToken}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setOrder(data.order);
        setAccessInfo(data.accessInfo);
      } else {
        throw new Error(data.error || 'Failed to access order');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to access order. The link may have expired.');
      setShowPinForm(true); // Show PIN form as fallback
    } finally {
      setLoading(false);
    }
  };

  // Handle PIN verification
  const handlePinVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API}/secure-order/access-pin`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pinForm)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setOrder(data.order);
        setAccessInfo(data.accessInfo);
        setMagicLink(data.magicLink);
        setShowPinForm(false);
      } else {
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email request for new magic link
  const handleEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API}/secure-order/request-link`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailForm)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setEmailSent(true);
        setShowEmailForm(false);
      } else {
        throw new Error(data.error || 'Failed to send tracking link');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send tracking link.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      'Received': 'bg-blue-500',
      'Processing': 'bg-yellow-500',
      'Shipped': 'bg-purple-500',
      'Delivered': 'bg-green-500',
      'Cancelled': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  // Loading state
  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Accessing your order...</p>
        </div>
      </div>
    );
  }

  // Success state - show order details
  if (order) {
    const customer = order.user || order.guestInfo;
    
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-yellow-400 mr-3" />
              <h1 className="text-3xl font-bold text-white">Secure Order Tracking</h1>
            </div>
            <p className="text-gray-300">Order #{order._id}</p>
          </div>

          {/* Success Message */}
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-green-300">
                Successfully accessed! {accessInfo && `Viewed ${accessInfo.accessCount} time(s).`}
              </p>
            </div>
          </div>

          {/* New Magic Link */}
          {magicLink && (
            <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-6">
              <h3 className="text-blue-400 font-semibold mb-2">🔗 New Secure Link Generated</h3>
              <p className="text-blue-200 text-sm mb-3">Bookmark this link for easy access:</p>
              <div className="bg-gray-800 p-3 rounded border">
                <code className="text-blue-400 text-sm break-all">{magicLink}</code>
              </div>
            </div>
          )}

          {/* Order Status */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Order Status</h2>
              <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400">Order Date</p>
                <p className="text-white">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-400">Customer</p>
                <p className="text-white">{customer?.name}</p>
              </div>
              {order.shipping?.trackingId && (
                <div>
                  <p className="text-gray-400">Tracking ID</p>
                  <p className="text-white">{order.shipping.trackingId}</p>
                </div>
              )}
              {order.shipping?.courier && (
                <div>
                  <p className="text-gray-400">Courier</p>
                  <p className="text-white">{order.shipping.courier}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.products.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{item.name}</h3>
                    <div className="text-gray-400 text-sm">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && item.customization && (
                        <span className="ml-4">Color: {getColorName(item.color)}</span>
                      )}
                      <span className="ml-4">Qty: {item.count}</span>
                    </div>
                  </div>
                  <div className="text-white font-semibold">
                    ₹{(item.price * item.count).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
              
              {/* ✅ UNIVERSAL DISCOUNT COMPONENT - Handles all discount sources including online payment discount */}
              <div className="pt-4 border-t border-gray-600">
                <OrderDiscountBreakdown 
                  order={order}
                  orderStateData={null}
                  className=""
                  showTitle={false}
                  variant="detailed"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Shipping Address</h2>
            <p className="text-gray-300">{order.address}</p>
            {order.shipping?.estimatedDelivery && (
              <p className="text-gray-400 mt-2">
                Estimated Delivery: {formatDate(order.shipping.estimatedDelivery)}
              </p>
            )}
          </div>

          {/* Security Info */}
          <div className="bg-gray-800 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-semibold">Security Notice</span>
            </div>
            <p className="text-gray-300 text-sm">
              This is a secure order tracking session. Your order information is protected and only accessible 
              with valid credentials. Links expire automatically for your security.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main tracking interface (no token provided or access failed)
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Order Tracking</h1>
          </div>
          <p className="text-gray-300">Track your order securely with multiple access methods</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Email Sent Success */}
        {emailSent && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <p className="text-green-300">
                New tracking link sent to your email! Check your inbox.
              </p>
            </div>
          </div>
        )}

        {/* Access Methods */}
        <div className="space-y-6">
          {/* PIN Access Form */}
          {showPinForm ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Access with PIN</h2>
              <form onSubmit={handlePinVerification} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Order ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your order ID"
                    value={pinForm.orderId}
                    onChange={(e) => setPinForm({ ...pinForm, orderId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={pinForm.email}
                    onChange={(e) => setPinForm({ ...pinForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    PIN Code
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder="Enter 6-digit PIN from email"
                      value={pinForm.pin}
                      onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent pr-12"
                      required
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-600 text-gray-900 font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Access Order'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowPinForm(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Use different method
                </button>
              </div>
            </div>
          ) : (
            /* Access Method Selection */
            <div className="space-y-4">
              <div 
                onClick={() => setShowPinForm(true)}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 cursor-pointer transition-colors border border-gray-700 hover:border-yellow-400"
              >
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-yellow-400 mr-4" />
                  <div>
                    <h3 className="text-white font-semibold">Access with PIN</h3>
                    <p className="text-gray-400 text-sm">Use Order ID + Email + PIN from your email</p>
                  </div>
                </div>
              </div>
              
              <div 
                onClick={() => setShowEmailForm(true)}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 cursor-pointer transition-colors border border-gray-700 hover:border-yellow-400"
              >
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-blue-400 mr-4" />
                  <div>
                    <h3 className="text-white font-semibold">Request New Link</h3>
                    <p className="text-gray-400 text-sm">Get a fresh tracking link sent to your email</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Request Form */}
          {showEmailForm && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Request New Tracking Link</h2>
              <form onSubmit={handleEmailRequest} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Order ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your order ID"
                    value={emailForm.orderId}
                    onChange={(e) => setEmailForm({ ...emailForm, orderId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Tracking Link'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-gray-800 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-400 font-semibold">Security Features</span>
          </div>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Tracking links expire after 7 days for security</li>
            <li>• Rate limiting prevents unauthorized access attempts</li>
            <li>• All access attempts are logged and monitored</li>
            <li>• Email verification required for all access methods</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
