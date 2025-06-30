import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  MapPin, 
  CreditCard, 
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Shield
} from 'lucide-react';
import { loadCart, cartEmpty } from '../core/helper/cartHelper';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';
import { validateCoupon } from '../core/helper/couponHelper';
import { useDevMode } from '../context/DevModeContext';
import { getMockProductImage } from '../data/mockData';

interface CheckoutStep {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const steps: CheckoutStep[] = [
  { id: 1, title: 'Cart Review', icon: <ShoppingCart className="w-5 h-5" /> },
  { id: 2, title: 'Shipping Info', icon: <MapPin className="w-5 h-5" /> },
  { id: 3, title: 'Payment', icon: <CreditCard className="w-5 h-5" /> },
  { id: 4, title: 'Confirmation', icon: <Check className="w-5 h-5" /> }
];

const EnhancedCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { isTestMode } = useDevMode();
  const auth = isAutheticated();
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  useEffect(() => {
    loadCartItems();
    if (auth && auth.user) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: auth.user.name || '',
        email: auth.user.email || ''
      }));
    }
  }, []);

  const loadCartItems = () => {
    const items = loadCart();
    if (items.length === 0) {
      navigate('/shop');
      return;
    }
    setCartItems(items);
    calculateTotal(items);
  };

  const calculateTotal = (items: any[]) => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setCartTotal(subtotal);
  };

  const getShippingCost = () => {
    if (cartTotal >= 1000) return 0;
    return shippingMethod === 'express' ? 149 : 99;
  };

  const getFinalTotal = () => {
    return cartTotal + getShippingCost() - couponDiscount;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponError('');
    const response = await validateCoupon(couponCode, cartTotal);
    
    if (response && response.valid) {
      setAppliedCoupon(response.coupon);
      setCouponDiscount(response.coupon.discount);
    } else {
      setCouponError(response?.error || 'Invalid coupon code');
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponError('');
  };

  const getProductImage = (item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id.split('-')[0]);
    }
    if (item.image) {
      return item.image;
    }
    return `${API}/product/photo/${item._id.split('-')[0]}`;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateShipping()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (validatePayment()) {
        handlePlaceOrder();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateShipping = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!shippingInfo[field as keyof typeof shippingInfo]) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    if (!/^\d{6}$/.test(shippingInfo.pincode)) {
      alert('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    // In test mode, skip validation
    if (isTestMode) return true;
    
    if (!paymentInfo.cardNumber || !paymentInfo.cardName || !paymentInfo.expiryMonth || 
        !paymentInfo.expiryYear || !paymentInfo.cvv) {
      alert('Please fill in all payment details');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    // Simulate order processing
    setTimeout(() => {
      cartEmpty(() => {
        navigate('/order-confirmation', {
          state: {
            orderId: `ORD-${Date.now()}`,
            items: cartItems,
            total: getFinalTotal(),
            shippingInfo
          }
        });
      });
    }, 2000);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                currentStep >= step.id
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                step.icon
              )}
            </div>
            <span
              className={`ml-3 font-medium hidden sm:inline ${
                currentStep >= step.id ? 'text-white' : 'text-gray-400'
              }`}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 sm:w-24 h-0.5 mx-2 transition-all ${
                currentStep > step.id ? 'bg-yellow-400' : 'bg-gray-700'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderCartReview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
      
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item._id} className="bg-gray-800 rounded-lg p-4 flex gap-4">
            <img
              src={getProductImage(item)}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/80/80';
              }}
            />
            <div className="flex-1">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-sm text-gray-400">
                Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
              </p>
              <p className="text-yellow-400 font-semibold mt-1">
                ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Have a Coupon?</h3>
        {!appliedCoupon ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400 uppercase"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition-all"
            >
              Apply
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-500/20 border border-green-500 rounded-lg p-3">
            <div>
              <p className="text-green-400 font-semibold">{appliedCoupon.code}</p>
              <p className="text-sm text-gray-300">{appliedCoupon.description}</p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-red-400 text-sm mt-2">{couponError}</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{cartTotal}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-400">
            <span>Discount ({appliedCoupon?.code})</span>
            <span>-₹{couponDiscount}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className={getShippingCost() === 0 ? 'text-green-400' : ''}>
            {getShippingCost() === 0 ? 'FREE' : `₹${getShippingCost()}`}
          </span>
        </div>
        <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-yellow-400">₹{getFinalTotal()}</span>
        </div>
      </div>
    </div>
  );

  const renderShippingInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            value={shippingInfo.fullName}
            onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={shippingInfo.email}
            onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="john@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input
            type="tel"
            value={shippingInfo.phone}
            onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="+91 98765 43210"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">City</label>
          <input
            type="text"
            value={shippingInfo.city}
            onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="Mumbai"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Address</label>
        <textarea
          value={shippingInfo.address}
          onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
          rows={3}
          placeholder="123 Main Street, Apartment 4B"
        />
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">State</label>
          <input
            type="text"
            value={shippingInfo.state}
            onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="Maharashtra"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Pincode</label>
          <input
            type="text"
            value={shippingInfo.pincode}
            onChange={(e) => setShippingInfo({ ...shippingInfo, pincode: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="400001"
            maxLength={6}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Country</label>
          <input
            type="text"
            value={shippingInfo.country}
            disabled
            className="w-full px-4 py-3 bg-gray-700 border border-gray-700 rounded-lg text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold mb-3">Shipping Method</h3>
        <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
          shippingMethod === 'standard' ? 'border-yellow-400 bg-gray-800' : 'border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="shipping"
              value="standard"
              checked={shippingMethod === 'standard'}
              onChange={(e) => setShippingMethod(e.target.value)}
              className="text-yellow-400"
            />
            <div>
              <p className="font-medium">Standard Shipping</p>
              <p className="text-sm text-gray-400">5-7 business days</p>
            </div>
          </div>
          <span className="font-semibold">{cartTotal >= 1000 ? 'FREE' : '₹99'}</span>
        </label>
        
        <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
          shippingMethod === 'express' ? 'border-yellow-400 bg-gray-800' : 'border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="shipping"
              value="express"
              checked={shippingMethod === 'express'}
              onChange={(e) => setShippingMethod(e.target.value)}
              className="text-yellow-400"
            />
            <div>
              <p className="font-medium">Express Shipping</p>
              <p className="text-sm text-gray-400">2-3 business days</p>
            </div>
          </div>
          <span className="font-semibold">₹149</span>
        </label>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
      
      {isTestMode && (
        <div className="bg-yellow-400/20 border border-yellow-400 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 text-sm">
            Test Mode: Use any card details for testing. Payment won't be processed.
          </p>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Card Number</label>
          <input
            type="text"
            value={paymentInfo.cardNumber}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="1234 5678 9012 3456"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Cardholder Name</label>
          <input
            type="text"
            value={paymentInfo.cardName}
            onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
            placeholder="John Doe"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              value={paymentInfo.expiryMonth}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryMonth: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <select
              value={paymentInfo.expiryYear}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryYear: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
            >
              <option value="">YYYY</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">CVV</label>
            <input
              type="text"
              value={paymentInfo.cvv}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800 rounded-lg p-4">
          <Shield className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <p className="text-sm">Secure Payment</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <Package className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <p className="text-sm">Fast Delivery</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <Truck className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <p className="text-sm">Track Order</p>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping ({shippingMethod})</span>
            <span>{getShippingCost() === 0 ? 'FREE' : `₹${getShippingCost()}`}</span>
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-lg">
            <span>Total Amount</span>
            <span className="text-yellow-400">₹{getFinalTotal()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        {renderStepIndicator()}
        
        {/* Step Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
          {currentStep === 1 && renderCartReview()}
          {currentStep === 2 && renderShippingInfo()}
          {currentStep === 3 && renderPayment()}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          
          <button
            onClick={handleNextStep}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Processing...</>
            ) : currentStep === 3 ? (
              <>Place Order</>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckout;
