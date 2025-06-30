import { API } from "../../backend";
import { mockCategories, mockProducts } from "../../data/mockData";

interface Category {
  _id?: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: any;
  stock: number;
  sold: number;
}

// Mock functions for test mode
let mockCategoryId = 100;
let mockProductId = 100;

export const mockCreateCategory = (category: { name: string }): Promise<any> => {
  return Promise.resolve({
    _id: String(mockCategoryId++),
    name: category.name,
    createdAt: new Date().toISOString()
  });
};

export const mockDeleteCategory = (categoryId: string): Promise<any> => {
  return Promise.resolve({ message: "Category deleted successfully" });
};

export const mockCreateProduct = (product: FormData): Promise<any> => {
  const name = product.get('name') as string;
  const price = product.get('price') as string;
  const description = product.get('description') as string;
  const stock = product.get('stock') as string;
  const category = product.get('category') as string;
  
  return Promise.resolve({
    _id: String(mockProductId++),
    name,
    price: Number(price),
    description,
    stock: Number(stock),
    category,
    sold: 0,
    createdAt: new Date().toISOString()
  });
};

export const mockDeleteProduct = (productId: string): Promise<any> => {
  return Promise.resolve({ message: "Product deleted successfully" });
};

export const mockUpdateProduct = (productId: string, product: FormData): Promise<any> => {
  const name = product.get('name') as string;
  const price = product.get('price') as string;
  const description = product.get('description') as string;
  const stock = product.get('stock') as string;
  const category = product.get('category') as string;
  
  return Promise.resolve({
    _id: productId,
    name,
    price: Number(price),
    description,
    stock: Number(stock),
    category,
    updatedAt: new Date().toISOString()
  });
};

// Category calls
export const createCategory = (userId: string, token: string, category: Category) => {
  return fetch(`${API}/category/create/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(category)
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Get all categories
export const getCategories = () => {
  return fetch(`${API}/categories`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Delete a category
export const deleteCategory = (categoryId: string, userId: string, token: string) => {
  return fetch(`${API}/category/${categoryId}/${userId}`, {
    method: "DELETE",
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
      return { error: "Failed to connect to server" };
    });
};

// Product calls

// Create a product
export const createaProduct = (userId: string, token: string, product: FormData) => {
  return fetch(`${API}/product/create/${userId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: product
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Get all products
export const getProducts = () => {
  return fetch(`${API}/products`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Delete a product
export const deleteProduct = (productId: string, userId: string, token: string) => {
  return fetch(`${API}/product/${productId}/${userId}`, {
    method: "DELETE",
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
      return { error: "Failed to connect to server" };
    });
};

// Get a product
export const getProduct = (productId: string) => {
  return fetch(`${API}/product/${productId}`, {
    method: "GET"
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Update a product
export const updateProduct = (productId: string, userId: string, token: string, product: FormData) => {
  return fetch(`${API}/product/${productId}/${userId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: product
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Get all orders (admin)
export const getAllOrders = (userId: string, token: string) => {
  return fetch(`${API}/order/all/${userId}`, {
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
      return { error: "Failed to connect to server" };
    });
};

// Mock get all orders for test mode
export const mockGetAllOrders = (): Promise<any> => {
  return Promise.resolve([
    {
      _id: "mock-admin-order-1",
      user: { _id: "user1", name: "John Doe", email: "john@example.com" },
      products: [
        { product: "1", name: "Naruto Sage Mode Premium", price: 599, count: 2 }
      ],
      transaction_id: "mock-txn-admin-1",
      amount: 1198,
      address: "123 Admin Street, Test City",
      status: "Delivered",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-admin-order-2",
      user: { _id: "user2", name: "Jane Smith", email: "jane@example.com" },
      products: [
        { product: "2", name: "Attack on Titan Wings", price: 649, count: 1 }
      ],
      transaction_id: "mock-txn-admin-2",
      amount: 649,
      address: "456 Customer Avenue, Test City",
      status: "Processing",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: "mock-admin-order-3",
      user: { _id: "user3", name: "Bob Wilson", email: "bob@example.com" },
      products: [
        { product: "3", name: "Brand Logo Classic", price: 449, count: 3 }
      ],
      transaction_id: "mock-txn-admin-3",
      amount: 1347,
      address: "789 Buyer Lane, Test City",
      status: "Shipped",
      createdAt: new Date().toISOString()
    }
  ]);
};

// Update order status
export const updateOrderStatus = (userId: string, token: string, orderId: string, status: string) => {
  return fetch(`${API}/order/${orderId}/status/${userId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ orderId, status })
  })
    .then(response => {
      return response.json();
    })
    .catch(err => {
      console.log(err);
      return { error: "Failed to connect to server" };
    });
};

// Mock update order status
export const mockUpdateOrderStatus = (orderId: string, status: string): Promise<any> => {
  return Promise.resolve({
    _id: orderId,
    status: status,
    message: "Order status updated successfully"
  });
};
