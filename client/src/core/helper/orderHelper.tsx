import { API } from "../../backend";

interface OrderItem {
  product: string;
  name: string;
  price: number;
  count: number;
}

interface Order {
  products: OrderItem[];
  transaction_id: string;
  amount: number;
  address?: string;
  status?: string;
  user?: string;
}

// Mock order creation for test mode
let mockOrderId = 1000;

export const mockCreateOrder = (order: Order): Promise<any> => {
  return Promise.resolve({
    _id: String(mockOrderId++),
    ...order,
    status: "Received",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const createOrder = (userId: string, token: string, orderData: Order) => {
  return fetch(`${API}/order/create/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ order: orderData })
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to create order" };
    });
};

export const getOrders = (userId: string, token: string) => {
  return fetch(`${API}/orders/${userId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to fetch orders" };
    });
};

// Mock orders for test mode
export const mockOrders = [
  {
    _id: "mock-order-1",
    products: [
      { product: "1", name: "Naruto Sage Mode Premium", price: 599, count: 1 }
    ],
    transaction_id: "mock-txn-1",
    amount: 599,
    address: "123 Test Street, Test City",
    status: "Delivered",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: "mock-order-2",
    products: [
      { product: "2", name: "Attack on Titan Wings", price: 649, count: 2 }
    ],
    transaction_id: "mock-txn-2",
    amount: 1298,
    address: "456 Test Avenue, Test City",
    status: "Processing",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockGetOrders = (): Promise<any> => {
  return Promise.resolve(mockOrders);
};
