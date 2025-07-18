import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Settings,
  LogOut,
  ShoppingBag,
  Clock,
  ChevronRight,
  Edit2,
  Mail,
  Phone,
  Loader,
  Plus,
  Trash2,
  Home,
  Building,
  Calendar,
  Shield,
  UserCheck,
  X,
  Check,
  Eye,
  ShoppingCart,
  Star,
  Gift
} from 'lucide-react';
import { isAutheticated, signout } from "../auth/helper";
import { getOrders, mockGetOrders } from "../core/helper/orderHelper";
import { getWishlist } from "../core/helper/wishlistHelper";
import { getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from "../core/helper/addressHelper";
import { updateUserProfile, changePassword, getUserDetails } from "../core/helper/userHelper";
import { useDevMode } from "../context/DevModeContext";
import { API } from "../backend";
import { addItemToCart } from "../core/helper/cartHelper";
import OrderCard from "../components/OrderCard";
import ProductGridItem from "../components/ProductGridItem";
import RewardPointsSection from "../components/user/RewardPointsSection";

interface Order {
  _id: string;
  products: Array<{
    product: any;
    name: string;
    price: number;
    count: number;
  }>;
  transaction_id: string;
  amount: number;
  address?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  shipping?: any;
}

interface Address {
  _id?: string;
  fullName?: string;
  name?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pinCode?: string;
  pincode?: string;
  isDefault?: boolean;
  type?: 'home' | 'work' | 'other';
}

interface WishlistItem {
  _id?: string;
  product: {
    _id: string;
    name: string;
    price: number;
    description: string;
    photoUrl?: string;
    stock: number;
  };
  addedAt: string;
}

const UserDashBoardEnhanced = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authData = isAutheticated();
  const user = authData && authData.user;
  const token = authData && authData.token;
  const { isTestMode } = useDevMode();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home'
  });
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'overview') {
      params.set('tab', activeTab);
    }
    setSearchParams(params);
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    loadData();
  }, [isTestMode, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load orders
      if (activeTab === 'overview' || activeTab === 'orders') {
        if (isTestMode) {
          const mockData = await mockGetOrders();
          setOrders(mockData);
        } else if (user && token) {
          const orderData = await getOrders(user._id, token);
          if (!orderData.error) {
            setOrders(orderData);
          }
        }
      }

      // Load wishlist
      if (activeTab === 'overview' || activeTab === 'wishlist') {
        if (user && token && !isTestMode) {
          const wishlistData = await getWishlist(user._id, token);
          if (!wishlistData.error) {
            // Handle both 'products' and 'items' response formats
            const items = wishlistData.items || wishlistData.products || [];
            setWishlist(items);
          }
        }
      }

      // Load addresses
      if (activeTab === 'overview' || activeTab === 'addresses') {
        if (user && token && !isTestMode) {
          const addressData = await getUserAddresses(user._id, token);
          if (!addressData.error) {
            setAddresses(addressData);
          }
        }
      }

      // Load user details for settings
      if (activeTab === 'settings') {
        if (user && token && !isTestMode) {
          const userDetails = await getUserDetails(user._id, token);
          if (!userDetails.error) {
            // Update profile form with latest user data
            setProfileForm({
              name: userDetails.name || '',
              email: userDetails.email || '',
              phone: userDetails.phone || '',
              dateOfBirth: userDetails.dob ? new Date(userDetails.dob).toISOString().split('T')[0] : ''
            });
            
            // Update localStorage with fresh user data including dob
            const authData = JSON.parse(localStorage.getItem("jwt") || "{}");
            if (authData && authData.user) {
              authData.user = { ...authData.user, ...userDetails };
              localStorage.setItem("jwt", JSON.stringify(authData));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignout = () => {
    signout(() => {
      navigate("/");
    });
  };

  const handleAddToCart = async (product: any) => {
    if (!user || !token) {
      setError('Please login to add items to cart');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      size: 'M',
      color: 'Default',
      quantity: 1,
      isCustom: false,
      photoUrl: product.photoUrl || `${API}/product/photo/${product._id}`
    };
    
    try {
      const result = await addItemToCart(user._id, token, cartItem);
      if (!result.error) {
        setSuccessMessage('Product added to cart!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to add to cart');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to add to cart');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(`${API}/wishlist/remove/${user._id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        setWishlist(wishlist.filter(item => item.product._id !== productId));
        setSuccessMessage('Removed from wishlist');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const validateAddressForm = () => {
    // Validate name
    if (!addressForm.name || addressForm.name.trim().length < 3) {
      setError('Name must be at least 3 characters long');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = addressForm.phone.replace(/[\s+\-()]/g, '');
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    // Validate address
    if (!addressForm.address || addressForm.address.trim().length < 10) {
      setError('Address must be at least 10 characters long');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    // Validate city
    if (!addressForm.city || addressForm.city.trim().length < 2) {
      setError('Please enter a valid city name');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    // Validate state
    if (!addressForm.state || addressForm.state.trim().length < 2) {
      setError('Please enter a valid state name');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    // Validate pincode
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!addressForm.pincode || !pincodeRegex.test(addressForm.pincode)) {
      setError('Please enter a valid 6-digit PIN code');
      setTimeout(() => setError(''), 3000);
      return false;
    }
    
    return true;
  };

  const handleAddAddress = async () => {
    if (!user || !token) return;
    
    // Validate form
    if (!validateAddressForm()) return;
    
    try {
      const addressData = {
        fullName: addressForm.name.trim(),
        email: user.email,
        phone: addressForm.phone.replace(/[\s+\-()]/g, ''),
        address: addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        country: 'India',
        pinCode: addressForm.pincode,
        isDefault: addresses.length === 0
      };
      
      const result = await addUserAddress(user._id, token, addressData);
      if (!result.error) {
        await loadData();
        setShowAddressForm(false);
        setAddressForm({
          name: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          type: 'home'
        });
        setSuccessMessage('Address added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to add address');
    }
  };

  const handleUpdateAddress = async () => {
    if (!user || !token || !editingAddress?._id) return;
    
    // Validate form
    if (!validateAddressForm()) return;
    
    try {
      const addressData = {
        fullName: addressForm.name.trim(),
        email: user.email,
        phone: addressForm.phone.replace(/[\s+\-()]/g, ''),
        address: addressForm.address.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        country: 'India',
        pinCode: addressForm.pincode,
        isDefault: editingAddress.isDefault
      };
      
      const result = await updateUserAddress(user._id, token, editingAddress._id, addressData);
      if (!result.error) {
        await loadData();
        setEditingAddress(null);
        setShowAddressForm(false);
        setSuccessMessage('Address updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !token) return;
    
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const result = await deleteUserAddress(user._id, token, addressId);
        if (!result.error) {
          await loadData();
          setSuccessMessage('Address deleted successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (err) {
        setError('Failed to delete address');
      }
    }
  };

  const handleSetDefaultAddress = async (address: Address) => {
    if (!user || !token || !address._id) return;
    
    try {
      const addressData = {
        fullName: address.fullName || address.name || '',
        email: user.email,
        phone: address.phone,
        address: address.address,
        city: address.city,
        state: address.state,
        country: 'India',
        pinCode: address.pinCode || address.pincode || '',
        isDefault: true
      };
      
      const result = await updateUserAddress(user._id, token, address._id, addressData);
      if (!result.error) {
        await loadData();
        setSuccessMessage('Default address updated!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to set default address');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !token) return;
    
    try {
      const result = await updateUserProfile(user._id, token, profileForm);
      if (!result.error) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!user || !token) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const result = await changePassword(user._id, token, passwordForm.currentPassword, passwordForm.newPassword);
      if (!result.error) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to change password');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <Check className="w-4 h-4" />;
      case 'shipped':
        return <Package className="w-4 h-4" />;
      case 'processing':
      case 'received':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'processing':
      case 'received':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'shipped':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: User, color: 'text-yellow-400' },
    { id: 'orders', label: 'My Orders', icon: Package, color: 'text-blue-400' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'text-red-400' },
    { id: 'addresses', label: 'Addresses', icon: MapPin, color: 'text-green-400' },
    { id: 'rewards', label: 'Rewards', icon: Gift, color: 'text-purple-400' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-400' }
  ];

  const stats = [
    { 
      label: 'Total Orders', 
      value: orders.length, 
      icon: ShoppingBag, 
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20'
    },
    { 
      label: 'Wishlist Items', 
      value: wishlist.length, 
      icon: Heart, 
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20'
    },
    { 
      label: 'Saved Addresses', 
      value: addresses.length, 
      icon: MapPin, 
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20'
    }
  ];

  const renderAddressForm = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button
            onClick={() => {
              setShowAddressForm(false);
              setEditingAddress(null);
              setAddressForm({
                name: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                type: 'home'
              });
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={addressForm.name}
              onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              value={addressForm.address}
              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              placeholder="Street address, apartment, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                placeholder="Mumbai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                placeholder="Maharashtra"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PIN Code</label>
            <input
              type="text"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
              placeholder="400001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['home', 'work', 'other'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setAddressForm({ ...addressForm, type })}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    addressForm.type === type
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {type === 'home' && <Home className="w-4 h-4 inline mr-1" />}
                  {type === 'work' && <Building className="w-4 h-4 inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 rounded-lg font-semibold transition-colors"
            >
              {editingAddress ? 'Update Address' : 'Add Address'}
            </button>
            <button
              onClick={() => {
                setShowAddressForm(false);
                setEditingAddress(null);
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-gray-400">Manage your account and track your orders</p>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50 sticky top-24">
              {/* User Avatar & Info */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                    <User className="w-12 h-12 text-gray-900" />
                  </div>
                  <div className="absolute bottom-2 right-0 w-6 h-6 bg-green-400 rounded-full border-2 border-gray-800"></div>
                </div>
                <h2 className="font-bold text-xl text-white">{user?.name || 'User'}</h2>
                <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
                <div className="mt-4 inline-flex items-center px-3 py-1 bg-yellow-400/10 rounded-full">
                  <UserCheck className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-xs text-yellow-400 font-medium">Verified Account</span>
                </div>
              </div>

              {/* Navigation with Icons */}
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/25'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-gray-900' : item.color}`} />
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                      activeTab === item.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'
                    }`} />
                  </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-700/50">
                  <button
                    onClick={handleSignout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all group"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className={`bg-gray-800/50 backdrop-blur rounded-xl p-6 border ${stat.borderColor} hover:scale-105 transition-transform duration-200`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className="text-3xl font-bold">{stat.value}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-yellow-400 text-sm hover:text-yellow-300 flex items-center gap-1"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No orders yet</p>
                      <button
                        onClick={() => navigate('/shop')}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <OrderCard key={order._id} order={order} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/shop')}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl p-6 text-left group transition-all"
                  >
                    <ShoppingBag className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-lg mb-1">Continue Shopping</h4>
                    <p className="text-sm text-purple-200">Explore new arrivals and deals</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 rounded-xl p-6 text-left group transition-all"
                  >
                    <Heart className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="font-bold text-lg mb-1">My Wishlist</h4>
                    <p className="text-sm text-pink-200">{wishlist.length} saved items</p>
                  </button>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-400" />
                    Order History
                  </h2>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-6">No orders yet</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-8 py-4 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard key={order._id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Heart className="w-6 h-6 text-red-400" />
                    My Wishlist
                  </h2>
                  <span className="text-sm text-gray-400">{wishlist.length} items</span>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-16">
                    <Heart className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-6">Your wishlist is empty</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all"
                    >
                      Explore Products
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <ProductGridItem
                        key={item._id || item.product._id}
                        product={item.product}
                        showWishlistButton={false}
                        showRemoveButton={true}
                        onRemove={handleRemoveFromWishlist}
                        isInWishlist={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-green-400" />
                    Saved Addresses
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Address
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-16">
                    <MapPin className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-6">No saved addresses yet</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {addresses.map((address) => (
                      <div key={address._id} className="bg-gray-700/50 rounded-xl p-6 relative hover:bg-gray-700/70 transition-all">
                        {address.isDefault && (
                          <span className="absolute top-4 right-4 px-3 py-1 bg-yellow-400/20 text-yellow-400 text-xs rounded-full">
                            Default
                          </span>
                        )}
                        <div className="mb-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {address.type === 'home' && <Home className="w-5 h-5 text-yellow-400" />}
                            {address.type === 'work' && <Building className="w-5 h-5 text-blue-400" />}
                            {address.fullName || address.name}
                          </h4>
                          <p className="text-sm text-gray-400 capitalize">{address.type} Address</p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>{address.address}</p>
                          <p>{address.city}, {address.state} - {address.pinCode || address.pincode}</p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {address.phone}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(address)}
                              className="px-4 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              Make Default
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingAddress(address);
                              setAddressForm({
                                name: address.fullName || address.name || '',
                                phone: address.phone,
                                address: address.address,
                                city: address.city,
                                state: address.state,
                                pincode: address.pinCode || address.pincode || '',
                                type: address.type || 'home'
                              });
                              setShowAddressForm(true);
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address._id!)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Gift className="w-6 h-6 text-purple-400" />
                    Reward Points
                  </h2>
                </div>
                <RewardPointsSection />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                  <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700/50">
                  <h2 className="text-xl font-bold mb-6">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && renderAddressForm()}
    </div>
  );
};

export default UserDashBoardEnhanced;
