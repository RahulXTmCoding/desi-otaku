import React, { memo, useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Star, X, Check, Home, User, Mail, Phone, MapPin, Loader, CheckCircle, AlertCircle
} from 'lucide-react';
import { Address } from '../../core/helper/addressHelper';
import { getLocationFromPincode, guessStateFromPincode } from '../../data/pincodeData';
import { 
  validateEmail, 
  validatePhone, 
  validateName, 
  validateAddress, 
  validateCity, 
  validateState, 
  validatePinCode,
  formatPinCode,
  cleanPhoneNumber 
} from '../../utils/validation';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-fill city and state based on pincode
  const handlePincodeChange = async (value: string) => {
    // Format pincode - only allow numbers, max 6 digits
    const formatted = formatPinCode(value);
    onInputChange('pinCode', formatted);
    
    // Auto-validate on change if field is touched
    if (touched.pinCode && formatted) {
      const error = validateField('pinCode', formatted);
      setErrors(prev => ({ ...prev, pinCode: error }));
    }
    
    // Auto-fill location when pincode is complete and valid
    if (formatted.length === 6 && formatted[0] !== '0') {
      setPincodeLoading(true);
      
      // Try to get location from local data first
      const localData = getLocationFromPincode(formatted);
      if (localData) {
        onInputChange('city', localData.city);
        onInputChange('state', localData.state);
        setPincodeLoading(false);
      } else {
        // Try to guess state from pincode pattern
        const guessedState = guessStateFromPincode(formatted);
        if (guessedState) {
          onInputChange('state', guessedState);
        }
        
        // In production, you would call a pincode API here
        // For now, we'll just use the guessed state
        setPincodeLoading(false);
      }
    }
  };

  // Validate individual fields
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        const nameValidation = validateName(value);
        return nameValidation.isValid ? '' : nameValidation.error!;
      case 'email':
        const emailValidation = validateEmail(value);
        return emailValidation.isValid ? '' : emailValidation.error!;
      case 'phone':
        const phoneValidation = validatePhone(value);
        return phoneValidation.isValid ? '' : phoneValidation.error!;
      case 'address':
        const addressValidation = validateAddress(value);
        return addressValidation.isValid ? '' : addressValidation.error!;
      case 'city':
        const cityValidation = validateCity(value);
        return cityValidation.isValid ? '' : cityValidation.error!;
      case 'state':
        const stateValidation = validateState(value);
        return stateValidation.isValid ? '' : stateValidation.error!;
      case 'pinCode':
        const pinCodeValidation = validatePinCode(value);
        return pinCodeValidation.isValid ? '' : pinCodeValidation.error!;
      default:
        return '';
    }
  };

  // Handle input change with validation
  const handleInputChange = (field: string, value: string) => {
    onInputChange(field, value);
    
    // Validate on change if field was touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle input blur
  const handleInputBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = shippingInfo[field as keyof typeof shippingInfo];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Validate all fields
  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(shippingInfo).forEach(field => {
      if (field !== 'country') { // Skip country validation
        const error = validateField(field, shippingInfo[field as keyof typeof shippingInfo]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(shippingInfo).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return isValid;
  };

  // Handle save with validation
  const handleSaveAddress = () => {
    if (validateAllFields()) {
      onSaveAddress();
    }
  };

  return (
    <>
      {/* Saved Addresses */}
      {!showAddressForm && savedAddresses.length > 0 && (
        <div className="mb-4 lg:mb-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-semibold">Select Delivery Address</h3>
            <button
              onClick={onAddNewAddress}
              className="flex items-center gap-1 lg:gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm lg:text-base"
            >
              <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
              Add New
            </button>
          </div>

          <div className="grid gap-2 lg:gap-4">
            {savedAddresses.map((address) => (
              <div
                key={address._id}
                className={`relative border-2 rounded-lg p-3 lg:p-4 transition-all ${
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
                <div className="absolute top-3 left-3 lg:top-4 lg:left-4">
                  <div className={`w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                    selectedAddressId === address._id
                      ? 'border-yellow-400 bg-yellow-400'
                      : 'border-gray-400'
                  }`}>
                    {selectedAddressId === address._id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Check className="w-2 h-2 lg:w-3 lg:h-3 text-gray-900" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Default Badge */}
                {address.isDefault && (
                  <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-400/20 text-yellow-400 rounded">
                      <Star className="w-3 h-3" />
                      <span className="hidden sm:inline">Default</span>
                    </span>
                  </div>
                )}

                {/* Address Details */}
                <div className="ml-8 lg:ml-10">
                  <h4 className="font-semibold text-white mb-1 text-sm lg:text-base">{address.fullName}</h4>
                  <p className="text-xs lg:text-sm text-gray-300 mb-1">{address.phone}</p>
                  <p className="text-xs lg:text-sm text-gray-400 leading-relaxed">
                    {address.address}<br />
                    {address.city}, {address.state} - {address.pinCode}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 lg:mt-4 ml-8 lg:ml-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAddress(address);
                    }}
                    className="flex items-center gap-1 px-2 lg:px-3 py-1 text-xs lg:text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefaultAddress(address._id!);
                      }}
                      disabled={addressLoading}
                      className="flex items-center gap-1 px-2 lg:px-3 py-1 text-xs lg:text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Star className="w-3 h-3" />
                      <span className="hidden sm:inline">Set Default</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAddress(address._id!);
                    }}
                    disabled={addressLoading}
                    className="flex items-center gap-1 px-2 lg:px-3 py-1 text-xs lg:text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Delete</span>
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
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-semibold">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>
            {savedAddresses.length > 0 && (
              <button
                onClick={onCancelAddressForm}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            )}
          </div>

          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">
                <User className="inline w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={shippingInfo.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={() => handleInputBlur('fullName')}
                className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                  errors.fullName && touched.fullName
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                }`}
                placeholder="Enter full name"
                required
              />
              {errors.fullName && touched.fullName && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.fullName}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">
                <Mail className="inline w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                value={shippingInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleInputBlur('email')}
                className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                  errors.email && touched.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                }`}
                placeholder="Enter email address"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                required
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">
                <Phone className="inline w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                Phone <span className="text-xs text-gray-400">(10-digit)</span>
              </label>
              <input
                type="tel"
                value={shippingInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleInputBlur('phone')}
                className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                  errors.phone && touched.phone
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                }`}
                placeholder="e.g. 9876543210"
                maxLength={10}
                required
              />
              {errors.phone && touched.phone && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">
                <Home className="inline w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                Address
              </label>
              <input
                type="text"
                value={shippingInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                onBlur={() => handleInputBlur('address')}
                className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                  errors.address && touched.address
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                }`}
                placeholder="Enter street address"
                required
              />
              {errors.address && touched.address && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.address}
                </p>
              )}
            </div>
            
            {/* PIN Code with Auto-fill */}
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">
                PIN Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={shippingInfo.pinCode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  onBlur={() => handleInputBlur('pinCode')}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                    errors.pinCode && touched.pinCode
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : shippingInfo.pinCode.length === 6 && !errors.pinCode && touched.pinCode
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                  }`}
                  placeholder="e.g. 110001"
                  maxLength={6}
                  required
                />
                {pincodeLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-3 h-3 lg:w-4 lg:h-4 animate-spin text-yellow-400" />
                  </div>
                )}
                {!pincodeLoading && shippingInfo.pinCode.length === 6 && !errors.pinCode && touched.pinCode && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
              {errors.pinCode && touched.pinCode && (
                <p className="mt-1 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.pinCode}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">
                  <MapPin className="inline w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  City
                </label>
                <input
                  type="text"
                  value={shippingInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  onBlur={() => handleInputBlur('city')}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                    errors.city && touched.city
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                  }`}
                  placeholder="Enter city"
                  required
                />
                {errors.city && touched.city && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.city}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-300 mb-1 lg:mb-2">State</label>
                <input
                  type="text"
                  value={shippingInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  onBlur={() => handleInputBlur('state')}
                  className={`w-full px-3 py-2 lg:px-4 lg:py-3 bg-gray-700 border rounded-lg text-white focus:ring-1 transition-all text-sm lg:text-base ${
                    errors.state && touched.state
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-600 focus:border-yellow-400 focus:ring-yellow-400'
                  }`}
                  placeholder="Enter state"
                  required
                />
                {errors.state && touched.state && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.state}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Save Address Button */}
          <button
            onClick={handleSaveAddress}
            disabled={addressLoading}
            className="mt-3 lg:mt-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-2 lg:py-3 rounded-lg font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm lg:text-base"
          >
            {addressLoading ? (
              <>
                <Loader className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
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
