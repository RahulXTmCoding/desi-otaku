import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, CreditCard, Package, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { isAutheticated } from '../auth/helper';
import { getBraintreeClientToken } from '../core/helper/paymentHelper';
import { loadRazorpayScript } from '../core/helper/razorpayHelper';
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
import { useOrderHandler } from '../components/checkout/OrderHandler';
import { API } from '../backend';

// Import optimized components
import AddressSectionEnhanced from '../components/checkout/AddressSectionEnhanced';
import ShippingMethodEnhanced from '../components/checkout/ShippingMethodEnhanced';
import OrderReview from '../components/checkout/OrderReview';
import PaymentSection from '../components/checkout/PaymentSection';
import DiscountSection from '../components/checkout/DiscountSection';
import ShippingProgressTracker from '../components/ShippingProgressTracker';

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
  const location = useLocation();
  const { cart: regularCart, clearCart } = useCart();
  
  // Check for Buy Now item
  const buyNowItem = location.state?.buyNowItem;
  const cart = buyNowItem ? [buyNowItem] : regularCart;
  
  const [activeStep, setActiveStep] = useState(1);
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
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  // Discount states
  const [appliedDiscount, setAppliedDiscount] = useState<{
    coupon: { code: string; discount: number; description: string } | null;
    rewardPoints: { points: number; discount: number } | null;
    quantity: { discount: number; percentage: number; description: string } | null;
  }>({
    coupon: null,
    rewardPoints: null,
    quantity: null
  });
  
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

  // Check cart items on mount
  useEffect(() => {
    if (!buyNowItem && (!regularCart || regularCart.length === 0)) {
      navigate('/cart');
    }
  }, [buyNowItem, regularCart, navigate]);

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
        // Guest users - load addresses from localStorage
        addressesLoadedRef.current = true;
        try {
          const savedGuestAddresses = localStorage.getItem('guest_addresses');
          if (savedGuestAddresses) {
            const addresses = JSON.parse(savedGuestAddresses);
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
          }
        } catch (error) {
          console.error('Failed to load guest addresses from localStorage:', error);
        }
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
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // ✅ CRITICAL FIX: Use backend calculation for authenticated users (same as guest flow)
  const [backendCalculatedAmount, setBackendCalculatedAmount] = useState<number | null>(null);
  const [backendCalculationLoading, setBackendCalculationLoading] = useState(false);

  // Fetch backend calculation for authenticated users
  useEffect(() => {
    if (!isTestMode && auth && typeof auth !== 'boolean' && auth.user && cart.length > 0 && selectedShipping) {
      setBackendCalculationLoading(true);
      
      fetch(`${API}/razorpay/calculate-amount`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartItems: cart.map(item => ({
            product: item.product || item._id?.split('-')[0] || '',
            name: item.name,
            quantity: item.quantity,
            size: item.size
          })),
          couponCode: appliedDiscount.coupon?.code || null,
          rewardPoints: appliedDiscount.rewardPoints?.points || null,
          shippingCost: selectedShipping?.rate || 0
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && !data.error) {
          setBackendCalculatedAmount(data.total);
          
          // Update quantity discount display from backend calculation
          if (data.quantityDiscount > 0) {
            const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
            const percentage = Math.round((data.quantityDiscount / (data.subtotal + data.shippingCost)) * 100);
            
            setAppliedDiscount(prev => ({
              ...prev,
              quantity: {
                discount: data.quantityDiscount,
                percentage,
                description: `${percentage}% off for ${totalQuantity} items`
              }
            }));
          } else {
            setAppliedDiscount(prev => ({ ...prev, quantity: null }));
          }
        }
      })
      .catch(console.error)
      .finally(() => setBackendCalculationLoading(false));
    }
  }, [isTestMode, auth && typeof auth !== 'boolean' ? auth.user._id : null, cart, selectedShipping?.rate, appliedDiscount.coupon?.code, appliedDiscount.rewardPoints?.points]);

  // ✅ FALLBACK: Frontend calculation for test mode and guests
  const getFrontendCalculatedAmount = useCallback(() => {
    const subtotal = getTotalAmount();
    const shipping = selectedShipping?.rate || 0;
    
    // Calculate quantity-based discount (AOV) - EXACT backend match with SAME rounding
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    let quantityDiscount = 0;
    let percentage = 0;
    
    // 🎯 FIXED: Match backend AOV tiers exactly - including 2-item tier!
    if (totalQuantity >= 2) {
      const baseAmount = subtotal + shipping;
      if (totalQuantity >= 5) {
        percentage = 20;
        quantityDiscount = Math.floor(baseAmount * 0.20); // 20% for 5+ items
      } else if (totalQuantity >= 3) {
        percentage = 15;
        quantityDiscount = Math.floor(baseAmount * 0.15); // 15% for 3-4 items
      } else if (totalQuantity >= 2) {
        percentage = 5;
        quantityDiscount = Math.floor(baseAmount * 0.05); // 5% for 2 items
      }
    }
    
    // Apply discounts in order: quantity discount first, then others
    const afterQuantityDiscount = (subtotal + shipping) - quantityDiscount;
    
    // ✅ CRITICAL ROUNDING FIX: Don't round coupon discount - it's already correctly calculated by backend API
    const couponDiscount = appliedDiscount.coupon?.discount || 0;
    const rewardDiscount = appliedDiscount.rewardPoints?.discount || 0;
    
    const finalAmount = afterQuantityDiscount - couponDiscount - rewardDiscount;
    
    // ✅ CRITICAL ROUNDING FIX: Use consistent rounding to match backend exactly
    const roundedFinalAmount = Math.round(finalAmount);
    
    // Store quantity discount for display
    if (quantityDiscount > 0 && (!appliedDiscount.quantity || appliedDiscount.quantity.discount !== quantityDiscount)) {
      setAppliedDiscount(prev => ({
        ...prev,
        quantity: {
          discount: quantityDiscount,
          percentage,
          description: `${percentage}% off for ${totalQuantity} items`
        }
      }));
    } else if (quantityDiscount === 0 && appliedDiscount.quantity) {
      setAppliedDiscount(prev => ({ ...prev, quantity: null }));
    }
    
    return Math.max(0, roundedFinalAmount);
  }, [getTotalAmount, selectedShipping, appliedDiscount, cart]);

  // ✅ FINAL AMOUNT: Use backend calculation for authenticated users, frontend for others
  const getFinalAmount = useCallback(() => {
    if (!isTestMode && auth && typeof auth !== 'boolean' && auth.user && backendCalculatedAmount !== null) {
      return backendCalculatedAmount;
    }
    return getFrontendCalculatedAmount();
  }, [isTestMode, auth && typeof auth !== 'boolean' ? auth.user._id : null, backendCalculatedAmount, getFrontendCalculatedAmount]);

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

    // For guest users (not signed in), save to localStorage
    if (!isTestMode && (!auth || typeof auth === 'boolean' || !auth.user)) {
      setAddressLoading(true);
      
      try {
        let updatedAddresses: Address[];
        
        if (editingAddressId) {
          // Update existing guest address
          updatedAddresses = savedAddresses.map(addr => 
            addr._id === editingAddressId
              ? { ...addr, ...shippingInfoRef.current }
              : addr
          );
        } else {
          // Add new guest address
          const guestAddress: Address = {
            _id: `guest-${Date.now()}`,
            ...shippingInfoRef.current,
            isDefault: savedAddresses.length === 0
          };
          updatedAddresses = [...savedAddresses, guestAddress];
        }
        
        // Save to localStorage
        localStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
        setSavedAddresses(updatedAddresses);
        setShowAddressForm(false);
        setEditingAddressId(null);
        
        // Select the saved/updated address
        const targetAddress = editingAddressId
          ? updatedAddresses.find(addr => addr._id === editingAddressId)
          : updatedAddresses[updatedAddresses.length - 1];
          
        if (targetAddress) {
          handleSelectAddress(targetAddress);
        }
        
        console.log('Guest address saved to localStorage');
      } catch (error: any) {
        console.error('Failed to save guest address:', error);
        alert('Failed to save address. Please try again.');
      }
      
      setAddressLoading(false);
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

    // For guest addresses, remove from localStorage and local state
    if (addressId.startsWith('guest-')) {
      const updatedAddresses = savedAddresses.filter(addr => addr._id !== addressId);
      setSavedAddresses(updatedAddresses);
      
      // Update localStorage
      localStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
      
      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
        // Reset form for new address
        handleAddNewAddress();
      }
      
      console.log('Guest address deleted from localStorage');
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
  }, [auth, isTestMode, selectedAddressId, savedAddresses, handleSelectAddress, handleAddNewAddress]);

  const handleSetDefaultAddress = useCallback(async (addressId: string) => {
    // For guest addresses, update local state and localStorage
    if (addressId.startsWith('guest-')) {
      const updatedAddresses = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      }));
      
      setSavedAddresses(updatedAddresses);
      
      // Update localStorage
      localStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
      
      console.log('Guest default address updated in localStorage');
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
  }, [auth, isTestMode, savedAddresses]);

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

  // Use the extracted order handler
  const { handlePlaceOrder, ProcessingModal } = useOrderHandler({
    cart,
    auth,
    isTestMode,
    paymentMethod,
    shippingInfo,
    selectedShipping,
    appliedDiscount,
    getTotalAmount,
    getFinalAmount,
    razorpayReady,
    clearCart: buyNowItem ? async () => {} : clearCart, // Don't clear cart for buy now
    isBuyNow: !!buyNowItem
  });

  const handlePlaceOrderWithValidation = useCallback(async () => {
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
    
    setLoading(true);
    try {
      await handlePlaceOrder();
    } catch (error: any) {
      console.error('Order placement error:', error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [validateShipping, selectedShipping, isTestMode, paymentMethod, razorpayReady, handlePlaceOrder]);

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
              onClick={async () => {
                if (!validateShipping()) {
                  alert('Please fill all shipping details');
                  return;
                }
                
                if (!selectedShipping) {
                  alert('Please select shipping method');
                  return;
                }
                
                // ✅ AUTO-SAVE: Save address for guest users before proceeding
                if (!auth || typeof auth === 'boolean' || !auth.user) {
                  try {
                    // Auto-save guest address when proceeding
                    const currentAddresses = JSON.parse(localStorage.getItem('guest_addresses') || '[]');
                    
                    // Check if current address already exists
                    const existingAddressIndex = currentAddresses.findIndex((addr: Address) => 
                      addr.fullName === shippingInfo.fullName &&
                      addr.email === shippingInfo.email &&
                      addr.phone === shippingInfo.phone &&
                      addr.address === shippingInfo.address &&
                      addr.pinCode === shippingInfo.pinCode
                    );
                    
                    if (existingAddressIndex === -1) {
                      // Address doesn't exist, add it
                      const newAddress: Address = {
                        _id: `guest-${Date.now()}`,
                        ...shippingInfo,
                        isDefault: currentAddresses.length === 0
                      };
                      
                      const updatedAddresses = [...currentAddresses, newAddress];
                      localStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
                      setSavedAddresses(updatedAddresses);
                      setSelectedAddressId(newAddress._id!);
                      
                      console.log('✅ Guest address auto-saved for future use');
                    }
                  } catch (error) {
                    console.error('Failed to auto-save guest address:', error);
                    // Don't block checkout if auto-save fails
                  }
                }
                
                setActiveStep(2);
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
              cartItems={cart.map(item => ({
                ...item,
                _id: item._id || `item-${Date.now()}`,
                product: item.product || (item._id ? item._id.split('-')[0] : '')
              }))}
              shippingInfo={shippingInfo}
              selectedShipping={selectedShipping}
              getTotalAmount={getTotalAmount}
            />
            
            {/* Free Shipping Progress Tracker */}
            <ShippingProgressTracker 
              cartTotal={getTotalAmount()} 
              className="mb-6"
            />
            
            {/* Add Discount Section */}
            <DiscountSection
              subtotal={getTotalAmount()}
              shippingCost={selectedShipping?.rate || 0}
              onDiscountChange={(discount) => setAppliedDiscount(prev => ({ ...prev, ...discount }))}
              isTestMode={isTestMode}
            />
            
            {/* Order Summary */}
            <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalAmount()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{selectedShipping?.rate || 0}</span>
                </div>
                {appliedDiscount.quantity && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Quantity Discount ({appliedDiscount.quantity.percentage}%)</span>
                    <span>-₹{appliedDiscount.quantity.discount}</span>
                  </div>
                )}
                {appliedDiscount.coupon && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span>
                    <span>-₹{appliedDiscount.coupon.discount}</span>
                  </div>
                )}
                {appliedDiscount.rewardPoints && (
                  <div className="flex justify-between text-purple-400">
                    <span>Reward Points</span>
                    <span>-₹{appliedDiscount.rewardPoints.discount}</span>
                  </div>
                )}
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-yellow-400">₹{getFinalAmount()}</span>
                  </div>
                </div>
              </div>
            </div>
            
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
              totalAmount={getFinalAmount()}
              onPaymentMethodChange={setPaymentMethod}
              onPlaceOrder={handlePlaceOrderWithValidation}
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
    cart,
    paymentMethod,
    isTestMode,
    razorpayReady,
    paymentData,
    loading,
    appliedDiscount,
    validateShipping,
    getTotalAmount,
    getFinalAmount,
    handleSelectAddress,
    handleAddNewAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleSaveAddress,
    handleCancelAddressForm,
    handleInputChange,
    handlePlaceOrderWithValidation
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
      
      {/* 🎯 UX FIX: Payment Processing Modal */}
      <ProcessingModal />
    </div>
  );
};

export default CheckoutFixed;
