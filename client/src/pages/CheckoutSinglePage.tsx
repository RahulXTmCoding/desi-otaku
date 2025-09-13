import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Truck, Percent, ShoppingBag } from 'lucide-react';
import { CreditCard, Smartphone, AlertCircle, Shield, Loader, Phone, CheckCircle } from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAnalytics } from '../context/AnalyticsContext';
import { isAutheticated } from '../auth/helper';
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
import { useAOV } from '../context/AOVContext';
import { useOrderHandler } from '../components/checkout/OrderHandler';
import { getMockProductImage } from '../data/mockData';
import CartTShirtPreview from '../components/CartTShirtPreview';
import { API } from '../backend';

// Import all existing components
import AddressSectionEnhanced from '../components/checkout/AddressSectionEnhanced';
import ShippingMethodEnhanced from '../components/checkout/ShippingMethodEnhanced';
import PaymentSection from '../components/checkout/PaymentSection';
import DiscountSection from '../components/checkout/DiscountSection';

const CheckoutSinglePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart: regularCart, clearCart } = useCart();
  const { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo } = useAnalytics();
  
  // Check for Buy Now item
  const buyNowItem = location.state?.buyNowItem;
  const cart = buyNowItem ? [buyNowItem] : regularCart;
  
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
    quantity: { discount: number; percentage: number; message: string } | null;
  }>({
    coupon: null,
    rewardPoints: null,
    quantity: null
  });

  // COD verification states
  const [codVerification, setCodVerification] = useState({
    otpSent: false,
    otpVerified: false,
    otp: '',
    loading: false
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

  // Check cart items on mount and track begin checkout
  useEffect(() => {
    if (!buyNowItem && (!regularCart || regularCart.length === 0)) {
      navigate('/cart');
      return;
    }

    // Track begin checkout when user reaches checkout page
    if (cart && cart.length > 0) {
      const couponCode = appliedDiscount.coupon?.code;
      trackBeginCheckout(cart, couponCode);
    }
  }, [buyNowItem, regularCart, navigate, cart, trackBeginCheckout, appliedDiscount.coupon?.code]);

  // Track shipping info when selected
  useEffect(() => {
    if (selectedShipping && cart && cart.length > 0) {
      trackAddShippingInfo(cart, selectedShipping.name || selectedShipping.label || 'Standard');
    }
  }, [selectedShipping, cart, trackAddShippingInfo]);

  // Track payment method when selected
  useEffect(() => {
    if (paymentMethod && cart && cart.length > 0) {
      const paymentType = paymentMethod === 'razorpay' ? 'Online Payment' : 
                         paymentMethod === 'cod' ? 'Cash on Delivery' : 
                         'Credit Card';
      trackAddPaymentInfo(cart, paymentType);
    }
  }, [paymentMethod, cart, trackAddPaymentInfo]);

  // Load Razorpay script
  useEffect(() => {
    if (!razorpayLoadedRef.current) {
      razorpayLoadedRef.current = true;
      loadRazorpayScript().then((loaded) => {
        setRazorpayReady(loaded as boolean);
      });
    }
    
    return () => {
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

  // Load saved addresses (reusing existing logic from CheckoutFixed)
  const addressesLoadedRef = useRef(false);
  
  useEffect(() => {
    if (addressesLoadedRef.current) {
      return;
    }
    
    const loadAddresses = async () => {
      if (auth && typeof auth !== 'boolean' && auth.user && auth.user._id && auth.user._id.includes('mock')) {
        if (!isTestMode) {
          console.log('Clearing invalid mock auth data');
          localStorage.removeItem('jwt');
          window.location.reload();
          return;
        }
      }
      
      if (isTestMode) {
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
  }, [isTestMode]);

  // Calculate totals
  const getTotalAmount = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // ✅ USE EXISTING AOV CONTEXT - NO API CALLS!
  const { quantityTiers } = useAOV();
  
  // ✅ Calculate AOV discount from existing context data
  const frontendAovDiscount = useMemo(() => {
    if (!quantityTiers || quantityTiers.length === 0) {
      return { discount: 0, percentage: 0 };
    }

    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Find applicable discount based on total quantity
    const applicableTier = quantityTiers
      .filter(tier => totalQuantity >= tier.minQuantity)
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];

    if (applicableTier) {
      const discountAmount = Math.round((subtotal * applicableTier.discount) / 100);
      console.log(`✅ AOV Calculation: ${totalQuantity} items, ${applicableTier.discount}% tier, ₹${discountAmount} discount`);
      return {
        discount: discountAmount,
        percentage: applicableTier.discount
      };
    }

    return { discount: 0, percentage: 0 };
  }, [cart, quantityTiers]);

  // ✅ Update applied discount when AOV discount changes
  useEffect(() => {
    if (frontendAovDiscount.discount > 0) {
      const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
      setAppliedDiscount(prev => ({
        ...prev,
        quantity: {
          discount: frontendAovDiscount.discount,
          percentage: frontendAovDiscount.percentage,
          message: `${frontendAovDiscount.percentage}% off for ${totalQuantity} items`
        }
      }));
    } else {
      setAppliedDiscount(prev => ({ ...prev, quantity: null }));
    }
  }, [frontendAovDiscount.discount, frontendAovDiscount.percentage, cart]);

  // ✅ STEP 3: Handle discount changes (NO API calls)
  const handleDiscountChange = useCallback((discount: any) => {
    setAppliedDiscount(prev => ({ ...prev, ...discount }));
  }, []);

  const getFinalAmount = useCallback(() => {
    // ✅ FIXED: Recalculate every time to ensure reactivity
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = selectedShipping?.rate || 0;
    let discountedSubtotal = subtotal;
    
    console.log(`💰 CALCULATING FINAL AMOUNT (REACTIVE):`, {
      subtotal,
      shipping,
      paymentMethod,
      aovDiscount: frontendAovDiscount.discount,
      couponDiscount: appliedDiscount.coupon?.discount || 0,
      rewardDiscount: appliedDiscount.rewardPoints?.discount || 0,
      timestamp: new Date().toISOString()
    });
    
    // 1️⃣ Apply AOV discount to subtotal
    const quantityDiscount = frontendAovDiscount.discount;
    discountedSubtotal = discountedSubtotal - quantityDiscount;
    console.log(`🔸 After AOV: ₹${discountedSubtotal} (deducted ₹${quantityDiscount})`);
    
    // 2️⃣ Apply coupon discount to discounted subtotal
    const couponDiscount = appliedDiscount.coupon?.discount || 0;
    discountedSubtotal = discountedSubtotal - couponDiscount;
    console.log(`🔸 After Coupon: ₹${discountedSubtotal} (deducted ₹${couponDiscount})`);
    
    // 3️⃣ Apply online payment discount to discounted subtotal
    const onlinePaymentDiscount = (paymentMethod === 'razorpay' || paymentMethod === 'card') 
      ? Math.round(discountedSubtotal * 0.05) 
      : 0;
    discountedSubtotal = discountedSubtotal - onlinePaymentDiscount;
    
    console.log(`💳 Online Payment Discount: ${paymentMethod} = ₹${onlinePaymentDiscount}`);
    console.log(`🔸 After Online Discount: ₹${discountedSubtotal}`);
    
    // 4️⃣ Apply reward points redemption (cash equivalent)
    const rewardDiscount = Math.min(appliedDiscount.rewardPoints?.discount || 0, discountedSubtotal);
    discountedSubtotal = discountedSubtotal - rewardDiscount;
    console.log(`🔸 After Rewards: ₹${discountedSubtotal} (deducted ₹${rewardDiscount})`);
    
    // 5️⃣ Add shipping to final discounted subtotal
    const finalAmount = Math.max(0, Math.round(discountedSubtotal + shipping));
    
    console.log(`✅ FINAL CALCULATION: ₹${finalAmount} (added shipping ₹${shipping})`);
    return finalAmount;
  }, [cart, selectedShipping?.rate, frontendAovDiscount.discount, appliedDiscount.coupon?.discount, appliedDiscount.rewardPoints?.discount, paymentMethod]);

  // Helper function to get online payment discount amount
  // ✅ REUSE: Same image handling logic as Cart page
  const getProductImage = useCallback((item: any) => {
    if (isTestMode) {
      return getMockProductImage(item._id?.split('-')[0] || '');
    }
    
    // For custom designs, we don't show a product image
    if (item.isCustom) {
      return '';
    }
    
    // Check if product has images array (new multi-image system)
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      // Find the primary image or use the first one
      const primaryImage = item.images.find((img: any) => img.isPrimary) || item.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
      // If no URL, try the indexed endpoint
      const primaryIndex = item.images.findIndex((img: any) => img.isPrimary);
      const index = primaryIndex >= 0 ? primaryIndex : 0;
      const productId = item.product?._id || item.product || item._id;
      return `${API}/product/image/${productId}/${index}`;
    }
    
    // Check if product object has images array
    if (item.product && typeof item.product === 'object' && item.product.images && Array.isArray(item.product.images)) {
      const primaryImage = item.product.images.find((img: any) => img.isPrimary) || item.product.images[0];
      if (primaryImage && primaryImage.url) {
        return primaryImage.url;
      }
      // If no URL, use indexed endpoint
      const primaryIndex = item.product.images.findIndex((img: any) => img.isPrimary);
      const index = primaryIndex >= 0 ? primaryIndex : 0;
      return `${API}/product/image/${item.product._id}/${index}`;
    }
    
    // Check if product has photoUrl (URL-based images - legacy)
    if (item.photoUrl) {
      if (item.photoUrl.startsWith('http') || item.photoUrl.startsWith('data:')) {
        return item.photoUrl;
      }
      return item.photoUrl;
    }
    
    // Check if we have a direct image URL
    if (item.image) {
      if (item.image.startsWith('http') || item.image.startsWith('data:')) {
        return item.image;
      }
      if (item.image.startsWith('/api')) {
        return item.image;
      }
    }
    
    // If we have a product ID, try the new endpoint with index 0
    const productId = item.product?._id || item.product || item._id;
    if (productId && !productId.startsWith('temp_') && !productId.startsWith('custom')) {
      return `${API}/product/image/${productId}/0`;
    }
    
    return '/api/placeholder/80/80';
  }, [isTestMode]);

  const getOnlinePaymentDiscount = useCallback(() => {
    if (paymentMethod === 'razorpay' || paymentMethod === 'card') {
      const subtotal = getTotalAmount();
      const shipping = selectedShipping?.rate || 0;
      return Math.round((subtotal + shipping) * 0.05);
    }
    return 0;
  }, [paymentMethod, getTotalAmount, selectedShipping]);

  const validateShipping = useCallback(() => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pinCode'];
    return required.every(field => shippingInfo[field as keyof typeof shippingInfo]);
  }, [shippingInfo]);

  // Address management functions (reused from CheckoutFixed)
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

    if (!isTestMode && (!auth || typeof auth === 'boolean' || !auth.user)) {
      setAddressLoading(true);
      
      try {
        let updatedAddresses: Address[];
        
        if (editingAddressId) {
          updatedAddresses = savedAddresses.map(addr => 
            addr._id === editingAddressId
              ? { ...addr, ...shippingInfoRef.current }
              : addr
          );
        } else {
          const guestAddress: Address = {
            _id: `guest-${Date.now()}`,
            ...shippingInfoRef.current,
            isDefault: savedAddresses.length === 0
          };
          updatedAddresses = [...savedAddresses, guestAddress];
        }
        
        localStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
        setSavedAddresses(updatedAddresses);
        setShowAddressForm(false);
        setEditingAddressId(null);
        
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

    if (addressId.startsWith('guest-')) {
      const updatedAddresses = savedAddresses.filter(addr => addr._id !== addressId);
      setSavedAddresses(updatedAddresses);
      
      localStorage.setItem('guest_addresses', JSON.stringify(updatedAddresses));
      
      if (selectedAddressId === addressId) {
        setSelectedAddressId('');
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
    if (addressId.startsWith('guest-')) {
      const updatedAddresses = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      }));
      
      setSavedAddresses(updatedAddresses);
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
    clearCart: buyNowItem ? async () => {} : clearCart,
    isBuyNow: !!buyNowItem,
    codVerification
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

    // COD specific validation
    if (paymentMethod === 'cod') {
      if (!codVerification.otpVerified) {
        alert('Please verify your phone number for COD orders');
        return;
      }
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
  }, [validateShipping, selectedShipping, paymentMethod, codVerification.otpVerified, isTestMode, razorpayReady, handlePlaceOrder]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 md:mb-8 mb-4">
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Side - Checkout Form */}
          <div className="space-y-6">
            
            {/* Delivery Address Section */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Delivery Address</h2>
              </div>
              
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
            </div>

            {/* Shipping Method Section */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Shipping Method</h2>
              </div>
              
              <ShippingMethodEnhanced
                selectedShipping={selectedShipping}
                onSelectShipping={setSelectedShipping}
                shippingPincode={shippingInfo.pinCode}
                cartTotal={getTotalAmount()}
              />
            </div>

            {/* Payment Section */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Payment Information</h2>
              </div>
              
              <PaymentSection
                paymentMethod={paymentMethod}
                isTestMode={isTestMode}
                razorpayReady={razorpayReady}
                paymentData={paymentData}
                loading={loading}
                totalAmount={getFinalAmount()}
                onPaymentMethodChange={setPaymentMethod}
                onPlaceOrder={handlePlaceOrderWithValidation}
                showCOD={true}
                codVerification={codVerification}
                setCodVerification={setCodVerification}
                customerPhone={shippingInfo.phone}
              />
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit space-y-6">
            
            {/* Cart Items */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Order Summary</h2>
                <span className="ml-auto text-sm text-gray-400">{cart.length} items</span>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {cart.map((item, index) => {
                  const isCustomDesign = item.isCustom;
                  
                  return (
                    <div key={index} className="flex gap-3 p-3 bg-gray-700 rounded-lg">
                      {/* ✅ FIXED: Product Image using Cart logic */}
                      <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                        {isCustomDesign && item.customization ? (
                          <CartTShirtPreview
                            design={null}
                            color={item.color}
                            image={null}
                            customization={{
                              frontDesign: item.customization.frontDesign ? {
                                designImage: item.customization.frontDesign.designImage,
                                position: item.customization.frontDesign.position
                              } : undefined,
                              backDesign: item.customization.backDesign ? {
                                designImage: item.customization.backDesign.designImage,
                                position: item.customization.backDesign.position
                              } : undefined
                            }}
                          />
                        ) : (
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/80/80';
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                        {isCustomDesign && (
                          <p className="text-xs text-yellow-400">Custom Design</p>
                        )}
                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && (
                            <span className="flex items-center gap-1">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="space-y-1">
                          <p className="font-semibold">₹{item.price}</p>
                          {(item as any).mrp && (item as any).mrp > item.price && (
                            <>
                              <p className="text-xs line-through opacity-60 text-gray-400">
                                ₹{((item as any).mrp).toLocaleString('en-IN')}
                              </p>
                              <p className="text-xs text-green-400 font-medium">
                                Save ₹{((item as any).mrp - item.price).toLocaleString('en-IN')}
                              </p>
                            </>
                          )}
                          <p className="text-xs text-gray-400">each</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discount Section */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold">Discounts & Offers</h2>
              </div>
              
              <DiscountSection
                subtotal={getTotalAmount()}
                shippingCost={selectedShipping?.rate || 0}
                onDiscountChange={handleDiscountChange}
                isTestMode={isTestMode}
                aovDiscount={frontendAovDiscount.discount} // ✅ CRITICAL FIX: Pass AOV discount for sequential calculation
              />
            </div>

            {/* Order Total */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹{getTotalAmount()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{selectedShipping?.rate ? `₹${selectedShipping.rate}` : '₹0'}</span>
                </div>
                
                {appliedDiscount.quantity && (
                  <div className="flex justify-between text-sm text-yellow-400">
                    <span>Quantity Discount ({appliedDiscount.quantity.percentage}%)</span>
                    <span>-₹{appliedDiscount.quantity.discount}</span>
                  </div>
                )}
                
                {appliedDiscount.coupon && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Coupon ({appliedDiscount.coupon.code})</span>
                    <span>-₹{appliedDiscount.coupon.discount}</span>
                  </div>
                )}
                
                {appliedDiscount.rewardPoints && (
                  <div className="flex justify-between text-sm text-purple-400">
                    <span>Reward Points ({appliedDiscount.rewardPoints.points} pts)</span>
                    <span>-₹{appliedDiscount.rewardPoints.discount}</span>
                  </div>
                )}
                
                {(paymentMethod === 'razorpay' || paymentMethod === 'card') && (
                  <div className="flex justify-between text-sm text-blue-400">
                    <span>Online Payment Discount (5%)</span>
                    <span>-₹{(() => {
                      // ✅ FIXED: Use same calculation as getFinalAmount for consistency
                      const subtotal = getTotalAmount();
                      let discountedAmount = subtotal;
                      discountedAmount -= frontendAovDiscount.discount;
                      discountedAmount -= appliedDiscount.coupon?.discount || 0;
                      const onlineDiscount = Math.round(discountedAmount * 0.05);
                      console.log(`🎯 UI Online Discount: ${paymentMethod} = ₹${onlineDiscount}`);
                      return onlineDiscount;
                    })()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-yellow-400">₹{getFinalAmount()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {}}
                disabled={loading || !selectedShipping || !validateShipping()}
                className="w-full mt-6 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white disabled:text-gray-400 py-4 rounded-lg font-bold text-lg disabled:cursor-not-allowed transition-colors"
              >
                Launching Soon
              </button>

               {/* <button
                      onClick={handlePlaceOrderWithValidation}
                      disabled={loading}
                      className="mt-6 w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-gray-900 disabled:text-gray-400 py-3 rounded-lg font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Place Order • ₹{getFinalAmount()}
                        </>
                      )}
                    </button>
               */}
              <p className="text-xs text-gray-500 text-center mt-3">
                By placing this order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <ProcessingModal />
    </div>
  );
};

export default CheckoutSinglePage;
