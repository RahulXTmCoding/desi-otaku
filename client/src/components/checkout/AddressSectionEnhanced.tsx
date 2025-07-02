import React, { memo, useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Star, X, Check, Home, User, Mail, Phone, MapPin, Loader, CheckCircle
} from 'lucide-react';
import { Address } from '../../core/helper/addressHelper';
import { getLocationFromPincode, guessStateFromPincode } from '../../data/pincodeData';

interface AddressSectionProps {
  savedAddresses: Address[];
  selectedAddressId: string;
  showAddressForm: boolean;
  editingAddressId: string | null;
  addressLoading: boolean;
  shippingInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  };
  onSelectAddress: (address: Address) => void;
  onAddNewAddress: () => void;
  onEditAddress: (address: Address) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetDefaultAddress: (addressId: string) => void;
  onSaveAddress: () => void;
  onCancelAddressForm: () => void;
  onInputChange: (field: string, value: string) => void;
  validateShipping: () => boolean;
}

const AddressSectionEnhanced: React.FC<AddressSectionProps> = ({
  savedAddresses,
  selectedAddressId,
  showAddressForm,
  editingAddressId,
  addressLoading,
  shippingInfo,
  onSelectAddress,
  onAddNewAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onSaveAddress,
  onCancelAddressForm,
  onInputChange,
  validateShipping
}) => {
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Auto-fill city and state based on pincode
  const handlePincodeChange = async (value: string) => {
    onInputChange('pinCode', value);
    
    if (value.length === 6) {
      setPincodeLoading(true);
      
      // Try to get location from local data first
      const localData = getLocationFromPincode(value);
      if (localData) {
        onInputChange('city', localData.city);
        onInputChange('state', localData.state);
        setPincodeLoading(false);
      } else {
        // Try to guess state from pincode pattern
        const guessedState = guessStateFromPincode(value);
        if (guessedState) {
          onInputChange('state', guessedState);
        }
        
        // In production, you would call a pincode API here
        // For now, we'll just use the guessed state
        setPincodeLoading(false);
      }
    }
  };

  return (
    <>
      {/* Saved Addresses */}
      {!showAddressForm && savedAddresses.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Select Delivery Address</h3>
            <button
              onClick={onAddNewAddress}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
          </div>

          <div className="grid gap-4">
            {savedAddresses.map((address) => (
              <div
                key={address._id}
                className={`relative border-2 rounded-lg p-4 transition-all ${
                  selectedAddressId === address._id
                    ? 'bg-gray-700 border-yellow-400'
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500 cursor-pointer'
                }`}
                onClick={() => {
                  if (selectedAddressId !== address._id) {
                    onSelectAddress(address);
                  }
                }}
              >
                {/* Selection Radio */}
                <div className="absolute top-4 left-4">
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selectedAddressId === address._id
                      ? 'border-yellow-400 bg-yellow-400'
                      : 'border-gray-400'
                  }`}>
                    {selectedAddressId === address._id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-900" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-400/20 text-yellow-400 rounded">
                      <Star className="w-3 h-3" />
                      Default
                    </span>
                  </div>
                )}

                {/* Address Details */}
                <div className="ml-10">
                  <h4 className="font-semibold text-white mb-1">{address.fullName}</h4>
                  <p className="text-sm text-gray-300 mb-1">{address.phone}</p>
                  <p className="text-sm text-gray-400">
                    {address.address}<br />
                    {address.city}, {address.state} - {address.pinCode}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 ml-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAddress(address);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefaultAddress(address._id!);
                      }}
                      disabled={addressLoading}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Star className="w-3 h-3" />
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAddress(address._id!);
                    }}
                    disabled={addressLoading}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Address Form */}
      {(showAddressForm || savedAddresses.length === 0) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>
            {savedAddresses.length > 0 && (
              <button
                onClick={onCancelAddressForm}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={shippingInfo.fullName}
                onChange={(e) => onInputChange('fullName', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                value={shippingInfo.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={shippingInfo.phone}
                onChange={(e) => onInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                placeholder="Enter phone number"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Home className="inline w-4 h-4 mr-1" />
                Address
              </label>
              <input
                type="text"
                value={shippingInfo.address}
                onChange={(e) => onInputChange('address', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                placeholder="Enter street address"
                required
              />
            </div>
            
            {/* PIN Code with Auto-fill */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PIN Code <span className="text-xs text-gray-400">(Auto-fills city & state)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shippingInfo.pinCode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                  placeholder="Enter PIN code"
                  maxLength={6}
                  required
                />
                {pincodeLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 animate-spin text-yellow-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  City
                </label>
                <input
                  type="text"
                  value={shippingInfo.city}
                  onChange={(e) => onInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <input
                  type="text"
                  value={shippingInfo.state}
                  onChange={(e) => onInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>
          </div>

          {/* Save Address Button */}
          <button
            onClick={onSaveAddress}
            disabled={addressLoading || !validateShipping()}
            className="mt-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {addressLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {editingAddressId ? 'Update Address' : 'Save Address'}
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default AddressSectionEnhanced;
