import { API } from "../../backend";

// Helper functions for reward points and coupon tracking
export const redeemPoints = async (userId: string, token: string, points: number, orderId: string) => {
  try {
    const response = await fetch(`${API}/rewards/redeem/${userId}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ points, orderId })
    });
    return response.json();
  } catch (error) {
    console.error('Failed to redeem points:', error);
    return { error: 'Failed to redeem points' };
  }
};

export const trackCouponUsage = async (code: string, userId: string, token: string, orderId: string) => {
  try {
    const response = await fetch(`${API}/coupon/track-usage`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code, orderId })
    });
    return response.json();
  } catch (error) {
    console.error('Failed to track coupon usage:', error);
    return { error: 'Failed to track coupon usage' };
  }
};
