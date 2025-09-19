import { API } from "../../backend";

export interface Address {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  isDefault?: boolean;
  createdAt?: string;
}

// Get all addresses for a user
export const getUserAddresses = async (userId: string, token: string) => {
  try {
    const response = await fetch(`${API}/user/${userId}/addresses`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    // If we get a 400 or 404, don't retry - just return empty array
    if (response.status === 400 || response.status === 404 || response.status === 401) {
      return [];
    }
    
    const data = await response.json();
    
    // If response has error property, return empty array
    if (data.error) {
      return [];
    }
    
    return data;
  } catch (err) {
    return [];
  }
};

// Add new address
export const addUserAddress = async (userId: string, token: string, address: Address) => {
  try {
    const response = await fetch(`${API}/user/${userId}/addresses`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(address)
    });
    return await response.json();
  } catch (err) {
    return { error: "Failed to add address" };
  }
};

// Update existing address
export const updateUserAddress = async (
  userId: string,
  token: string,
  addressId: string,
  updates: Partial<Address>
) => {
  try {
    const response = await fetch(`${API}/user/${userId}/addresses/${addressId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    return await response.json();
  } catch (err) {
    return { error: "Failed to update address" };
  }
};

// Delete address
export const deleteUserAddress = async (userId: string, token: string, addressId: string) => {
  try {
    const response = await fetch(`${API}/user/${userId}/addresses/${addressId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (err) {
    return { error: "Failed to delete address" };
  }
};

// Mock functions for test mode
let mockAddresses: Address[] = [
  {
    _id: "1",
    fullName: "Test User",
    email: "test@example.com",
    phone: "9876543210",
    address: "123 Test Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pinCode: "400001",
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: "2",
    fullName: "Test User",
    email: "test@example.com",
    phone: "9876543210",
    address: "456 Office Road",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    pinCode: "110001",
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

export const mockGetUserAddresses = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockAddresses];
};

export const mockAddUserAddress = async (address: Address) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newAddress: Address = {
    ...address,
    _id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  
  // If this is the first address or marked as default, unset other defaults
  if (address.isDefault || mockAddresses.length === 0) {
    mockAddresses = mockAddresses.map(addr => ({ ...addr, isDefault: false }));
    newAddress.isDefault = true;
  }
  
  mockAddresses.push(newAddress);
  
  return {
    message: "Address added successfully",
    addresses: [...mockAddresses]
  };
};

export const mockUpdateUserAddress = async (addressId: string, updates: Partial<Address>) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Create a completely new array with new objects
  mockAddresses = mockAddresses.map(addr => {
    if (addr._id === addressId) {
      // If setting as default, we'll handle it below
      return { ...addr, ...updates };
    }
    // If this update sets a new default, unset other defaults
    if (updates.isDefault) {
      return { ...addr, isDefault: false };
    }
    return { ...addr }; // Always return a new object
  });
  
  return {
    message: "Address updated successfully",
    addresses: [...mockAddresses]
  };
};

export const mockDeleteUserAddress = async (addressId: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const deletedAddress = mockAddresses.find(addr => addr._id === addressId);
  mockAddresses = mockAddresses.filter(addr => addr._id !== addressId);
  
  // If we deleted the default address and there are other addresses, make the first one default
  if (deletedAddress?.isDefault && mockAddresses.length > 0) {
    mockAddresses[0].isDefault = true;
  }
  
  return {
    message: "Address deleted successfully",
    addresses: [...mockAddresses]
  };
};
