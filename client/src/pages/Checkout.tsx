import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  MapPin,
  CreditCard,
  Package,
  Check,
  AlertCircle,
  User,
  Mail,
  Phone,
  Home,
  Truck,
  Loader
} from 'lucide-react';
import { loadCart, cartEmpty } from '../core/helper/cartHelper';
import { isAutheticated } from '../auth/helper';
import { createOrder, mockCreateOrder } from '../core/helper/orderHelper';
import { useDevMode } from '../context/DevModeContext';
import { API } from '../backend';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorValue?: string;
  image?: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = isAutheticated();
  const { isTestMode } = useDevMode();

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India'
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [checkingRates, setCheckingRates] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState<boolean | null>(null);

  useEffect(() => {
    const items = loadCart();
    setCartItems(items || []);
    
    // Redirect to cart if empty
    if (!items || items.length === 0) {
      navigate('/cart');
    }

    // Pre-fill user info if logged in
    if (auth && auth.user) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: auth.user.name || '',
        email: auth.user.email || ''
      }));
    }
  }, []);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    
    // Check pincode serviceability when pincode is entered
    if (field === 'pinCode' && value.length === 6) {
      checkPincodeServiceability(value);
    }
  };

  const checkPincodeServiceability = async (pincode: string) => {
    setCheckingRates(true);
    setPincodeServiceable(null);
    setShippingRates([]);
    
    try {
      // In test mode, simulate shipping rates
      if (isTestMode) {
        setTimeout(() => {
          setPincodeServiceable(true);
          setShippingRates([
            {
              courier_id: 1,
              courier_name: "Delhivery Surface",
              rate: 60,
              estimated_delivery: "3-5 days",
              etd: "2025-07-03"
            },
            {
              courier_id: 2,
              courier_name: "BlueDart Express",
              rate: 120,
              estimated_delivery: "1-2 days",
              etd: "2025-07-01"
            }
          ]);
          setSelectedShipping({
            courier_id: 1,
            courier_name: "Delhivery Surface",
            rate: 60,
            estimated_delivery: "3-5 days"
          });
          setCheckingRates(false);
        }, 1000);
        return;
      }

      // Check serviceability
      const response = await fetch(`${API}/shipping/pincode/${pincode}`);
      const data = await response.json();
      
      if (data.serviceable) {
        setPincodeServiceable(true);
        
        // Calculate shipping rates
        const rateResponse = await fetch(`${API}/shipping/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pincode: pincode,
            weight: 0.3 * cartItems.length, // 300g per t-shirt
            amount: getTotalAmount(),
            cod: paymentMethod === 'cod'
          })
        });
        
        const rateData = await rateResponse.json();
        if (rateData.rates && rateData.rates.length > 0) {
          setShippingRates(rateData.rates);
          setSelectedShipping(rateData.rates[0]); // Select cheapest by default
        }
      } else {
        setPincodeServiceable(false);
      }
    } catch (error) {
      console.error('Error checking pincode:', error);
      setPincodeServiceable(false);
    } finally {
      setCheckingRates(false);
    }
  };

  const validateShipping = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pinCode'];
    return required.every(field => shippingInfo[field as keyof typeof shippingInfo]);
  };

  const handlePlaceOrder = async () => {
    if (!validateShipping()) {
      alert('Please fill all shipping details');
      return;
    }

    if (!selectedShipping) {
      alert('Please select a shipping method');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare order data with shipping details
      const orderData = {
        products: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          price: item.price,
          count: item.quantity,
          size: item.size
        })),
        transaction_id: `TXN-${Date.now()}`, // Mock transaction ID
        amount: getTotalAmount() + (selectedShipping?.rate || 0),
        address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pinCode}, ${shippingInfo.country}`,
        status: "Received",
        shipping: {
          name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          pincode: shippingInfo.pinCode,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
          weight: 0.3 * cartItems.length,
          shippingCost: selectedShipping?.rate || 0,
          courier: selectedShipping?.courier_name || ''
        }
      };

      let result;
      if (isTestMode) {
        // Use mock order creation
        result = await mockCreateOrder(orderData);
      } else if (auth && auth.user && auth.token) {
        // Use real backend
        result = await createOrder(auth.user._id, auth.token, orderData);
      } else {
        alert('Please login to place order');
        navigate('/signin');
        return;
      }

      if (result.error) {
        alert('Failed to create order: ' + result.error);
      } else {
        // Clear cart after successful order
        cartEmpty(() => {
          navigate('/order-confirmation', { 
            state: { 
              orderId: result._id,
              orderDetails: orderData,
              shippingInfo,
              paymentMethod
            }
          });
        });
      }
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Shipping', icon: MapPin },
    { id: 2, name: 'Payment', icon: CreditCard },
    { id: 3, name: 'Review', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Cart
        </button>

        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    activeStep >= step.id
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {activeStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`ml-3 font-medium ${
                    activeStep >= step.id ? 'text-yellow-400' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-0.5 mx-4 transition-all ${
                    activeStep > step.id ? 'bg-yellow-400' : 'bg-gray-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2">
            {/* Shipping Information */}
            {activeStep === 1 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                  Shipping Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={shippingInfo.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={shippingInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Street Address
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={shippingInfo.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                        placeholder="123 Main Street, Apartment 4B"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      placeholder="Maharashtra"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.pinCode}
                      onChange={(e) => handleInputChange('pinCode', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      placeholder="400001"
                      required
                      maxLength={6}
                    />
                    {checkingRates && (
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                        <Loader className="w-3 h-3 animate-spin" />
                        Checking delivery availability...
                      </p>
                    )}
                    {pincodeServiceable === false && (
                      <p className="text-sm text-red-400 mt-1">
                        Sorry, we don't deliver to this pincode yet
                      </p>
                    )}
                    {pincodeServiceable === true && (
                      <p className="text-sm text-green-400 mt-1">
                        ✓ Delivery available
                      </p>
                    )}
                  </div>
                </div>

                {/* Shipping Options */}
                {shippingRates.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-yellow-400" />
                      Select Shipping Method
                    </h3>
                    <div className="space-y-3">
                      {shippingRates.map((rate) => (
                        <label
                          key={rate.courier_id}
                          className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                            selectedShipping?.courier_id === rate.courier_id
                              ? 'bg-yellow-400/20 border border-yellow-400'
                              : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShipping?.courier_id === rate.courier_id}
                              onChange={() => setSelectedShipping(rate)}
                              className="text-yellow-400 focus:ring-yellow-400"
                            />
                            <div>
                              <p className="font-medium">{rate.courier_name}</p>
                              <p className="text-sm text-gray-400">
                                Delivery in {rate.estimated_delivery}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold">₹{rate.rate}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!validateShipping()) {
                      alert('Please fill all shipping details');
                      return;
                    }
                    if (!pincodeServiceable) {
                      alert('Please enter a serviceable pincode');
                      return;
                    }
                    if (!selectedShipping) {
                      alert('Please select a shipping method');
                      return;
                    }
                    setActiveStep(2);
                  }}
                  className="mt-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 px-8 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Payment Method */}
            {activeStep === 2 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-yellow-400" />
                  Payment Method
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="ml-3">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="ml-3">UPI</span>
                  </label>
                  <label className="flex items-center p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="ml-3">Cash on Delivery</span>
                  </label>
                </div>
                
                {/* Note for test mode */}
                {isTestMode && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                    <p className="text-sm text-blue-400">
                      Test Mode: Payment will be simulated. No actual payment will be processed.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-lg font-bold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 px-8 rounded-lg font-bold transition-all transform hover:scale-105"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Order Review */}
            {activeStep === 3 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-yellow-400" />
                  Review Your Order
                </h2>
                
                {/* Shipping Details */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Shipping Details</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="font-medium">{shippingInfo.fullName}</p>
                    <p className="text-sm text-gray-300">{shippingInfo.email}</p>
                    <p className="text-sm text-gray-300">{shippingInfo.phone}</p>
                    <p className="text-sm text-gray-300 mt-2">
                      {shippingInfo.address}<br />
                      {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pinCode}<br />
                      {shippingInfo.country}
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Payment Method</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="capitalize">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : 'Credit/Debit Card'}</p>
                  </div>
                </div>

                {/* Shipping Method */}
                {selectedShipping && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Shipping Method</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="font-medium">{selectedShipping.courier_name}</p>
                      <p className="text-sm text-gray-400">
                        Delivery in {selectedShipping.estimated_delivery} • ₹{selectedShipping.rate}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-400">
                            Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-lg font-bold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 text-gray-900 py-3 px-8 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-gray-400">
                        {item.size} / {item.color} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <hr className="border-gray-700 mb-4" />
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>₹{getTotalAmount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span>{selectedShipping ? `₹${selectedShipping.rate}` : 'Calculate at checkout'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span>₹0</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-yellow-400">
                    ₹{getTotalAmount() + (selectedShipping?.rate || 0)}
                  </span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <AlertCircle className="w-4 h-4" />
                  <p>Your payment information is secure and encrypted</p>
                </div>
              </div>

              {/* Mode Indicator */}
              <div className="mt-4 text-center text-xs text-gray-500">
                {isTestMode ? (
                  <p>Test Mode: Order simulation</p>
                ) : (
                  <p>Live Mode: Real order processing</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
