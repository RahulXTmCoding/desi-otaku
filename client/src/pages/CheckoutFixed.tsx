import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, CreditCard, Package, Check } from 'lucide-react';
import { loadCart, cartEmpty } from '../core/helper/cartHelper';
import { isAutheticated } from '../auth/helper';
import { createOrder, mockCreateOrder } from '../core/helper/orderHelper';
import { getBraintreeClientToken, processPayment, mockProcessPayment } from '../core/helper/paymentHelper';
import { 
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  mockRazorpayPayment,
  initializeRazorpayCheckout
} from '../core/helper/razorpayHelper';
import { 
  getUserAddresses, 
  addUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  mockGetUserAddresses,
  mockAddUserAddress,
  mockUpdateUserAddress,
  mockDeleteUserAddress,
  type Address
} from '../core/helper/addressHelper';
import { useDevMode } from '../context/DevModeContext';
import { API } from '../backend';

// Import optimized components
import AddressSectionEnhanced from '../components/checkout/AddressSectionEnhanced';
import ShippingMethodEnhanced from '../components/checkout/ShippingMethodEnhanced';
import OrderReview from '../components/checkout/OrderReview';
import PaymentSection from '../components/checkout/PaymentSection';

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

// Step progress component
const StepProgress = React.memo(({ activeStep }: { activeStep: number }) => {
  const steps = [
    { id: 1, name: 'Shipping', icon: MapPin },
    { id: 2, name: 'Review', icon: Package },
    { id: 3, name: 'Payment', icon: CreditCard }
  ];

  return (
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
  );
});

StepProgress.displayName = 'StepProgress';

