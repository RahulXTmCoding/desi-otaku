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
  Loader,
  Shield,
  Zap,
  Lock,
  Globe,
  Smartphone
} from 'lucide-react';
import { loadCart, cartEmpty } from '../core/helper/cartHelper';
import { isAutheticated } from '../auth/helper';
import { createOrder, mockCreateOrder } from '../core/helper/orderHelper';
import { useDevMode } from '../context/DevModeContext';
import { API } from '../backend';
import { getLocationFromPincode, guessStateFromPincode } from '../data/pincodeData';
import RealTShirtPreview from '../components/RealTShirtPreview';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorValue?: string;
  image?: string;
  customDesign?: any;
  productImage?: string;
  category?: string | { _id: string; name: string };
  design?: string;
  designPrice?: number;
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
      return;
    }

    // Load saved checkout state (if returning from signin)
    loadCheckoutState();

    // Pre-fill user info if logged in
    if (auth && auth.user) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: auth.user.name || '',
        email: auth.user.email || ''
      }));
      
      // Load saved addresses for returning users
      loadSavedAddresses();
    }
  }, []);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
    
    // Check pincode serviceability and auto-fill city/state when pincode is entered
    if (field === 'pinCode' && value.length === 6) {
      // Try to get location from pincode
      const location = getLocationFromPincode(value);
      if (location) {
        setShippingInfo(prev => ({
          ...prev,
          city: location.city,
          state: location.state
        }));
      } else {
        // Try to guess state from pincode pattern
        const guessedState = guessStateFromPincode(value);
        if (guessedState) {
          setShippingInfo(prev => ({
            ...prev,
            state: guessedState
          }));
        }
      }
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

  // Save checkout state to sessionStorage
  const saveCheckoutState = () => {
    const checkoutState = {
      shippingInfo,
      paymentMethod,
      activeStep,
      selectedShipping,
      shippingRates,
      pincodeServiceable
    };
    sessionStorage.setItem('checkoutState', JSON.stringify(checkoutState));
  };

  // Load saved checkout state
  const loadCheckoutState = () => {
    const savedState = sessionStorage.getItem('checkoutState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setShippingInfo(state.shippingInfo || shippingInfo);
        setPaymentMethod(state.paymentMethod || 'card');
        setActiveStep(state.activeStep || 1);
        setSelectedShipping(state.selectedShipping || null);
        setShippingRates(state.shippingRates || []);
        setPincodeServiceable(state.pincodeServiceable || null);
        
        // Clear the saved state after loading
        sessionStorage.removeItem('checkoutState');
      } catch (error) {
        console.error('Error loading checkout state:', error);
      }
    }
  };

  // Load saved addresses for logged in users
  const loadSavedAddresses = async () => {
    if (auth && auth.user && auth.token) {
      try {
        const response = await fetch(`${API}/user/${auth.user._id}/addresses`, {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        });
        
        if (response.ok) {
          const addresses = await response.json();
          if (addresses && addresses.length > 0) {
            // Use the default address or the first one
            const defaultAddress = addresses.find((addr: any) => addr.isDefault) || addresses[0];
            if (defaultAddress) {
              setShippingInfo({
                fullName: defaultAddress.fullName || auth.user.name || '',
                email: auth.user.email || '',
                phone: defaultAddress.phone || '',
                address: defaultAddress.address || '',
                city: defaultAddress.city || '',
                state: defaultAddress.state || '',
                pinCode: defaultAddress.pinCode || '',
                country: defaultAddress.country || 'India'
              });
              
              // Check pincode serviceability if we have one
              if (defaultAddress.pinCode) {
                checkPincodeServiceability(defaultAddress.pinCode);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved addresses:', error);
      }
    }
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

    // Check if user is logged in
    if (!auth || !auth.user || !auth.token) {
      // Save current state before redirecting
      saveCheckoutState();
      
      // Redirect to signin with return URL
      navigate('/signin', { 
        state: { 
          from: '/checkout',
          message: 'Please sign in to complete your order' 
        } 
      });
      return;
    }

    setLoading(true);
    
    try {
      // Save address for future use if user is logged in
      if (auth && auth.user && auth.token) {
        try {
          await fetch(`${API}/user/${auth.user._id}/address`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth.token}`
            },
            body: JSON.stringify({
              ...shippingInfo,
              isDefault: true // Mark as default address
            })
          });
        } catch (error) {
          console.error('Error saving address:', error);
          // Don't block order if address save fails
        }
      }

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

      console.log('Order placement debug:', {
        isTestMode,
        hasAuth: !!auth,
        hasUser: !!(auth && auth.user),
        hasToken: !!(auth && auth.token),
        orderData
      });

      let result;
      
      if (isTestMode) {
        console.log('Using mock order creation (test mode)...');
        // Use mock order creation
        result = await mockCreateOrder(orderData);
        console.log('Mock order result:', result);
      } else if (auth && auth.user && auth.token) {
        console.log('Using real backend...');
        // Process order data to handle custom designs properly
        const processedOrderData = {
          ...orderData,
          products: orderData.products.map(item => {
            // Check if it's a custom design
            const isCustomDesign = item.product === 'custom' || !item.product || 
                                 (typeof item.product === 'string' && item.product.includes('custom'));
            
            if (isCustomDesign) {
              // For custom designs, omit the product field and add custom flag
              const { product, ...itemWithoutProduct } = item;
              return {
                ...itemWithoutProduct,
                isCustom: true,
                customDesign: item.name || 'Custom T-Shirt Design'
              };
            } else {
              // For regular products, keep the product ID
              return {
                ...item,
                isCustom: false
              };
            }
          })
        };
        
        console.log('Processed order data:', processedOrderData);
        
        // Use real backend
        result = await createOrder(auth.user._id, auth.token, processedOrderData);
        console.log('Real order result:', result);
      } else {
        // This shouldn't happen as we check auth earlier
        alert('Authentication error. Please try again.');
        return;
      }

      if (result.error) {
        console.error('Order creation failed:', result);
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
                <div className="space-y-6">
                  {/* Pincode First (Auto-fills City/State) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      PIN Code <span className="text-yellow-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={shippingInfo.pinCode}
                        onChange={(e) => handleInputChange('pinCode', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                        placeholder="Enter 6-digit PIN code"
                        required
                        maxLength={6}
                      />
                    </div>
                    {shippingInfo.pinCode.length === 6 && (
                      <>
                        {checkingRates && (
                          <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                            <Loader className="w-3 h-3 animate-spin" />
                            Checking delivery availability...
                          </p>
                        )}
                        {pincodeServiceable === false && (
                          <p className="text-sm text-red-400 mt-2">
                            Sorry, we don't deliver to this pincode yet
                          </p>
                        )}
                        {pincodeServiceable === true && (
                          <p className="text-sm text-green-400 mt-2">
                            ✓ Delivery available
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Enter pincode to auto-fill city and state</p>
                  </div>

                  {/* City and State (Auto-filled) */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={shippingInfo.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                          placeholder="Auto-filled from PIN code"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        State
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={shippingInfo.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                          placeholder="Auto-filled from PIN code"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
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
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
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

                  {/* Address */}
                  <div>
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

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      value={shippingInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      disabled
                    >
                      <option value="India">India</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Currently shipping only within India</p>
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
                  Select Payment Method
                </h2>
                
                {/* Payment Options */}
                <div className="space-y-4">
                  {/* Credit/Debit Card */}
                  <label className={`relative overflow-hidden cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'ring-2 ring-yellow-400 bg-gray-700' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`} style={{ borderRadius: '12px' }}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start p-5">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          paymentMethod === 'card' ? 'bg-yellow-400' : 'bg-gray-600'
                        }`}>
                          <CreditCard className={`w-6 h-6 ${
                            paymentMethod === 'card' ? 'text-gray-900' : 'text-gray-300'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">Credit/Debit Card</h3>
                          {paymentMethod === 'card' && (
                            <Check className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Pay securely with your credit or debit card
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Accepted:</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">Visa</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">Mastercard</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">RuPay</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* UPI */}
                  <label className={`relative overflow-hidden cursor-pointer transition-all ${
                    paymentMethod === 'upi' 
                      ? 'ring-2 ring-yellow-400 bg-gray-700' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`} style={{ borderRadius: '12px' }}>
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start p-5">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          paymentMethod === 'upi' ? 'bg-yellow-400' : 'bg-gray-600'
                        }`}>
                          <Smartphone className={`w-6 h-6 ${
                            paymentMethod === 'upi' ? 'text-gray-900' : 'text-gray-300'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">UPI Payment</h3>
                          {paymentMethod === 'upi' && (
                            <Check className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Quick and easy payment via UPI
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Supported:</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">GPay</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">PhonePe</span>
                          <span className="text-xs bg-gray-600 px-2 py-1 rounded">Paytm</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery - Disabled */}
                  <div className="relative overflow-hidden opacity-50 cursor-not-allowed" style={{ borderRadius: '12px' }}>
                    <div className="bg-gray-700 p-5">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-lg font-semibold text-gray-400">Cash on Delivery</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Currently unavailable
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            COD will be available soon as we expand our services
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Lock className="w-4 h-4 text-green-400" />
                      <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Zap className="w-4 h-4 text-green-400" />
                      <span>Fast Processing</span>
                    </div>
                  </div>
                </div>
                
                {/* Note for test mode */}
                {isTestMode && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                    <p className="text-sm text-blue-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
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
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Package className="w-5 h-5 text-yellow-400" />
                  Review Your Order
                </h2>
                
                <div className="space-y-6">
                  {/* Order Items - Enhanced */}
                  <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-yellow-400" />
                      Order Items ({cartItems.length})
                    </h3>
                    <div className="space-y-4">
                      {cartItems.map((item, index) => (
                        <div key={item._id} className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                          {/* Product Image - Custom Preview or Real Image */}
                          <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            {item.category === 'custom' && item.design ? (
                              // Show T-shirt preview for custom designs
                              <div className="w-full h-full relative">
                                <div className="relative w-full h-full bg-gray-100 rounded overflow-hidden">
                                  {/* T-shirt base */}
                                  <img
                                    src="/front.png"
                                    alt="T-shirt"
                                    className="w-full h-full object-contain"
                                    style={{
                                      filter: item.color === 'Black' ? 'brightness(0.2)' : 
                                             item.color === 'Navy' ? 'brightness(0.4) sepia(1) hue-rotate(190deg) saturate(2)' :
                                             item.color === 'Red' ? 'brightness(0.6) sepia(1) hue-rotate(-20deg) saturate(2.5)' :
                                             item.color === 'Gray' ? 'brightness(0.6) grayscale(1)' :
                                             'none'
                                    }}
                                  />
                                  {/* Design overlay */}
                                  {item.image && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <img
                                        src={item.image}
                                        alt={item.design || 'Custom design'}
                                        className="w-1/3 h-1/3 object-contain"
                                        style={{
                                          filter: item.color === 'Black' ? 'brightness(1.2)' : 'none'
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Show product image for regular items
                              <img 
                                src={item.image && item.image.startsWith('http') 
                                  ? item.image 
                                  : `${API}/product/photo/${item._id}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, show placeholder
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'https://via.placeholder.com/200?text=Product';
                                }}
                              />
                            )}
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{item.name}</h4>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-gray-400">
                                <span className="text-xs">Size:</span>
                                <span className="font-medium text-white">{item.size || 'M'}</span>
                              </span>
                              <span className="flex items-center gap-1 text-gray-400">
                                <span className="text-xs">Color:</span>
                                <span className="flex items-center gap-1">
                                  <span 
                                    className="w-4 h-4 rounded-full border border-gray-600" 
                                    style={{ backgroundColor: item.colorValue || '#999' }}
                                  />
                                  <span className="font-medium text-white">{item.color || 'Black'}</span>
                                </span>
                              </span>
                              <span className="flex items-center gap-1 text-gray-400">
                                <span className="text-xs">Qty:</span>
                                <span className="font-medium text-white">{item.quantity}</span>
                              </span>
                              {item.customDesign && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <span className="text-xs">✨ Custom Design</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-yellow-400">₹{item.price * item.quantity}</p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-gray-400">₹{item.price} each</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Information Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Shipping Address */}
                    <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-yellow-400" />
                        Delivery Address
                      </h3>
                      <div className="space-y-2">
                        <p className="font-medium text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {shippingInfo.fullName}
                        </p>
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {shippingInfo.email}
                        </p>
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {shippingInfo.phone}
                        </p>
                        <div className="pt-2 border-t border-gray-600">
                          <p className="text-sm text-gray-300 flex items-start gap-2">
                            <Home className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span>
                              {shippingInfo.address}<br />
                              {shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pinCode}<br />
                              {shippingInfo.country}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Shipping & Payment Info */}
                    <div className="space-y-4">
                      {/* Shipping Method */}
                      <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-yellow-400" />
                          Shipping Method
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{selectedShipping?.courier_name}</p>
                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                              <Zap className="w-3 h-3" />
                              {selectedShipping?.estimated_delivery}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-yellow-400">₹{selectedShipping?.rate}</p>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-yellow-400" />
                          Payment Method
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              paymentMethod === 'card' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}>
                              {paymentMethod === 'card' ? (
                                <CreditCard className="w-5 h-5 text-white" />
                              ) : (
                                <Smartphone className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI Payment'}
                              </p>
                              <p className="text-xs text-gray-400">Secure payment</p>
                            </div>
                          </div>
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-6">
                    <h3 className="font-semibold mb-4 text-yellow-400">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Subtotal ({cartItems.length} items)</span>
                        <span className="font-medium">₹{getTotalAmount()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Shipping</span>
                        <span className="font-medium">₹{selectedShipping?.rate || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Tax</span>
                        <span className="font-medium">₹0</span>
                      </div>
                      <div className="pt-3 border-t border-yellow-400/30">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold text-yellow-400">
                            ₹{getTotalAmount() + (selectedShipping?.rate || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400">
                      By placing this order, you agree to our{' '}
                      <a href="#" className="text-yellow-400 hover:underline">Terms & Conditions</a>
                      {' '}and{' '}
                      <a href="#" className="text-yellow-400 hover:underline">Privacy Policy</a>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveStep(2)}
                      className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                    >
                      <ChevronLeft className="inline w-4 h-4 mr-1" />
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 disabled:from-yellow-400/50 disabled:to-yellow-500/50 text-gray-900 py-3 px-8 rounded-lg font-bold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing Order...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Place Order • ₹{getTotalAmount() + (selectedShipping?.rate || 0)}
                        </>
                      )}
                    </button>
                  </div>
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
