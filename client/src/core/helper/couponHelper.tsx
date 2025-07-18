import { API } from "../../backend";

// Get all coupons (Admin)
export const getAllCoupons = (userId: string, token: string) => {
  return fetch(`${API}/coupons/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Create coupon (Admin)
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
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Update coupon (Admin)
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
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Delete coupon (Admin)
export const deleteCoupon = (couponId: string, userId: string, token: string) => {
  return fetch(`${API}/coupon/${couponId}/${userId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get single coupon
export const getCoupon = (couponId: string, userId: string, token: string) => {
  return fetch(`${API}/coupon/${couponId}/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Validate coupon
export const validateCoupon = (code: string, subtotal: number, token?: string) => {
  const headers: any = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return fetch(`${API}/coupon/validate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code, subtotal })
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get active coupons
export const getActiveCoupons = () => {
  return fetch(`${API}/coupons/active`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get promotional coupons for homepage
export const getPromotionalCoupons = () => {
  return fetch(`${API}/coupons/promotional`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get best auto-apply coupon
export const getBestAutoApplyCoupon = (subtotal: number, userId?: string) => {
  return fetch(`${API}/coupon/auto-apply`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ subtotal, userId })
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};
