import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { loadCart } from '../core/helper/cartHelper';
import { isAutheticated } from '../auth/helper';
import { 
  mockGetUserAddresses,
  mockAddUserAddress,
  mockUpdateUserAddress,
  mockDeleteUserAddress,
  type Address
} from '../core/helper/addressHelper';
import { useDevMode } from '../context/DevModeContext';
import AddressSectionFixed from '../components/checkout/AddressSectionFixed';

const CheckoutSimple: React.FC = () => {
  const navigate = useNavigate();
  const auth = isAutheticated();
  const { isTestMode } = useDevMode();
  
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

  // Load saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      console.log('Loading addresses...');
      const addresses = await mockGetUserAddresses();
      console.log('Loaded addresses:', addresses);
      setSavedAddresses(addresses);
      
      if (addresses.length > 0) {
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
    };

    loadAddresses();
  }, []);

  const validateShipping = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pinCode'];
    return required.every(field => shippingInfo[field as keyof typeof shippingInfo]);
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('Input change:', field, value);
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectAddress = (address: Address) => {
    console.log('Selecting address:', address);
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
  };

  const handleAddNewAddress = () => {
    console.log('Add new address clicked');
    setShowAddressForm(true);
    setEditingAddressId(null);
    setShippingInfo({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India'
    });
  };

  const handleEditAddress = (address: Address) => {
    console.log('Edit address:', address);
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
  };

  const handleSaveAddress = async () => {
    console.log('Save address clicked');
    if (!validateShipping()) {
      alert('Please fill all address fields');
      return;
    }

    setAddressLoading(true);
    
    try {
      const addressData: Address = {
        ...shippingInfo,
        isDefault: savedAddresses.length === 0
      };

      console.log('Saving address data:', addressData);

      const result = editingAddressId
        ? await mockUpdateUserAddress(editingAddressId, addressData)
        : await mockAddUserAddress(addressData);

      console.log('Save result:', result);

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
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Failed to save address');
    }
    
    setAddressLoading(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    console.log('Delete address:', addressId);
    if (!confirm('Are you sure you want to delete this address?')) return;

    setAddressLoading(true);
    
    try {
      const result = await mockDeleteUserAddress(addressId);
      console.log('Delete result:', result);

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
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    console.log('Set default address:', addressId);
    setAddressLoading(true);
    
    try {
      const result = await mockUpdateUserAddress(addressId, { isDefault: true });
      console.log('Set default result:', result);

      if (result && result.addresses) {
        setSavedAddresses(result.addresses);
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('Failed to set default address');
    }
    
    setAddressLoading(false);
  };

  const handleCancelAddressForm = () => {
    console.log('Cancel address form');
    setShowAddressForm(false);
    setEditingAddressId(null);
    if (savedAddresses.length > 0 && selectedAddressId) {
      const selected = savedAddresses.find(addr => addr._id === selectedAddressId);
      if (selected) {
        handleSelectAddress(selected);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold mb-8 text-center">Checkout (Simple Test)</h1>

        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Address Management Test</h2>
          
          <div className="mb-4 p-4 bg-gray-700 rounded">
            <p className="text-sm">Debug Info:</p>
            <p className="text-xs text-gray-400">Addresses: {savedAddresses.length}</p>
            <p className="text-xs text-gray-400">Selected: {selectedAddressId}</p>
            <p className="text-xs text-gray-400">Loading: {addressLoading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-400">Show Form: {showAddressForm ? 'Yes' : 'No'}</p>
          </div>

          <AddressSectionFixed
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
      </div>
    </div>
  );
};

export default CheckoutSimple;
