import { API } from "../../backend";

// Validate a coupon code
export const validateCoupon = (code: string, subtotal: number) => {
  return fetch(`${API}/coupon/validate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code, subtotal })
  })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get all active coupons
export const getActiveCoupons = () => {
  return fetch(`${API}/coupons/active`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Admin: Create a new coupon
export const createCoupon = (userId: string, token: string, coupon: any) => {
  return fetch(`${API}/coupon/create/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(coupon)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Admin: Get all coupons
export const getAllCoupons = (userId: string, token: string) => {
  return fetch(`${API}/coupons/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Admin: Update a coupon
export const updateCoupon = (couponId: string, userId: string, token: string, coupon: any) => {
  return fetch(`${API}/coupon/${couponId}/${userId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(coupon)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Admin: Delete a coupon
export const deleteCoupon = (couponId: string, userId: string, token: string) => {
  return fetch(`${API}/coupon/${couponId}/${userId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};
