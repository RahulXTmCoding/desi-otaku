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
    mrp?: number;
    discount?: number;
    discountPercentage?: number;
    sizeStock?: {
      S: number;
      M: number;
      L: number;
      XL: number;
      XXL: number;
    };
    sizeAvailability?: {
      S: boolean;
      M: boolean;
      L: boolean;
      XL: boolean;
      XXL: boolean;
    };
    totalStock?: number;
    rating?: number;
    reviews?: number;
    category?: {
      _id: string;
      name: string;
    };
  };
  addedAt: string;
}

// Utility function to safely convert values to strings
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return '';
  return String(value);
};

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
  
  // ✅ PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // ✅ WISHLIST PAGINATION STATE
  const [wishlistCurrentPage, setWishlistCurrentPage] = useState(1);
  const [wishlistTotalPages, setWishlistTotalPages] = useState(1);
  const [wishlistTotalItems, setWishlistTotalItems] = useState(0);
  const [wishlistPerPage] = useState(12);
  const [wishlistHasNextPage, setWishlistHasNextPage] = useState(false);
  const [wishlistHasPreviousPage, setWishlistHasPreviousPage] = useState(false);
  
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

  // Listen for URL parameter changes and update activeTab
  useEffect(() => {
    const newTab = searchParams.get('tab') || 'overview';
    setActiveTab(newTab);
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [isTestMode, activeTab, currentPage, statusFilter, wishlistCurrentPage]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load orders with pagination
      if (activeTab === 'overview' || activeTab === 'orders') {
        if (isTestMode) {
          const mockData = await mockGetOrders();
          setOrders(mockData);
        } else if (user && token) {
          const options = {
            page: activeTab === 'overview' ? 1 : currentPage, // Overview always shows page 1
            limit: activeTab === 'overview' ? 5 : ordersPerPage, // Overview shows fewer items
            status: activeTab === 'overview' ? 'all' : statusFilter,
            sortBy: 'createdAt',
            sortOrder: 'desc' as const
          };

          const orderData = await getOrders(user._id, token, options);
          
          if (!orderData.error) {
            if (orderData.orders) {
              // Paginated response
              setOrders(orderData.orders);
              setTotalPages(orderData.pagination?.totalPages || 1);
              setTotalOrders(orderData.pagination?.totalOrders || 0);
              setHasNextPage(orderData.pagination?.hasNextPage || false);
              setHasPreviousPage(orderData.pagination?.hasPreviousPage || false);
            } else {
              // Legacy response format
              setOrders(orderData);
            }
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
            
            // Ensure each product has proper image URL and complete data
            const itemsWithImages = items.map((item: WishlistItem) => {
              const product = item.product;
              
              return {
                ...item,
                product: {
                  ...product,
                  photoUrl: product.photoUrl || `${API}/product/image/${product._id}`,
                  // Ensure all required fields exist
                  price: product.price || 0,
                  name: product.name || 'Unknown Product',
                  stock: product.stock || 0,
                  sizeAvailability: product.sizeAvailability || {},
                  sizeStock: product.sizeStock || {}
                }
              };
            });
            
            setWishlist(itemsWithImages);
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
      photoUrl: product.photoUrl || `${API}/product/image/${product._id}`
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
    const safeStatus = safeString(status);
    switch (safeStatus.toLowerCase()) {
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
    const safeStatus = safeString(status);
    switch (safeStatus.toLowerCase()) {
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
            <label className="block text-sm font-medium mb-2">Phone Number <span className="text-xs text-gray-400">(10-digit)</span></label>
            <div className="relative">
              <input
                type="tel"
                value={addressForm.phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.startsWith('91') && value.length > 10) {
                    value = value.substring(2);
                  } else if (value.startsWith('0') && value.length > 10) {
                    value = value.substring(1);
                  }
                  value = value.slice(0, 10);
                  setAddressForm({ ...addressForm, phone: value });
                }}
                className={`w-full px-4 py-3 pr-16 bg-gray-700 border rounded-lg focus:ring-1 text-white ${
                  addressForm.phone.length === 10 && /^[6-9]/.test(addressForm.phone)
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                }`}
                placeholder="9876543210"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={13}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                addressForm.phone.length === 10 ? 'text-green-400' : 
                addressForm.phone.length > 0 ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {addressForm.phone.length}/10
              </span>
            </div>
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
    <div className="md:min-h-screen bg-gray-900 text-white">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in max-w-xs md:max-w-sm text-sm md:text-base">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in max-w-xs md:max-w-sm text-sm md:text-base">
          {error}
        </div>
      )}

      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8 hidden md:block">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Manage your account and track your orders</p>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Enhanced Sidebar - Hidden on Mobile */}
          <div className="hidden md:block lg:w-1/4 mb-6 lg:mb-0">
            <div className="bg-gray-800 backdrop-blur rounded-2xl p-4 md:p-6 border border-gray-700 shadow-lg lg:sticky lg:top-24">
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
                
                <div className="pt-4 mt-4 border-t border-gray-700">
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

          {/* Main Content Area - Full Width on Mobile */}
          <div className="w-full">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className={`bg-gray-800 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-6 border ${stat.borderColor} hover:scale-105 transition-transform duration-200 shadow-lg`}
                    >
                      <div className="flex flex-col md:flex-row items-center md:justify-between mb-2 md:mb-4">
                        <div className={`p-2 md:p-3 ${stat.bgColor} rounded-md md:rounded-lg shadow-md mb-2 md:mb-0`}>
                          <stat.icon className={`w-4 h-4 md:w-6 md:h-6 ${stat.color}`} />
                        </div>
                        <span className="text-xl md:text-3xl font-bold text-white">{stat.value}</span>
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm font-medium text-center md:text-left">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-gray-800 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-yellow-400 text-sm hover:text-yellow-300 flex items-center gap-1 font-medium"
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
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order._id} className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">Order #{safeString(order.transaction_id).slice(-8) || order._id.slice(-8)}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">₹{safeString(order.amount)}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                {safeString(order.status) || 'pending'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-300">
                              {order.products?.length || 0} item{(order.products?.length || 0) !== 1 ? 's' : ''}
                            </p>
                            <button
                              onClick={() => navigate(`/order/${order._id}`)}
                              className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1"
                            >
                              View Details
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {orders.length > 3 && (
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="w-full mt-4 py-3 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                        >
                          View {orders.length - 3} More Orders
                        </button>
                      )}
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
                  
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gray-800 backdrop-blur rounded-2xl p-4 md:p-6 border border-gray-700 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white mb-1">
                        <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                        Order History
                      </h2>
                      {totalOrders > 0 && (
                        <p className="text-sm text-gray-400">
                          {totalOrders} order{totalOrders !== 1 ? 's' : ''} found
                        </p>
                      )}
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400 hidden sm:block">Filter:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 min-w-[120px]"
                      >
                        <option value="all">All Orders</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Orders Content */}
                <div className="bg-gray-800 backdrop-blur rounded-2xl border border-gray-700 shadow-lg overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader className="w-8 h-8 animate-spin text-yellow-400" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <Package className="w-16 h-16 md:w-20 md:h-20 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                        {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                      </h3>
                      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                        {statusFilter === 'all' 
                          ? 'Start shopping to see your orders here'
                          : `You don't have any ${statusFilter} orders at the moment`
                        }
                      </p>
                      {statusFilter === 'all' && (
                        <button
                          onClick={() => navigate('/shop')}
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold transition-all transform hover:scale-105"
                        >
                          Start Shopping
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {/* Results Summary */}
                      <div className="px-4 md:px-6 py-3 bg-gray-700/30">
                        <p className="text-sm text-gray-400">
                          Showing {((currentPage - 1) * ordersPerPage) + 1} - {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                        </p>
                      </div>

                      {/* Orders List */}
                      <div className="divide-y divide-gray-700">
                        {orders.map((order, index) => (
                          <div key={order._id} className="p-4 md:p-6 hover:bg-gray-700/20 transition-colors">
                            {/* Mobile-First Order Card */}
                            <div className="space-y-4">
                              {/* Order Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg flex-shrink-0 ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-white text-sm md:text-base">
                                      Order #{safeString(order.transaction_id).slice(-8) || order._id.slice(-8)}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-400">
                                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                                  <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                                    {safeString(order.status) || 'pending'}
                                  </span>
                                  <p className="font-bold text-white text-lg md:text-xl">₹{safeString(order.amount)}</p>
                                </div>
                              </div>

                              {/* Order Details */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                  <ShoppingBag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span>{order.products?.length || 0} item{(order.products?.length || 0) !== 1 ? 's' : ''}</span>
                                </div>
                                
                                {order.shipping && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                      {order.shipping.method || 'Standard Delivery'}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-gray-300 sm:justify-end">
                                  <button
                                    onClick={() => navigate(`/order/${order._id}`)}
                                    className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Order Progress Bar (for non-delivered orders) */}
                              {order.status && order.status.toLowerCase() !== 'delivered' && order.status.toLowerCase() !== 'cancelled' && (
                                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      order.status.toLowerCase() === 'processing' ? 'w-1/4 bg-yellow-400' :
                                      order.status.toLowerCase() === 'shipped' ? 'w-3/4 bg-blue-400' :
                                      'w-full bg-green-400'
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Enhanced Pagination */}
                      {totalPages > 1 && (
                        <div className="px-4 md:px-6 py-4 bg-gray-700/30">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-400 order-2 sm:order-1">
                              Page {currentPage} of {totalPages}
                            </div>
                            
                            <div className="flex items-center gap-1 md:gap-2 order-1 sm:order-2">
                              {/* Previous Button */}
                              <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!hasPreviousPage}
                                className={`px-3 md:px-4 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                                  hasPreviousPage
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <span className="hidden sm:inline">←</span>
                                <span className="hidden md:inline">Previous</span>
                                <span className="md:hidden">←</span>
                              </button>
                              
                              {/* Page Numbers */}
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNumber;
                                  if (totalPages <= 5) {
                                    pageNumber = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNumber = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i;
                                  } else {
                                    pageNumber = currentPage - 2 + i;
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNumber}
                                      onClick={() => setCurrentPage(pageNumber)}
                                      className={`w-8 h-8 md:w-10 md:h-10 rounded-lg transition-colors text-sm ${
                                        currentPage === pageNumber
                                          ? 'bg-yellow-400 text-gray-900 font-bold'
                                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                                      }`}
                                    >
                                      {pageNumber}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {/* Next Button */}
                              <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!hasNextPage}
                                className={`px-3 md:px-4 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                                  hasNextPage
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <span className="md:hidden">→</span>
                                <span className="hidden md:inline">Next</span>
                                <span className="hidden sm:inline">→</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-gray-800 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Heart className="w-6 h-6 text-red-400" />
                    My Wishlist
                  </h2>
                  <span className="text-sm text-gray-300 font-medium">{wishlist.length} items</span>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {wishlist.map((item) => (
                      <div key={item._id || item.product._id} className="min-w-0">
                        <ProductGridItem
                          product={item.product}
                          showWishlistButton={false}
                          showRemoveButton={true}
                          onRemove={handleRemoveFromWishlist}
                          isInWishlist={true}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-gray-800 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
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
              <div className="bg-gray-800 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
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
                <div className="bg-gray-800 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-lg">
                  <h2 className="text-xl font-bold mb-6 text-white">Profile Settings</h2>
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
                        Phone Number <span className="text-xs text-gray-400">(10-digit)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.startsWith('91') && value.length > 10) {
                              value = value.substring(2);
                            } else if (value.startsWith('0') && value.length > 10) {
                              value = value.substring(1);
                            }
                            value = value.slice(0, 10);
                            setProfileForm({ ...profileForm, phone: value });
                          }}
                          placeholder="9876543210"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={13}
                          className={`w-full px-4 py-3 pr-16 bg-gray-700 border rounded-lg focus:ring-1 text-white ${
                            profileForm.phone.length === 10 && /^[6-9]/.test(profileForm.phone)
                              ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                              : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                          }`}
                        />
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                          profileForm.phone.length === 10 ? 'text-green-400' : 
                          profileForm.phone.length > 0 ? 'text-yellow-400' : 'text-gray-500'
                        }`}>
                          {profileForm.phone.length}/10
                        </span>
                      </div>
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

                <div className="bg-gray-800 backdrop-blur rounded-2xl p-6 border border-gray-700 shadow-lg">
                  <h2 className="text-xl font-bold mb-6 text-white">Change Password</h2>
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