const CheckoutFixed: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = useMemo(() => isAutheticated(), []);
  const { isTestMode } = useDevMode();
  
  // Use ref to track if Razorpay script is loaded
  const razorpayLoadedRef = useRef(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  
  // Address management states
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
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

  const shippingInfoRef = useRef(shippingInfo);
  useEffect(() => {
    shippingInfoRef.current = shippingInfo;
  }, [shippingInfo]);

  // Debug and prevent stuck loading states
  useEffect(() => {
    if (addressLoading) {
      console.log('Address loading started');
      const timeout = setTimeout(() => {
        console.warn('Address loading timeout - forcing reset');
        setAddressLoading(false);
      }, 5000); // 5 second timeout
      return () => clearTimeout(timeout);
    }
  }, [addressLoading]);
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  const [paymentData, setPaymentData] = useState<{
    loading: boolean;
    success: boolean;
    clientToken: string | null;
    error: string;
    instance: any;
  }>({
    loading: false,
    success: false,
    clientToken: null,
    error: '',
    instance: {}
  });

  // Load cart items on mount
  useEffect(() => {
    const items = loadCart();
    if (!items || items.length === 0) {
      navigate('/cart');
    } else {
      setCartItems(items);
    }
  }, [navigate]);

  // Load Razorpay script with cleanup
  useEffect(() => {
    if (!razorpayLoadedRef.current) {
      razorpayLoadedRef.current = true;
      loadRazorpayScript().then((loaded) => {
        setRazorpayReady(loaded as boolean);
      });
    }
    
    // Cleanup function
    return () => {
      // Remove Razorpay script if needed
      const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  // Set default user info
  useEffect(() => {
    if (auth && typeof auth !== 'boolean' && auth.user) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: auth.user?.name || '',
        email: auth.user?.email || ''
      }));
    }
  }, [auth]);

  // Track if addresses have been loaded to prevent duplicate calls
  const addressesLoadedRef = useRef(false);
  
  // Load saved addresses
  useEffect(() => {
    // Prevent duplicate loads
    if (addressesLoadedRef.current) {
      return;
    }
    
    const loadAddresses = async () => {
      // Clear any bad mock auth data
      if (auth && typeof auth !== 'boolean' && auth.user && auth.user._id && auth.user._id.includes('mock')) {
        // Clear mock auth data that shouldn't be in production
        if (!isTestMode) {
          console.log('Clearing invalid mock auth data');
          localStorage.removeItem('jwt');
          window.location.reload();
          return;
        }
      }
      
      // Only load addresses if in test mode or properly authenticated
      if (isTestMode) {
        // Test mode - use mock addresses
        addressesLoadedRef.current = true;
        try {
          const addresses = await mockGetUserAddresses();
          
          if (Array.isArray(addresses) && addresses.length > 0) {
            setSavedAddresses(addresses);
            const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr._id || '');
              setShippingInfo({
                fullName: defaultAddr.fullName,
                email: defaultAddr.email,
                phone: defaultAddr.phone,
                address: defaultAddr.address,
                city: defaultAddr.city,
                state: defaultAddr.state,
                pinCode: defaultAddr.pinCode,
                country: defaultAddr.country || 'India'
              });
            }
          }
        } catch (error) {
          console.error('Failed to load mock addresses:', error);
        }
      } else if (auth && typeof auth !== 'boolean' && auth.user && auth.user._id && auth.token && !auth.user._id.includes('mock')) {
        // Production mode - only if properly authenticated with real user ID
        addressesLoadedRef.current = true;
        try {
          const addresses = await getUserAddresses(auth.user._id, auth.token);
          
          if (Array.isArray(addresses) && addresses.length > 0) {
            setSavedAddresses(addresses);
            const defaultAddr = addresses.find((addr: Address) => addr.isDefault) || addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr._id || '');
              setShippingInfo({
                fullName: defaultAddr.fullName,
                email: defaultAddr.email,
                phone: defaultAddr.phone,
                address: defaultAddr.address,
                city: defaultAddr.city,
                state: defaultAddr.state,
                pinCode: defaultAddr.pinCode,
                country: defaultAddr.country || 'India'
              });
            }
          }
        } catch (error) {
          console.error('Failed to load user addresses:', error);
        }
      } else {
        // Mark as loaded even for guest users to prevent re-runs
        addressesLoadedRef.current = true;
      }
    };

    loadAddresses();
  }, [isTestMode]); // Remove auth from dependencies to prevent loops

  // Load payment token when reaching payment step
  useEffect(() => {
    if (activeStep === 3 && !isTestMode && auth && typeof auth !== 'boolean' && auth.token) {
      getBraintreeClientToken(auth.user._id, auth.token).then(data => {
        if (data.error) {
          setPaymentData(prev => ({ ...prev, error: data.error }));
        } else {
          setPaymentData(prev => ({ ...prev, clientToken: data.clientToken }));
        }
      });
    }
  }, [activeStep, isTestMode, auth]);

  // Memoized callbacks
  const getTotalAmount = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const validateShipping = useCallback(() => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pinCode'];
    return required.every(field => shippingInfo[field as keyof typeof shippingInfo]);
  }, [shippingInfo]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectAddress = useCallback((address: Address) => {
    setSelectedAddressId(address._id || '');
    setShippingInfo({
      fullName: address.fullName,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      country: address.country || 'India'
    });
    setShowAddressForm(false);
  }, []);

  const handleAddNewAddress = useCallback(() => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    if (auth && typeof auth !== 'boolean' && auth.user) {
      setShippingInfo({
        fullName: auth.user.name || '',
        email: auth.user.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
        country: 'India'
      });
    }
  }, [auth]);

  const handleEditAddress = useCallback((address: Address) => {
    setEditingAddressId(address._id || null);
    setShippingInfo({
      fullName: address.fullName,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      country: address.country || 'India'
    });
    setShowAddressForm(true);
  }, []);

  const handleSaveAddress = useCallback(async () => {
    if (!validateShipping()) {
      alert('Please fill all address fields');
      return;
    }

    // For guest users (not signed in), just use the address without saving to profile
    if (!isTestMode && (!auth || typeof auth === 'boolean' || !auth.user)) {
      // Create a temporary address for guest checkout
      const guestAddress: Address = {
        _id: `guest-${Date.now()}`,
        ...shippingInfoRef.current,
        isDefault: true
      };
      
      // Add to local state only
      setSavedAddresses([guestAddress]);
      setShowAddressForm(false);
      setEditingAddressId(null);
      handleSelectAddress(guestAddress);
      
      // Show info message
      console.log('Guest checkout - address will not be saved to profile');
      return;
    }

    setAddressLoading(true);
    
    try {
      const addressData: Address = {
        ...shippingInfoRef.current,
        isDefault: savedAddresses.length === 0
      };

      let result;
      if (isTestMode) {
        result = editingAddressId
          ? await mockUpdateUserAddress(editingAddressId, addressData)
          : await mockAddUserAddress(addressData);
      } else if (auth && typeof auth !== 'boolean' && auth.user && auth.token) {
        result = editingAddressId
          ? await updateUserAddress(auth.user._id, auth.token, editingAddressId, addressData)
          : await addUserAddress(auth.user._id, auth.token, addressData);
      }

      if (result && result.addresses) {
        setSavedAddresses(result.addresses);
        setShowAddressForm(false);
        setEditingAddressId(null);
        
        // Find and select the saved/updated address
        const targetAddress = editingAddressId 
          ? result.addresses.find((addr: Address) => addr._id === editingAddressId)
          : result.addresses[result.addresses.length - 1];
          
        if (targetAddress) {
          handleSelectAddress(targetAddress);
        }
      } else if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to save address:', error);
      alert(error.message || 'Failed to save address. Please try again.');
    }
    
    setAddressLoading(false);
  }, [validateShipping, auth, savedAddresses, editingAddressId, isTestMode, handleSelectAddress]);

  const handleDeleteAddress = useCallback(async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    // For guest addresses, just remove from local state
    if (addressId.startsWith('guest-')) {
      setSavedAddresses(prev => prev.filter(addr => addr._id !== addressId));
      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
        // Reset form for new address
        handleAddNewAddress();
      }
      return;
    }

    setAddressLoading(true);
    
    try {
      let result;
      if (isTestMode) {
        result = await mockDeleteUserAddress(addressId);
      } else if (auth && typeof auth !== 'boolean' && auth.user && auth.token) {
        result = await deleteUserAddress(auth.user._id, auth.token, addressId);
      }

      if (result && result.addresses !== undefined) {
        setSavedAddresses(result.addresses);
        
        // If deleted address was selected, select another one
        if (selectedAddressId === addressId && result.addresses.length > 0) {
          const defaultAddr = result.addresses.find((addr: Address) => addr.isDefault);
          handleSelectAddress(defaultAddr || result.addresses[0]);
        }
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address');
    }
    
    setAddressLoading(false);
  }, [auth, isTestMode, selectedAddressId, handleSelectAddress, handleAddNewAddress]);

  const handleSetDefaultAddress = useCallback(async (addressId: string) => {
    // For guest addresses, just update local state
    if (addressId.startsWith('guest-')) {
      setSavedAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      })));
      return;
    }

    setAddressLoading(true);
    
    try {
      let result;
      if (isTestMode) {
        result = await mockUpdateUserAddress(addressId, { isDefault: true });
      } else if (auth && typeof auth !== 'boolean' && auth.user && auth.token) {
        result = await updateUserAddress(auth.user._id, auth.token, addressId, { isDefault: true });
      }

      if (result && result.addresses) {
        setSavedAddresses(result.addresses);
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('Failed to set default address');
    }
    
    setAddressLoading(false);
  }, [auth, isTestMode]);

  const handleCancelAddressForm = useCallback(() => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    if (savedAddresses.length > 0 && selectedAddressId) {
      const selected = savedAddresses.find(addr => addr._id === selectedAddressId);
      if (selected) {
        handleSelectAddress(selected);
      }
    }
  }, [savedAddresses, selectedAddressId, handleSelectAddress]);

  const handlePlaceOrder = useCallback(async () => {
    if (!validateShipping()) {
      alert('Please fill all shipping details');
      return;
    }
  
    if (!selectedShipping) {
      alert('Please select a shipping method');
      return;
    }
  
    if (!isTestMode && paymentMethod === 'razorpay' && !razorpayReady) {
      alert('Payment gateway is loading. Please try again.');
      return;
    }
  
    // Allow guest checkout - they can sign in later or create account after order
    const isGuest = !auth || typeof auth === 'boolean' || !auth.user || !auth.token;
  
    setLoading(true);
  
    try {
      const totalAmount = getTotalAmount() + (selectedShipping?.rate || 0);
      
      if (isTestMode) {
        // Test mode implementation
        const paymentResult = paymentMethod === 'razorpay' 
          ? await mockRazorpayPayment(totalAmount)
          : await mockProcessPayment(totalAmount);
          
        const orderData = {
          products: cartItems.map(item => ({
            product: item._id.split('-')[0],
            name: item.name,
            price: item.price,
            count: item.quantity,
            size: item.size,
          })),
          transaction_id: paymentMethod === 'razorpay' 
            ? paymentResult.razorpay_payment_id 
            : paymentResult.transaction.id,
          amount: totalAmount,
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
        
        const orderResult = await mockCreateOrder(orderData);
        
        if (orderResult.error) {
          throw new Error(orderResult.error);
        }
        
        cartEmpty(() => {
          navigate('/order-confirmation-enhanced', { 
            state: { 
              orderId: orderResult._id,
              orderDetails: orderData,
              shippingInfo,
              paymentMethod
            }
          });
        });
      } else if (paymentMethod === 'razorpay') {
        // Razorpay implementation for both authenticated and guest users
        let orderResponse;
        
        if (isGuest) {
          // Guest checkout - use dedicated endpoint
          const response = await fetch(`${API}/razorpay/order/guest/create`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: totalAmount,
              currency: 'INR',
              receipt: `guest_${Date.now()}`,
              customerInfo: {
                name: shippingInfo.fullName,
                email: shippingInfo.email,
                phone: shippingInfo.phone
              },
              notes: {
                items: cartItems.length,
                shipping_method: selectedShipping?.courier_name || 'Standard'
              }
            })
          });
          
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create guest order');
          }
          orderResponse = data;
        } else {
          // Authenticated user checkout
          const userId = (auth as any).user._id;
          const token = (auth as any).token;
          
          orderResponse = await createRazorpayOrder(
            userId, 
            token,
            {
              amount: totalAmount,
              currency: 'INR',
              receipt: `order_${Date.now()}`,
              notes: {
                customer_name: shippingInfo.fullName,
                customer_email: shippingInfo.email
              }
            }
          );
        }
        
        if (orderResponse.error) {
          throw new Error(orderResponse.error);
        }
        
        setLoading(false);
        
        initializeRazorpayCheckout(
          {
            order_id: orderResponse.order.id,
            amount: orderResponse.order.amount,
            currency: orderResponse.order.currency,
            key_id: orderResponse.key_id,
            name: 'T-Shirt Store',
            description: 'Order Payment',
            prefill: {
              name: shippingInfo.fullName,
              email: shippingInfo.email,
              phone: shippingInfo.phone
            }
          },
          async (paymentData: any) => {
            setLoading(true);
            
            try {
              let verifyResponse;
              
              if (isGuest) {
                // Guest payment verification
                const response = await fetch(`${API}/razorpay/payment/guest/verify`, {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(paymentData)
                });
                
                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.error || 'Payment verification failed');
                }
                verifyResponse = data;
              } else {
                // Authenticated user verification
                verifyResponse = await verifyRazorpayPayment(
                  (auth as any).user._id,
                  (auth as any).token,
                  paymentData
                );
              }
              
              if (!verifyResponse.verified && !verifyResponse.success) {
                throw new Error('Payment verification failed');
              }
              
              const orderData = {
                products: cartItems.map(item => ({
                  product: item._id.split('-')[0],
                  name: item.name,
                  price: item.price,
                  count: item.quantity,
                  size: item.size,
                })),
                transaction_id: paymentData.razorpay_payment_id,
                amount: totalAmount,
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
              
              let orderResult;
              
              if (isGuest) {
                // Guest order creation
                const response = await fetch(`${API}/guest/order/create`, {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    ...orderData,
                    guestInfo: {
                      name: shippingInfo.fullName,
                      email: shippingInfo.email,
                      phone: shippingInfo.phone
                    }
                  })
                });
                
                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.error || 'Failed to create guest order');
                }
                orderResult = data.order;
              } else {
                // Authenticated user order
                orderResult = await createOrder((auth as any).user._id, (auth as any).token, orderData);
                if (orderResult.error) {
                  throw new Error(orderResult.error);
                }
              }
              
              setLoading(false);
              
              cartEmpty(() => {
                // Navigate to enhanced confirmation page
                navigate('/order-confirmation-enhanced', { 
                  state: { 
                    orderId: orderResult._id,
                    orderDetails: orderData,
                    shippingInfo,
                    paymentMethod,
                    paymentDetails: verifyResponse.payment,
                    isGuest,
                    createdAt: new Date().toISOString()
                  }
                });
              });
              
            } catch (error: any) {
              console.error('Order creation error:', error);
              alert(`Failed to create order: ${error.message}`);
              setLoading(false);
            }
          },
          (error: any) => {
            console.error('Razorpay payment error:', error);
            if (error.error !== 'Payment cancelled by user') {
              alert(`Payment failed: ${error.error || 'Unknown error'}`);
            }
          }
        );
      }
    } catch (error: any) {
      console.error('Order placement error:', error);
      alert(`Failed to place order: ${error.message}`);
      setLoading(false);
    }
  }, [validateShipping, selectedShipping, isTestMode, paymentMethod, razorpayReady, auth, navigate, getTotalAmount, cartItems, shippingInfo]);

  // Render step content
  const renderStepContent = useMemo(() => {
    switch (activeStep) {
      case 1:
        return (
          <>
            <AddressSectionEnhanced
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              showAddressForm={showAddressForm}
              editingAddressId={editingAddressId}
              addressLoading={addressLoading}
              shippingInfo={shippingInfo}
              onSelectAddress={handleSelectAddress}
              onAddNewAddress={handleAddNewAddress}
              onEditAddress={handleEditAddress}
              onDeleteAddress={handleDeleteAddress}
              onSetDefaultAddress={handleSetDefaultAddress}
              onSaveAddress={handleSaveAddress}
              onCancelAddressForm={handleCancelAddressForm}
              onInputChange={handleInputChange}
              validateShipping={validateShipping}
            />
            
            <ShippingMethodEnhanced
              selectedShipping={selectedShipping}
              onSelectShipping={setSelectedShipping}
              shippingPincode={shippingInfo.pinCode}
              cartTotal={getTotalAmount()}
            />
            
            <button
              onClick={() => {
                if (validateShipping() && selectedShipping) {
                  setActiveStep(2);
                } else {
                  alert('Please fill all details and select shipping method');
                }
              }}
              className="mt-6 w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 px-8 rounded-lg font-bold"
            >
              Continue to Review
            </button>
          </>
        );
        
      case 2:
        return (
          <>
            <OrderReview
              cartItems={cartItems}
              shippingInfo={shippingInfo}
              selectedShipping={selectedShipping}
              getTotalAmount={getTotalAmount}
            />
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setActiveStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 py-3 rounded-lg font-bold"
              >
                Continue to Payment
              </button>
            </div>
          </>
        );
        
      case 3:
        return (
          <>
            <PaymentSection
              paymentMethod={paymentMethod}
              isTestMode={isTestMode}
              razorpayReady={razorpayReady}
              paymentData={paymentData}
              loading={loading}
              totalAmount={getTotalAmount() + (selectedShipping?.rate || 0)}
              onPaymentMethodChange={setPaymentMethod}
              onPlaceOrder={handlePlaceOrder}
            />
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setActiveStep(2)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold"
              >
                Back
              </button>
            </div>
          </>
        );
        
      default:
        return null;
    }
  }, [
    activeStep,
    savedAddresses,
    selectedAddressId,
    showAddressForm,
    editingAddressId,
    addressLoading,
    shippingInfo,
    selectedShipping,
    cartItems,
    paymentMethod,
    isTestMode,
    razorpayReady,
    paymentData,
    loading,
    validateShipping,
    getTotalAmount,
    handleSelectAddress,
    handleAddNewAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleSaveAddress,
    handleCancelAddressForm,
    handleInputChange,
    handlePlaceOrder
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
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
        <StepProgress activeStep={activeStep} />

        {/* Main Content */}
        <div className="bg-gray-800 rounded-2xl p-6">
          {renderStepContent}
        </div>
      </div>
    </div>
  );
};

export default CheckoutFixed;
