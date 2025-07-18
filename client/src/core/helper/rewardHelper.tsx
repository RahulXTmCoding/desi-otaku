import { API } from "../../backend";

interface RewardBalance {
  balance: number;
  isEnabled: boolean;
}

interface RewardTransaction {
  _id: string;
  type: 'earned' | 'redeemed' | 'admin_adjustment' | 'expired';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  orderId?: {
    _id: string;
    orderId: string;
    totalAmount: number;
  };
}

interface RewardHistoryResponse {
  transactions: RewardTransaction[];
  currentPage: number;
  totalPages: number;
  totalTransactions: number;
}

// Get user's reward balance
export const getRewardBalance = (userId: string, token: string) => {
  return fetch(`${API}/rewards/balance/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get reward transaction history
export const getRewardHistory = (userId: string, token: string, page = 1, limit = 20) => {
  return fetch(`${API}/rewards/history/${userId}?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Admin: Adjust user points
export const adjustUserPoints = (
  userId: string,
  token: string,
  amount: number,
  reason: string,
  targetUserId: string
) => {
  return fetch(`${API}/admin/rewards/adjust/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId: targetUserId, amount, reason })
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Admin: Toggle rewards system
export const toggleRewardsSystem = (userId: string, token: string, enabled: boolean) => {
  return fetch(`${API}/admin/rewards/toggle/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ enabled })
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Admin: Get rewards system status
export const getRewardsSystemStatus = (userId: string, token: string) => {
  return fetch(`${API}/admin/rewards/status/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Admin: Get all users' reward balances
export const getAllUsersRewards = (
  userId: string,
  token: string,
  page = 1,
  limit = 20,
  search = ""
) => {
  return fetch(`${API}/admin/rewards/users/${userId}?page=${page}&limit=${limit}&search=${search}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Format reward transaction type for display
export const formatTransactionType = (type: string): string => {
  switch (type) {
    case 'earned':
      return 'Earned';
    case 'redeemed':
      return 'Redeemed';
    case 'admin_adjustment':
      return 'Admin Adjustment';
    case 'expired':
      return 'Expired';
    default:
      return type;
  }
};

// Get transaction badge color
export const getTransactionBadgeColor = (type: string): string => {
  switch (type) {
    case 'earned':
      return 'bg-green-100 text-green-800';
    case 'redeemed':
      return 'bg-blue-100 text-blue-800';
    case 'admin_adjustment':
      return 'bg-purple-100 text-purple-800';
    case 'expired':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
