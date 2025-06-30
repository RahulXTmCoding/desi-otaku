import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, Trash2, Package, Heart, Star } from 'lucide-react';
import Base from '../core/Base';
import { isAutheticated } from '../auth/helper';
import { API } from '../backend';

const UserProfile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistItems: 0,
    totalReviews: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const auth = isAutheticated();
  const userId = auth && auth.user ? auth.user._id : null;
  const token = auth ? auth.token : null;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`${API}/user/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.user.name || '',
          lastname: data.user.lastname || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || '',
          country: data.user.country || '',
          pincode: data.user.pincode || ''
        });
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API}/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Profile updated successfully');
        // Update local storage with new user data
        const authData = JSON.parse(localStorage.getItem('jwt') || '{}');
        authData.user = { ...authData.user, ...profileData };
        localStorage.setItem('jwt', JSON.stringify(authData));
      } else {
        setError(data.err || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API}/user/password/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Password updated successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt('Please enter your password to confirm account deletion:');
    
    if (!password) return;
    
    if (!confirm('Are you absolutely sure? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API}/user/account/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Account deleted successfully');
        // Clear auth and redirect to home
        localStorage.removeItem('jwt');
        window.location.href = '/';
      } else {
        alert(data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <Base>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-xl">Loading profile...</div>
        </div>
      </Base>
    );
  }

  return (
    <Base>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-400/20 rounded-lg">
              <Package className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Wishlist Items</p>
              <p className="text-2xl font-bold">{stats.wishlistItems}</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Star className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Reviews Written</p>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'password'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'danger'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="bg-gray-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastname}
                  onChange={(e) => setProfileData({ ...profileData, lastname: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">PIN Code</label>
                <input
                  type="text"
                  value={profileData.pincode}
                  onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordUpdate} className="bg-gray-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </h2>

            <div className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-400"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Lock className="w-4 h-4" />
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6 text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h2>

            <div className="max-w-2xl">
              <h3 className="font-semibold mb-2">Delete Account</h3>
              <p className="text-gray-400 mb-6">
                Once you delete your account, there is no going back. Please be certain.
                This will permanently delete your account and all associated data including:
              </p>
              
              <ul className="list-disc list-inside text-gray-400 mb-6 space-y-1">
                <li>Your profile information</li>
                <li>Order history</li>
                <li>Wishlist items</li>
                <li>Product reviews</li>
                <li>All other personal data</li>
              </ul>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </Base>
  );
};

export default UserProfile;
