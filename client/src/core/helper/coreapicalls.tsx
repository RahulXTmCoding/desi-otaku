import { API } from "../../backend";

// Get all products
export const getProducts = () => {
  return fetch(`${API}/products`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get a single product
export const getProduct = (productId: string) => {
  return fetch(`${API}/product/${productId}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get all categories
export const getCategories = () => {
  return fetch(`${API}/categories`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Get products by category
export const getProductsByCategory = (categoryId: string) => {
  return fetch(`${API}/products/category/${categoryId}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};

// Search products
export const searchProducts = (searchTerm: string) => {
  return fetch(`${API}/products/search?q=${searchTerm}`, { method: "GET" })
    .then(response => {
      return response.json();
    })
    .catch(err => console.log(err));
};
