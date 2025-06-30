import { API } from "../../backend";

// Get dashboard statistics
export const getDashboardStats = (userId: string, token: string) => {
  return fetch(`${API}/analytics/dashboard/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get sales data over time
export const getSalesData = (userId: string, token: string, period: string = "month") => {
  return fetch(`${API}/analytics/sales/${userId}?period=${period}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get top products
export const getTopProducts = (userId: string, token: string, limit: number = 10) => {
  return fetch(`${API}/analytics/products/${userId}?limit=${limit}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get category performance
export const getCategoryPerformance = (userId: string, token: string) => {
  return fetch(`${API}/analytics/categories/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get customer analytics
export const getCustomerAnalytics = (userId: string, token: string) => {
  return fetch(`${API}/analytics/customers/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get order analytics
export const getOrderAnalytics = (userId: string, token: string) => {
  return fetch(`${API}/analytics/orders/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Get revenue analytics
export const getRevenueAnalytics = (userId: string, token: string, year?: number) => {
  const url = year 
    ? `${API}/analytics/revenue/${userId}?year=${year}`
    : `${API}/analytics/revenue/${userId}`;
    
  return fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .catch(err => console.log(err));
};

// Mock data for test mode
export const mockAnalyticsData = {
  dashboardStats: {
    overview: {
      totalOrders: 156,
      totalProducts: 24,
      totalUsers: 89,
      totalCategories: 6,
      totalRevenue: 125000,
      averageOrderValue: 801
    },
    today: {
      revenue: 4500,
      orders: 5
    },
    thisMonth: {
      revenue: 45000,
      orders: 48
    }
  },
  salesData: [
    { _id: "2025-06-01", revenue: 1200, orders: 2, items: 4 },
    { _id: "2025-06-05", revenue: 3400, orders: 4, items: 8 },
    { _id: "2025-06-10", revenue: 2100, orders: 3, items: 5 },
    { _id: "2025-06-15", revenue: 4500, orders: 5, items: 10 },
    { _id: "2025-06-20", revenue: 3200, orders: 4, items: 7 },
    { _id: "2025-06-25", revenue: 5600, orders: 6, items: 12 },
    { _id: "2025-06-28", revenue: 4200, orders: 5, items: 9 }
  ],
  topProducts: [
    {
      _id: "1",
      name: "Anime Hero T-Shirt",
      price: 699,
      sold: 45,
      avgRating: 4.5,
      reviewCount: 23,
      revenue: 31455,
      category: { name: "Anime" }
    },
    {
      _id: "2", 
      name: "Custom Design Tee",
      price: 899,
      sold: 38,
      avgRating: 4.8,
      reviewCount: 19,
      revenue: 34162,
      category: { name: "Custom" }
    },
    {
      _id: "3",
      name: "Vintage Style Shirt",
      price: 799,
      sold: 32,
      avgRating: 4.3,
      reviewCount: 15,
      revenue: 25568,
      category: { name: "Vintage" }
    }
  ],
  categoryPerformance: [
    {
      name: "Anime",
      productCount: 8,
      totalSold: 120,
      totalRevenue: 89400,
      avgPrice: 745
    },
    {
      name: "Custom",
      productCount: 6,
      totalSold: 95,
      totalRevenue: 82300,
      avgPrice: 866
    },
    {
      name: "Vintage",
      productCount: 5,
      totalSold: 78,
      totalRevenue: 58200,
      avgPrice: 746
    },
    {
      name: "Sports",
      productCount: 5,
      totalSold: 65,
      totalRevenue: 45500,
      avgPrice: 700
    }
  ],
  customerAnalytics: {
    customerGrowth: [
      { _id: "2025-01", newCustomers: 12 },
      { _id: "2025-02", newCustomers: 15 },
      { _id: "2025-03", newCustomers: 18 },
      { _id: "2025-04", newCustomers: 22 },
      { _id: "2025-05", newCustomers: 25 },
      { _id: "2025-06", newCustomers: 28 }
    ],
    topCustomers: [
      {
        name: "John Doe",
        email: "john@example.com",
        totalOrders: 12,
        totalSpent: 8500,
        avgOrderValue: 708
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        totalOrders: 10,
        totalSpent: 7200,
        avgOrderValue: 720
      }
    ],
    retentionRate: "68.50"
  },
  orderAnalytics: {
    orderStatusDistribution: [
      { _id: "Delivered", count: 120, totalValue: 96000 },
      { _id: "Processing", count: 25, totalValue: 20000 },
      { _id: "Shipped", count: 8, totalValue: 6400 },
      { _id: "Cancelled", count: 3, totalValue: 2400 }
    ],
    ordersByHour: Array.from({ length: 24 }, (_, i) => ({
      _id: i,
      count: Math.floor(Math.random() * 10) + 1,
      avgValue: Math.floor(Math.random() * 200) + 600
    })),
    deliveryTimeStats: {
      avgDeliveryTime: 5.2,
      minDeliveryTime: 3,
      maxDeliveryTime: 8
    }
  },
  revenueAnalytics: {
    monthlyRevenue: [
      { _id: 1, revenue: 18000, orders: 22, avgOrderValue: 818 },
      { _id: 2, revenue: 21000, orders: 26, avgOrderValue: 808 },
      { _id: 3, revenue: 19500, orders: 24, avgOrderValue: 813 },
      { _id: 4, revenue: 23000, orders: 28, avgOrderValue: 821 },
      { _id: 5, revenue: 25000, orders: 31, avgOrderValue: 806 },
      { _id: 6, revenue: 24200, orders: 30, avgOrderValue: 807 }
    ],
    revenueByPayment: [
      { _id: "Stripe", revenue: 85000, count: 106 },
      { _id: "Braintree", revenue: 45700, count: 50 }
    ],
    discountImpact: {
      totalDiscount: 12500,
      ordersWithDiscount: 45,
      avgDiscountPerOrder: 278
    }
  }
};
