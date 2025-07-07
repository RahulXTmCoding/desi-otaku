# Address Management API Documentation

## Overview
The address management system allows users to save multiple shipping addresses for future use. When placing an order, the shipping address is automatically saved to the user's profile for convenience in future checkouts.

## API Endpoints

### 1. Get All Addresses
**GET** `/api/user/:userId/addresses`

Returns all saved addresses for a user.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "_id": "address_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "address": "123 Main Street, Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pinCode": "400001",
    "isDefault": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### 2. Add New Address
**POST** `/api/user/:userId/address`

Adds a new address to the user's saved addresses.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "address": "123 Main Street, Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pinCode": "400001",
  "isDefault": true
}
```

**Response:**
```json
{
  "message": "Address added successfully",
  "addresses": [/* array of all addresses */]
}
```

### 3. Update Address
**PUT** `/api/user/:userId/address/:addressId`

Updates an existing address.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:** (include only fields to update)
```json
{
  "phone": "+91 9876543211",
  "isDefault": true
}
```

**Response:**
```json
{
  "message": "Address updated successfully",
  "addresses": [/* array of all addresses */]
}
```

### 4. Delete Address
**DELETE** `/api/user/:userId/address/:addressId`

Removes an address from the user's saved addresses.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Address deleted successfully",
  "addresses": [/* array of remaining addresses */]
}
```

## Frontend Integration

### Automatic Address Saving
When a user completes an order, their shipping address is automatically saved:

```javascript
// In handlePlaceOrder function
if (auth && auth.user && auth.token) {
  await fetch(`${API}/user/${auth.user._id}/address`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify({
      ...shippingInfo,
      isDefault: true
    })
  });
}
```

### Loading Saved Addresses
On checkout page load, saved addresses are fetched and the default address is auto-filled:

```javascript
// In loadSavedAddresses function
const response = await fetch(`${API}/user/${auth.user._id}/addresses`, {
  headers: {
    Authorization: `Bearer ${auth.token}`
  }
});

const addresses = await response.json();
const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
```

## Features

1. **Multiple Addresses**: Users can save multiple shipping addresses
2. **Default Address**: One address can be marked as default
3. **Auto-fill**: Default address automatically fills the checkout form
4. **Persistence**: Addresses are saved permanently in the user's profile
5. **Easy Management**: Users can add, update, or delete addresses

## Testing

Run the test script to verify address functionality:

```bash
cd server
node testAddresses.js
```

This will:
1. Add test addresses to a user
2. List all addresses
3. Update address properties
4. Delete addresses
5. Clean up test data

## Security

- All address endpoints require authentication
- Users can only access/modify their own addresses
- Address data is validated before saving
